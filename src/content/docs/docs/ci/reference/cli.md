---
title: CLI reference
description: Every hatchrun command, argument and flag, with output formats, exit codes and sample output.
banner:
  content: "Preview: hatchrun CI is not available yet. These pages document the configuration format and the planned service."
---

`hatchrun` checks and converts config files on your machine. It reads
and writes local files and talks to no server. See the
[Quickstart](/docs/ci/get-started/quickstart/#install-the-cli) to
install it.

```text
Usage: hatchrun <COMMAND>

Commands:
  validate  Check a workflow file and print every problem found
  convert   Convert GitHub Actions workflow files into a hatchrun config
  help      Print this message or the help of the given subcommand(s)

Options:
  -h, --help     Print help
  -V, --version  Print version
```

## hatchrun validate

```text
hatchrun validate [PATH]
```

Checks one config file and prints every problem it finds.

| Argument | Default | Description |
| --- | --- | --- |
| `PATH` | `.hatchrun/config.yml` | The file to check |

### What it checks

1. The YAML and the file's shape: known keys, the right types. It
   stops at the first problem here.
2. Every job and command on its own, whether or not a workflow uses
   it: runners, parameters, command calls, expressions.
3. Every workflow, planned for the branch `main`: triggers, filters,
   entries, `requires`, matrices and limits.

### Output

Nothing on success. Otherwise one line per problem on standard output:

```text
PATH:LINE:COLUMN: MESSAGE
PATH: MESSAGE
```

Problems from step 1 carry a line and column. Later problems do not.

<!-- check: validate-fails -->
```yaml title=".hatchrun/config.yml"
jobs:
  test:
    runs-on: ubuntu-latest
    timeout-minutes: soon
```

```text
.hatchrun/config.yml:4:22: invalid u32
```

<!-- check: validate-fails -->
```yaml title=".hatchrun/config.yml"
jobs:
  deploy:
    executor: rust
workflows:
  ci:
    on: { push: {} }
    jobs: [lint, deploy]
```

```text
.hatchrun/config.yml: job `deploy` uses executor `rust`, which is not defined in `executors:`
.hatchrun/config.yml: workflow `ci` runs job `lint`, which is not defined in `jobs:`
```

Every message is listed in
[Error and warning messages](/docs/ci/reference/messages/).

### Exit codes

| Code | Meaning |
| --- | --- |
| 0 | The file is valid |
| 1 | Problems were found, or the file could not be read |
| 2 | The command line was wrong |

A file that cannot be read prints to standard error:

```text
hatchrun: read nope.yml: No such file or directory (os error 2)
```

## hatchrun convert

```text
hatchrun convert [FILES]... [-o PATH]
```

Converts GitHub Actions workflow files into one hatchrun config.

| Argument or flag | Default | Description |
| --- | --- | --- |
| `FILES` | every `.yml` and `.yaml` in `.github/workflows/`, by name | The workflow files to convert |
| `-o`, `--output PATH` | standard output | Write the config to `PATH`; missing directories are created |

### Output

- The config goes to standard output, or to `PATH` with `-o`.
- Warnings, then errors, go to standard error, one per line.
- A problem with a position in a file reads
  `PATH:LINE:COLUMN: MESSAGE`. Others start with the file name.

```text
$ hatchrun convert -o .hatchrun/config.yml
`ci.yml`: `concurrency` is not supported and was dropped
`ci.yml` job `lint`: `runs-on: ubuntu-24.04` became `ubuntu-latest`, which runs Ubuntu 26.04
```

A warning means a key was dropped or changed and the config works
without it. An error means a job, an event or a file was left out.

See [Migrate a repository](/docs/ci/guides/migrate/) and [Error and
warning messages](/docs/ci/reference/messages/#convert-warnings).

### Naming

Each file becomes the workflow named after it, without `.yml` or
`.yaml`. Each job becomes `FILE-JOB` under `jobs:`, and its workflow
entry is named after the GitHub job id.

### Exit codes

| Code | Meaning |
| --- | --- |
| 0 | Everything converted; there may be warnings |
| 1 | Something was left out and the config holds the rest; or nothing converted, or a file could not be read, and no config was written |
| 2 | The command line was wrong |

Run `hatchrun validate` on the written config before you commit it.

## hatchrun --version

Prints `hatchrun` and the version.

## hatchrun help

`hatchrun help`, `hatchrun --help` and `hatchrun help COMMAND` print
usage.
