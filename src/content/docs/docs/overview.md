---
title: Overview
description: What hatchrun is and who it is for.
---

hatchrun runs GitHub Actions jobs on new machines in your own cloud
account: EC2 instances on AWS today, with GCP and Azure next. A workflow
asks for a runner with `runs-on`, hatchrun launches an instance for that
job, the job runs, and the instance terminates.

```yaml
jobs:
  build:
    runs-on: hatchrun-4cpu-arm64
    steps:
      - uses: actions/checkout@v7
      - run: make test
```

It is built for teams that want:

- jobs on instance types GitHub does not offer, or bigger ones for less;
- runners inside their own VPC, next to their databases and registries;
- their cloud discounts, Savings Plans and Spot prices applied to CI;
- a clean machine for every job, without running a Kubernetes cluster.

`hatchrun-4cpu-arm64` names a built-in runner profile: 4 vCPUs and
16 GiB on Arm. See [Choosing a runner](/docs/runs-on/) for the other
profiles and how to make your own.

## Parts

- **Control plane**: takes jobs from GitHub and launches an instance
  for each. The hosted service gets jobs from the hatchrun GitHub App;
  a self-hosted scaler uses GitHub's runner scale set API.
- **Agent**: runs on each instance, fetches the instance's single-use
  runner config, runs one job and powers the instance off.
- **Runner images**: Ubuntu 26.04 AMIs for amd64 and arm64 with the
  GitHub runner, Docker and common build tools.

See [How it works](/docs/how-it-works/) for the details, and
[Downloads](/docs/downloads/) for the release files, the scaler image
and how to verify them.

## Status

hatchrun launches runners in your own AWS account, in any of 17
supported AWS regions. GCP and Azure are next.
The runner images are published, and the scaler, agent, images and the
Terraform module are open source under AGPL-3.0-only. The
[roadmap](/docs/roadmap/) lists what comes next.
