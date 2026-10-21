---
title: Reuse config with commands, executors and parameters
description: Remove repeated steps and machine labels from a config with commands, executors and typed parameters.
banner:
  content: "Preview: hatchrun CI is not available yet. These pages document the configuration format and the planned service."
---

Configs repeat themselves: every job checks out the code and installs
the same tools, and many jobs name the same machine.

This guide moves the repeated parts into an executor and a command,
then makes one job serve two purposes with a parameter.

## Prerequisites

- A config with at least two jobs. The starting point here:

```yaml title=".hatchrun/config.yml"
jobs:
  lint:
    runs-on: ubuntu-26.04-4core
    steps:
      - uses: actions/checkout@v5
      - uses: actions/setup-node@v4
        with:
          node-version: 22
      - run: npm ci
      - run: npm run lint
  test:
    runs-on: ubuntu-26.04-4core
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
      pull_request: {}
    jobs:
      - lint
      - test
```

:::steps

1. ## Name the machine once with an executor

   Add an `executors:` section and point each job at it with
   `executor:` in place of `runs-on:`:

   ```yaml title=".hatchrun/config.yml"
   executors:
     node:
       runs-on: ubuntu-26.04-4core

   jobs:
     lint:
       executor: node
       steps:
         - run: npm run lint
   ```

   A job takes `executor` or `runs-on`, never both. To move every job
   to a bigger machine later, change one line.

2. ## Move the shared steps into a command

   A command is a named list of steps. Add `commands:` with a `setup`
   command, and call it as a step by its name:

   ```yaml title=".hatchrun/config.yml"
   executors:
     node:
       runs-on: ubuntu-26.04-4core

   commands:
     setup:
       steps:
         - uses: actions/checkout@v5
         - uses: actions/setup-node@v4
           with:
             node-version: 22
         - run: npm ci

   jobs:
     lint:
       executor: node
       steps:
         - setup
         - run: npm run lint
     test:
       executor: node
       steps:
         - setup
         - run: npm test
   ```

   hatchrun replaces `- setup` with the command's three steps when it
   plans the run.

3. ## Give the command a parameter

   Some jobs need another Node version. Declare a `node` parameter with
   a default, and read it as `${{ parameters.node }}`:

   ```yaml title=".hatchrun/config.yml"
   commands:
     setup:
       parameters:
         node:
           type: integer
           default: 22
           description: Node.js major version
       steps:
         - uses: actions/checkout@v5
         - uses: actions/setup-node@v4
           with:
             node-version: ${{ parameters.node }}
         - run: npm ci

   jobs:
     lint:
       runs-on: ubuntu-latest
       steps:
         - setup
         - run: npm run lint
     legacy:
       runs-on: ubuntu-latest
       steps:
         - setup: { node: 20 }
         - run: npm test
   ```

   `- setup` uses the default. `- setup: { node: 20 }` passes a value.
   A parameter without a `default` is required, and every call must
   pass it.

4. ## Make a job take a parameter

   Jobs take parameters the same way. The workflow passes the value on
   the entry, so one job runs twice with different values. Give the
   second entry a `name`, since two entries cannot share an id:

   ```yaml title=".hatchrun/config.yml"
   executors:
     node:
       runs-on: ubuntu-26.04-4core

   commands:
     setup:
       steps:
         - uses: actions/checkout@v5
         - run: npm ci

   jobs:
     test:
       executor: node
       parameters:
         suite:
           type: enum
           enum: [unit, e2e]
           default: unit
       steps:
         - setup
         - run: npm run test:${{ parameters.suite }}

   workflows:
     ci:
       on:
         pull_request: {}
       jobs:
         - test
         - test:
             name: e2e
             suite: e2e
   ```

   The run plans two jobs, `test` running `npm run test:unit` and `e2e`
   running `npm run test:e2e`.

5. ## Validate

   ```sh
   hatchrun validate
   ```

:::

## Parameter types

| `type` | Accepts | Example default |
| --- | --- | --- |
| `string` | A string, number or boolean | `default: release` |
| `boolean` | `true` or `false` | `default: false` |
| `integer` | A whole number | `default: 3` |
| `enum` | One of the strings in `enum:` | `default: unit` |

A value that holds a `${{ }}` expression passes any type check. It is
checked when it runs.

## Rules for parameters

- Only a whole `${{ parameters.NAME }}` is replaced. Something like
  `${{ parameters.suite == 'e2e' }}` is an error, because parameters
  are gone by the time expressions run.
- A string that is exactly `${{ parameters.NAME }}` keeps the value's
  type. Inside longer text the value becomes text.
- A job parameter cannot be called `name`, `requires`, `type`,
  `branches`, `tags` or `matrix`. Workflow entries use those keys.
- A command cannot be called after a step key such as `run`, `cache`
  or `env`.
- Commands can call commands, up to 64 levels deep, and never
  themselves.

## Troubleshooting

:::note[A parameter is required]
`validate` says ``command `setup` needs a value for parameter `node`, which is required``.
The parameter has no `default` and the call passes no value. Add a
default, or call it as `- setup: { node: 22 }`.
:::

:::note[A parameter is read inside an expression]
`validate` says a field ``reads `parameters` inside an expression``.
An expression does more than read a parameter. Move the decision into
the workflow: list the job twice with different parameter values.
:::

## Next steps

- [Build a matrix](/docs/ci/guides/matrix/) runs one job over many
  values without listing each entry.
- [Configuration reference: parameters](/docs/ci/reference/configuration/#parameters)
