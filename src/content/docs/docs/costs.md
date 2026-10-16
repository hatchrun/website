---
title: Costs
description: What you pay for when you run jobs with hatchrun.
---

## Runners

Runners are EC2 instances in your account, so AWS bills you for them
directly:

- **Instance time**, per second, from launch until the instance
  terminates. That is the job plus the boot, 29.5 seconds on a
  t4g.medium in ap-south-1.
- **The root volume**, gp3, for the same time.
- **A public IPv4 address**, if runners get one, per hour while they run.

As an example, a c7g.large (2 vCPU, 4 GiB, arm64) costs $0.0725 an hour
on demand in us-east-1 at the time of writing, about 1.2 cents for a
ten-minute job. Spot prices are usually far lower. Check current prices
for your region and instance types.

Runners need outbound internet access. A NAT gateway costs about $32 a
month before data, so the default setup puts runners in public subnets
with a security group that allows no inbound traffic.

## Control plane

- **Hosted**: a flat subscription per GitHub organization. It pays for
  image rebuilds and scans, security fixes, support and the hosted
  control plane. hatchrun never marks up compute.
- **Self-hosted**: the scaler is one small container or instance in your
  account, a few dollars a month. See [Self-hosting](/docs/self-hosting/).

## Images

The runner images are free in AWS Marketplace, and subscribing costs
nothing. AWS still bills the instances, volumes, public IPv4 addresses
and other resources your runners use, as above.
