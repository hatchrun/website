---
title: Configuration reference
description: Every key of .hatchrun/config.yml with its type, whether it is required, its default and an example.
banner:
  content: "Preview: hatchrun CI is not available yet. These pages document the configuration format and the planned service."
---

hatchrun CI reads `.hatchrun/config.yml` at the commit of each event.
This page lists every key. Each section has a table and an example
that passes `hatchrun validate`.

## The file

The file is YAML 1.2. Only `true` and `false` are booleans; `yes`,
`no`, `on` and `off` are strings. The file can be at most 1 MiB.

Unknown keys are errors everywhere except two places that take free
names: [command steps](#command-step) and
[workflow job entries](#workflow-job-entries).

`hatchrun validate` stops at the first problem in the YAML or the
file's shape. Once the shape is right, it reports every other problem
it finds.

## Top-level keys

| Key | Required | Type | Default | Description |
| --- | --- | --- | --- | --- |
| [`executors`](#executors) | no | map | none | Named runner templates that jobs share |
| [`commands`](#commands) | no | map | none | Named, reusable lists of steps |
| [`jobs`](#jobs) | no | map | none | Jobs, each a list of steps on one machine |
| [`workflows`](#workflows) | no | map | none | Triggers and the jobs they run |

An empty file is valid and runs nothing.

---

## executors

A map of executor names to executors. A job names one with
[`executor`](#executor).

| Key | Required | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `runs-on` | yes | string | | A [runner template](/docs/ci/reference/runners/) label |

```yaml title=".hatchrun/config.yml"
executors:
  small:
    runs-on: ubuntu-latest
  big-arm:
    runs-on: ubuntu-26.04-8core-arm
```

- A label that names no template is an error, even if no job uses the
  executor.
- `docker:` is reserved for a later release and is an error today.

---

## commands

A map of command names to commands. A job or another command calls a
command as a [step](#command-step).

| Key | Required | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `parameters` | no | map of [parameters](#parameters) | none | Inputs the steps read as `${{ parameters.NAME }}` |
| `steps` | no | list of [steps](#steps) | `[]` | The steps |

```yaml title=".hatchrun/config.yml"
commands:
  setup:
    parameters:
      node:
        type: integer
        default: 22
    steps:
      - uses: actions/checkout@v5
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ parameters.node }}
      - run: npm ci
```

- A command cannot have the name of a step key: `name`, `id`, `env`,
  `if`, `with`, `shell`, `run`, `uses`, `cache`, `workspace`,
  `test-results`, `working-directory`, `continue-on-error` or
  `timeout-minutes`.
- Commands can call commands up to 64 levels deep. A command that
  reaches itself is an error.

---

## jobs

A map of job names to jobs. A job runs its steps in order on one fresh
machine. It runs only when a [workflow](#workflows) lists it.

| Key | Required | Type | Default | Description |
| --- | --- | --- | --- | --- |
| [`executor`](#executor) | one of `executor`, `runs-on` | string | | An executor from `executors:` |
| [`runs-on`](#runs-on) | one of `executor`, `runs-on` | string | | A runner template label |
| [`parameters`](#parameters) | no | map | none | Inputs the job's steps and fields read |
| [`parallelism`](#parallelism) | no | integer | `1` | Copies of the job to run, 1 to 64 |
| [`env`](#env) | no | map of strings | none | Environment variables for every step |
| [`if`](#if) | no | expression | none | The job runs only when this is true |
| [`timeout-minutes`](#timeout-minutes) | no | integer | `360` | Minutes before the job is cancelled |
| [`outputs`](#outputs) | no | map of strings | none | Values later jobs read through `needs` |
| [`steps`](#steps) | no | list | `[]` | The steps |

`services:` and `container:` are reserved for a later release and are
errors today.

### executor

The name of an executor from `executors:`. A job takes `executor` or
`runs-on`, never both.

```yaml title=".hatchrun/config.yml"
executors:
  big:
    runs-on: ubuntu-26.04-8core
jobs:
  build:
    executor: big
    steps:
      - run: make
```

### runs-on

A [runner template](/docs/ci/reference/runners/) label. A label that
names no template is an error that lists the valid labels.

```yaml title=".hatchrun/config.yml"
jobs:
  build:
    runs-on: ubuntu-26.04-arm
    steps:
      - run: make
```

### parallelism

How many copies of the job run at once. Copies are separate jobs with
ids ending in `[1/N]` to `[N/N]`. See
[Split tests across parallel jobs](/docs/ci/guides/test-splitting/).

```yaml title=".hatchrun/config.yml"
jobs:
  test:
    runs-on: ubuntu-latest
    parallelism: 4
    steps:
      - run: make test
```

### env

Environment variables set for every step. Numbers and booleans are
read as strings. Values can hold expressions.

```yaml title=".hatchrun/config.yml"
jobs:
  test:
    runs-on: ubuntu-latest
    env:
      CI: true
      RUST_BACKTRACE: 1
      SHA: ${{ github.sha }}
    steps:
      - run: cargo test
```

### if

An [expression](/docs/ci/reference/expressions/). The job runs only
when it is true. Write it bare or inside `${{ }}`.

Without a [status
function](/docs/ci/reference/expressions/#status-functions), the job
also needs every job it requires to have succeeded.

```yaml title=".hatchrun/config.yml"
jobs:
  docs:
    runs-on: ubuntu-latest
    if: github.event_name == 'push' && github.ref == 'refs/heads/main'
    steps:
      - run: make docs
```

### timeout-minutes

Minutes the job may run before it is cancelled. Default `360`.

```yaml title=".hatchrun/config.yml"
jobs:
  test:
    runs-on: ubuntu-latest
    timeout-minutes: 20
    steps:
      - run: make test
```

### outputs

Named values a later job reads as `${{ needs.JOB.outputs.NAME }}`.
Usually set from a step's output.

```yaml title=".hatchrun/config.yml"
jobs:
  version:
    runs-on: ubuntu-latest
    outputs:
      tag: ${{ steps.v.outputs.tag }}
    steps:
      - id: v
        run: echo "tag=v1.2.3" >> "$GITHUB_OUTPUT"
```

### Parameter names a job cannot use

A job parameter cannot be called `name`, `requires`, `type`,
`branches`, `tags` or `matrix`. A workflow entry reads those keys as
its own, so it could never set the parameter.

---

## steps

A list of steps. A step is one of six kinds, told apart by its keys:

| Kind | Identified by |
| --- | --- |
| [run](#run-step) | a `run` key |
| [uses](#uses-step) | a `uses` key |
| [command](#command-step) | a bare string, or a map whose one key is not a step key |
| [cache](#cache) | a `cache` key |
| [workspace](#workspace) | a `workspace` key |
| [test-results](#test-results) | a `test-results` key |

A step map with none of these keys is an error.

### run step

Runs a shell script.

| Key | Required | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `run` | yes | string | | The script |
| `name` | no | string | | Shown in logs |
| `id` | no | string | | Lets later steps read this step's outputs as `steps.ID.outputs.NAME` |
| `shell` | no | string | | The shell that runs the script |
| `working-directory` | no | string | | The directory the script runs in |
| `env` | no | map of strings | | Environment variables for this step |
| `if` | no | expression | | The step runs only when this is true |
| `continue-on-error` | no | boolean | `false` | A failure does not fail the job |
| `timeout-minutes` | no | integer | | Minutes before the step is cancelled |

```yaml title=".hatchrun/config.yml"
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - name: Unit tests
        id: unit
        run: |
          npm ci
          npm test
        shell: bash
        working-directory: web
        env:
          NODE_ENV: test
        timeout-minutes: 15
        continue-on-error: false
```

### uses step

Runs a GitHub action, fetched from GitHub at the named ref. See
[Use GitHub actions in steps](/docs/ci/guides/github-actions/).

| Key | Required | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `uses` | yes | string | | `owner/repo@ref`, `owner/repo/path@ref` or `./path` |
| `with` | no | map | | The action's inputs |
| `name` | no | string | | Shown in logs |
| `id` | no | string | | Lets later steps read this step's outputs |
| `env` | no | map of strings | | Environment variables for this step |
| `if` | no | expression | | The step runs only when this is true |
| `continue-on-error` | no | boolean | `false` | A failure does not fail the job |

```yaml title=".hatchrun/config.yml"
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Install Go
        id: go
        uses: actions/setup-go@v5
        with:
          go-version: '1.25'
```

- `with` is valid only on a `uses` step.
- `shell`, `working-directory` and `timeout-minutes` are valid only on
  a `run` step.
- A step with both `run` and `uses` is an error.
- `uses: docker://...` is an error until Docker support ships.

### command step

Calls a command from `commands:`. Write the bare name, or a map with
one key, the name, whose value sets the command's parameters.

| Form | Example |
| --- | --- |
| Bare name, defaults only | `- setup` |
| Map with parameter values | `- setup: { node: 20 }` |

```yaml title=".hatchrun/config.yml"
commands:
  greet:
    parameters:
      who: { type: string, default: world }
    steps:
      - run: echo "hello ${{ parameters.who }}"
jobs:
  hello:
    runs-on: ubuntu-latest
    steps:
      - greet
      - greet: { who: hatchrun }
```

A command step takes no other keys. A misspelled step key, such as
`rnu:`, reads as a call to a command that does not exist.

### cache

Restores a saved copy of paths when the step runs, and saves them
when the job ends. See [Cache dependencies](/docs/ci/guides/cache/).

| Key | Required | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `key` | yes | string | | The exact key to restore and save under |
| `restore-keys` | no | list of strings | `[]` | Key prefixes to fall back to, in order |
| `paths` | no | list of strings | `[]` | The paths cached |

```yaml title=".hatchrun/config.yml"
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - cache:
          key: npm-${{ hashFiles('package-lock.json') }}
          restore-keys: [npm-]
          paths: [~/.npm]
```

### workspace

Passes files to later jobs in the same workflow run. It takes one of
two forms. See [Share files between jobs](/docs/ci/guides/workspaces/).

| Key | Required | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `persist.root` | yes, with `persist` | string | | The directory `paths` are relative to |
| `persist.paths` | no | list of strings | `[]` | The paths saved |
| `attach.at` | yes, with `attach` | string | | The directory to restore into |

```yaml title=".hatchrun/config.yml"
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - run: make dist
      - workspace:
          persist:
            root: .
            paths: [dist]
  ship:
    runs-on: ubuntu-latest
    steps:
      - workspace:
          attach:
            at: .
```

### test-results

Uploads JUnit XML results. The value is a file or a directory. See
[Collect test results](/docs/ci/guides/test-results/).

| Key | Required | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `test-results` | yes | string | | Path to a JUnit XML file or a directory of them |

```yaml title=".hatchrun/config.yml"
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - run: pytest --junitxml=reports/junit.xml
      - test-results: reports
```

`cache`, `workspace` and `test-results` take no other keys: no
`name`, `if` or `env`.

---

## parameters

Commands, jobs and `on.workflow_dispatch.inputs` declare parameters
with the same keys.

| Key | Required | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `type` | yes | `string`, `boolean`, `integer` or `enum` | | The value type |
| `enum` | with `type: enum` | list of strings | | The allowed values |
| `default` | no | any | none | The value used when none is given |
| `description` | no | string | none | Shown to people filling it in |

```yaml title=".hatchrun/config.yml"
jobs:
  deploy:
    runs-on: ubuntu-latest
    parameters:
      target:
        type: enum
        enum: [staging, production]
        default: staging
        description: Where to deploy
      dry-run:
        type: boolean
        default: true
      replicas:
        type: integer
        default: 2
      tag:
        type: string
    steps:
      - run: ./deploy.sh ${{ parameters.target }} ${{ parameters.tag }} ${{ parameters.replicas }} ${{ parameters.dry-run }}
```

| `type` | Accepts |
| --- | --- |
| `string` | A string, number or boolean |
| `boolean` | `true` or `false` |
| `integer` | A whole number |
| `enum` | One of the strings in `enum` |

- A parameter without a `default` is required.
- A value that holds a `${{ }}` expression passes any type check.
- `enum` values need `type: enum`, and `type: enum` needs `enum`.

### Reading parameters

Steps and job fields read a parameter as `${{ parameters.NAME }}`.
hatchrun replaces it when it plans the run. No `parameters` context
exists when steps run.

- Only a whole `${{ parameters.NAME }}` is replaced. An expression
  that does more, such as `${{ parameters.env == 'prod' }}`, is an
  error.
- A string that is exactly one `${{ parameters.NAME }}` takes the
  value with its type. Inside longer text, the value becomes text.
- Reading a parameter the job or command does not declare is an
  error.
- A replaced string may be at most 64 KiB.

---

## workflows

A map of workflow names to workflows.

| Key | Required | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `on` | yes | map | | The events that start the workflow. See [Triggers](/docs/ci/reference/triggers/) |
| `jobs` | yes | list | | [Workflow job entries](#workflow-job-entries) |

```yaml title=".hatchrun/config.yml"
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
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

`on: {}` is valid and never starts the workflow.

### Workflow job entries

Each entry is a job name, or a map with one key, the job name, whose
value holds these keys:

| Key | Required | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `name` | no | string | the job name | The entry's id; needed when a job appears twice |
| [`requires`](#requires) | no | list of ids | `[]` | Entries that must finish first |
| [`type`](#type-approval) | no | `approval` | | The entry waits for a person and runs no job |
| [`branches`](#branches-and-tags) | no | filter | | Branches the entry runs on |
| [`tags`](#branches-and-tags) | no | filter | | Tags the entry runs on |
| [`matrix`](#matrix) | no | map of lists | | One job per combination of values |
| any other key | no | any | | A value for the job's parameter of that name |

Entry ids must be unique in a workflow.

### requires

Ids of entries that must finish before this one starts. An entry
that requires a matrix or parallel entry waits for all of its jobs.
A loop is an error.

```yaml title=".hatchrun/config.yml"
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - run: make test
  build:
    runs-on: ubuntu-latest
    steps:
      - run: make build
workflows:
  ci:
    on:
      push: {}
    jobs:
      - test
      - build:
          requires: [test]
```

### type: approval

An entry with `type: approval` runs no job. Its key is its id and
names no job. It waits for a person to approve it. It takes
`requires`, `branches` and `tags` only.

```yaml title=".hatchrun/config.yml"
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - run: ./deploy.sh
workflows:
  release:
    on:
      push:
        branches: [main]
    jobs:
      - hold:
          type: approval
      - deploy:
          requires: [hold]
```

### branches and tags

[Filters](/docs/ci/reference/triggers/#filter-patterns) on the ref of
the event. For a pull request the ref is the base branch; for a
schedule, the default branch.

| Entry has | On a branch | On a tag |
| --- | --- | --- |
| neither | runs | runs |
| only `branches` | runs when it matches | dropped |
| only `tags` | dropped | runs when it matches |
| both | runs when `branches` matches | runs when `tags` matches |

A dropped entry takes every entry that requires it with it.

```yaml title=".hatchrun/config.yml"
jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
      - run: ./publish.sh
workflows:
  ci:
    on:
      push: {}
    jobs:
      - publish:
          tags: ['v*']
```

### matrix

Keys mapped to lists of values. The entry runs one job per
combination. See [Build a matrix](/docs/ci/guides/matrix/).

```yaml title=".hatchrun/config.yml"
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - run: echo ${{ matrix.os-image }} ${{ matrix.node }}
workflows:
  ci:
    on:
      push: {}
    jobs:
      - test:
          matrix:
            node: [20, 22]
            os-image: [slim, full]
```

- Steps read values as `${{ matrix.KEY }}`.
- A key the job declares as a parameter also sets that parameter.
- Every key needs a value, values must be unique per key, and a key
  cannot also be a parameter value on the entry.
- At most 256 combinations.

### Parameter values

Any other key on an entry sets the job parameter of that name:

```yaml title=".hatchrun/config.yml"
jobs:
  test:
    runs-on: ubuntu-latest
    parameters:
      suite: { type: string, default: unit }
    steps:
      - run: make test-${{ parameters.suite }}
workflows:
  ci:
    on:
      push: {}
    jobs:
      - test
      - test:
          name: integration
          suite: integration
```

A value cannot read `${{ parameters... }}`; a workflow has no
parameters.

### Job ids after expansion

Each matrix combination and parallel copy is its own job with its own
id and check run:

| Entry | Planned job ids |
| --- | --- |
| `test` | `test` |
| `test`, matrix `node: [20, 22]` | `test (20)`, `test (22)` |
| `test`, matrix `node: [20, 22]`, `os: [a, b]` | `test (20, a)`, `test (20, b)`, `test (22, a)`, `test (22, b)` |
| `test` on a job with `parallelism: 2` | `test [1/2]`, `test [2/2]` |
| both | `test (20) [1/2]`, `test (20) [2/2]`, ... |

Matrix values appear in the order of their keys sorted by name, and
the first key changes slowest.
