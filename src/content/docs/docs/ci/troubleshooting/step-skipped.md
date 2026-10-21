---
title: A step was skipped
description: How if conditions and status functions decide whether a step runs, and how to make a step run after a failure.
banner:
  content: "Preview: hatchrun CI is not available yet. These pages document the configuration format and the planned service."
---

A step runs when its `if:` is true. A step with no `if:`, or with an
`if:` that calls no status function, also needs every step before it
to have succeeded. That second rule explains most skipped steps.

## The rule

| `if:` on the step | Runs when |
| --- | --- |
| none | Every step before succeeded |
| `matrix.os == 'arm'` | Every step before succeeded, and the expression is true |
| `failure()` | A step before failed |
| `always()` | Always |
| `!cancelled()` | Always, except after a cancel |
| `success() \|\| github.ref == 'refs/heads/main'` | The expression is true |

Calling `success()`, `failure()`, `cancelled()` or `always()` anywhere
in the condition turns off the implicit "everything succeeded" check.

## Run a step after a failure

```yaml title=".hatchrun/config.yml"
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - run: make test
      - name: Save logs
        if: failure()
        run: ./save-logs.sh
      - name: Clean up
        if: always()
        run: ./cleanup.sh
```

## Let a step fail without failing the job

`continue-on-error: true` lets the job go on as if the step passed:

```yaml title=".hatchrun/config.yml"
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - run: make lint-experimental
        continue-on-error: true
      - run: make test
```

`continue-on-error` takes `true` or `false` only, never an expression.

## Common causes

- **An earlier step failed.** Look for the first failed step in the
  check run.
- **The expression reads a value that is not there.** A missing
  property is `null`, which is falsy. Print it with
  `run: echo '${{ toJSON(github.event) }}'` to check.
- **A variable holds the text `false`.** `${{ vars.DEPLOY }}` is the
  string `'false'`, which is truthy. Compare it instead:
  `vars.DEPLOY == 'true'`.

## Built-in steps

`cache`, `workspace` and `test-results` take no `if:`.
