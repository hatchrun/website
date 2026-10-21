---
title: Filter by branch, tag and path
description: Start workflows only for the branches, tags and paths they care about, and set up a monorepo.
banner:
  content: "Preview: hatchrun CI is not available yet. These pages document the configuration format and the planned service."
---

Filters decide what runs for an event. Filters on `on:` decide whether
a workflow starts at all.

Filters on a workflow entry decide whether one job in a started
workflow runs. This guide uses both to set up a monorepo with an API
and a web app.

## Prerequisites

- A repository with `api/` and `web/` directories, or your own
  layout.

:::steps

1. ## Give each part its own workflow with a path filter

   `paths` starts a workflow only when a changed file matches. Put
   shared files in both lists:

   ```yaml title=".hatchrun/config.yml"
   jobs:
     api-test:
       runs-on: ubuntu-latest
       steps:
         - uses: actions/checkout@v5
         - run: make -C api test
     web-test:
       runs-on: ubuntu-latest
       steps:
         - uses: actions/checkout@v5
         - run: npm --prefix web test

   workflows:
     api:
       on:
         push:
           branches: [main]
           paths: ['api/**', 'go.mod']
         pull_request:
           paths: ['api/**', 'go.mod']
       jobs:
         - api-test
     web:
       on:
         push:
           branches: [main]
           paths: ['web/**', 'package-lock.json']
         pull_request:
           paths: ['web/**', 'package-lock.json']
       jobs:
         - web-test
   ```

   A pull request that touches only `web/` starts `web` and not `api`.

2. ## Skip docs-only changes

   `paths-ignore` is the inverse. The workflow starts unless every
   changed file is ignored:

   ```yaml title=".hatchrun/config.yml"
   jobs:
     test:
       runs-on: ubuntu-latest
       steps:
         - run: make test

   workflows:
     ci:
       on:
         pull_request:
           paths-ignore: ['docs/**', '**.md']
       jobs:
         - test
   ```

   A trigger takes `paths` or `paths-ignore`, never both.

3. ## Release on tags

   A push filter with only `tags` starts on tag pushes and never on
   branch pushes:

   ```yaml title=".hatchrun/config.yml"
   jobs:
     release:
       runs-on: ubuntu-latest
       steps:
         - uses: actions/checkout@v5
         - run: ./release.sh "$GITHUB_REF_NAME"

   workflows:
     release:
       on:
         push:
           tags: ['v[0-9]+.[0-9]+.[0-9]+']
       jobs:
         - release
   ```

   `[0-9]+` means one or more digits, so `v1.2.3` and `v10.0.1` match
   and `v1.2.3-rc1` does not.

4. ## Run one job only on main

   In a workflow that starts for every branch, `branches` on an entry
   limits one job:

   ```yaml title=".hatchrun/config.yml"
   jobs:
     test:
       runs-on: ubuntu-latest
       steps:
         - run: make test
     publish-docs:
       runs-on: ubuntu-latest
       steps:
         - run: make docs-publish

   workflows:
     ci:
       on:
         push: {}
       jobs:
         - test
         - publish-docs:
             requires: [test]
             branches: [main]
   ```

   On a push to `feature/x`, the run plans `test` only.

5. ## Validate

   ```sh
   hatchrun validate
   ```

   `validate` checks the filters' syntax and plans each workflow for
   the branch `main`. It cannot tell which events will match.

:::

## How patterns match

| Pattern | Matches |
| --- | --- |
| `main` | Only `main` |
| `release/*` | `release/1.0`, not `release/1.0/hotfix` |
| `release/**` | Everything under `release/` |
| `!release/**-alpha` | Excludes what an earlier pattern included |
| `**.md` | Any path ending in `.md`, in any directory |

Patterns apply in order and the last one that matches decides. A name
no pattern matches does not pass. The full rules are in
[Triggers and filter patterns](/docs/ci/reference/triggers/#filter-patterns).

## Path filter rules

- Only the first 300 changed files are checked. A change past the
  first 300 does not start a workflow.
- When the list of changed files is empty or unknown, path filters
  pass.
- Tag pushes skip path filters.

## Troubleshooting

:::note[The workflow did not start for a large pull request]
The file that matters may be past the first 300 changed files. Split
the pull request, or drop the path filter for that workflow.
:::

:::note[Both include and ignore filters]
`validate` reports ``has both `paths` and `paths-ignore`; use one``.
Fold the ignore patterns into `paths` with `!`, such as
`['api/**', '!api/docs/**']`.
:::

## Next steps

- [Schedule a nightly workflow](/docs/ci/guides/schedule/)
- [My workflow did not run](/docs/ci/troubleshooting/workflow-did-not-run/)
