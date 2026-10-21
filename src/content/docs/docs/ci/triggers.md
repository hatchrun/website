---
title: Triggers
description: The on key of a workflow, its events and filters, and how filter patterns match.
banner:
  content: "Preview: hatchrun CI is not available yet. This page documents the configuration format."
---

Each workflow has its own `on:` map. It uses GitHub's event and filter
names, so a GitHub `on:` block usually works unchanged. hatchrun CI
starts workflows on four events:

| Event | Starts the workflow when |
| --- | --- |
| [`push`](#push) | A branch or tag is pushed |
| [`pull_request`](#pull_request) | A pull request has activity of a listed type |
| [`schedule`](#schedule) | A cron schedule fires |
| [`workflow_dispatch`](#workflow_dispatch) | Someone starts the workflow by hand |

`on:` is always a map. GitHub's short forms, `on: push` and
`on: [push, pull_request]`, are errors here; write
`on: { push: {}, pull_request: {} }`. An event key with an empty value,
such as `pull_request:`, means the event with no filters.

Every workflow whose `on:` matches an event starts, each as its own
run. Pull requests from forks do not start workflows.

## push

| Key | Type | Description |
| --- | --- | --- |
| `branches` | filter | Branches that start the workflow |
| `branches-ignore` | filter | Branches that do not |
| `tags` | filter | Tags that start the workflow |
| `tags-ignore` | filter | Tags that do not |
| `paths` | filter | Changed paths that start the workflow |
| `paths-ignore` | filter | Changed paths that do not |

A key and its `-ignore` form cannot both be set; that is an error.

Branch and tag filters work together like this:

| Filters set | A branch push | A tag push |
| --- | --- | --- |
| none | starts | starts |
| only `branches` or `branches-ignore` | starts when it passes | does not start |
| only `tags` or `tags-ignore` | does not start | starts when it passes |
| both kinds | starts when the branch filter passes | starts when the tag filter passes |

Path filters are not checked for tag pushes.

```yaml title=".hatchrun/config.yml"
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - run: make

workflows:
  build:
    on:
      push:
        branches: [main, 'release/**']
        paths-ignore: ['docs/**', '**.md']
    jobs:
      - build
  release:
    on:
      push:
        tags: ['v*']
    jobs:
      - build
```

## pull_request

| Key | Type | Default | Description |
| --- | --- | --- | --- |
| `types` | list | `[opened, synchronize, reopened]` | Activity types that start the workflow |
| `branches` | filter | | Base branches that start the workflow |
| `branches-ignore` | filter | | Base branches that do not |
| `paths` | filter | | Changed paths that start the workflow |
| `paths-ignore` | filter | | Changed paths that do not |

Branch filters match the pull request's base branch, the one it
merges into. Setting `types` replaces the default list.

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
        paths: ['src/**']
    jobs:
      - lint
```

## schedule

A list of cron schedules. Each entry has one key, `cron`, with five
fields in UTC. Scheduled runs use the default branch.

```yaml title=".hatchrun/config.yml"
jobs:
  audit:
    runs-on: ubuntu-latest
    steps:
      - run: cargo audit

workflows:
  nightly:
    on:
      schedule:
        - cron: '30 2 * * *'
    jobs:
      - audit
```

## workflow_dispatch

Lets people start the workflow by hand. `inputs` is a map of
[parameters](/docs/ci/configuration/#parameters), read in expressions
as `${{ inputs.NAME }}`. A `default` that does not fit its type is an
error.

```yaml title=".hatchrun/config.yml"
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - run: ./deploy.sh --env ${{ inputs.environment }} --dry-run=${{ inputs.dry-run }}

workflows:
  deploy:
    on:
      workflow_dispatch:
        inputs:
          environment:
            type: enum
            enum: [staging, production]
            default: staging
          dry-run:
            type: boolean
            default: true
    jobs:
      - deploy
```

## Filter patterns

A filter is one pattern or a list of patterns, written the way GitHub
writes them.

| Pattern | Matches |
| --- | --- |
| `*` | Any run of characters except `/` |
| `**` | Any run of characters, `/` included |
| `?` | Zero or one of the character before it |
| `+` | One or more of the character before it |
| `[abc]`, `[a-z]` | One character from the set or range |
| `[!a-z]`, `[^a-z]` | One character outside the set or range |
| `\` | Makes the next character literal, such as `\*` |
| `!` at the start | Negates the pattern |

`?` and `+` apply to the character or `[...]` set just before them.
Anything else matches itself. A pattern must match the whole name or
path.

Patterns apply in order and the last one that matches decides. A name
that no pattern matches does not pass. So `!` excludes only what an
earlier pattern included:

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

Here `release/2.0` starts the workflow, `release/2.0-alpha` does not,
and `release/1.0-alpha` does, because the last pattern matches it.

## Path filters

`paths` passes when at least one changed path passes the filter.
`paths-ignore` passes when at least one changed path is not ignored,
so a push that changes only ignored files does not start the workflow.

- Only the first 300 changed files of a push or pull request are
  looked at, as GitHub limits its diffs to 300 files. A change past
  the first 300 does not start a workflow.
- When the list of changed files is empty or not known, path filters
  pass and the workflow starts.
- Matching each filter against the changed files has a fixed work
  limit. A filter that reaches it passes. Ordinary patterns stay far
  below it; see [Limits](/docs/ci/limits/#filters).
