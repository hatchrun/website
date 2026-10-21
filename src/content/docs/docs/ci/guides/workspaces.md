---
title: Share files between jobs with workspaces
description: Build once and pass the output to later jobs in the same workflow run.
banner:
  content: "Preview: hatchrun CI is not available yet. These pages document the configuration format and the planned service."
---

:::caution[Coming later]
The `workspace` step is part of the format and `hatchrun validate`
checks it today. The storage behind it needs the hosted service.
:::

Each job runs on its own machine. A workspace carries files from one
job to the jobs after it in the same workflow run, such as a build
that several test jobs use.

A cache and a workspace differ in scope. A cache is reused across
runs and may miss. A workspace belongs to one workflow run.

## Prerequisites

- A job that makes files, and later jobs that need them.

:::steps

1. ## Persist the files in the first job

   ```yaml title=".hatchrun/config.yml"
   jobs:
     build:
       runs-on: ubuntu-latest
       steps:
         - uses: actions/checkout@v5
         - run: npm ci && npm run build
         - workspace:
             persist:
               root: .
               paths: [dist, node_modules]
   ```

   `root` is the directory the `paths` are relative to.

2. ## Attach the files in the later jobs

   `attach` restores everything earlier jobs persisted into the
   directory `at`:

   ```yaml title=".hatchrun/config.yml"
   jobs:
     e2e:
       runs-on: ubuntu-latest
       steps:
         - uses: actions/checkout@v5
         - workspace:
             attach:
               at: .
         - run: npm run e2e
   ```

3. ## Order the jobs

   `attach` restores what earlier jobs persisted, so the job that
   persists must run first. Add `requires` in the workflow:

   ```yaml title=".hatchrun/config.yml"
   jobs:
     build:
       runs-on: ubuntu-latest
       steps:
         - uses: actions/checkout@v5
         - run: npm ci && npm run build
         - workspace:
             persist:
               root: .
               paths: [dist]
     e2e:
       runs-on: ubuntu-latest
       steps:
         - uses: actions/checkout@v5
         - workspace:
             attach:
               at: .
         - run: npm run e2e
     deploy:
       runs-on: ubuntu-latest
       steps:
         - workspace:
             attach:
               at: .
         - run: ./deploy.sh dist

   workflows:
     ci:
       on:
         push:
           branches: [main]
       jobs:
         - build
         - e2e:
             requires: [build]
         - deploy:
             requires: [e2e]
   ```

4. ## Validate

   ```sh
   hatchrun validate
   ```

:::

Expected result: `e2e` and `deploy` start with `dist/` in their
working directory, without building again.

## Good to know

- `persist` takes `root` and `paths`. `attach` takes `at`. Neither
  takes `name`, `if` or `env`.
- Persist only what later jobs need. Every byte is uploaded and
  downloaded again.

## Next steps

- [Collect test results](/docs/ci/guides/test-results/)
- [Configuration reference: workspace](/docs/ci/reference/configuration/#workspace)
