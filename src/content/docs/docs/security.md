---
title: Security
description: What hatchrun can reach, what it cannot, and how runners are isolated.
---

## Runners stay in your account

Runner instances run in your AWS account, in subnets you choose. Your
code, secrets and build output never pass through hatchrun's systems.
The hosted control plane only launches and terminates instances; it
never logs in to them.

## One job per instance

Every job runs on a new instance that is terminated when the job ends.
A job cannot leave anything behind for the next one: no files, no
processes, no cached credentials.

## What the control plane can do in AWS

The hosted control plane reaches your account through an IAM role that
your connect stack creates, one per region. The role can:

- launch instances from the stack's launch template, into the stack's
  VPC and security group, from AWS Marketplace images your account
  subscribed to only, which are the hatchrun runner images unless you
  subscribed to others;
- pick only the instance types you allowed and root volumes up to your
  size limit;
- launch only with IMDSv2 required, a metadata hop limit of 1 and
  encrypted volumes, so a launch cannot weaken the template's
  metadata and volume settings;
- tag instances at launch with your tenant id, and stop, start, modify,
  retag or terminate only instances that carry that tag;
- list instances and the instance types offered in the region.

It cannot read your data, log in to instances, touch instances it did
not launch, create or change IAM roles, or give a runner an instance
profile. The one IAM action it holds creates the service-linked role
AWS needs before the first Spot launch in an account.

## No access keys

The role has no access keys, so hatchrun.io holds none that could leak.
It trusts the OIDC issuer at `oidc.hatchrun.io` and only tokens whose
subject is `tenant:<your tenant id>`. For each use the control plane
signs a short-lived token and trades it with AWS STS for credentials
that expire within an hour. A token for another tenant gets nothing.
Deleting the stack, or the role, cuts hatchrun.io off.

Runners get no instance profile either. The agent claims its runner
config from the broker with a single-use ticket, and jobs that need AWS
use [GitHub's OIDC](https://docs.github.com/en/actions/security-for-github-actions/security-hardening-your-deployments/configuring-openid-connect-in-amazon-web-services).

A self-hosted scaler uses its own role in your account. See
[Self-hosting](/docs/self-hosting/).

## Runner configs

The just-in-time config that registers a runner is single-use, never
written to user data, never put on a command line and never visible to
job steps. See [How it works](/docs/how-it-works/).

## Runner telemetry

Runners launched by the hosted service report their CPU, memory, disk and network use to
`telemetry.hatchrun.io` over HTTPS while a job runs. The app shows the
numbers on the job's page. Runners started by a self-hosted scaler send
nothing.

The agent reports once a minute, and once more when the runner exits.
Each report holds ten-second windows, and each window carries:

- CPU busy share (lowest second, mean and highest second) and CPU
  steal;
- the highest memory in use and the instance's total memory;
- the peak memory of the agent's cgroup, which holds the runner and
  the job's processes, and its OOM kills;
- disk used on the root file system;
- bytes received and sent.

Each report also names the instance type, the CPU architecture and the
agent version. The reports carry nothing else. No logs, command lines,
environment variables or file names.

Job logs stay on GitHub, and the app links to the job there.

At boot the runner gets a signed token with its config and keeps it in
memory. The token names the job and the GitHub App installation, and
expires after nine hours.

The telemetry service takes the job id and installation id from the
token, never from the report, so a runner cannot report for another
job.

hatchrun signs the token with a key that signs nothing else. The OIDC
key that gets credentials for your AWS role never signs anything a
runner holds.

hatchrun keeps the reports in Cloudflare Workers Analytics Engine,
which deletes them after three months.

## Network

The security group for runners allows no inbound traffic.

Runners only make outbound connections. They connect to GitHub, to
the broker that hands out runner configs and to whatever your jobs
use. Runners launched by the hosted service also connect to
`telemetry.hatchrun.io`.

## Images

Runner images are built from pinned, checksummed inputs, scanned with
Trivy before the AMI is made, scanned again by AWS Marketplace, and
published with an SBOM and a build provenance attestation. See [Runner images](/docs/images/).

## Reporting a vulnerability

Report security issues privately through
[GitHub security advisories](https://github.com/hatchrun/hatchrun/security/advisories/new).
