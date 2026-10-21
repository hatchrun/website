---
title: Runners
description: The runner templates a job can ask for, their sizes and their per-minute prices.
banner:
  content: "Preview: hatchrun CI is not available yet. This page documents the configuration format."
---

A job names its machine with `runs-on`, directly or through an
[executor](/docs/ci/configuration/#executors). The label picks one of
a fixed set of runner templates, named the way GitHub names its hosted
runners. You cannot define your own templates.

```yaml title=".hatchrun/config.yml"
executors:
  arm:
    runs-on: ubuntu-26.04-arm

jobs:
  unit:
    runs-on: ubuntu-latest
    steps:
      - run: make test
  build:
    executor: arm
    steps:
      - run: make build
  e2e:
    runs-on: ubuntu-26.04-8core
    steps:
      - run: make e2e
```

## Templates

| `runs-on` | Arch | vCPU | Memory | Price per minute |
| --- | --- | --- | --- | --- |
| `ubuntu-latest`, `ubuntu-26.04` | amd64 | 2 | 8 GiB | $0.002 |
| `ubuntu-26.04-arm` | arm64 | 2 | 8 GiB | $0.002 |
| `ubuntu-26.04-4core` | amd64 | 4 | 16 GiB | $0.004 |
| `ubuntu-26.04-4core-arm` | arm64 | 4 | 16 GiB | $0.004 |
| `ubuntu-26.04-8core` | amd64 | 8 | 32 GiB | $0.008 |
| `ubuntu-26.04-8core-arm` | arm64 | 8 | 32 GiB | $0.008 |
| `ubuntu-26.04-16core` | amd64 | 16 | 64 GiB | $0.016 |
| `ubuntu-26.04-16core-arm` | arm64 | 16 | 64 GiB | $0.016 |

The price follows the vCPU count: $0.001 per vCPU per minute, the same
for amd64 and arm64. It includes the machine. Memory is 4 GiB per
vCPU.

`ubuntu-latest` and `ubuntu-26.04` are two names for one template.

## The machine

Every job gets a fresh machine that runs only that job, on on-demand
capacity, so a job is never interrupted to reclaim it. The machine
runs the hatchrun runner image: Ubuntu 26.04 with the layout of
GitHub's hosted runners, common toolchains and Docker with Buildx.
Steps can use `sudo` without a password.

The machine has no cloud credentials and no access to its host's
instance metadata. Outbound network traffic is open except port 25.

## Labels that name no template

A label that is not in the table, such as `ubuntu-24.04`,
`macos-latest` or `windows-latest`, is an error. `hatchrun validate`
reports it and lists the labels it accepts:

```text
.hatchrun/config.yml: job `t` has `runs-on: ubuntu-24.04`, which names no runner template; use one of ubuntu-latest, ubuntu-26.04, ubuntu-26.04-arm, ubuntu-26.04-4core, ubuntu-26.04-4core-arm, ubuntu-26.04-8core, ubuntu-26.04-8core-arm, ubuntu-26.04-16core, ubuntu-26.04-16core-arm
```

`hatchrun convert` maps GitHub's retired Ubuntu labels for you:
`ubuntu-24.04` and `ubuntu-22.04` become `ubuntu-latest`, and their
`-arm` forms become `ubuntu-26.04-arm`. See
[Migrating from GitHub Actions](/docs/ci/migrating/#runs-on).

