---
title: Self-hosting
description: Running the hatchrun control plane in your own account.
---

Everything in hatchrun is open source under the Apache-2.0 licence, and
you can run all of it yourself. A self-hosted install needs no GitHub
App and no hatchrun.io account: a scaler in your account talks to
GitHub directly.

## Status

The scaler, agent and broker run end to end today, but installing them
still takes manual steps. A CloudFormation template that sets up a
scale set in one step, with a Launch Stack button per region, is in
progress. Until then, see the READMEs in
[hatchrun/hatchrun](https://github.com/hatchrun/hatchrun) and
[hatchrun/images](https://github.com/hatchrun/images).
[Downloads](/docs/downloads/) lists the scaler binaries, the scaler
image and the runner AMIs, and how to verify them.

## What you will run

- **The scaler**, one per scale set, as a small ECS Fargate task.
- **An IAM role** for the scaler, limited to launching and terminating
  hatchrun instances.
- **A launch template and a security group** for runners, with no
  inbound rules.
- **Runner configs** handed over through SSM Parameter Store, so nothing
  leaves your account.

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
   config itself.
5. At boot, `hatchrun-agent` claims the config, runs exactly one job and
   powers the instance off, as in the hosted service. See
   [How it works](/docs/how-it-works/).

## Handing over the runner config

The scaler can hand configs over in two ways:

- **Broker**: the same broker the hosted service uses, run by you. It
  stores each config under a random ticket for up to an hour and gives
  it to the first claim only.
- **SSM parameter**: the config waits in a Parameter Store parameter
  named by an instance tag. The agent reads and deletes it with the
  instance role, so runners need an instance profile in this mode.

## Restarts

The scaler keeps no database. After a restart it rebuilds its view from
GitHub's runner list and the tags on your instances, and takes over the
instances that are still running jobs.
