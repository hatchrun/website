---
title: Limits
description: The size, job, expression and filter limits of .hatchrun/config.yml, and the message each one gives.
banner:
  content: "Preview: hatchrun CI is not available yet. This page documents the configuration format."
---

hatchrun plans every run from your config when an event arrives, so
the config has fixed limits. Each keeps the work one push causes small
and the same for every repository. A config past a limit fails
`hatchrun validate` with a message that names the limit.

## The file

| Limit | Value |
| --- | --- |
| Config size | 1 MiB (1,048,576 bytes) |
| Converted config size, for `hatchrun convert` | 1 MiB |
| One GitHub workflow file read by `convert` | 1 MiB |

```text
.hatchrun/config.yml: the config is 1048579 bytes; the limit is 1048576
```

A file that nests too deeply or holds too much YAML structure to read
fails with `the file is too large or nests too deeply to read`.

## Jobs

| Limit | Value |
| --- | --- |
| Jobs one workflow plans | 256 |
| Combinations in one matrix | 256 |
| `parallelism` | 1 to 64 |
| `timeout-minutes` when unset | 360 |

A workflow plans one job per matrix combination per parallel copy of
each entry, and one per approval. An entry without a matrix counts as
one combination. A matrix of 16 combinations on a job with
`parallelism: 17` plans 272 jobs and fails:

```text
.hatchrun/config.yml: workflow `ci` plans more than 256 jobs; the limit is 256
```

A matrix of 17 by 16 values, on a job with `parallelism: 65`:

```text
.hatchrun/config.yml: job `test` has parallelism 65; it must be 1 to 64
.hatchrun/config.yml: `test` has a matrix of 272 entries; the limit is 256
```

## Planning budget

hatchrun spreads out every command call, matrix combination and
parallel copy when it plans a run. Two budgets cap that work:

| Budget | Value | What counts |
| --- | --- | --- |
| Steps and command calls | 50,000 | Every step and command call visited, and every step written into the plan, once per matrix combination and parallel copy |
| Bytes | 8 MiB (8,388,608 bytes) | The text and values of every planned step and job, once per matrix combination and parallel copy |

A job of 200 steps with a matrix of 256 combinations goes over the
first budget:

```text
.hatchrun/config.yml: workflow `ci` expands to more than 50000 steps and command calls, counting each matrix entry and parallel node; the limit is 50000
```

A step with a 60,000-character script and the same matrix goes over
the second:

```text
.hatchrun/config.yml: workflow `ci` expands to more than 8388608 bytes of steps and values, counting each matrix entry and parallel node; the limit is 8388608 bytes
```

At run time each workflow gets its own budget. `hatchrun validate`
plans all workflows of the file with one budget, so a file that passes
`validate` fits at run time.

To get under a budget, move steps that only some combinations need
into their own job, or cut the matrix.

## Commands and parameters

| Limit | Value |
| --- | --- |
| Commands calling commands | 64 levels deep |
| A string after `${{ parameters.NAME }}` is replaced | 64 KiB (65,536 bytes) |

A chain of commands `c0` to `c70`, each calling the next, fails at
the command 64 levels down. A 70,000-character value passed to
`run: "echo ${{ parameters.blob }}"` fails too:

```text
.hatchrun/config.yml: command `c63` nests commands deeper than 64
.hatchrun/config.yml: job `build` substitutes `${{ parameters.blob }}` into a value of 70005 bytes; the limit is 65536
```

## Expressions

| Limit | Value |
| --- | --- |
| Length of one expression | 4,096 bytes |
| Nesting of brackets, parentheses, calls and `!` | 64 levels |
| Longest string an expression makes | 1 MiB |
| Memory one expression or one interpolated string may use | 8 MiB |

`validate` checks length and nesting:

```text
.hatchrun/config.yml: job `t` step 1 `run` has a bad expression: expression is longer than 4096 bytes (at byte 3)
```

The string and memory limits apply when the expression runs. A step
whose expression passes them fails.

## Filters

| Limit | Value |
| --- | --- |
| Patterns in one filter | 256 |
| Glob patterns in all filters of the config | 4,096 |
| Changed files that path filters look at | the first 300 |

A glob pattern is one that is not plain text, plain text then `**`, or
`**` then plain text. `docs/**`, `**.md` and `main` are not globs;
`release/v*` and `src/**/*.rs` are.

A `branches` list of 257 patterns, and 17 workflows with 256 glob
patterns each:

```text
.hatchrun/config.yml: workflow `ci`: `on.push.branches` has 257 patterns; the limit is 256
.hatchrun/config.yml: the config's filters have 4352 glob patterns; the limit is 4096
```

Matching one path filter against an event's changed files also has a
fixed work limit. Patterns such as `apps/a07/**/*.tsx` use a small
part of it, even 256 of them against 300 paths. Only patterns with
many `*` runs, such as `*a*a*a*a*b`, against long paths reach it. A filter that reaches the limit passes, as it does when the
changed files are not known, so the workflow starts.
