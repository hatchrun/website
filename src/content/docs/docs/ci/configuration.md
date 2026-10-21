---
title: Configuration reference
description: Every key of .hatchrun/config.yml, with its type, default and an example.
banner:
  content: "Preview: hatchrun CI is not available yet. This page documents the configuration format."
---

hatchrun CI reads one file, `.hatchrun/config.yml`, at the commit of
each event. It has four top-level keys, all optional:

| Key | Type | What it holds |
| --- | --- | --- |
| [`executors`](#executors) | map | Named runner choices that jobs share |
| [`commands`](#commands) | map | Named, reusable lists of steps |
| [`jobs`](#jobs) | map | Jobs, each a list of steps on one runner |
| [`workflows`](#workflows) | map | Triggers and the jobs they run, in order |

Any other key is an error. So is any unknown key inside the sections
below, except in two places that take free names: a
[command step](#command-steps) and a [workflow job entry](#workflow-job-entries).

The file is YAML 1.2. Only `true` and `false` are booleans: `yes`,
`no`, `on` and `off` are strings.

Run [`hatchrun validate`](/docs/ci/cli/) after each edit. It reports
every problem in the file. A file that is not valid YAML, or that has
the wrong shape, stops at the first problem, with its line and column.

## executors

A map of names to runner choices. A job picks one with `executor:`.

| Key | Required | Type | Description |
| --- | --- | --- | --- |
| `runs-on` | yes | string | A [runner template](/docs/ci/runners/) label |

```yaml title=".hatchrun/config.yml"
executors:
  rust:
    runs-on: ubuntu-26.04-4core
  arm:
    runs-on: ubuntu-26.04-arm
```

A label that names no template is an error, even when no job uses the
executor. `docker:` is reserved for a later release and is an error
today.

## commands

A map of names to step lists that jobs and other commands call as a
step.

| Key | Required | Type | Description |
| --- | --- | --- | --- |
| `parameters` | no | map | [Parameters](#parameters) the steps read as `${{ parameters.NAME }}` |
| `steps` | no | list | [Steps](#steps), empty by default |

```yaml title=".hatchrun/config.yml"
commands:
  setup:
    parameters:
      toolchain:
        type: string
        default: stable
    steps:
      - uses: actions/checkout@v5
      - uses: dtolnay/rust-toolchain@master
        with:
          toolchain: ${{ parameters.toolchain }}

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - setup
      - setup: { toolchain: beta }
      - run: cargo test
```

A command cannot have the name of a step key (`name`, `id`, `env`,
`if`, `with`, `shell`, `run`, `uses`, `cache`, `workspace`,
`test-results`, `working-directory`, `continue-on-error`,
`timeout-minutes`): a step with that key could not be told apart from
a call.

Commands can call commands, up to 64 levels deep. A command that calls
itself, directly or through others, is an error.

## jobs

A map of job names to jobs. A job runs its steps in order on one
fresh machine. A job runs only when a [workflow](#workflows) lists it.

| Key | Required | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `executor` | one of the two | string | | An executor from `executors:` |
| `runs-on` | one of the two | string | | A [runner template](/docs/ci/runners/) label |
| `parameters` | no | map | | [Parameters](#parameters) the job's steps and fields read |
| `parallelism` | no | integer | `1` | How many copies of the job run, 1 to 64. See [Test splitting](/docs/ci/test-splitting/) |
| `env` | no | map of strings | | Environment variables for every step |
| `if` | no | expression | | The job runs only when this is true |
| `timeout-minutes` | no | integer | `360` | The job is cancelled after this many minutes |
| `outputs` | no | map of strings | | Values later jobs read as `needs.ID.outputs.NAME` |
| `steps` | no | list | | The [steps](#steps) |

A job needs exactly one of `executor` and `runs-on`. `services:` and
`container:` are reserved for a later release and are errors today.

Numbers and booleans in `env` and `outputs` are read as strings.

```yaml title=".hatchrun/config.yml"
executors:
  big:
    runs-on: ubuntu-26.04-8core

jobs:
  build:
    executor: big
    timeout-minutes: 30
    env:
      CARGO_TERM_COLOR: always
    outputs:
      version: ${{ steps.meta.outputs.version }}
    steps:
      - uses: actions/checkout@v5
      - id: meta
        run: echo "version=$(cat VERSION)" >> "$GITHUB_OUTPUT"
      - run: cargo build --release

  docs:
    runs-on: ubuntu-latest
    if: github.event_name == 'push'
    steps:
      - run: make docs
```

A job parameter cannot be named `name`, `requires`, `type`,
`branches`, `tags` or `matrix`: a workflow entry reads those keys as
its own and could never set the parameter.

## Steps

A step is one of six kinds. hatchrun tells them apart by their keys.

### run

Runs a shell script.

| Key | Required | Type | Description |
| --- | --- | --- | --- |
| `run` | yes | string | The script |
| `name` | no | string | Shown in logs |
| `id` | no | string | Lets later steps read this step's outputs as `steps.ID.outputs.NAME` |
| `shell` | no | string | The shell that runs the script |
| `working-directory` | no | string | The directory the script runs in |
| `env` | no | map of strings | Environment variables for this step |
| `if` | no | expression | The step runs only when this is true |
| `continue-on-error` | no | boolean | A failure does not fail the job. Default `false` |
| `timeout-minutes` | no | integer | The step is cancelled after this many minutes |

### uses

Runs a GitHub action, fetched from GitHub at the ref the step names.

| Key | Required | Type | Description |
| --- | --- | --- | --- |
| `uses` | yes | string | The action, as `owner/repo@ref` or a local path |
| `with` | no | map | The action's inputs |
| `name` | no | string | Shown in logs |
| `id` | no | string | Lets later steps read this step's outputs |
| `env` | no | map of strings | Environment variables for this step |
| `if` | no | expression | The step runs only when this is true |
| `continue-on-error` | no | boolean | A failure does not fail the job. Default `false` |

`with` is valid only on a `uses` step. `shell`, `working-directory`
and `timeout-minutes` are valid only on a `run` step. A step with both
`run` and `uses` is an error.

JavaScript and composite actions run at launch. `uses: docker://...`
and Docker container actions come in a later release; a
`docker://` step is an error today.

### Command steps

Calls a command from `commands:`. Write the bare name, or a map with
one key, the name, whose value sets the command's parameters.

```yaml title=".hatchrun/config.yml"
commands:
  greet:
    parameters:
      who: { type: string }
    steps:
      - run: echo "hello ${{ parameters.who }}"

jobs:
  hello:
    runs-on: ubuntu-latest
    steps:
      - greet: { who: world }
```

A command step takes no other keys. Any map key that is not a step key
is read as a command name, so a misspelled key such as `rnu:` is a
command call, and `validate` reports it.

### cache

Restores a cache when the step runs and saves it when the job ends.

| Key | Required | Type | Description |
| --- | --- | --- | --- |
| `key` | yes | string | The exact key to restore and save under |
| `restore-keys` | no | list of strings | Key prefixes to fall back to, in order |
| `paths` | no | list of strings | The paths cached |

### workspace

Passes files from one job to later jobs of the same workflow run. Use
`persist` in the job that makes the files and `attach` in a job that
`requires` it.

| Form | Keys | Description |
| --- | --- | --- |
| `persist` | `root` (required), `paths` (list) | Saves `paths`, relative to `root` |
| `attach` | `at` (required) | Restores what earlier jobs saved into the directory `at` |

### test-results

Uploads JUnit XML results. The value is a file or a directory.

```yaml title=".hatchrun/config.yml"
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v5
      - cache:
          key: deps-${{ hashFiles('package-lock.json') }}
          restore-keys: [deps-]
          paths: [node_modules]
      - run: npm ci && npm run build
      - workspace:
          persist:
            root: .
            paths: [dist]

  test:
    runs-on: ubuntu-latest
    steps:
      - workspace:
          attach:
            at: .
      - run: npm test -- --reporter junit --output reports/junit.xml
      - test-results: reports
```

`cache`, `workspace` and `test-results` take no other keys: no
`name`, `if` or `env`.

## Parameters

Commands, jobs and [`workflow_dispatch`](/docs/ci/triggers/#workflow_dispatch)
declare parameters the same way.

| Key | Required | Type | Description |
| --- | --- | --- | --- |
| `type` | yes | `string`, `boolean`, `integer` or `enum` | The value type |
| `enum` | with `type: enum` | list of strings | The allowed values |
| `default` | no | any | The value used when none is given |
| `description` | no | string | Shown to people filling the parameter in |

A parameter without a `default` is required. A missing required value
is an error.

| Type | Accepts |
| --- | --- |
| `string` | A string, number or boolean |
| `boolean` | `true` or `false` |
| `integer` | A whole number |
| `enum` | One of the strings listed in `enum` |

A value that holds a `${{ }}` expression passes every type check; it
is checked when it runs.

### Reading parameters

Steps and job fields read a parameter as `${{ parameters.NAME }}`.
hatchrun replaces it when it plans the run, before anything runs, so
the plan holds the value and no `parameters` context exists at run
time. Two rules follow:

- Only a whole `${{ parameters.NAME }}` is replaced. An expression
  that does more with a parameter, such as
  `${{ parameters.env == 'prod' }}`, is an error.
- A string that is exactly one `${{ parameters.NAME }}` takes the
  parameter's value with its type. In a `with:` input written as
  `retries: "${{ parameters.n }}"`, an integer parameter stays an
  integer. Inside longer text, the value is written as text.

Reading a parameter the job or command does not declare is an error.
A replaced value longer than 64 KiB is an error.

## workflows

A map of workflow names to workflows. Each workflow has its own
triggers and runs its own set of jobs.

| Key | Required | Type | Description |
| --- | --- | --- | --- |
| `on` | yes | map | The events that start the workflow. See [Triggers](/docs/ci/triggers/) |
| `jobs` | yes | list | [Workflow job entries](#workflow-job-entries) |

A workflow with `on: {}` is valid and never starts.

### Workflow job entries

Each entry is a job name, or a map with one key, the job name, whose
value holds these keys:

| Key | Type | Description |
| --- | --- | --- |
| `name` | string | The entry's id. Needed when one job appears twice |
| `requires` | list of ids | Entries that must finish first |
| `type` | `approval` | The entry waits for a person to approve and runs no job |
| `branches` | filter | Branches the entry runs on |
| `tags` | filter | Tags the entry runs on |
| `matrix` | map of lists | Runs one copy of the job per combination of values |
| any other key | any | A value for the job parameter of that name |

```yaml title=".hatchrun/config.yml"
jobs:
  test:
    runs-on: ubuntu-latest
    parameters:
      suite:
        type: enum
        enum: [unit, integration]
        default: unit
    steps:
      - run: make ${{ parameters.suite }}
  deploy:
    runs-on: ubuntu-latest
    steps:
      - run: ./deploy.sh

workflows:
  ci:
    on:
      push: {}
      pull_request: {}
    jobs:
      - test
      - test:
          name: integration
          suite: integration
      - hold:
          type: approval
          requires: [test, integration]
          branches: [main]
      - deploy:
          requires: [hold]
          branches: [main]
```

An entry's id is its `name`, or the job name when it has none. Ids
must be unique within a workflow. `requires` names ids, and a
`requires` cycle is an error.

### Approval entries

An entry with `type: approval` runs no job. Its key is its id and can
be any name that is not used by another entry. It waits for a person
to approve it, then the entries that require it start. An approval
takes `requires`, `branches` and `tags`, and nothing else: no `name`,
no `matrix` and no parameter values.

### branches and tags

`branches` and `tags` are [filters](/docs/ci/triggers/#filter-patterns):
one pattern or a list. They decide whether an entry runs for the ref
of the event:

| Event | Ref the filters see |
| --- | --- |
| push | The pushed branch or tag |
| pull_request | The base branch |
| schedule | The default branch |
| workflow_dispatch | The ref the run was started on |

| Entry has | Runs on a branch | Runs on a tag |
| --- | --- | --- |
| neither | yes | yes |
| only `branches` | when the filter matches | no |
| only `tags` | no | when the filter matches |
| both | when `branches` matches | when `tags` matches |

An entry that does not run is dropped from the run, and so is every
entry that requires it, directly or through others. `hatchrun validate`
plans every workflow for the branch `main`.

### matrix

`matrix` maps keys to lists of values. The entry runs one copy of its
job for every combination, so two keys with two values each give four
jobs.

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
      - run: npm test -- --shard ${{ matrix.shard }}

workflows:
  ci:
    on:
      push: {}
    jobs:
      - test:
          matrix:
            node: [20, 22]
            shard: [a, b]
```

- Every key is readable in steps as `${{ matrix.KEY }}`.
- A key that the job declares as a parameter also sets that parameter,
  as `node` does above.
- A key cannot also be set as a parameter value on the same entry.
- A key needs at least one value, and a value may appear only once per
  key.
- A matrix may have at most 256 combinations.

### Job ids after expansion

Each matrix combination and each parallel copy becomes its own job,
with its own check run. Its id is built from the entry id:

| Entry | Planned job ids |
| --- | --- |
| `test`, no matrix, no parallelism | `test` |
| `test` with `matrix: { node: [20, 22], shard: [a, b] }` | `test (20, a)`, `test (20, b)`, `test (22, a)`, `test (22, b)` |
| `test` whose job has `parallelism: 2` | `test [1/2]`, `test [2/2]` |
| both | `test (20, a) [1/2]`, `test (20, a) [2/2]`, ... |

Matrix values appear in the order of their keys sorted by name, and
the first key changes slowest. An entry that requires `test` waits for
every job planned from `test`.

## A full example

```yaml title=".hatchrun/config.yml"
executors:
  rust:
    runs-on: ubuntu-26.04-4core

commands:
  setup:
    steps:
      - uses: actions/checkout@v5
      - uses: dtolnay/rust-toolchain@stable
      - cache:
          key: deps-${{ hashFiles('Cargo.lock') }}
          paths: [target]

jobs:
  test:
    executor: rust
    parallelism: 4
    steps:
      - setup
      - run: cargo nextest run
      - test-results: target/nextest
  deploy:
    executor: rust
    steps:
      - setup
      - run: ./deploy.sh

workflows:
  ci:
    on:
      push:
        branches: [main]
      pull_request: {}
    jobs:
      - test
      - hold:
          type: approval
          requires: [test]
          branches: [main]
      - deploy:
          requires: [hold]
          branches: [main]
```
