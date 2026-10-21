---
title: Split tests across parallel jobs
description: Run copies of a test job with parallelism and how hatchrun will split tests between them by timing.
banner:
  content: "Preview: hatchrun CI is not available yet. These pages document the configuration format and the planned service."
---

:::caution[Coming later]
`parallelism` is part of the format and `hatchrun validate` checks it
today. The runner command that hands each copy its share of the tests
is not shipped yet.
:::

A test suite that takes 20 minutes on one machine can take about 5 on
four. `parallelism` runs several copies of a job at once, and test
splitting gives each copy a different share of the tests.

Each copy pays for its own minutes, so four 5-minute copies cost about
the same as one 20-minute job.

## Prerequisites

- A test suite that can run a subset of tests given a list of files or
  names.

:::steps

1. ## Set parallelism on the job

   ```yaml title=".hatchrun/config.yml"
   jobs:
     test:
       runs-on: ubuntu-26.04-4core
       parallelism: 4
       steps:
         - uses: actions/checkout@v5
         - run: cargo nextest run
         - test-results: target/nextest

   workflows:
     ci:
       on:
         pull_request: {}
       jobs:
         - test
   ```

   The run plans four jobs, `test [1/4]` to `test [4/4]`, each on its
   own machine with its own check run.

2. ## Validate

   ```sh
   hatchrun validate
   ```

3. ## Split the tests

   This step needs the runner command, which is coming. Each copy will
   ask it for its share of the test list and run only those tests.

:::

## How the split works

The split takes the list of tests, the timings recorded for them, and
the copy's number. Every copy computes the same answer from the same
inputs, so no test runs twice and none is left out.

1. A test with a recorded timing keeps it. A test without one gets the
   median of the known timings, or 1 when none are known.
2. Tests are placed longest first, in name order on a tie.
3. Each test goes to the copy with the least total time so far, the
   lowest-numbered copy on a tie.
4. Each copy runs its tests in the order they were given.

With no timings at all, every test weighs the same and the copies get
equal numbers of tests. A copy numbered past the number of tests gets
none. How timings are recorded will be settled with the runner work.

## Parallelism with a matrix

Each matrix combination gets its own copies. A matrix of two Node
versions with `parallelism: 4` plans eight jobs, `test (20) [1/4]` to
`test (22) [4/4]`.

All of them count toward the [256-job
limit](/docs/ci/reference/limits/#jobs) of a workflow.

## Rules

- `parallelism` is 1 to 64. 1 is the default and plans one job with no
  `[i/n]` suffix.
- An entry that requires a parallel job waits for every copy.

## Next steps

- [Choose a runner size](/docs/ci/guides/runner-size/)
