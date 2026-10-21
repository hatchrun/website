---
title: Triggers and filter patterns
description: Every key of a workflow's on block, how branch, tag and path filters combine, and the filter pattern syntax.
banner:
  content: "Preview: hatchrun CI is not available yet. These pages document the configuration format and the planned service."
---

Each workflow has its own `on:` map with GitHub's event and filter
names. Where the events come from is in
[How events reach hatchrun](/docs/ci/setup/events/).

## on

| Key | Required | Type | Description |
| --- | --- | --- | --- |
| [`push`](#push) | no | map | Branch and tag pushes |
| [`pull_request`](#pull_request) | no | map | Pull request activity |
| [`schedule`](#schedule) | no | list | Cron schedules |
| [`workflow_dispatch`](#workflow_dispatch) | no | map | Manual runs |

- `on:` is always a map. `on: push` and `on: [push]` are errors.
- An event with an empty value, such as `pull_request:` or
  `pull_request: {}`, means the event with no filters.
- `on: {}` is valid and never starts the workflow.
- Any other event name is an error.

## push

| Key | Type | Description |
| --- | --- | --- |
| `branches` | filter | Branches that start the workflow |
| `branches-ignore` | filter | Branches that do not |
| `tags` | filter | Tags that start the workflow |
| `tags-ignore` | filter | Tags that do not |
| `paths` | filter | Changed paths that start the workflow |
| `paths-ignore` | filter | Changed paths that do not |

A key and its `-ignore` form cannot both be set.

| Ref filters set | A branch push | A tag push |
| --- | --- | --- |
| none | starts | starts |
| only branch filters | starts when it passes | does not start |
| only tag filters | does not start | starts when it passes |
| both | starts when the branch filter passes | starts when the tag filter passes |

Tag pushes skip path filters.

```yaml title=".hatchrun/config.yml"
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - run: make
workflows:
  ci:
    on:
      push:
        branches: [main, 'release/**']
        paths-ignore: ['docs/**']
    jobs:
      - build
```

## pull_request

| Key | Type | Default | Description |
| --- | --- | --- | --- |
| `types` | list of strings | `[opened, synchronize, reopened]` | Activity types that start the workflow |
| `branches` | filter | | Base branches that start the workflow |
| `branches-ignore` | filter | | Base branches that do not |
| `paths` | filter | | Changed paths that start the workflow |
| `paths-ignore` | filter | | Changed paths that do not |

Branch filters match the base branch. Setting `types` replaces the
default list. Pull requests from forks never start workflows.

```yaml title=".hatchrun/config.yml"
jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - run: make lint
workflows:
  pr:
    on:
      pull_request:
        types: [opened, synchronize, reopened, ready_for_review]
        branches: [main]
    jobs:
      - lint
```

## schedule

A list of entries with one key, `cron`, a five-field cron expression
in UTC. Schedules run on the default branch, from the config on the
default branch. `validate` does not check the expression.

```yaml title=".hatchrun/config.yml"
jobs:
  audit:
    runs-on: ubuntu-latest
    steps:
      - run: make audit
workflows:
  nightly:
    on:
      schedule:
        - cron: '30 2 * * *'
    jobs:
      - audit
```

## workflow_dispatch

| Key | Type | Description |
| --- | --- | --- |
| `inputs` | map of [parameters](/docs/ci/reference/configuration/#parameters) | Inputs asked for when someone starts a run |

Steps read inputs as `${{ inputs.NAME }}`. A `default` that does not
fit its `type` is an error. Manual runs will start from the hatchrun
app; see [Manual runs](/docs/ci/setup/events/#manual-runs).

```yaml title=".hatchrun/config.yml"
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - run: ./deploy.sh ${{ inputs.target }}
workflows:
  deploy:
    on:
      workflow_dispatch:
        inputs:
          target:
            type: enum
            enum: [staging, production]
            default: staging
    jobs:
      - deploy
```

## Filter patterns

A filter is one pattern or a list of patterns.

| Pattern | Matches |
| --- | --- |
| `*` | Any run of characters except `/` |
| `**` | Any run of characters, `/` included |
| `?` | Zero or one of the character or set before it |
| `+` | One or more of the character or set before it |
| `[abc]`, `[a-z]` | One character from the set or range |
| `[!a-z]`, `[^a-z]` | One character outside the set or range |
| `\` | The next character is literal, such as `\*` |
| `!` at the start | Negates the pattern |

Every other character matches itself. A pattern must match the whole
name or path.

### Order

Patterns apply in order, and the last one that matches decides. A name
no pattern matches does not pass. A `!` pattern excludes only what an
earlier pattern included.

```yaml title=".hatchrun/config.yml"
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - run: make
workflows:
  ci:
    on:
      push:
        branches:
          - 'release/**'
          - '!release/**-alpha'
          - 'release/1.0-alpha'
    jobs:
      - build
```

| Branch | Starts | Why |
| --- | --- | --- |
| `release/2.0` | yes | Only `release/**` matches |
| `release/2.0-alpha` | no | `!release/**-alpha` matches last |
| `release/1.0-alpha` | yes | `release/1.0-alpha` matches last |
| `main` | no | No pattern matches |

### Ignore filters

`branches-ignore`, `tags-ignore` and `paths-ignore` use the same
patterns, and pass what the filter does not match.

## Path filters

- `paths` passes when at least one changed path passes.
- `paths-ignore` passes when at least one changed path is not ignored.
  A change that touches only ignored files does not start the
  workflow.
- Only the first 300 changed files are checked, as GitHub limits its
  diffs to 300 files. A change past the first 300 does not start a
  workflow.
- An empty or unknown list of changed files passes.
- Matching one filter against the changed files has a work limit. A
  filter that reaches it passes. See [Limits](/docs/ci/reference/limits/#filters).

## Limits

- At most 256 patterns in one filter.
- At most 4,096 glob patterns across all filters in the config.
