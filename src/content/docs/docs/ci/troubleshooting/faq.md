---
title: FAQ
description: Short answers to common questions about hatchrun CI.
banner:
  content: "Preview: hatchrun CI is not available yet. These pages document the configuration format and the planned service."
---

## Can I use hatchrun CI today?

You can write and validate configs and convert GitHub workflows today
with the `hatchrun` CLI. The service that runs them is not available
yet. See [What exists today](/docs/ci/get-started/introduction/#what-exists-today).

## Do I need an AWS account?

No. hatchrun CI runs jobs on machines hatchrun owns. hatchrun.io
runners are the product that uses your AWS account.

## Can I keep some workflows on GitHub Actions?

Yes. hatchrun CI reads only `.hatchrun/config.yml` and ignores
`.github/workflows/`. Move one workflow at a time, and delete each
GitHub file once hatchrun runs it.

## Does every GitHub action work?

JavaScript and composite actions are planned for launch. Docker
container actions and `uses: docker://` come in a later release. See
[Use GitHub actions in steps](/docs/ci/guides/github-actions/).

## Can I run Docker in a job?

Yes, from `run:` steps. Each job has a whole machine with Docker and
Buildx. `services:`, `container:` and Docker executors come later.

## Are macOS or Windows runners available?

No. hatchrun CI runs Ubuntu 26.04 on x86-64 and Arm.

## Can I define my own machine sizes?

No. Pick from the [runner templates](/docs/ci/reference/runners/).

## Why is my `ubuntu-24.04` job an error?

hatchrun has no Ubuntu 24.04 template. Use `ubuntu-latest`, which is
Ubuntu 26.04. `hatchrun convert` makes this change for you.

## Why can't I write `on: push`?

`on:` is always a map in hatchrun CI. Write `on: { push: {} }`.

## Why does my parameter comparison fail?

`${{ parameters.NAME }}` is filled in before anything runs, and only a
whole `${{ parameters.NAME }}` is replaced. Expressions cannot read
parameters. See
[Reading parameters](/docs/ci/reference/configuration/#reading-parameters).

## How do I start a workflow by hand?

Declare `on.workflow_dispatch`. Manual runs will start from the
hatchrun app, since GitHub's own dispatch event only reaches GitHub
Actions. See [Manual runs](/docs/ci/setup/events/#manual-runs).

## Do pull requests from forks run?

No, never. A fork could change the config and reach your secrets.

## Where are the logs?

In the hatchrun app, linked from each check run. GitHub shows the
summary and the end of a failed step.

## What does a job cost?

The template's price per minute, charged per second, with a 60-second
minimum per job attempt. A 10-minute job on `ubuntu-latest` is $0.02. A
45-second job is billed as 60 seconds, $0.002. There are no free
minutes, and the organization needs a card on file before jobs start.
It is the same subscription as hatchrun.io runners. See
[Billing](/docs/ci/setup/billing/).

## Can I limit a secret to some repositories?

Yes. An organization secret or variable reaches all repositories or a
list you pick. See
[Secrets and variables](/docs/ci/setup/secrets/#which-repositories-an-organization-value-reaches).

## How do I protect a production deploy?

Create an [environment](/docs/ci/setup/environments/) with branch
patterns and approval, and set `environment` on the deploy job.

## How is hatchrun CI different from CircleCI?

The file layout is close to CircleCI's: executors, commands,
parameters, workflows with `requires` and approvals. Triggers,
expressions and `uses:` steps come from GitHub Actions. Results show
as GitHub check runs.
