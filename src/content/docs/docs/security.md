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

The control plane, hosted or self-hosted, reaches your account through
an IAM role you create.
The role can only launch instances from the hatchrun launch template,
with hatchrun's tags, the instance types you allow and in the regions
you allow, and terminate instances that carry those tags. It cannot
read your data or change anything else. The hosted control plane is
designed to hold no AWS access keys: it receives one-hour credentials
for each use, and the role trusts it only together with an external id
unique to your account. Deleting the role cuts it off.

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
