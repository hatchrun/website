---
title: Choosing a runner
description: The runs-on label that names a runner profile, the overrides it takes, and why it must be the only label.
---

A job asks the hosted service for a runner by naming one runner profile
in `runs-on`:

```yaml
jobs:
  test:
    runs-on: hatchrun
  build:
    runs-on: hatchrun-4cpu-arm64
```

## Built-in profiles

Every organization has these profiles, with 4 GiB of memory per vCPU,
on-demand:

| Profile | vCPU | Memory | Architecture |
| --- | --- | --- | --- |
| `hatchrun-2cpu` (also `hatchrun`) | 2 | 8 GiB | x86-64 |
| `hatchrun-4cpu` | 4 | 16 GiB | x86-64 |
| `hatchrun-8cpu` | 8 | 32 GiB | x86-64 |
| `hatchrun-16cpu` | 16 | 64 GiB | x86-64 |
| `hatchrun-2cpu-arm64` to `hatchrun-16cpu-arm64` | 2 to 16 | 8 to 64 GiB | Arm (Graviton) |

x86-64 profiles run on m8i, or m7i where a region has no m8i. Arm
profiles run on m8g, or m7g.

## Your own profiles

Owners add profiles under Runners in
[app.hatchrun.io](https://app.hatchrun.io): instance families in order
of preference, vCPU and memory, root volume, Spot or on-demand, and
image. Names start with `hatchrun-`. A profile named like a built-in
replaces it for your organization. The Runners page shows the instance
type each profile gets in your region and its on-demand price.

## Overrides

One job can change its profile in the same label, with overrides
separated by `/`:

```yaml
runs-on: hatchrun-4cpu/disk=200/spot=true
```

| Override | Meaning |
| --- | --- |
| `cpu=N` | At least N vCPUs. |
| `ram=N` | At least N GiB of memory. |
| `disk=N` | A root volume of N GiB. |
| `spot=true` or `spot=false` | Spot, falling back to on-demand when Spot has no capacity, or on-demand. |

A job with an unknown profile or an unknown override is skipped, and
the GitHub App's webhook delivery log says why.

The connect stack has the final word. Its `InstanceTypes` and
`VolumeSizeLimit` parameters limit what hatchrun can launch, the
Runners page offers only what they allow, and a job that asks for more
fails with the reason on the Jobs page. See [Security](/docs/security/).

## One label only

The hatchrun label must be the job's only label. hatchrun skips these
jobs and they stay queued in GitHub:

```yaml
runs-on: [self-hosted, hatchrun]
runs-on: [hatchrun, hatchrun-4cpu-arm64]
```

GitHub gives a job any idle runner whose labels include all of the
job's labels. If labels could be combined, a job asking only for
`hatchrun` could take the runner launched for
`[hatchrun, hatchrun-8cpu]`, and the job that asked for eight CPUs
would wait for a runner nobody launches. With one label, each runner
registers with exactly its job's label, jobs with the same label get
identical runners, and it does not matter which of them takes which
runner.

Self-hosted scale sets use their own labels. See
[Self-hosting](/docs/self-hosting/).
