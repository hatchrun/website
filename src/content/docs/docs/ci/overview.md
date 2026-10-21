---
title: hatchrun CI overview
description: What hatchrun CI is, how it differs from hatchrun.io runners, and what exists today.
banner:
  content: "Preview: hatchrun CI is not available yet. This page documents the configuration format."
---

hatchrun CI runs your whole CI pipeline on hatchrun. You install the
hatchrun GitHub App and add one file, `.hatchrun/config.yml`, to the
repository. hatchrun reads the file on every push and pull request,
runs the jobs on machines hatchrun owns, and shows each job as a check
run on the commit and the pull request. GitHub Actions takes no part.

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

## How it differs from hatchrun.io runners

hatchrun has two products. They share the agent, the runner images and
the launch code, and you can use both in one repository.

| | hatchrun.io runners | hatchrun CI |
| --- | --- | --- |
| Who decides which jobs run | GitHub Actions | hatchrun |
| Workflow file | `.github/workflows/*.yml` | `.hatchrun/config.yml` |
| Where jobs run | Your AWS account | Machines hatchrun owns |
| Runner sizes | [Runner profiles](/docs/runs-on/) you can edit | A fixed set of [runner templates](/docs/ci/runners/) |
| What you pay | AWS for the instances, hatchrun per job minute | hatchrun per job minute, compute included |

hatchrun CI leaves `.github/workflows/` alone. A workflow you have not
moved keeps running on GitHub Actions, and nothing runs twice. You can
move one workflow at a time.

## The file format

The format takes its structure from CircleCI and its building blocks
from GitHub Actions.

From CircleCI:

- `executors`, `commands` and jobs with `parameters`, defined once and
  reused;
- a `workflows:` section, separate from `jobs:`, that orders jobs with
  `requires`, filters them by branch and tag, and holds approval jobs;
- `parallelism` on a job, with test splitting by recorded timings;
- built-in `cache`, `workspace` and `test-results` steps.

From GitHub Actions:

- `uses:` steps that run GitHub actions, with `with:` inputs and step
  outputs;
- `on:` triggers on each workflow, with GitHub's event and filter
  names;
- `${{ }}` expressions and `matrix`.

See the [configuration reference](/docs/ci/configuration/) for every
key.

## From push to check run

1. The GitHub App sends hatchrun a webhook for each push, pull request
   and manual run. A schedule fires from the `on.schedule` entries on
   the default branch.
2. hatchrun reads `.hatchrun/config.yml` at the event's commit and
   keeps the workflows whose `on:` matches the event. Each match
   becomes one workflow run.
3. The run spreads out each job's matrix and `parallelism`, drops jobs
   whose `branches` or `tags` do not match, orders the rest by
   `requires`, and creates a check run per job.
4. A job whose required jobs have finished starts on a fresh machine
   made from its runner template. The agent on the machine runs the
   steps and reports each one.
5. hatchrun updates the check run as steps finish and starts the jobs
   that were waiting.

Pull requests from forks do not run.

## What exists today

Available now:

- the file format and its validation;
- the [`hatchrun` CLI](/docs/ci/cli/), with `validate` and `convert`;
- conversion of GitHub Actions workflows into `.hatchrun/config.yml`.

Coming later:

- the hosted service that receives events and runs jobs;
- the runner side of `run:`, `uses:` and the built-in steps;
- storage for `cache`, `workspace` and `test-results`;
- the approval page for approval jobs;
- [test splitting](/docs/ci/test-splitting/) on the runner.

Docker `services:`, `container:`, `docker:` executors and
`uses: docker://` steps come in a later release after that. Windows
and macOS runners are out of scope for now. A `docker` command inside a
`run:` step is fine: each job gets a whole machine with Docker
installed.

## Next

- [Quickstart](/docs/ci/quickstart/): convert a repository and
  validate the result.
- [Migrating from GitHub Actions](/docs/ci/migrating/): what converts
  and what does not.
