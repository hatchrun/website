---
title: Fix validate errors
description: How to read hatchrun validate output and fix the errors people hit most often.
banner:
  content: "Preview: hatchrun CI is not available yet. These pages document the configuration format and the planned service."
---

`hatchrun validate` prints one line per problem. This page shows how
to read the lines and fixes the most common ones. Every message is in
[Error and warning messages](/docs/ci/reference/messages/).

## Read the output

```text
.hatchrun/config.yml:4:22: invalid u32
.hatchrun/config.yml: job `deploy` uses executor `rust`, which is not defined in `executors:`
```

- `PATH:LINE:COLUMN:` means a YAML or shape problem at that spot.
  `validate` stops at the first one. Fix it and run again.
- `PATH:` with no position means a problem found once the shape was
  right. `validate` reports all of these at once.
- The message names the job, command or workflow, and the step number
  counting from 1.

## Work in order

1. Fix the problem with a line number, if there is one.
2. Run `hatchrun validate` again. More problems may appear now that
   the file can be read.
3. Fix the rest. They do not depend on each other, so any order works.
4. Run it until it prints nothing.

## Common errors

### on: push

<!-- check: validate-fails -->
```yaml title=".hatchrun/config.yml"
jobs:
  test:
    runs-on: ubuntu-latest
workflows:
  ci:
    on: push
    jobs: [test]
```

```text
.hatchrun/config.yml:6:9: expected mapping start
```

`on:` is always a map. Write `on: { push: {} }`.

### A runner label that is not a template

<!-- check: validate-fails -->
```yaml title=".hatchrun/config.yml"
jobs:
  test:
    runs-on: macos-latest
```

```text
.hatchrun/config.yml: job `test` has `runs-on: macos-latest`, which names no runner template; use one of ubuntu-latest, ubuntu-26.04, ubuntu-26.04-arm, ubuntu-26.04-4core, ubuntu-26.04-4core-arm, ubuntu-26.04-8core, ubuntu-26.04-8core-arm, ubuntu-26.04-16core, ubuntu-26.04-16core-arm
```

Use a label from the list. hatchrun runs Ubuntu 26.04 only.

### A workflow entry's options at the wrong indent

<!-- check: validate-fails -->
```yaml title=".hatchrun/config.yml"
jobs:
  build:
    runs-on: ubuntu-latest
workflows:
  ci:
    on: { push: {} }
    jobs:
      - build:
        requires: [test]
```

```text
.hatchrun/config.yml:8:9: a workflow job entry is a map with one key, the job name; found `requires` after `build`
```

Options go under the job name, two spaces further in than the name:

```yaml title=".hatchrun/config.yml"
jobs:
  test:
    runs-on: ubuntu-latest
  build:
    runs-on: ubuntu-latest
workflows:
  ci:
    on: { push: {} }
    jobs:
      - test
      - build:
          requires: [test]
```

### A GitHub context that does not exist here

<!-- check: validate-fails -->
```yaml title=".hatchrun/config.yml"
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - run: echo ${{ strategy.job-index }}
```

```text
.hatchrun/config.yml: job `test` step 1 `run` has a bad expression: unknown context 'strategy' (at byte 9)
```

Use `matrix` values in place of `strategy`. The
[contexts](/docs/ci/reference/contexts/) page lists what exists.

### A parameter used inside an expression

<!-- check: validate-fails -->
```yaml title=".hatchrun/config.yml"
jobs:
  deploy:
    runs-on: ubuntu-latest
    parameters:
      env: { type: string, default: staging }
    steps:
      - if: ${{ parameters.env == 'production' }}
        run: ./deploy.sh
```

```text
.hatchrun/config.yml: job `deploy` step 1 `if` reads `parameters` inside an expression; only a whole `${{ parameters.NAME }}` is substituted, and run time has no parameters
```

Parameters are filled in before steps run, so expressions cannot use
them. Pass the decision in as a whole value, such as a script argument,
or list the job twice in the workflow.

### Two entries for one job

<!-- check: validate-fails -->
```yaml title=".hatchrun/config.yml"
jobs:
  test:
    runs-on: ubuntu-latest
workflows:
  ci:
    on: { push: {} }
    jobs:
      - test
      - test
```

```text
.hatchrun/config.yml: workflow `ci` has a duplicate job id `test`; give one of them a `name`
```

Give the second entry a `name`, such as `name: test-again`.

### An approval with no type

<!-- check: validate-fails -->
```yaml title=".hatchrun/config.yml"
jobs:
  deploy:
    runs-on: ubuntu-latest
workflows:
  ci:
    on: { push: {} }
    jobs:
      - hold
      - deploy: { requires: [hold] }
```

```text
.hatchrun/config.yml: workflow `ci` runs job `hold`, which is not defined in `jobs:`
```

An entry is a job unless it says `type: approval`. Write
`- hold: { type: approval }`.

## Next steps

- [Error and warning messages](/docs/ci/reference/messages/)
- [Configuration reference](/docs/ci/reference/configuration/)
