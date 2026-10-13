---
title: Self-hosting
description: Running the hatchrun control plane in your own account.
---

Everything in hatchrun is open source under the Apache-2.0 licence, and
you can run all of it yourself.

## Status

The scaler, agent and broker run end to end today, but installing them
still takes manual steps. A CloudFormation template that sets up a
scale set in one step, with a Launch Stack button per region, is in
progress. Until then, see the READMEs in
[hatchrun/hatchrun](https://github.com/hatchrun/hatchrun) and
[hatchrun/images](https://github.com/hatchrun/images).

## What you will run

- **The scaler**, one per scale set, as a small ECS Fargate task.
- **An IAM role** for the scaler, limited to launching and terminating
  hatchrun instances.
- **A launch template and a security group** for runners, with no
  inbound rules.
- **Runner configs** handed over through SSM Parameter Store, so nothing
  leaves your account.
