---
title: Limits
description: Every limit on a hatchrun CI config, the message you see when you pass it, and how to get under it.
banner:
  content: "Preview: hatchrun CI is not available yet. These pages document the configuration format and the planned service."
---

hatchrun plans every run from your config when an event arrives. Fixed
limits keep that work small and the same for every repository.
`hatchrun validate` reports each limit you pass, with the limit in the
message.

## Summary

| Limit | Value |
| --- | --- |
| [Config file size](#the-file) | 1 MiB |
| [Jobs one workflow plans](#jobs) | 256 |
| [Combinations in one matrix](#jobs) | 256 |
| [`parallelism`](#jobs) | 1 to 64 |
| [Default `timeout-minutes`](#jobs) | 360 |
| [Steps and command calls planned](#planning-budget) | 50,000 |
| [Bytes planned](#planning-budget) | 8 MiB |
| [Command nesting](#commands-and-parameters) | 64 levels |
| [A string after parameters are filled in](#commands-and-parameters) | 64 KiB |
| [Expression length](#expressions) | 4,096 bytes |
| [Expression nesting](#expressions) | 64 levels |
| [Patterns in one filter](#filters) | 256 |
| [Glob patterns in the config](#filters) | 4,096 |
| [Changed files path filters check](#filters) | the first 300 |

## The file

The config can be at most 1 MiB (1,048,576 bytes). `hatchrun convert`
applies the same limit to each GitHub file it reads and to the config
it writes.

```text
.hatchrun/config.yml: the config is 1048579 bytes; the limit is 1048576
```

YAML that nests too deeply fails with `recursion limit exceeded`.
YAML that expands to too many values, for example through anchors and
aliases, fails with a message that starts with `budget breached`.

To get under it, move long scripts into files in the repository and
call them from `run:`.

## Jobs

A workflow plans one job per matrix combination per parallel copy of
each entry, plus one per approval.

| Limit | Value |
| --- | --- |
| Jobs one workflow plans | 256 |
| Combinations in one matrix | 256 |
| `parallelism` | 1 to 64 |

A matrix of 16 combinations on a job with `parallelism: 17` plans 272
jobs:

```text
.hatchrun/config.yml: workflow `ci` plans more than 256 jobs; the limit is 256
```

A matrix of 17 by 16 values on a job with `parallelism: 65`:

```text
.hatchrun/config.yml: job `test` has parallelism 65; it must be 1 to 64
.hatchrun/config.yml: `test` has a matrix of 272 entries; the limit is 256
```

To get under them, cut matrix values, lower `parallelism`, or split
one workflow into two with different triggers.

## Planning budget

Planning expands every command call, matrix combination and parallel
copy. Two budgets cap the total:

| Budget | Value | What counts |
| --- | --- | --- |
| Steps and command calls | 50,000 | Each step and command call visited, and each step written into the plan, once per matrix combination and parallel copy |
| Bytes | 8 MiB (8,388,608) | The text and values of planned steps and jobs, once per matrix combination and parallel copy |

A job of 200 steps with a matrix of 256 combinations:

```text
.hatchrun/config.yml: workflow `ci` expands to more than 50000 steps and command calls, counting each matrix entry and parallel node; the limit is 50000
```

A step with a 60,000-character script and the same matrix:

```text
.hatchrun/config.yml: workflow `ci` expands to more than 8388608 bytes of steps and values, counting each matrix entry and parallel node; the limit is 8388608 bytes
```

At run time each workflow gets its own budget. `validate` plans every
workflow of the file against one shared budget, so a file that passes
`validate` fits at run time.

To get under them, move long scripts into files, and move steps only
some combinations need into a separate job.

## Commands and parameters

| Limit | Value |
| --- | --- |
| Commands calling commands | 64 levels |
| A string after `${{ parameters.NAME }}` is filled in | 64 KiB (65,536 bytes) |

A chain of commands `c0` to `c70`, each calling the next, and a
70,000-character value passed into `run: "echo ${{ parameters.blob }}"`:

```text
.hatchrun/config.yml: command `c63` nests commands deeper than 64
.hatchrun/config.yml: job `build` substitutes `${{ parameters.blob }}` into a value of 70005 bytes; the limit is 65536
```

## Expressions

| Limit | Value | Checked by |
| --- | --- | --- |
| Length of one expression | 4,096 bytes | `validate` |
| Nesting of brackets, parentheses, calls and `!` | 64 levels | `validate` |
| Longest string an expression makes | 1 MiB | the machine, at run time |
| Memory for one expression or one string | 8 MiB | the machine, at run time |

```text
.hatchrun/config.yml: job `t` step 1 `run` has a bad expression: expression is longer than 4096 bytes (at byte 3)
```

## Filters

| Limit | Value |
| --- | --- |
| Patterns in one filter | 256 |
| Glob patterns across all filters in the config | 4,096 |
| Changed files path filters check | the first 300 |

A glob pattern is any pattern that is not plain text, plain text then
`**`, or `**` then plain text. `main`, `docs/**` and `**.md` are not
globs. `release/v*` and `src/**/*.rs` are.

A `branches` list of 257 patterns, and 17 workflows with 256 glob
patterns each:

```text
.hatchrun/config.yml: workflow `ci`: `on.push.branches` has 257 patterns; the limit is 256
.hatchrun/config.yml: the config's filters have 4352 glob patterns; the limit is 4096
```

Path filters check only the first 300 changed files, as GitHub's diffs
stop at 300. A change past them does not start a workflow.

Matching one path filter against the changed files also has a work
limit. Patterns like `apps/a07/**/*.tsx` use a small part of it, even
256 of them against 300 paths.

Only patterns with many `*` runs, such as `*a*a*a*a*b`, against long
paths reach it. A filter that reaches the limit passes, and the
workflow starts.
