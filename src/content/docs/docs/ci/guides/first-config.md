---
title: Write your first config by hand
description: Build a .hatchrun/config.yml from scratch, one job and one workflow at a time.
banner:
  content: "Preview: hatchrun CI is not available yet. These pages document the configuration format and the planned service."
---

This guide builds a config for a Node.js project from an empty file. At
the end it lints and tests every pull request, and builds on `main`
after the tests pass.

## Prerequisites

- The `hatchrun` CLI. See the
  [Quickstart](/docs/ci/get-started/quickstart/#install-the-cli).
- A repository with `npm run lint`, `npm test` and `npm run build`, or
  your own commands in their place.

:::steps

1. ## Create the file

   ```sh
   mkdir -p .hatchrun
   touch .hatchrun/config.yml
   ```

   hatchrun reads only this path. An empty file is valid and runs
   nothing.

2. ## Add a job

   A job is a list of steps that runs on one machine. Add a `jobs:`
   section with one job:

   ```yaml title=".hatchrun/config.yml"
   jobs:
     test:
       runs-on: ubuntu-latest
       steps:
         - uses: actions/checkout@v5
         - uses: actions/setup-node@v4
           with:
             node-version: 22
         - run: npm ci
         - run: npm test
   ```

   `runs-on` picks the machine. `uses:` steps run GitHub actions, here
   to check out the code and install Node. `run:` steps run shell
   commands.

3. ## Add a workflow

   A job runs only when a workflow lists it. Add a `workflows:` section
   that runs `test` on pushes to `main` and on pull requests:

   ```yaml title=".hatchrun/config.yml"
   jobs:
     test:
       runs-on: ubuntu-latest
       steps:
         - uses: actions/checkout@v5
         - uses: actions/setup-node@v4
           with:
             node-version: 22
         - run: npm ci
         - run: npm test

   workflows:
     ci:
       on:
         push:
           branches: [main]
         pull_request: {}
       jobs:
         - test
   ```

   `pull_request: {}` means every pull request, with no filters. `on:`
   is always a map of events, so `on: push` does not work here.

4. ## Validate

   ```sh
   hatchrun validate
   ```

   No output means the file is valid. Validate after every step from
   here on.

5. ## Add a second job and order the jobs

   Add `lint` and `build`. In the workflow, `requires` makes `build`
   wait until `lint` and `test` both pass, and `branches` runs `build`
   only on `main`:

   ```yaml title=".hatchrun/config.yml"
   jobs:
     lint:
       runs-on: ubuntu-latest
       steps:
         - uses: actions/checkout@v5
         - run: npm ci
         - run: npm run lint
     test:
       runs-on: ubuntu-latest
       steps:
         - uses: actions/checkout@v5
         - uses: actions/setup-node@v4
           with:
             node-version: 22
         - run: npm ci
         - run: npm test
     build:
       runs-on: ubuntu-26.04-4core
       steps:
         - uses: actions/checkout@v5
         - run: npm ci
         - run: npm run build

   workflows:
     ci:
       on:
         push:
           branches: [main]
         pull_request: {}
       jobs:
         - lint
         - test
         - build:
             requires: [lint, test]
             branches: [main]
   ```

   `lint` and `test` start together. `build` starts when both pass.

6. ## Check what runs where

   `branches` on a workflow entry matches the event's ref. For a pull
   request, that ref is the base branch. A pull request into `main`
   therefore runs `build` too. To build only on pushes, give `build`
   its own workflow:

   ```yaml title=".hatchrun/config.yml"
   jobs:
     lint:
       runs-on: ubuntu-latest
       steps:
         - uses: actions/checkout@v5
         - run: npm ci
         - run: npm run lint
     test:
       runs-on: ubuntu-latest
       steps:
         - uses: actions/checkout@v5
         - run: npm ci
         - run: npm test
     build:
       runs-on: ubuntu-26.04-4core
       steps:
         - uses: actions/checkout@v5
         - run: npm ci
         - run: npm run build

   workflows:
     pr:
       on:
         pull_request: {}
       jobs:
         - lint
         - test
     main:
       on:
         push:
           branches: [main]
       jobs:
         - lint
         - test
         - build:
             requires: [lint, test]
   ```

   Pull requests run the `pr` workflow. Pushes to `main` run the
   `main` workflow, which builds after both checks pass.

7. ## Commit the file

   ```sh
   git add .hatchrun/config.yml
   git commit -m "ci: add hatchrun config"
   ```

:::

Expected result: `hatchrun validate` prints nothing. Once the GitHub
App is installed, a pull request shows the check runs `lint` and
`test`, and a push to `main` shows `lint`, `test` and `build`.

## Troubleshooting

:::note[validate says "expected mapping start"]
A value that must be a map has a list or a plain word. The usual
cause is `on: push` or `on: [push]`. Write `on: { push: {} }`.
:::

:::note[validate says a job "needs `executor` or `runs-on`"]
Every job names its machine. Add `runs-on: ubuntu-latest`.
:::

## Next steps

- [Reuse config with commands, executors and parameters](/docs/ci/guides/reuse-config/)
  removes the repeated checkout and install steps.
- [Run jobs in order with requires and approvals](/docs/ci/guides/requires-approvals/)
