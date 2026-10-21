---
title: Concepts
description: The parts of a hatchrun CI config and how a push becomes check runs.
banner:
  content: "Preview: hatchrun CI is not available yet. These pages document the configuration format and the planned service."
---

This page names each part of hatchrun CI once. The guides and the
reference use these words with these meanings.

## From push to check runs

:::caution[Coming later]
The hosted service described in this section is not built yet. The
planning steps run today inside `hatchrun validate`.
:::

```text
 GitHub                       hatchrun                          machines
 ------                       --------                          --------
 push, pull_request  ──────►  1. verify webhook
 webhook                      2. read .hatchrun/config.yml
                                 at the event's commit
                              3. keep workflows whose on:
                                 matches the event
                              4. plan each workflow run:
                                 commands, parameters,
                                 matrix, parallelism,
                                 branches/tags, requires
 check runs  ◄──────────────  5. one check run per job
                              6. start jobs with nothing  ────►  fresh machine
                                 left to wait for                per job
 check runs  ◄──────────────  7. update as steps finish  ◄────  agent reports
                                                                 each step
```

1. GitHub sends the hatchrun GitHub App a webhook for a push or pull
   request. A schedule or a manual start begins at step 2.
2. hatchrun reads `.hatchrun/config.yml` at the commit of the event.
3. Each workflow whose `on:` matches the event becomes one workflow
   run.
4. hatchrun plans each run: it expands commands, fills in
   parameters, spreads out matrices and parallel copies, drops jobs
   whose branch or tag filters do not match, and orders the rest.
5. Each planned job gets a check run on the commit.
6. A job whose required jobs have finished starts on a new machine.
7. The agent on the machine runs the steps and reports each one, and
   hatchrun updates the check run.

## The parts of a config

### Workflow

A workflow is a named entry under `workflows:`. It has triggers in
`on:` and a list of jobs to run. A config can hold many workflows, and
each starts on its own events.

### Workflow run

A workflow run is one start of a workflow for one event. Two workflows
that match the same push make two workflow runs.

### Job

A job is a named list of steps under `jobs:` that runs on one machine.
A job runs only when a workflow lists it, and one workflow can list
the same job more than once with different parameters.

### Step

A step is one unit of work in a job: a shell script (`run`), a GitHub
action (`uses`), a command call, or a built-in step (`cache`,
`workspace`, `test-results`). Steps run in order, and by default a
failed step stops the job.

### Runner template

A runner template is a machine size, such as `ubuntu-26.04-4core`. A
job names one with `runs-on`. hatchrun publishes a
[fixed set](/docs/ci/reference/runners/), each with a per-minute price.

### Executor

An executor is a named runner template under `executors:`. Jobs that
share a machine size name the executor instead of repeating the label.

### Command

A command is a named list of steps under `commands:`. A job calls it
as a step, like a function. Commands can take parameters and call
other commands.

### Parameter

A parameter is a typed input of a job, a command or a manual trigger.
Steps read it as `${{ parameters.NAME }}`. hatchrun fills it in when it
plans the run, before any machine starts.

### Matrix

A matrix lists values on a workflow entry. hatchrun runs one copy of
the job for every combination of the values, such as each Node version
on each database.

### Parallelism

Parallelism runs several copies of one job at once, so a test suite
can be split between them. Each copy is a separate job with its own
machine.

### Requires

`requires` on a workflow entry lists the entries that must finish
first. Entries with nothing to wait for start at once, in parallel.

### Approval

An approval is a workflow entry that runs nothing. It waits until a
person approves it, then the entries that require it start.

### Check run

A check run is GitHub's record of one job's result on a commit. Pull
requests show them in the Checks tab and in the merge box, and branch
protection can require them.

## Two kinds of expressions

`${{ parameters.NAME }}` is filled in when the run is planned. Every
other `${{ }}` expression, such as `${{ github.sha }}`, is evaluated on
the machine when the step runs. See
[Expressions](/docs/ci/reference/expressions/).

## Next steps

- [Quickstart](/docs/ci/get-started/quickstart/)
- [Configuration reference](/docs/ci/reference/configuration/)
