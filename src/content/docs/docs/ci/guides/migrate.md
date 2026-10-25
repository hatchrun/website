---
title: Migrate a repository from GitHub Actions
description: Convert GitHub workflows with hatchrun convert, read each warning, and fix what does not convert.
banner:
  content: "Preview: hatchrun CI is not available yet. These pages document the configuration format and the planned service."
---

This guide moves a repository's GitHub Actions workflows to hatchrun
CI. `hatchrun convert` does most of the work. You read what it
reports, fix the few things it cannot map, and validate the result.

## Prerequisites

- The `hatchrun` CLI. See the
  [Quickstart](/docs/ci/get-started/quickstart/#install-the-cli).
- A local clone of the repository with workflows in
  `.github/workflows/`.

:::steps

1. ## Convert the workflows

   From the root of the repository:

   ```sh
   hatchrun convert -o .hatchrun/config.yml
   ```

   `convert` reads every `.yml` and `.yaml` file in
   `.github/workflows/`. Each file becomes a workflow named after the
   file, and each job becomes a job named `FILE-JOB`.

   The config goes to `.hatchrun/config.yml`, and the warnings and
   errors to your terminal.

   To convert some files only, name them:

   ```sh
   hatchrun convert .github/workflows/ci.yml -o .hatchrun/config.yml
   ```

2. ## Read the exit code

   ```sh
   echo $?
   ```

   - `0`: everything converted. There may be warnings.
   - `1`: some jobs, events or files were left out. The config holds
     the rest. If nothing converted, no file was written.

3. ## Read every warning

   A warning means a key was dropped or changed, and the config works
   without it. Decide for each whether you need a replacement. The
   [convert warnings](#what-each-warning-means) table below says what
   to do.

4. ## Fix every error

   An error means a job was left out of the config. Fix the cause in
   the GitHub workflow and convert again, or add the job to the config
   by hand. See [Fix common problems](#fix-common-problems).

5. ## Validate the result

   ```sh
   hatchrun validate
   ```

   No output means the config is valid.

6. ## Commit, then retire the GitHub workflows

   Commit `.hatchrun/config.yml`. Once hatchrun CI runs a workflow,
   delete the GitHub file it came from. Until then GitHub runs it too,
   and both report checks.

:::

## A worked example

This workflow lints, then tests on two Node versions and two operating
systems:

<!-- check: convert+output -->
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

`hatchrun convert` prints four warnings and exits with 0:

```text
`ci.yml`: `concurrency` is not supported and was dropped
`ci.yml` job `lint`: `runs-on: ubuntu-24.04` became `ubuntu-latest`, which runs Ubuntu 26.04
`ci.yml` job `test`: `strategy.fail-fast` is not supported and was dropped
`ci.yml` job `test`: matrix key `os` values `macos-latest` name no runner template and were dropped; hatchrun runs Linux only
```

It writes this config:

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

What changed, warning by warning:

- `concurrency` has no equivalent. Pushes no longer cancel older runs
  of the same branch.
- `ubuntu-24.04` is not a runner template. The job now runs on
  `ubuntu-latest`, which is Ubuntu 26.04. Check that your toolchain
  works there.
- `fail-fast` has no equivalent. hatchrun has no setting for it.
- hatchrun runs Linux only, so the macOS legs are gone. The run plans
  `test (20, ubuntu-latest)` and `test (22, ubuntu-latest)`.

Each workflow entry keeps the GitHub job id as its `name`, so
`requires: [lint]` and the check run names stay the same.

## What each warning means

Every message starts with the file, and the job and step when there is
one. The [error and warning messages](/docs/ci/reference/messages/#convert-warnings)
reference lists them all.

| Warning says | What you lose | What to do |
| --- | --- | --- |
| `` `concurrency` is not supported and was dropped `` | Cancelling older runs | Nothing, or keep the workflow on GitHub if you depend on it |
| `` `permissions` is not supported and was dropped `` | A narrower job token | Nothing |
| `` `environment.url` is not supported and was dropped `` | The deployment URL GitHub shows | Nothing |
| `` `services` is not supported and was dropped `` | Service containers | Start them in a `run:` step. See [services](#services) |
| `` `strategy.matrix.include` is not supported `` | Extra or changed matrix legs | See [matrix include](#matrix-include-and-exclude) |
| `` became `ubuntu-latest`, which runs Ubuntu 26.04 `` | Ubuntu 24.04 or 22.04 | Test on 26.04 |
| `` name no runner template and were dropped; hatchrun runs Linux only `` | macOS and Windows legs | Keep those on GitHub Actions |
| `` calls a reusable workflow, which is not supported `` | The whole job | See [reusable workflows](#reusable-workflows) |
| `` `on.release` is not supported and was dropped `` | That event | Keep the workflow on GitHub, or use a tag push |

## Fix common problems

### runs-on is an expression

A `runs-on` such as `${{ matrix.os }}` converts when every value maps
to one runner template. Values that name no template are dropped with
a warning. Values that map to two templates are an error:

<!-- check: convert -->
```yaml title=".github/workflows/build.yml"
on: push
jobs:
  a:
    runs-on: ${{ matrix.os }}
    strategy:
      matrix:
        os: [ubuntu-latest, ubuntu-26.04-arm]
    steps:
      - run: make
```

```text
`build.yml` job `a` has `runs-on: ${{ matrix.os }}` over legs that run on `ubuntu-latest`, `ubuntu-26.04-arm`; a job runs on one runner template
```

A job runs on one template in hatchrun. Split it into one job per
template in the config and list both in the workflow. Any other expression in `runs-on`, such as
`${{ inputs.runner }}`, is an error. Set a label by hand.

### Environments and secrets

`convert` keeps a job's `environment`, as a name or as a map with
`name`. The environment itself does not convert, because it lives in
GitHub's settings. Recreate each one in the hatchrun app:

| In GitHub | In hatchrun |
| --- | --- |
| Deployment branches and tags | The environment's branch patterns. Tag rules have no match, and neither do pull request runs |
| Required reviewers | Require approval. Any organization admin can approve, whatever reviewers GitHub named |
| Wait timer | Not supported |
| Environment secrets and variables | The environment's secrets and variables |
| Repository secrets and variables | The repository's secrets and variables |
| Organization secrets, "Repository access" | The organization secret's repository access: all repositories or selected ones |

A job that names an environment fails until you create it, and the
check run says so. A name that is an expression, such as
`${{ matrix.target }}`, is an error and the job is left out. Write the
name out, or split the job. See [Environments](/docs/ci/setup/environments/)
and [Secrets and variables](/docs/ci/setup/secrets/).

GitHub shows an environment's URL on the run. hatchrun drops it.

### services

hatchrun drops `services:` with a warning. Each job has a whole
machine with Docker, so start the service yourself:

```yaml title=".hatchrun/config.yml"
jobs:
  test:
    runs-on: ubuntu-latest
    env:
      DATABASE_URL: postgres://postgres:postgres@localhost:5432/test
    steps:
      - uses: actions/checkout@v5
      - run: |
          docker run -d --name db -p 5432:5432 \
            -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=test postgres:17
          until docker exec db pg_isready -U postgres; do sleep 1; done
      - run: make test
```

### Matrix include and exclude

`include` and `exclude` are dropped with a warning, and only plain
lists of values convert. Rebuild what they did with more workflow
entries. To add one extra leg, list the job a second time with a
`name` and the values as parameters:

```yaml title=".hatchrun/config.yml"
jobs:
  test:
    runs-on: ubuntu-latest
    parameters:
      node: { type: integer }
    steps:
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ parameters.node }}
      - run: npm test

workflows:
  ci:
    on:
      push: {}
    jobs:
      - test:
          matrix:
            node: [20, 22]
      - test:
          name: test-next
          node: 24
```

To exclude a leg, split the matrix into two entries that each list
only the combinations you want.

### Reusable workflows

A job with `uses:` at job level calls a reusable workflow. `convert`
drops it, and every job that needs it, with warnings:

<!-- check: convert -->
```yaml title=".github/workflows/ci.yml"
on: push
jobs:
  call:
    uses: my-org/shared/.github/workflows/build.yml@main
  after:
    needs: call
    runs-on: ubuntu-latest
    steps:
      - run: make release
```

```text
`ci.yml` job `call` calls a reusable workflow, which is not supported; the job was dropped
`ci.yml` job `after` was dropped: it needs `call`, which calls a reusable workflow
```

Copy the reusable workflow's jobs into the config, and turn steps they
share into a [command](/docs/ci/guides/reuse-config/).

### Docker steps

`uses: docker://...` is an error, and the job is dropped. Replace the
step with a `run:` step that calls `docker run`:

```yaml title=".hatchrun/config.yml"
jobs:
  scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v5
      - run: docker run --rm -v "$PWD:/src" aquasec/trivy:latest fs /src
```

### strategy and jobs contexts

`${{ strategy.job-index }}`, `${{ jobs.x }}` and other reads of the
`strategy` and `jobs` contexts are errors.

Use `${{ matrix.KEY }}` for matrix values, and [job
outputs](/docs/ci/reference/configuration/#jobs) with `needs` for
results of other jobs.

## Troubleshooting

:::note[convert exits with 1 and writes nothing]
Nothing converted. Every file failed to parse, or every job had an
error. The messages say which. A missing `.github/workflows/`
directory gives `hatchrun: read .github/workflows: No such file or directory (os error 2)`.
:::

:::note[Two files become the same workflow]
`ci.yml` and `ci.yaml` both become workflow `ci`, and the second is
skipped. Rename one and convert again.
:::

## Next steps

- [Reuse config with commands, executors and parameters](/docs/ci/guides/reuse-config/)
- [convert warnings and errors](/docs/ci/troubleshooting/convert-problems/)
