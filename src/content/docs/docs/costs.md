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

- **Hosted**: billed per second, per GitHub organization, at $0.001 a
  minute ($0.0000167 a second). Each job costs at least 60 seconds. A
  job counts from when its runner starts it to when it completes, and
  only jobs that ran on a hatchrun runner count. There are no free
  minutes and no grace period: an organization needs a card on file
  before runners launch. Add one under Settings in the app, through
  Polar. The app shows the month's usage there. The fee pays for image
  rebuilds and scans, security fixes, support and the hosted control
  plane. hatchrun never marks up compute. For large volume, invoicing
  or an SLA, email
  [support@hatchrun.io](mailto:support@hatchrun.io).
- **Self-hosted**: the scaler is one small container or instance in your
  account, a few dollars a month. See [Self-hosting](/docs/self-hosting/).

## hatchrun CI

hatchrun CI jobs run on machines hatchrun owns, so there is no AWS
bill. They are billed on the same subscription as the runners above,
per second with a 60-second minimum per job, at their own rate: $0.002
a minute for a 2 vCPU template, and 2x, 4x and 8x that for the 4, 8 and
16 vCPU templates. See [Billing](/docs/ci/setup/billing/).

## Images

The runner images are free in AWS Marketplace, and subscribing costs
nothing. AWS still bills the instances, volumes, public IPv4 addresses
and other resources your runners use, as above.
