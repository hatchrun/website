---
title: Overview
description: What hatchrun is and who it is for.
---

hatchrun runs GitHub Actions jobs on EC2 instances in your own AWS
account. A workflow asks for a runner with `runs-on`, hatchrun launches
an instance for that job, the job runs, and the instance terminates.

```yaml
jobs:
  build:
    runs-on: hatchrun-linux-arm64
    steps:
      - uses: actions/checkout@v7
      - run: make test
```

It is built for teams that want:

- jobs on instance types GitHub does not offer, or bigger ones for less;
- runners inside their own VPC, next to their databases and registries;
- their AWS discounts, Savings Plans and Spot prices applied to CI;
- a clean machine for every job, without running a Kubernetes cluster.

## Parts

- **Scaler**: talks to GitHub's runner scale set API and launches or
  removes instances as jobs queue and finish.
- **Agent**: runs on each instance, fetches the instance's single-use
  runner config, runs one job and powers the instance off.
- **Runner images**: Ubuntu 26.04 AMIs for amd64 and arm64 with the
  GitHub runner, Docker and common build tools.

See [How it works](/docs/how-it-works/) for the details.

## Status

hatchrun is in early development. The runner images are published, the
agent and scaler run end to end, and the hosted control plane is being
built, with a private [beta](/docs/beta/) to follow. The [roadmap](/docs/roadmap/) lists what
comes next.
