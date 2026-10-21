---
title: CLI reference
description: The hatchrun command line, its validate and convert commands, their output and exit codes.
banner:
  content: "Preview: hatchrun CI is not available yet. This page documents the configuration format."
---

`hatchrun` is a single binary for Linux on amd64 and arm64. It reads
files and writes files, and talks to no server. See the
[Quickstart](/docs/ci/quickstart/#install-the-cli) to install it.

```text
hatchrun validate [PATH]
hatchrun convert [FILES]... [-o PATH]
hatchrun --version
hatchrun --help
```

## hatchrun validate

```sh
hatchrun validate [PATH]
```

Checks one config file and prints every problem found. `PATH`
defaults to `.hatchrun/config.yml`.

`validate` checks the file's shape, then every job and command on its
own, whether or not a workflow runs it, then plans every workflow for
the branch `main`. See the
[configuration reference](/docs/ci/configuration/) for the rules.

Each problem is one line on standard output:

```text
PATH:LINE:COLUMN: MESSAGE
PATH: MESSAGE
```

Problems in the YAML or the file's shape carry a line and column, and
`validate` stops at the first one. For `parallelism: lots` on line 4:

```text
.hatchrun/config.yml:4:18: invalid u32
```

Problems found once the shape is right, such as a job that names a
missing executor, have no position, and all of them are reported:

```text
.hatchrun/config.yml: job `deploy` uses executor `rust`, which is not defined in `executors:`
.hatchrun/config.yml: workflow `ci` runs job `lint`, which is not defined in `jobs:`
```

| Exit code | Meaning |
| --- | --- |
| 0 | The file is valid. Nothing is printed |
| 1 | Problems were found, or the file could not be read |
| 2 | The command line was wrong |

## hatchrun convert

```sh
hatchrun convert [FILES]... [-o PATH]
```

Converts GitHub Actions workflow files into one hatchrun config.

| Argument | Description |
| --- | --- |
| `FILES` | The workflow files to convert. Default: every `.yml` and `.yaml` file in `.github/workflows/`, in name order |
| `-o`, `--output PATH` | Write the config to `PATH` instead of standard output. Missing directories are created |

The config goes to standard output, or to `PATH` with `-o`. Warnings
and errors go to standard error, one per line, warnings first. A
problem with a position in a file reads `PATH:LINE:COLUMN: MESSAGE`.

Warnings name keys that were dropped or changed; the config works
without them. Errors name jobs, events or files that were left out;
the config holds everything else. See
[Migrating from GitHub Actions](/docs/ci/migrating/) for each case.

| Exit code | Meaning |
| --- | --- |
| 0 | Everything converted. There may be warnings |
| 1 | Something was left out, and the config holds the rest. When nothing converted, or a file could not be read, no config is written |
| 2 | The command line was wrong |

Run `hatchrun validate` on the written config before you commit it.

## hatchrun --version

Prints `hatchrun VERSION`.
