---
title: Build a matrix
description: Run one job over every combination of values, read the values in steps, and pass them as parameters.
banner:
  content: "Preview: hatchrun CI is not available yet. These pages document the configuration format and the planned service."
---

A matrix runs one job once per combination of values, such as every
Node version against every database. You write the job once and list
the values on its workflow entry.

## Prerequisites

- A job that should run with different values. This guide uses a
  Node.js test job.

:::steps

1. ## Add a matrix to the workflow entry

   `matrix` maps each key to a list of values:

   ```yaml title=".hatchrun/config.yml"
   jobs:
     test:
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
       on:
         pull_request: {}
       jobs:
         - test:
             matrix:
               node: [20, 22, 24]
   ```

   The run plans three jobs: `test (20)`, `test (22)` and `test (24)`.
   Steps read the job's value as `${{ matrix.node }}`.

2. ## Add a second key

   Each new key multiplies the jobs. Two Node versions on two databases
   make four jobs:

   ```yaml title=".hatchrun/config.yml"
   jobs:
     test:
       runs-on: ubuntu-latest
       steps:
         - uses: actions/checkout@v5
         - run: docker run -d -p 5432:5432 -e POSTGRES_PASSWORD=pw postgres:${{ matrix.postgres }}
         - uses: actions/setup-node@v4
           with:
             node-version: ${{ matrix.node }}
         - run: npm test

   workflows:
     ci:
       on:
         pull_request: {}
       jobs:
         - test:
             matrix:
               node: [20, 22]
               postgres: [16, 17]
   ```

   The jobs are `test (20, 16)`, `test (20, 17)`, `test (22, 16)` and
   `test (22, 17)`. Values appear in the order of their keys sorted by
   name, and the first key changes slowest.

3. ## Feed a matrix key into a parameter

   When the job declares a parameter with the same name as a matrix
   key, the matrix also sets the parameter. Use this when a value must
   reach a command, or must keep its type:

   ```yaml title=".hatchrun/config.yml"
   commands:
     setup:
       parameters:
         node: { type: integer }
       steps:
         - uses: actions/checkout@v5
         - uses: actions/setup-node@v4
           with:
             node-version: ${{ parameters.node }}

   jobs:
     test:
       runs-on: ubuntu-latest
       parameters:
         node: { type: integer }
       steps:
         - setup: { node: "${{ parameters.node }}" }
         - run: npm test

   workflows:
     ci:
       on:
         pull_request: {}
       jobs:
         - test:
             matrix:
               node: [20, 22]
   ```

4. ## Validate

   ```sh
   hatchrun validate
   ```

:::

## Rules

- Every key needs at least one value.
- A value may appear only once per key.
- A key cannot also be set as a parameter value on the same entry.
- A matrix may have at most 256 combinations, and the whole workflow
  at most 256 jobs. With `parallelism`, each combination counts once
  per copy.
- An entry that requires a matrix entry waits for all its jobs.

GitHub's `include` and `exclude` have no equivalent. To add a leg,
list the job again under another `name` with parameter values.

To leave a combination out, split the matrix into entries that list
only what you want. See [Migrate: matrix include and
exclude](/docs/ci/guides/migrate/#matrix-include-and-exclude).

## Troubleshooting

:::note[A matrix of more than 256 entries]
The product of the list lengths is over 256. Drop values, or split the
matrix into two entries with different names.
:::

:::note[A value listed twice]
`validate` reports ``lists `20` twice in matrix key `node` ``. Remove
the duplicate.
:::

## Next steps

- [Split tests across parallel jobs](/docs/ci/guides/test-splitting/)
- [Configuration reference: matrix](/docs/ci/reference/configuration/#matrix)
