---
title: Billing
description: How hatchrun CI is billed on one subscription with hatchrun.io, what it costs, and how to add a card.
banner:
  content: "Preview: hatchrun CI is not available yet. These pages document the configuration format and the planned service."
---

:::caution[Coming later]
Billing needs the hosted service and the hatchrun app. This page
describes the plan.
:::

hatchrun CI and [hatchrun.io runners](/docs/costs/) share one
subscription per GitHub organization. An organization that already pays
for runners has nothing to set up. Each product bills at its own rate.

## What it costs

CI jobs are billed per second, with a 60 second minimum per job
attempt. Usage is counted from the attempt's start to its result.

| Template size | Per minute | Per second |
| --- | --- | --- |
| 2 vCPU | $0.002 | $0.0000333 |
| 4 vCPU | $0.004 | $0.0000667 |
| 8 vCPU | $0.008 | $0.0001333 |
| 16 vCPU | $0.016 | $0.0002667 |

amd64 and arm64 cost the same. The price includes the machine. See
[Runner templates and pricing](/docs/ci/reference/runners/) for every
label.

For example, a job that runs 45 seconds on `ubuntu-latest` is billed for
60 seconds, $0.002. A job that runs 10 minutes and 20 seconds on
`ubuntu-26.04-4core` is billed for 620 seconds, about $0.0413.

hatchrun.io runner jobs on the same subscription cost $0.001 a minute
($0.0000167 a second), also with a 60 second minimum per job.

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
2. Under Billing, choose Add a card. The checkout is the same one
   hatchrun.io runners use. If the organization already has a card for
   runners, the page shows "A card is on file."
3. To change the card, see invoices or cancel, choose Manage billing.
   It opens the same billing portal as the runners.

The page also shows the month's runner time, the spend so far and how
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
- [Costs](/docs/costs/)
- [A job did not start](/docs/ci/troubleshooting/job-did-not-start/)
