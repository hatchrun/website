---
title: Introduction to hatchrun CI
description: What hatchrun CI is, what you get, and what a config looks like.
---

hatchrun CI runs your whole pipeline. You add one file,
`.hatchrun/config.yml`, to a GitHub repository. hatchrun reads it on
each push and pull request, runs the jobs on machines it owns, and
reports each job as a check run on the commit.

GitHub Actions plays no part. GitHub sends the events and shows the
results. hatchrun decides what runs, in what order, on which machine.

## What you get

- Jobs run on machines hatchrun owns. Each job gets a new machine that
  runs only that job and is then removed. You need no cloud account.
- Live logs for every step, in the hatchrun app and linked from each
  check run.
- Secrets, variables and environments, set per organization, repository
  or environment. See [Secrets and variables](/docs/ci/setup/secrets/)
  and [Environments](/docs/ci/setup/environments/).
- Billing per second with a 60-second minimum per job, and a monthly
  spend cap. See [Billing](/docs/ci/setup/billing/).

GitHub stays your code host. You install the hatchrun GitHub App, sign
in to the app with GitHub, and GitHub sends the push and pull request
events that start workflows. `.github/workflows/` is ignored, so a
workflow you have not moved keeps running on GitHub Actions.

Docker `services:`, `container:` and `docker://` steps are not
supported yet. Run containers with `docker run` in a step.

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
