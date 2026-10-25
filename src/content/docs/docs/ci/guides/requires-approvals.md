---
title: Run jobs in order with requires and approvals
description: Order jobs with requires, fan out and back in, and hold a deploy until a person approves it.
banner:
  content: "Preview: hatchrun CI is not available yet. These pages document the configuration format and the planned service."
---

By default every job in a workflow starts at once. This guide orders
them: tests before build, build before deploy, and a person's approval
before production.

## Prerequisites

- A config with `test`, `build` and `deploy` jobs, or your own.

:::steps

1. ## Make a job wait for another

   On the workflow entry, `requires` lists the entries that must
   finish first:

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

   `build` starts after `test` succeeds. If `test` fails, `build` does
   not run.

2. ## Fan out and back in

   Entries with nothing to wait for run in parallel. An entry that
   requires several waits for all of them:

   ```yaml title=".hatchrun/config.yml"
   jobs:
     lint:
       runs-on: ubuntu-latest
       steps:
         - run: make lint
     unit:
       runs-on: ubuntu-latest
       steps:
         - run: make unit
     e2e:
       runs-on: ubuntu-26.04-4core
       steps:
         - run: make e2e
     build:
       runs-on: ubuntu-latest
       steps:
         - run: make build

   workflows:
     ci:
       on:
         push: {}
       jobs:
         - lint
         - unit
         - e2e
         - build:
             requires: [lint, unit, e2e]
   ```

   `lint`, `unit` and `e2e` run side by side. `build` waits for all
   three.

3. ## Add an approval before deploy

   An entry with `type: approval` runs nothing. It waits for a person,
   then the entries that require it start. Its key is its name and can
   be anything not used by another entry:

   ```yaml title=".hatchrun/config.yml"
   jobs:
     test:
       runs-on: ubuntu-latest
       steps:
         - run: make test
     deploy:
       runs-on: ubuntu-latest
       steps:
         - run: ./deploy.sh production

   workflows:
     release:
       on:
         push:
           branches: [main]
       jobs:
         - test
         - hold-production:
             type: approval
             requires: [test]
         - deploy:
             requires: [hold-production]
   ```

   The run shows `hold-production` as waiting once `test` passes.
   `deploy` starts after someone approves it.

4. ## Pass values from one job to the next

   A job's `outputs` are read by later jobs as
   `${{ needs.ID.outputs.NAME }}`. Set the output from a step with an
   `id`:

   ```yaml title=".hatchrun/config.yml"
   jobs:
     version:
       runs-on: ubuntu-latest
       outputs:
         tag: ${{ steps.read.outputs.tag }}
       steps:
         - uses: actions/checkout@v5
         - id: read
           run: echo "tag=v$(cat VERSION)" >> "$GITHUB_OUTPUT"
     publish:
       runs-on: ubuntu-latest
       steps:
         - run: ./publish.sh "${{ needs.version.outputs.tag }}"

   workflows:
     release:
       on:
         push:
           branches: [main]
       jobs:
         - version
         - publish:
             requires: [version]
   ```

5. ## Validate

   ```sh
   hatchrun validate
   ```

:::

:::caution[Coming later]
Approving needs the hatchrun app's approval page, which is not built
yet. The config format for approvals works today.
:::

## How requires works

- `requires` names entry ids: an entry's `name`, or its key.
- An entry that requires a matrix or parallel entry waits for every
  job planned from it.
- If an entry is dropped by its `branches` or `tags` filter, every
  entry that requires it is dropped too.
- A loop in `requires` is an error.

To hold one job for an organization admin, tied to a deploy target
with its own branch rules and secrets, use an
[environment](/docs/ci/setup/environments/#approval) with approval
instead.

An approval takes `requires`, `branches` and `tags` only. It cannot
have a `name`, a `matrix` or parameter values.

## Troubleshooting

:::note[requires names a job that is not in the workflow]
`requires` names an id that no entry in this workflow has. Entries in
other workflows do not count. Check the spelling, and use the entry's
`name` if it has one.
:::

:::note[validate reports a requires cycle]
Two or more entries wait for each other. Remove one of the
`requires` links.
:::

:::note[deploy never ran]
If `test` failed, entries after it do not run. If `deploy` has a
`branches` filter that the ref does not match, it is dropped along
with everything after it.
:::

## Next steps

- [Build a matrix](/docs/ci/guides/matrix/)
- [Filter by branch, tag and path](/docs/ci/guides/filters/)
