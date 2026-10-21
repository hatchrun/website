---
title: Test splitting and parallelism
description: Run copies of a job in parallel and split tests between them by recorded timings.
banner:
  content: "Preview: hatchrun CI is not available yet. This page documents the configuration format."
---

:::caution[Coming later]
`parallelism` is part of the format and `hatchrun validate` checks it
today. The command that splits tests on the runner is not shipped yet.
This page describes how splitting will work.
:::

A test suite that takes 20 minutes on one machine takes about 5 on
four. Set `parallelism` on a job to run that many copies of it at
once, and give each copy a different share of the tests. Each copy
is billed for its own minutes, so four copies of 5 minutes cost about
the same as one of 20.

## Run copies of a job

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
      push: {}
    jobs:
      - test
```

`parallelism` is 1 to 64, and 1 by default. Each copy is its own job
with its own check run, named `test [1/4]` to `test [4/4]`. With a
matrix, every combination gets its copies: `test (20) [1/4]` and so
on. An entry that requires `test` waits for all of them. See
[Job ids after expansion](/docs/ci/configuration/#job-ids-after-expansion).

Copies count toward the 256-job limit of a workflow: a matrix of 8
combinations with `parallelism: 4` plans 32 jobs.

## How tests are split

Splitting takes the list of test files or names, the timings recorded
for them by earlier runs, and the copy's number. Every copy computes
the same assignment from the same inputs, so no test runs twice and
none is left out.

1. A test with a recorded timing keeps it. A test without one gets
   the median of the known timings, or 1 when none are known.
2. Tests are placed longest first, and in name order when two take
   the same time.
3. Each test goes to the copy with the least total time so far, the
   lowest-numbered copy on a tie.
4. Each copy runs its tests in the order they were given.

With no timings at all, every test weighs the same and the copies get
equal numbers of tests. A copy beyond the number of tests gets none.

## Where timings come from

How timings are recorded will be settled with the runner work, and
this page will say how once it ships.
