---
title: Overview
description: What hatchrun is and who it is for.
---

hatchrun is a CI. You put one file, `.hatchrun/config.yml`, in a GitHub
repository. On each push and pull request hatchrun runs the jobs in it
on machines it owns, streams the logs, and reports each job as a check
run on the commit.

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

GitHub stays your code host. It handles the app install, sign-in, the
events that start workflows, and the check runs. GitHub Actions plays no
part, and hatchrun ignores `.github/workflows/`.

## What it does

- Runs every job on a new machine that is removed when the job ends.
- Takes `uses:` steps, so GitHub actions work as steps.
- Keeps live logs, secrets, variables and environments in the hatchrun
  app.
- Bills per second, with a 60-second minimum per job and a monthly spend
  cap you set. See [Billing](/docs/ci/setup/billing/).

## Where to start

- [Getting started](/docs/getting-started/) installs the GitHub App and
  runs the first job.
- [Introduction](/docs/ci/get-started/introduction/) and
  [Concepts](/docs/ci/get-started/concepts/) explain the file and how a
  push becomes check runs.
- [Migrate from GitHub Actions](/docs/ci/guides/migrate/) converts the
  workflows you already have.
- [Runner templates and pricing](/docs/ci/reference/runners/) lists the
  machine sizes.
