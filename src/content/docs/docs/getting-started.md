---
title: Getting started
description: Connect a GitHub organization and an AWS account to hatchrun.io and run the first job.
---

This guide sets up the hosted service. It takes five steps in
[app.hatchrun.io](https://app.hatchrun.io), then one line in a
workflow. To run the control plane yourself, see
[Self-hosting](/docs/self-hosting/).

## Before you start

You need:

- owner rights on the GitHub organization;
- an AWS account where you can create CloudFormation stacks and IAM
  roles;
- an invite code for the [beta](/docs/beta/), unless hatchrun already
  listed your organization.

Runners launch in that AWS account and AWS bills it for them. hatchrun
holds no access keys to it. See [Security](/docs/security/).

## 1. Install the GitHub App

Sign in to [app.hatchrun.io](https://app.hatchrun.io) with GitHub and
install the hatchrun GitHub App on your organization. GitHub shows the
permissions the App asks for and lets you pick the repositories it
sees.

The App sends hatchrun a webhook for every queued job in those
repositories, and hatchrun launches a runner for it.

## 2. Enter your invite code

On the plan step, enter your beta invite code. The beta is free. Only
organizations in it can launch runners.

## 3. Subscribe to the runner images

Runners boot from the hatchrun images in AWS Marketplace. The images
are free; AWS charges only for the instances. Signed in to the AWS
account you connect, open both links on the setup page and subscribe
once.

EC2 refuses to launch an image the account has not subscribed to.
Skip this step and jobs fail with `OptInRequired`.

## 4. Launch the connect stack

The connect stack is a CloudFormation stack in your account. It creates
the role hatchrun assumes, an IAM OIDC provider for
`oidc.hatchrun.io`, a launch template and an S3 bucket for job caches.

[Security](/docs/security/) lists what the role may do.

Pick the region for your runners and choose Launch Stack. The
CloudFormation console opens the `hatchrun` stack with your tenant ID
filled in. The role accepts only hatchrun requests for that tenant.

Check these parameters before you create the stack:

| Parameter | Default | What it does |
| --- | --- | --- |
| `InstanceTypes` | any size up to `8xlarge` | Instance types AWS lets hatchrun launch. Wildcards allowed. |
| `ExcludedInstanceTypes` | GPU, accelerator and bare metal | Types AWS refuses even when `InstanceTypes` allows them. |
| `VolumeSizeLimit` | 200 | Largest runner volume in GiB. |
| `RootVolumeSize` | 30 | Root volume in GiB for jobs that do not ask for one. |
| `VpcId`, `SubnetIds` | empty | Your own VPC and subnets. Empty creates a VPC with two public subnets. |
| `OidcProviderArn` | empty | Leave empty for the first stack in an account. |

Your own subnets need a route to the internet, through public IPs or a
NAT gateway. Runners make only outbound HTTPS connections.

IAM keeps one OIDC provider per URL in an account. For a second stack
in another region of the same account, paste the first stack's
`OidcProviderArn` output into the `OidcProviderArn` parameter.

Tick the box that lets the stack create IAM resources, then create
it.

## 5. Paste the role ARN

Once the stack shows `CREATE_COMPLETE`, open its Outputs tab and copy
`RoleArn`. Paste it into the setup page and choose Verify and connect.

hatchrun assumes the role, reads the launch template, subnets and
instance type limits the stack allows, and checks that the subnets
exist. An error here names what is wrong. Fix the stack and verify
again.

## 6. Run a job

Set a job's `runs-on` to `hatchrun`:

```yaml
jobs:
  test:
    runs-on: hatchrun
    steps:
      - uses: actions/checkout@v7
      - run: make test
```

`hatchrun` gets a runner with 2 vCPUs and 8 GiB on x86-64. Push the
change. The job shows on the Jobs page of the app, and a new instance
starts in your account, runs the job and terminates.

The job's page in the app shows its CPU and memory use. Start with
`hatchrun` and move a job to a bigger profile when those numbers say it
needs one.

## Choosing a label

The label names a runner profile, and the profile sets the vCPUs,
memory and architecture:

```yaml
runs-on: hatchrun-8cpu
runs-on: hatchrun-4cpu-arm64
runs-on: hatchrun-4cpu/disk=200/spot=true
```

The built-in profiles are `hatchrun-2cpu`, `hatchrun-4cpu`,
`hatchrun-8cpu` and `hatchrun-16cpu`, plus the same names ending in
`-arm64` for Graviton. Owners add their own on the Runners page.

Overrides after a `/` change one job. They are `cpu=N`, `ram=N`,
`disk=N` and `spot=true` or `spot=false`.
[Choosing a runner](/docs/runs-on/) has the full tables.

## One label only

The hatchrun label must be the only label in `runs-on`. hatchrun skips
a job with more labels and it stays queued in GitHub:

```yaml
runs-on: [self-hosted, hatchrun]   # skipped
runs-on: [hatchrun, hatchrun-8cpu] # skipped
```

GitHub gives a job any idle runner that has all of the job's labels.
With combined labels, a job asking for `hatchrun` could take the runner
launched for `[hatchrun, hatchrun-8cpu]`, and the bigger job would wait.

The GitHub App's webhook delivery log lists each skipped job and the
reason.

## Updating the stack

Some hatchrun releases need a newer connect stack. The app then says
what the update brings and shows the console steps and the AWS CLI
command. Runners keep working on the old stack until you update.
