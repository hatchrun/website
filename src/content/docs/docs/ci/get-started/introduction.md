---
title: Introduction to hatchrun CI
description: What hatchrun CI is, what exists today, and when to use it instead of hatchrun.io runners.
banner:
  content: "Preview: hatchrun CI is not available yet. These pages document the configuration format and the planned service."
---

hatchrun CI runs your whole pipeline. You add one file,
`.hatchrun/config.yml`, to a GitHub repository. hatchrun reads it on
each push and pull request, runs the jobs on machines it owns, and
reports each job as a check run on the commit.

GitHub Actions plays no part. GitHub sends the events and shows the
results. hatchrun decides what runs, in what order, on which machine.

## What exists today

hatchrun CI is in preview. The file format is finished and you can
write and check configs now. The hosted service that runs them is
still being built.

| Part | Status |
| --- | --- |
| The `.hatchrun/config.yml` format | Available today |
| `hatchrun validate`, which checks a config | Available today |
| `hatchrun convert`, which turns GitHub workflows into a config | Available today |
| The GitHub App permissions and events for CI | Coming later |
| Running jobs, check runs, logs | Coming later |
| Secrets and variables | Coming later |
| Storage for `cache`, `workspace` and `test-results` | Coming later |
| The approval page for approval jobs | Coming later |
| Test splitting on the runner | Coming later |
| Docker `services:`, `container:` and `docker://` steps | A later release |

Pages that describe the hosted service carry a "Coming later" note.
Treat them as the plan, and expect details to change before launch.

## hatchrun CI or hatchrun.io runners

hatchrun has two products. Both use the same GitHub App, agent and
runner images.

| | hatchrun.io runners | hatchrun CI |
| --- | --- | --- |
| Who runs the pipeline | GitHub Actions | hatchrun |
| Workflow file | `.github/workflows/*.yml` | `.hatchrun/config.yml` |
| Where jobs run | EC2 in your AWS account | Machines hatchrun owns |
| Machine sizes | [Runner profiles](/docs/runs-on/) you can edit | A fixed set of [runner templates](/docs/ci/reference/runners/) |
| What you pay | AWS for instances, hatchrun per job minute | hatchrun per job minute, machine included |

Pick hatchrun.io runners when jobs must run inside your own VPC, use
your AWS discounts or reach private resources. Pick hatchrun CI when
you want CI without an AWS account and a low price per minute.

You can use both in one repository. hatchrun CI ignores
`.github/workflows/`, so a workflow you have not moved keeps running on
GitHub Actions.

## What the file looks like

```yaml title=".hatchrun/config.yml"
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v5
      - run: make test

workflows:
  ci:
    on:
      push:
        branches: [main]
      pull_request: {}
    jobs:
      - test
```

The layout follows CircleCI. Jobs are defined once under `jobs:`, and
`workflows:` decides which jobs run and in what order. Reusable
`commands`, `executors` and `parameters` cut repetition.

The building blocks come from GitHub Actions. Triggers use GitHub's
`on:` names, steps run GitHub actions with `uses:`, and strings take
`${{ }}` expressions.

## Where to go next

- [Concepts](/docs/ci/get-started/concepts/) explains each part of the
  file and how a push becomes check runs.
- [Quickstart](/docs/ci/get-started/quickstart/) takes a repository
  from nothing to a valid config.
- [Migrate from GitHub Actions](/docs/ci/guides/migrate/) converts the
  workflows you already have.
