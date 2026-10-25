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
  `type: approval` and nobody has approved it yet. A job whose
  [environment](/docs/ci/setup/environments/#approval) requires
  approval waits too, and its check run names the run page where an
  organization admin can approve or reject it.
- **It waits for a card.** The check run says "Waiting for a card".
  Add one on the organization's CI page. See
  [Billing](/docs/ci/setup/billing/#a-card-is-required).
- **It reached the spend cap or the limit of 5 running jobs.** The
  check run says which. Raise the cap on the CI page, or wait for a
  running job to end.

## The job was skipped

- **A job it requires failed.** Without a status function in its
  `if:`, a job runs only when every job before it succeeded. Add
  `if: always()` to run anyway.
- **Its `if:` was false.** Check the expression against the event.
  See [A step was skipped](/docs/ci/troubleshooting/step-skipped/) for
  how conditions work.

## The job failed before it started

- **The environment does not exist.** The job names an environment the
  repository has not created. Create it, or fix the name.
- **The branch is not allowed.** The environment lists branches and
  this run is on another one. Pull request and tag runs never match a
  non-empty list.
- **An admin rejected it.** The check run says `Rejected by LOGIN`.
  Push again, or retry the job, and ask for approval again.

See [Environments](/docs/ci/setup/environments/).

## The job was cancelled

- **It ran past `timeout-minutes`.** The default is 360 minutes. Raise
  it, or find what hangs.
- **The run was cancelled.**

## Next steps

- [Billing](/docs/ci/setup/billing/)
- [A step was skipped](/docs/ci/troubleshooting/step-skipped/)
- [Run jobs in order with requires and approvals](/docs/ci/guides/requires-approvals/)
