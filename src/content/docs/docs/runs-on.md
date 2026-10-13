---
title: Choosing a runner
description: The runs-on label that asks hatchrun for a runner, and why it must be the only one.
---

A job asks the hosted service for a runner with one label: `hatchrun`,
or `hatchrun/` followed by options separated by `/`, in any order.

```yaml
jobs:
  test:
    runs-on: hatchrun
  build:
    runs-on: hatchrun/arm64/cpu=8/spot
  release:
    runs-on: hatchrun/type=c7i.2xlarge/disk=100
```

## Options

| Option | Meaning |
| --- | --- |
| `amd64` or `arm64` | CPU architecture. `amd64` when not given. |
| `cpu=N` | At least N vCPUs, 1 to 192. |
| `ram=N` | At least N GiB of memory, 1 to 1536. |
| `disk=N` | A root volume of N GiB, 10 to 16384. |
| `spot` | A Spot instance. |
| `type=X` | This instance type, such as `c7g.xlarge`, instead of `cpu` and `ram`. |

Labels are compared without regard to case, as GitHub does. Numbers are
written plainly, without leading zeros or signs. A label with an unknown
option, an option given twice or `type` together with `cpu` or `ram`
gets no runner.

The limits you set in the connect stack still apply: AWS refuses an
instance type you did not allow or a root volume larger than your
limit, whatever the label asks for. See [Security](/docs/security/).

## One label only

The hatchrun label must be the job's only label. hatchrun skips these
jobs and they stay queued in GitHub:

```yaml
runs-on: [self-hosted, hatchrun]
runs-on: [hatchrun, hatchrun/arm64]
```

GitHub gives a job any idle runner whose labels include all of the
job's labels. If labels could be combined, a job asking only for
`hatchrun` could take the runner launched for `[hatchrun, cpu=8]`, and
the job that asked for eight CPUs would wait for a runner nobody
launches. With one label, each runner registers with exactly its job's
label, jobs with the same label get identical runners, and it does not
matter which of them takes which runner.

Self-hosted scale sets use their own labels. See
[Self-hosting](/docs/self-hosting/).
