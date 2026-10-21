---
title: Migrating from GitHub Actions
description: How hatchrun convert maps a GitHub workflow onto .hatchrun/config.yml, and what it drops.
banner:
  content: "Preview: hatchrun CI is not available yet. This page documents the configuration format."
---

`hatchrun convert` reads GitHub workflow files and writes one
`.hatchrun/config.yml`. It prints a warning for each key it drops and
an error for each job it cannot convert. This page shows a conversion
and lists what happens to each part of a GitHub workflow.

## A conversion side by side

The GitHub workflow:

```yaml title=".github/workflows/ci.yml"
name: CI

on:
  push:
    branches: [main]
  pull_request:

concurrency:
  group: ci-${{ github.ref }}
  cancel-in-progress: true

jobs:
  lint:
    runs-on: ubuntu-24.04
    steps:
      - uses: actions/checkout@v5
      - run: npm ci
      - run: npm run lint

  test:
    needs: lint
    runs-on: ${{ matrix.os }}
    strategy:
      fail-fast: false
      matrix:
        os: [ubuntu-latest, macos-latest]
        node: [20, 22]
    steps:
      - uses: actions/checkout@v5
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ matrix.node }}
      - run: npm ci
      - run: npm test
```

`hatchrun convert -o .hatchrun/config.yml` prints:

```text
`ci.yml`: `concurrency` is not supported and was dropped
`ci.yml` job `lint`: `runs-on: ubuntu-24.04` became `ubuntu-latest`, which runs Ubuntu 26.04
`ci.yml` job `test`: `strategy.fail-fast` is not supported and was dropped
`ci.yml` job `test`: matrix key `os` values `macos-latest` name no runner template and were dropped; hatchrun runs Linux only
```

and writes:

```yaml title=".hatchrun/config.yml"
jobs:
  ci-lint:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v5
    - run: npm ci
    - run: npm run lint
  ci-test:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v5
    - uses: actions/setup-node@v4
      with:
        node-version: ${{ matrix.node }}
    - run: npm ci
    - run: npm test
workflows:
  ci:
    "on":
      push:
        branches:
        - main
      pull_request:
        types:
        - opened
        - synchronize
        - reopened
    jobs:
    - ci-lint:
        name: lint
    - ci-test:
        name: test
        requires:
        - lint
        matrix:
          node:
          - 20
          - 22
          os:
          - ubuntu-latest
```

What happened:

- The file `ci.yml` became workflow `ci`. Its jobs became `ci-lint`
  and `ci-test` under `jobs:`, and the workflow lists them with
  `name:` set to the GitHub job ids, so `requires: [lint]` and the
  check run names stay the same.
- `needs` became `requires`.
- `pull_request:` with no filters got GitHub's default activity
  types written out.
- The matrix moved to the workflow entry. The macOS leg was dropped,
  so the run plans `test (20, ubuntu-latest)` and
  `test (22, ubuntu-latest)`.

## How files and jobs are named

Each file becomes the workflow named after the file without `.yml` or
`.yaml`. Each job becomes `FILE-JOB` under `jobs:` and an entry named
after the GitHub job id. These are errors:

- two files with the same name before the extension, such as `ci.yml`
  and `ci.yaml` (the second is skipped);
- a file named only `.yml` (it is skipped);
- a job whose `FILE-JOB` name another file already uses (the job is
  dropped).

## What converts

| GitHub | hatchrun |
| --- | --- |
| `on.push`, `on.pull_request` with their filters | the same, under the workflow's `on:` |
| `on.schedule` | the same |
| `on.workflow_dispatch.inputs` | parameters. `string`, `boolean` and `choice` (as `enum`) map directly; `number` becomes `integer` and `environment` becomes `string`, each with a warning |
| `jobs.<id>.needs` | `requires` on the workflow entry |
| `jobs.<id>.if`, `env`, `outputs`, `timeout-minutes` | the same keys on the job |
| `jobs.<id>.strategy.matrix` with plain value lists | `matrix` on the workflow entry |
| `env` at the top of the file | added to every job's `env`, unless the job sets the same name |
| `defaults.run.shell`, `defaults.run.working-directory` | set on each `run` step that does not set its own |
| `run` and `uses` steps | the same, with `name`, `id`, `if`, `env`, `with`, `shell`, `working-directory`, `continue-on-error` and `timeout-minutes` |
| `${{ }}` expressions | unchanged |

Numbers and booleans in `env` and `outputs` become strings.

