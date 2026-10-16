---
title: Self-hosting
description: Running the hatchrun scaler, broker and runners in your own accounts.
---

Everything in hatchrun is open source under AGPL-3.0-only, and you can
run all of it yourself. A self-hosted install needs no hatchrun.io
account and no hatchrun GitHub App: a scaler in your account talks to
GitHub directly.

This page explains the parts, then walks through an install from
scratch. A CloudFormation template that sets up a scale set in one
step is in progress; until then the steps are manual. [Downloads](/docs/downloads/) lists the scaler binaries, the
scaler image and the runner AMIs, and how to verify them. The runner
AMIs come from AWS Marketplace: subscribe your account to the
[amd64](https://aws.amazon.com/marketplace/pp/prodview-znhn62372z6jq) and
[arm64](https://aws.amazon.com/marketplace/pp/prodview-nchg6i6uzlfr2) image once, for free.

## What you will run

- **The scaler**, one per scale set, as a container on ECS Fargate or
  Kubernetes, or as a binary on any machine with outbound internet
  access.
- **The broker**, a Cloudflare Worker that hands each runner its config
  once. One broker serves any number of scalers.
- **A GitHub App or token** that lets the scaler register runners.
- **An IAM role** for the scaler, limited to launching and terminating
  runner instances.
- **A launch template and a security group** for runners, with no
  inbound rules.

## From queued job to running runner

1. A workflow job asks for the label of a hatchrun scale set: its name,
   or one of the extra labels you gave it. The `hatchrun/<options>`
   labels of the hosted service do not apply here.
2. GitHub tells the scaler through the runner scale set API, the same
   API that Actions Runner Controller uses. The scaler keeps one open
   session per scale set and gets the job within a second or two.
3. The scaler creates a just-in-time (JIT) runner config for the job and
   launches an instance from your launch template.
4. The instance gets a single-use ticket in its user data, not the
   config itself. Once the instance exists, the scaler stores the config
   in the broker under that ticket.
5. At boot, `hatchrun-agent` claims the config, runs exactly one job and
   powers the instance off, as in the hosted service. See
   [How it works](/docs/how-it-works/).

The broker gives a config to the first claim only and deletes a config
nobody claims after 15 minutes. Runners need no instance profile.

## Restarts

The scaler keeps no database. Every minute it compares its runners with
the instances tagged `hatchrun:scale-set-id`. After a restart it
rebuilds its view from GitHub's runner list and those tags, and takes
over the instances that are still running jobs. On SIGTERM it closes
its session and leaves running jobs alone.

GitHub allows one open session per scale set. Run one scaler per scale
set, and stop the old one before the new one starts when you upgrade.

## Install

The steps below set up one scale set for an organization, `acme`, with
arm64 runners in `eu-west-1`. You need:

- an AWS account and a VPC whose subnets reach the internet, through a
  NAT gateway or a public IP on each instance;
- a Cloudflare account for the broker (the free plan is enough);
- the AWS CLI, the GitHub CLI and Node.js 22, and Rust through
  [rustup](https://rustup.rs) to build the broker;
- owner access to the GitHub organization, or admin access to the
  repository for a repository scale set.

Commands use `$VERSION` for the scaler release without the `v`, as
[Downloads](/docs/downloads/) sets it.

### 1. GitHub credentials

The scaler registers runners as a GitHub App or with a personal access
token. Use an App where you can: its tokens last an hour and it is not
tied to a person.

To create the App, open the organization's settings, then **Developer
settings**, **GitHub Apps**, **New GitHub App**:

1. Give it a name and a homepage URL, and clear **Active** under
   **Webhook**. The scaler needs no webhooks.
2. Under **Organization permissions**, set **Self-hosted runners** to
   **Read and write**. For a repository scale set, set
   **Administration** under **Repository permissions** to **Read and
   write** instead.
3. Pick **Only on this account** and create the App.
4. Note the **Client ID** on the App's page, then generate a private
   key. The browser downloads it as a `.pem` file.
5. Install the App on the organization. The installation's URL ends in
   its id: `.../settings/installations/12345678`.

The scaler takes these as `--github-app-client-id`,
`--github-app-installation-id` and `--github-app-private-key`, or the
`HATCHRUN_GITHUB_APP_*` variables.

To use a token instead, create a classic personal access token with the
`admin:org` scope for an organization, `repo` for a repository or
`manage_runners:enterprise` for an enterprise, and pass it as
`HATCHRUN_GITHUB_TOKEN`.

### 2. The broker

The broker is
[`crates/broker`](https://github.com/hatchrun/hatchrun/tree/main/crates/broker)
in hatchrun/hatchrun. Check out the release you run:

```sh
git clone --branch "v$VERSION" --depth 1 https://github.com/hatchrun/hatchrun
cd hatchrun/crates/broker
```

`wrangler.toml` routes the Worker to `broker.hatchrun.io`. Change the
`routes` line to a hostname in a zone of your Cloudflare account:

```toml
routes = [
  { pattern = "broker.example.com", custom_domain = true },
]
```

Or delete it and add `workers_dev = true` to use the
`hatchrun-broker.<subdomain>.workers.dev` URL. The agent only talks to
an HTTPS broker; both give you one.

Then set the token the scaler stores configs with, and deploy. The
build compiles the Worker with the Rust toolchain the repository pins:

```sh
openssl rand -hex 32 | tr -d '\n' > broker-token
npx wrangler@4.143.0 login
npx wrangler@4.143.0 secret put BROKER_TOKEN < broker-token
npx wrangler@4.143.0 deploy
```

When your login reaches more than one Cloudflare account, export
`CLOUDFLARE_ACCOUNT_ID` first. Keep `broker-token`; the scaler needs it
as `HATCHRUN_BROKER_TOKEN`. A claim needs only the ticket, so runners
need no token.

### 3. Security group and launch template

Runners make outbound connections only. A new security group has no
inbound rules and allows all outbound traffic, which is what they need:

```sh
aws ec2 create-security-group --region eu-west-1 \
  --group-name hatchrun-runners --description "hatchrun runners" \
  --vpc-id vpc-0123456789abcdef0
```

Get the AMI id for your region and architecture from the latest
[runner image](/docs/downloads/#runner-amis) manifest, then create the
launch template. It sets the image, instance type, security group, disk
and metadata options:

```sh
aws ec2 create-launch-template --region eu-west-1 \
  --launch-template-name hatchrun-linux-arm64 \
  --launch-template-data '{
    "ImageId": "ami-0123456789abcdef0",
    "InstanceType": "t4g.large",
    "SecurityGroupIds": ["sg-0123456789abcdef0"],
    "MetadataOptions": {"HttpTokens": "required", "HttpPutResponseHopLimit": 1},
    "BlockDeviceMappings": [{
      "DeviceName": "/dev/sda1",
      "Ebs": {"VolumeSize": 30, "VolumeType": "gp3", "Encrypted": true, "DeleteOnTermination": true}
    }]
  }'
```

Leave user data and network interfaces out of the template: the scaler
sets user data, and it picks the subnet when you pass `--subnets`. It
also sets the shutdown behaviour to terminate, so the agent powering
off ends the instance. The image's root volume is 10 GB and
unencrypted; the template above makes it 30 GB and encrypted.

When a new image is published, add a launch template version with its
id and make it the default, or build the image in your own account
from [hatchrun/images](https://github.com/hatchrun/images).

### 4. IAM role for the scaler

The scaler needs the EC2 actions listed in the
[scaler section of the hatchrun README](https://github.com/hatchrun/hatchrun#scaler),
plus four more for the warm pool. This policy holds all of them:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "ec2:RunInstances",
        "ec2:CreateTags",
        "ec2:DescribeInstances",
        "ec2:TerminateInstances",
        "ec2:StopInstances",
        "ec2:StartInstances",
        "ec2:ModifyInstanceAttribute",
        "ec2:DeleteTags"
      ],
      "Resource": "*"
    }
  ]
}
```

Leave out the last four when you run without a warm pool. Add
`iam:PassRole` for the instance profile when your launch template sets
one. Attach the policy to a role the scaler can assume where it runs:
an ECS task role, an EKS Pod Identity or IRSA role, or an EC2 instance
profile. The scaler reads AWS credentials from the usual SDK chain.

### 5. Run the scaler

Every flag has an environment variable, listed in
[Scaler flags](#scaler-flags) below. The examples pass everything as
environment variables, so secrets never show up in a process list. The
image runs as user 65532 and writes no files, so each example runs it
with a read-only root filesystem.

#### ECS Fargate

Store the App's private key and the broker token in Secrets Manager,
and give the task execution role `secretsmanager:GetSecretValue` on
both. A task definition for the scale set:

```json
{
  "family": "hatchrun-scaler-linux-arm64",
  "requiresCompatibilities": ["FARGATE"],
  "networkMode": "awsvpc",
  "cpu": "256",
  "memory": "512",
  "runtimePlatform": {"cpuArchitecture": "ARM64", "operatingSystemFamily": "LINUX"},
  "taskRoleArn": "arn:aws:iam::123456789012:role/hatchrun-scaler",
  "executionRoleArn": "arn:aws:iam::123456789012:role/hatchrun-scaler-execution",
  "containerDefinitions": [
    {
      "name": "scaler",
      "image": "ghcr.io/hatchrun/hatchrun-scaler:VERSION",
      "essential": true,
      "readonlyRootFilesystem": true,
      "user": "65532",
      "environment": [
        {"name": "HATCHRUN_GITHUB_URL", "value": "https://github.com/acme"},
        {"name": "HATCHRUN_GITHUB_APP_CLIENT_ID", "value": "Iv23liEXAMPLE"},
        {"name": "HATCHRUN_GITHUB_APP_INSTALLATION_ID", "value": "12345678"},
        {"name": "HATCHRUN_BROKER_URL", "value": "https://broker.example.com"},
        {"name": "HATCHRUN_SCALE_SET", "value": "linux-arm64"},
        {"name": "HATCHRUN_LAUNCH_TEMPLATE", "value": "hatchrun-linux-arm64"},
        {"name": "HATCHRUN_SUBNETS", "value": "subnet-0123456789abcdef0,subnet-0fedcba9876543210"},
        {"name": "HATCHRUN_MAX_RUNNERS", "value": "20"}
      ],
      "secrets": [
        {
          "name": "HATCHRUN_GITHUB_APP_PRIVATE_KEY",
          "valueFrom": "arn:aws:secretsmanager:eu-west-1:123456789012:secret:hatchrun/github-app-key-AbCdEf"
        },
        {
          "name": "HATCHRUN_BROKER_TOKEN",
          "valueFrom": "arn:aws:secretsmanager:eu-west-1:123456789012:secret:hatchrun/broker-token-AbCdEf"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/hatchrun/scaler",
          "awslogs-region": "eu-west-1",
          "awslogs-stream-prefix": "linux-arm64"
        }
      }
    }
  ]
}
```

Replace `VERSION` with the release, create the `/hatchrun/scaler` log
group, and run one copy as a service. A minimum healthy percent of 0
makes a deployment stop the old task before it starts the new one:

```sh
aws ecs create-service --region eu-west-1 --cluster hatchrun \
  --service-name hatchrun-scaler-linux-arm64 \
  --task-definition hatchrun-scaler-linux-arm64 \
  --desired-count 1 --launch-type FARGATE \
  --deployment-configuration minimumHealthyPercent=0,maximumPercent=100 \
  --network-configuration 'awsvpcConfiguration={subnets=[subnet-0123456789abcdef0],securityGroups=[sg-0fedcba9876543210],assignPublicIp=DISABLED}'
```

The task's security group needs no inbound rules either.

#### Kubernetes

Put the secrets in a Secret whose keys are the variable names:

```sh
kubectl create namespace hatchrun
kubectl -n hatchrun create secret generic hatchrun-scaler-linux-arm64 \
  --from-file=HATCHRUN_GITHUB_APP_PRIVATE_KEY=acme-runners.private-key.pem \
  --from-file=HATCHRUN_BROKER_TOKEN=broker-token
```

The Deployment runs one replica and recreates it on change, so two
scalers never hold the scale set at once:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: hatchrun-scaler-linux-arm64
  namespace: hatchrun
spec:
  replicas: 1
  strategy:
    type: Recreate
  selector:
    matchLabels:
      app: hatchrun-scaler-linux-arm64
  template:
    metadata:
      labels:
        app: hatchrun-scaler-linux-arm64
    spec:
      serviceAccountName: hatchrun-scaler
      securityContext:
        runAsNonRoot: true
        runAsUser: 65532
        runAsGroup: 65532
        seccompProfile:
          type: RuntimeDefault
      containers:
        - name: scaler
          image: ghcr.io/hatchrun/hatchrun-scaler:VERSION
          env:
            - name: HATCHRUN_GITHUB_URL
              value: https://github.com/acme
            - name: HATCHRUN_GITHUB_APP_CLIENT_ID
              value: Iv23liEXAMPLE
            - name: HATCHRUN_GITHUB_APP_INSTALLATION_ID
              value: "12345678"
            - name: HATCHRUN_BROKER_URL
              value: https://broker.example.com
            - name: HATCHRUN_SCALE_SET
              value: linux-arm64
            - name: HATCHRUN_LAUNCH_TEMPLATE
              value: hatchrun-linux-arm64
            - name: HATCHRUN_SUBNETS
              value: subnet-0123456789abcdef0,subnet-0fedcba9876543210
            - name: HATCHRUN_MAX_RUNNERS
              value: "20"
            - name: AWS_REGION
              value: eu-west-1
          envFrom:
            - secretRef:
                name: hatchrun-scaler-linux-arm64
          securityContext:
            readOnlyRootFilesystem: true
            allowPrivilegeEscalation: false
            capabilities:
              drop: ["ALL"]
          resources:
            requests:
              cpu: 50m
              memory: 64Mi
            limits:
              memory: 256Mi
```

The `hatchrun-scaler` service account carries the AWS role. On EKS,
link it to the role with EKS Pod Identity, or annotate it for IRSA:

```yaml
apiVersion: v1
kind: ServiceAccount
metadata:
  name: hatchrun-scaler
  namespace: hatchrun
  annotations:
    eks.amazonaws.com/role-arn: arn:aws:iam::123456789012:role/hatchrun-scaler
```

Outside EKS, add
`AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY` for an IAM user to the
Secret.

#### A VM with systemd

Install the binary from the release tarball (see
[Downloads](/docs/downloads/#the-scaler)). On EC2, give the instance an
instance profile with the scaler's role; elsewhere, add AWS keys to the
environment file. Put the settings in `/etc/hatchrun-scaler/linux-arm64.env`:

```sh
HATCHRUN_GITHUB_URL=https://github.com/acme
HATCHRUN_GITHUB_APP_CLIENT_ID=Iv23liEXAMPLE
HATCHRUN_GITHUB_APP_INSTALLATION_ID=12345678
HATCHRUN_BROKER_URL=https://broker.example.com
HATCHRUN_BROKER_TOKEN=paste-the-broker-token
HATCHRUN_SCALE_SET=linux-arm64
HATCHRUN_LAUNCH_TEMPLATE=hatchrun-linux-arm64
HATCHRUN_SUBNETS=subnet-0123456789abcdef0,subnet-0fedcba9876543210
HATCHRUN_MAX_RUNNERS=20
AWS_REGION=eu-west-1
```

and the App's key in `/etc/hatchrun-scaler/github-app.pem`, both owned
by root with mode 0600. The unit hands the key over as a systemd
credential, so it stays out of the environment file and the command
line. `$$` keeps systemd from expanding the shell's variables.
`/etc/systemd/system/hatchrun-scaler@.service`:

```ini
[Unit]
Description=hatchrun scaler for scale set %i
Wants=network-online.target
After=network-online.target

[Service]
EnvironmentFile=/etc/hatchrun-scaler/%i.env
LoadCredential=github-app.pem:/etc/hatchrun-scaler/github-app.pem
ExecStart=/bin/sh -c 'HATCHRUN_GITHUB_APP_PRIVATE_KEY="$$(cat "$$CREDENTIALS_DIRECTORY/github-app.pem")" exec /usr/local/bin/hatchrun-scaler'
Restart=on-failure
RestartSec=10
DynamicUser=yes
NoNewPrivileges=yes
ProtectSystem=strict
ProtectHome=yes
PrivateTmp=yes

[Install]
WantedBy=multi-user.target
```

```sh
sudo systemctl daemon-reload
sudo systemctl enable --now hatchrun-scaler@linux-arm64
journalctl -u hatchrun-scaler@linux-arm64 -f
```

With a token, set `HATCHRUN_GITHUB_TOKEN` in the environment file and
drop the `LoadCredential` line and the `sh -c` wrapper.

### 6. Runner counts and the warm pool

- `--max-runners` (default 10) caps the instances of the scale set.
  Jobs over the cap wait in GitHub's queue.
- `--min-runners` (default 0) keeps that many runners up with no job,
  so a job starts without waiting for a boot. Each one is a running
  instance you pay for. A runner that waits longer than
  `--idle-timeout` (15 minutes) is replaced, which also recycles these.
- `--warm-pool N` keeps N stopped instances that have booted once. A
  new runner starts from one of them, which skips the launch and the
  slow first read of a fresh volume. A stopped instance costs only its
  volume. The pool needs an on-demand launch template and the four
  warm pool actions in the IAM policy. `--warm-pool-warmup` (3 minutes)
  is how long a pool instance runs before it is stopped, and pool
  instances older than `--warm-pool-max-age` (24 hours) are replaced,
  so the pool picks up new images.

### 7. Check it with a test workflow

Add a workflow to a repository in the organization:

```yaml
name: hatchrun test
on: workflow_dispatch
jobs:
  hello:
    runs-on: linux-arm64
    steps:
      - run: uname -a && nproc && df -h /
```

Run it from the Actions tab. Within a few seconds the scaler logs that
it launched an instance, and the instance shows up in EC2 tagged
`hatchrun:scale-set-id` and `hatchrun:runner-name`. The job starts
29.5 seconds later on a t4g.medium. When it finishes the instance powers off and
terminates. Set `RUST_LOG=debug` on the scaler for more detail.

A job that stays queued usually means the scaler cannot launch: look
for `launch instance` errors in its log, which name the EC2 error.

### 8. Upgrade

- **Scaler**: change the image tag (or replace the binary) and redeploy.
  The old scaler closes its session on SIGTERM, the new one adopts the
  running instances, and running jobs carry on.
- **Runner images**: add a launch template version with the new AMI id
  and make it the default. New runners use it at once; warm pool
  instances move over within `--warm-pool-max-age`.
- **Broker**: redeploy from the new release tag when the release notes
  mention it. Stored configs survive a deploy.

## Scaler flags

From `hatchrun-scaler --help`. Every flag also reads the environment
variable next to it.

| Flag and variable | Default | Meaning |
| --- | --- | --- |
| `--github-url`<br />`HATCHRUN_GITHUB_URL` | required | Where runners register: the URL of an organization, a repository or `github.com/enterprises/NAME` |
| `--github-token`<br />`HATCHRUN_GITHUB_TOKEN` | | Personal access token, instead of an App |
| `--github-app-client-id`<br />`HATCHRUN_GITHUB_APP_CLIENT_ID` | | GitHub App client id (or App id) |
| `--github-app-installation-id`<br />`HATCHRUN_GITHUB_APP_INSTALLATION_ID` | | GitHub App installation id |
| `--github-app-private-key`<br />`HATCHRUN_GITHUB_APP_PRIVATE_KEY` | | GitHub App private key in PEM |
| `--broker-url`<br />`HATCHRUN_BROKER_URL` | required | URL of your broker |
| `--broker-token`<br />`HATCHRUN_BROKER_TOKEN` | required | The `BROKER_TOKEN` the broker was deployed with |
| `--scale-set`<br />`HATCHRUN_SCALE_SET` | required | Scale set name, also a `runs-on` label |
| `--labels`<br />`HATCHRUN_LABELS` | | More `runs-on` labels, comma separated |
| `--runner-group`<br />`HATCHRUN_RUNNER_GROUP` | `Default` | Runner group of the scale set |
| `--disable-update`<br />`HATCHRUN_DISABLE_UPDATE` | off | Keep runners from updating themselves |
| `--min-runners`<br />`HATCHRUN_MIN_RUNNERS` | `0` | Runners kept with no jobs |
| `--max-runners`<br />`HATCHRUN_MAX_RUNNERS` | `10` | Most runners at once |
| `--idle-timeout`<br />`HATCHRUN_IDLE_TIMEOUT` | `15m` | How long a runner may wait for a job before it is replaced |
| `--warm-pool`<br />`HATCHRUN_WARM_POOL` | `0` | Stopped instances kept ready for new runners |
| `--warm-pool-warmup`<br />`HATCHRUN_WARM_POOL_WARMUP` | `3m` | How long a pool instance runs before it is stopped |
| `--warm-pool-max-age`<br />`HATCHRUN_WARM_POOL_MAX_AGE` | `24h` | Age at which a pool instance is replaced |
| `--reconcile-interval`<br />`HATCHRUN_RECONCILE_INTERVAL` | `1m` | How often to compare runners with instances |
| `--launch-template`<br />`HATCHRUN_LAUNCH_TEMPLATE` | required | Launch template id (`lt-...`) or name |
| `--launch-template-version`<br />`HATCHRUN_LAUNCH_TEMPLATE_VERSION` | `$Default` | Launch template version |
| `--subnets`<br />`HATCHRUN_SUBNETS` | template's | Subnets, comma separated, tried in order when one is out of capacity |

Give either a token or all three App settings. Durations take values
like `90s`, `15m` or `24h`.
