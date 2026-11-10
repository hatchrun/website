---
title: Runner templates and pricing
description: Every runner template hatchrun CI offers, with architecture, vCPUs, memory and price.
---

A job picks its machine with `runs-on`, directly or through an
executor. The label names one runner template from this table. You
cannot define your own.

## Templates

| `runs-on` | Arch | vCPU | Memory | Price per minute |
| --- | --- | --- | --- | --- |
| `ubuntu-latest`, `ubuntu-26.04` | amd64 | 2 | 8 GiB | $0.004 |
| `ubuntu-26.04-arm` | arm64 | 2 | 8 GiB | $0.0035 |
| `ubuntu-26.04-4core` | amd64 | 4 | 16 GiB | $0.008 |
| `ubuntu-26.04-4core-arm` | arm64 | 4 | 16 GiB | $0.0065 |
| `ubuntu-26.04-8core` | amd64 | 8 | 32 GiB | $0.016 |
| `ubuntu-26.04-8core-arm` | arm64 | 8 | 32 GiB | $0.012 |
| `ubuntu-26.04-16core` | amd64 | 16 | 64 GiB | $0.032 |
| `ubuntu-26.04-16core-arm` | arm64 | 16 | 64 GiB | $0.023 |

- Price is $0.002 per vCPU per minute on amd64, a little less on
  arm64, and includes the machine.
- Jobs are billed per second, with a 60-second minimum per job attempt. There
  are no free minutes. See [Billing](/docs/ci/setup/billing/).
- Memory is 4 GiB per vCPU.
- `ubuntu-latest` and `ubuntu-26.04` are two names for one template.

## Against GitHub Actions

GitHub's hosted Linux runners bill each job rounded up to the nearest
whole minute. hatchrun bills per second with a 60-second minimum, so a
job that runs a little past a minute boundary costs proportionally
less here. At the time of writing, GitHub charges $0.006 a minute for 2
vCPU x64 against $0.004 here, $0.012 against $0.008 at 4 vCPU, $0.022
against $0.016 at 8 vCPU, and $0.042 against $0.032 at 16 vCPU; Arm is
$0.005, $0.008, $0.014 and $0.026 against $0.0035, $0.0065, $0.012 and
$0.023 here. Those are GitHub's paid larger-runner rates; standard
runners are free on public repositories. See
[Billing](/docs/ci/setup/billing/) for the full comparison.

## The machine

- Each job gets a new machine that runs only that job and is then
  removed.
- Machines are on-demand capacity, never reclaimed in the middle of a
  job.
- The image is the hatchrun runner image: Ubuntu 26.04 with the layout
  of GitHub's hosted runners, common toolchains, and Docker with
  Buildx.
- Steps can use `sudo` without a password.
- The machine has no cloud credentials and cannot reach its host's
  instance metadata. Outbound traffic is open except port 25.

## Labels that name no template

Any other label is an error in `hatchrun validate`, and the message
lists the labels that work:

<!-- check: validate-fails -->
```yaml title=".hatchrun/config.yml"
jobs:
  test:
    runs-on: ubuntu-24.04
    steps:
      - run: make test
```

```text
.hatchrun/config.yml: job `test` has `runs-on: ubuntu-24.04`, which names no runner template; use one of ubuntu-latest, ubuntu-26.04, ubuntu-26.04-arm, ubuntu-26.04-4core, ubuntu-26.04-4core-arm, ubuntu-26.04-8core, ubuntu-26.04-8core-arm, ubuntu-26.04-16core, ubuntu-26.04-16core-arm
```

`hatchrun convert` maps GitHub's retired Ubuntu labels:
`ubuntu-24.04` and `ubuntu-22.04` become `ubuntu-latest`, and their
`-arm` forms become `ubuntu-26.04-arm`. macOS and Windows labels have
no template.
