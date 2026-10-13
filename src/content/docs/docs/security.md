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
  VPC and security group, from hatchrun's published images only;
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

The role has no access keys, so hatchrun.dev holds none that could leak.
It trusts the OIDC issuer at `oidc.hatchrun.dev` and only tokens whose
subject is `tenant:<your tenant id>`. For each use the control plane
signs a short-lived token and trades it with AWS STS for credentials
that expire within an hour. A token for another tenant gets nothing.
Deleting the stack, or the role, cuts hatchrun.dev off.

Runners get no instance profile either. The agent claims its runner
config from the broker with a single-use ticket, and jobs that need AWS
use [GitHub's OIDC](https://docs.github.com/en/actions/security-for-github-actions/security-hardening-your-deployments/configuring-openid-connect-in-amazon-web-services).

A self-hosted scaler uses its own role in your account. See
[Self-hosting](/docs/self-hosting/).

## Runner configs

The just-in-time config that registers a runner is single-use, never
written to user data, never put on a command line and never visible to
job steps. See [How it works](/docs/how-it-works/).

## Network

The security group for runners allows no inbound traffic. Runners only
make outbound connections, to GitHub and whatever your jobs use.

## Images

Runner images are built from pinned, checksummed inputs, scanned with
Trivy before the AMI is made, and published with an SBOM and a build
provenance attestation. See [Runner images](/docs/images/).

## Reporting a vulnerability

Report security issues privately through
[GitHub security advisories](https://github.com/hatchrun/hatchrun/security/advisories/new).
