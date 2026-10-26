---
title: Collect test results
description: Upload JUnit XML results from a job with the test-results step.
banner:
  content: "Preview: hatchrun CI is not available yet. These pages document the configuration format and the planned service."
---

:::caution[Coming later]
The `test-results` step is part of the format and `hatchrun validate`
checks it today. What hatchrun shows from the results is not built
yet.
:::

Most test runners can write their results as JUnit XML. The
`test-results` step uploads those files, so hatchrun has a result
for each test.

## Prerequisites

- A test runner that writes JUnit XML. Most do with a flag or a
  reporter: Jest with `jest-junit`, pytest with `--junitxml`,
  cargo-nextest with a JUnit profile, Go with `gotestsum`.

:::steps

1. ## Make the test runner write JUnit XML

   Point it at one directory, here `reports/`:

   ```sh
   pytest --junitxml=reports/junit.xml
   ```

2. ## Add the test-results step

   The value is a file or a directory:

   ```yaml title=".hatchrun/config.yml"
   jobs:
     test:
       runs-on: ubuntu-latest
       steps:
         - uses: actions/checkout@v5
         - run: pip install -r requirements.txt
         - run: pytest --junitxml=reports/junit.xml
         - test-results: reports
   ```

3. ## Validate

   ```sh
   hatchrun validate
   ```

:::

## Good to know

- `test-results` takes one path and nothing else.
- Built-in steps take no `if:`. Whether `test-results` runs after a
  failed test step will be settled with the runner work.

## Next steps

- [Split tests across parallel jobs](/docs/ci/guides/test-splitting/)
