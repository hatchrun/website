---
title: Choose a runner size
description: Pick a runner template for each job, switch to Arm, and weigh time against cost.
banner:
  content: "Preview: hatchrun CI is not available yet. These pages document the configuration format and the planned service."
---

Every job names a runner template with `runs-on`. The template sets the
CPU architecture, the vCPUs and the memory. Price follows the vCPUs,
so a bigger machine costs more per minute and may cost less per job.

## Prerequisites

- A config with at least one job.

:::steps

1. ## Start on the smallest template

   `ubuntu-latest` has 2 vCPUs and 8 GiB on x86-64, at $0.002 a
   minute. Start every job there:

   ```yaml title=".hatchrun/config.yml"
   jobs:
     test:
       runs-on: ubuntu-latest
       steps:
         - run: make test
   ```

2. ## Move slow, parallel jobs up

   Builds and test suites that use every core get faster with more of
   them. Double the vCPUs and the price per minute doubles:

   ```yaml title=".hatchrun/config.yml"
   jobs:
     build:
       runs-on: ubuntu-26.04-8core
       steps:
         - run: cargo build --release
   ```

   Jobs are billed per second, with a 60-second minimum, so a job that
   ends in 20 seconds costs the same as one that runs for 60.

   If the job takes half as long, it costs the same and you wait half
   as long. This holds only when both runs last longer than the 60-second
   minimum: a 100-second job on `ubuntu-latest` costs $0.0033, but the same
   job at 50 seconds on `ubuntu-26.04-4core` is billed for 60 seconds and
   costs $0.004. If it takes as long as before, the job is not using the
   cores; move it back.

3. ## Name shared sizes with an executor

   ```yaml title=".hatchrun/config.yml"
   executors:
     big:
       runs-on: ubuntu-26.04-8core

   jobs:
     build:
       executor: big
       steps:
         - run: cargo build --release
     test:
       executor: big
       steps:
         - run: cargo test
   ```

4. ## Try Arm

   Every size has an Arm template ending in `-arm`, at the same price.
   Arm suits code that builds for Arm, or that has no x86-only
   dependencies:

   ```yaml title=".hatchrun/config.yml"
   jobs:
     test:
       runs-on: ubuntu-26.04-arm
       steps:
         - run: make test
   ```

5. ## Validate

   ```sh
   hatchrun validate
   ```

   A label that names no template is an error, and the message lists
   the labels that work.

:::

## The templates

| `runs-on` | Arch | vCPU | Memory | Per minute |
| --- | --- | --- | --- | --- |
| `ubuntu-latest`, `ubuntu-26.04` | amd64 | 2 | 8 GiB | $0.002 |
| `ubuntu-26.04-arm` | arm64 | 2 | 8 GiB | $0.002 |
| `ubuntu-26.04-4core` | amd64 | 4 | 16 GiB | $0.004 |
| `ubuntu-26.04-4core-arm` | arm64 | 4 | 16 GiB | $0.004 |
| `ubuntu-26.04-8core` | amd64 | 8 | 32 GiB | $0.008 |
| `ubuntu-26.04-8core-arm` | arm64 | 8 | 32 GiB | $0.008 |
| `ubuntu-26.04-16core` | amd64 | 16 | 64 GiB | $0.016 |
| `ubuntu-26.04-16core-arm` | arm64 | 16 | 64 GiB | $0.016 |

See [Runner templates and pricing](/docs/ci/reference/runners/).

## Troubleshooting

:::note[ubuntu-24.04 names no runner template]
hatchrun runs Ubuntu 26.04 only. Use `ubuntu-latest`, and check your
tools work on 26.04.
:::

:::note[The job runs out of memory]
Memory grows with vCPUs, 4 GiB each. Move up one size.
:::

## Next steps

- [Split tests across parallel jobs](/docs/ci/guides/test-splitting/)
