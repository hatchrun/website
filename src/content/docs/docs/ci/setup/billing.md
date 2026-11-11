---
title: Billing
description: How hatchrun CI is billed, what it costs, and how to add a card and set a spend cap.
---

hatchrun CI is billed per GitHub organization through one
subscription, handled by Polar.

## What it costs

CI jobs are billed per second, with a 60-second minimum per job
attempt. Usage is counted from the attempt's start to its result.

| Template size | amd64 per minute | arm64 per minute | Per second |
| --- | --- | --- | --- |
| 2 vCPU | $0.004 | $0.0035 | $0.0000667 / $0.0000583 |
| 4 vCPU | $0.008 | $0.0065 | $0.0001333 / $0.0001083 |
| 8 vCPU | $0.016 | $0.012 | $0.0002667 / $0.0002 |
| 16 vCPU | $0.032 | $0.023 | $0.0005333 / $0.0003833 |

Arm templates cost less than the same size on amd64. The price
includes the machine. See
[Runner templates and pricing](/docs/ci/reference/runners/) for every
label.

For example, a job that runs 45 seconds on `ubuntu-latest` is billed for
60 seconds, $0.004. A job that runs 10 minutes and 20 seconds on
`ubuntu-26.04-4core` is billed for 620 seconds, about $0.0827.

## How this compares with GitHub Actions

Prices below are GitHub's paid Linux per-minute rates at the time of
writing. GitHub rounds each job up to the nearest whole minute; hatchrun
bills per second with a 60-second minimum.

On public repositories GitHub's standard runners are free, and there
`ubuntu-latest` is a 4 vCPU machine. The 4, 8 and 16 vCPU rows use
GitHub's larger-runner rates, which apply on public repositories too.

| Template size | GitHub x64 | GitHub arm64 | hatchrun amd64 | hatchrun arm64 |
| --- | --- | --- | --- | --- |
| 2 vCPU | $0.006 | $0.005 | $0.004 | $0.0035 |
| 4 vCPU | $0.012 | $0.008 | $0.008 | $0.0065 |
| 8 vCPU | $0.022 | $0.014 | $0.016 | $0.012 |
| 16 vCPU | $0.042 | $0.026 | $0.032 | $0.023 |

A 10-minute job on 2 vCPU costs $0.06 on GitHub x64 against $0.04 on
hatchrun amd64. A 10-minute-30-second job is billed as 11 minutes on
GitHub ($0.066) and as 630 seconds on hatchrun ($0.042). GitHub's plans
include a monthly allowance of minutes and run public repositories for
free on standard runners; hatchrun has no free minutes and bills every
job, on any repository.

There are no free minutes, no free units and no grace period.

## A card is required

An organization needs a card on file before a job starts. Until then,
every job waits and its check run says:

```text
Waiting for a card. Add one for acme at https://app.hatchrun.io/o/acme/ci.
```

The jobs start when the card is added, with no need to push again.

## Add a card and manage billing

1. Open the organization's CI page at
   [app.hatchrun.io](https://app.hatchrun.io), under `/o/ORG/ci`.
2. Under Billing, choose Add a card. Once a card is on file, the page
   shows "A card is on file."
3. To change the card, see invoices or cancel, choose Manage billing.
   It opens the billing portal.

The page also shows the month's job time, the spend so far and how
many jobs run now.

## Spend cap and concurrent jobs

- The monthly spend cap is $50 to start. Set it to any whole number of
  dollars from $50 to $10,000 on the CI page. Jobs that would go past
  the cap wait, and the check run says so.
- At most 5 jobs run at once per organization to start. The rest wait
  until one ends.

## Beta organizations

Organizations in the beta are not billed.

## Next steps

- [Runner templates and pricing](/docs/ci/reference/runners/)
- [A job did not start](/docs/ci/troubleshooting/job-did-not-start/)
