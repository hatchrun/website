---
title: Check runs and statuses
description: What hatchrun CI shows on commits and pull requests, how to read a failed check, and where the logs are.
banner:
  content: "Preview: hatchrun CI is not available yet. These pages document the configuration format and the planned service."
---

:::caution[Coming later]
Check runs need the hosted service. This page describes the plan.
:::

hatchrun reports results through GitHub check runs. You read them
where you read GitHub Actions results today: on the commit, in the
pull request's merge box and in its Checks tab.

## One check run per job

Every job hatchrun plans gets its own check run, named after its job
id. Matrix combinations and parallel copies are separate jobs, so
each gets its own check run:

| Workflow entry | Check runs |
| --- | --- |
| `test` | `test` |
| `test` with `matrix: { node: [20, 22] }` | `test (20)`, `test (22)` |
| `test` on a job with `parallelism: 2` | `test [1/2]`, `test [2/2]` |
| `hold` with `type: approval` | `hold` |

A job dropped by its `branches` or `tags` filter gets no check run.
See [job ids](/docs/ci/reference/configuration/#job-ids-after-expansion)
for the full naming rule.

## States

| State on GitHub | Meaning |
| --- | --- |
| Queued | The job waits for the jobs it requires, a machine, or an approval |
| In progress | The job runs on a machine |
| Success | Every step passed, or failed with `continue-on-error: true` |
| Failure | A step failed |
| Cancelled | The job timed out, or the run was cancelled |
| Skipped | The job's `if:` was false, or a job it requires did not succeed |

hatchrun updates a check run when a step ends, never per log line.

## Read a failed check

1. Open the pull request and choose the failed check, or open the
   Checks tab.
2. The summary names the step that failed and shows the end of its
   log.
3. Lines a step prints in GitHub's `::error file=PATH,line=N::message`
   form appear as annotations on the changed files.
4. Choose the link to the full log in the hatchrun app.

## Logs

The full log of each job lives in the hatchrun app.
While a job runs, the app streams the log. When the job ends, hatchrun
stores the log and keeps it for 30 days.

Anyone with read access to the repository can read its logs. Logs of
public repositories are public. Secret values are masked on the
machine before the log leaves it.

## Require checks before merging

Branch protection and rulesets can require hatchrun check runs like
any other check. Require the job ids that run on every pull request.
A job that its filters drop never reports, so requiring it blocks the
merge.

## Next steps

- [Secrets and variables](/docs/ci/setup/secrets/)
- [A job did not start](/docs/ci/troubleshooting/job-did-not-start/)