## Dropped with a warning

The config still works without these. `convert` prints one warning for
each and exits with 0 if nothing else went wrong.

- Workflow keys `run-name`, `permissions` and `concurrency`, and any
  key GitHub does not define.
- Events other than `push`, `pull_request`, `schedule` and
  `workflow_dispatch`.
- Job keys `concurrency`, `permissions`, `environment` and
  `continue-on-error`, and any key GitHub does not define.
- Job `services` and `container`, which come in a later release.
- `strategy` keys other than `matrix`, such as `fail-fast` and
  `max-parallel`.
- `strategy.matrix.include` and `strategy.matrix.exclude`, matrix keys
  that are not lists, and matrix keys with no values.
- `defaults` other than `run.shell` and `run.working-directory`.
- A job or step `timeout-minutes` that is not a whole number, such as
  an expression.
- A step `continue-on-error` that is an expression; only `true` and
  `false` convert.
- `with` on a `run` step, and `shell`, `working-directory` or
  `timeout-minutes` on a `uses` step.
- `env` and `outputs` values that are lists or maps.
- A `workflow_dispatch` input default that does not fit the input's
  type.
- A job that calls a reusable workflow (`uses:` on the job). The job is
  dropped.

## Errors that drop a job

These leave a job out. `convert` prints an error, writes everything
else and exits with 1.

- `runs-on` that names no [runner template](/docs/ci/runners/) after
  mapping, such as `windows-latest`, `macos-14` or a self-hosted label
  list.
- A step with `uses: docker://...`.
- A step with both `run` and `uses`, or with neither.
- `needs` that names a job not in the file.
- An expression that does not parse, or reads a context hatchrun does
  not provide: `strategy`, `jobs`, or any unknown name.
- Reading `parameters`, which a converted job does not declare.

A job that needs a dropped job is dropped too, with a warning that
names what it needed, and so is everything below it. Given a
`publish` job that needs `scan`, where `scan` uses a Docker action:

```text
`release.yml` job `publish` was dropped: it needs `scan`, which did not convert
`release.yml` job `scan` step 1 has `uses: docker://aquasec/trivy:latest`; Docker steps are not supported yet and come in a later release
```

A `workflow_dispatch` input of type `choice` with no `options`, or of
a type GitHub does not define, is an error and the input is dropped.

A whole file is skipped, with an error, when it is not valid YAML, is
over 1 MiB, or every one of its jobs failed. An `on:` that cannot be
read drops that event. When nothing converts at all, `convert` writes
no config and exits with 1.

`convert` also reports, as errors, a converted workflow that plans more
than 256 jobs and a converted config over 1 MiB, because `validate`
would refuse them.

## runs-on

| GitHub `runs-on` | Becomes |
| --- | --- |
| a template label, such as `ubuntu-latest` or `ubuntu-26.04-4core` | the same |
| `ubuntu-24.04`, `ubuntu-22.04` | `ubuntu-latest`, with a warning |
| `ubuntu-24.04-arm`, `ubuntu-22.04-arm` | `ubuntu-26.04-arm`, with a warning |
| a list with one label | that label, mapped as above |
| `${{ matrix.KEY }}` | see below |
| anything else | an error; the job is dropped |

### Matrix runners

When `runs-on` is `${{ matrix.KEY }}` and `KEY` is a matrix key,
`convert` maps each value of the key:

- Values that name no template, such as `macos-latest` or
  `windows-latest`, are dropped with a warning. When no value names a
  template, the job is an error.
- A value that maps to the same template as an earlier one, such as
  `ubuntu-24.04` after `ubuntu-latest`, is dropped with a warning,
  since its jobs would repeat the earlier value's jobs.
- The remaining values must all map to one template, which becomes
  the job's `runs-on`. Values that map to two templates, such as
  `ubuntu-latest` and `ubuntu-26.04-arm`, are an error, because a job
  runs on one template. Split such a job into one job per runner by
  hand.

The matrix key stays, so `${{ matrix.KEY }}` still reads the original
value.

## After converting

1. Read every warning and decide whether the config needs a change by
   hand, for example a `services:` database that a step now has to
   start with `docker run`.
2. Run `hatchrun validate`.
3. Replace repeated steps with [commands](/docs/ci/configuration/#commands)
   and shared runners with [executors](/docs/ci/configuration/#executors)
   if you like. The converter writes neither.
4. Commit `.hatchrun/config.yml` and delete each GitHub workflow once
   hatchrun runs it.
