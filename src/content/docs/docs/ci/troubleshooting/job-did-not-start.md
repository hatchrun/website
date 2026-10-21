---
title: A job did not start
description: Why a planned hatchrun CI job stays queued, is skipped, or never appears.
banner:
  content: "Preview: hatchrun CI is not available yet. These pages document the configuration format and the planned service."
---

:::caution[Coming later]
Job scheduling needs the hosted service. This page describes the
planned behaviour.
:::

The workflow started, but one job did not run. Find your symptom.

## The job has no check run

The run never planned it.

- **A branch or tag filter dropped it.** `branches` and `tags` on its
  workflow entry did not match the ref. For a pull request the ref is
  the base branch.
- **It requires a dropped entry.** An entry that requires a dropped
  entry is dropped too, and so on down the chain.
- **It is in another workflow.** Each workflow plans only its own
  entries. Check that the workflow listing the job started.

## The job stays queued

- **It waits for the jobs it requires.** It starts when all of them
  finish. A required matrix or parallel entry means every one of its
  jobs.
- **It waits for an approval.** An entry it requires has
  `type: approval` and nobody has approved it yet.

## The job was skipped

- **A job it requires failed.** Without a status function in its
  `if:`, a job runs only when every job before it succeeded. Add
  `if: always()` to run anyway.
- **Its `if:` was false.** Check the expression against the event.
  See [A step was skipped](/docs/ci/troubleshooting/step-skipped/) for
  how conditions work.

## The job was cancelled

- **It ran past `timeout-minutes`.** The default is 360 minutes. Raise
  it, or find what hangs.
- **The run was cancelled.**

## Next steps

- [A step was skipped](/docs/ci/troubleshooting/step-skipped/)
- [Run jobs in order with requires and approvals](/docs/ci/guides/requires-approvals/)
