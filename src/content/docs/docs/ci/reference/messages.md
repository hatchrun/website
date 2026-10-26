---
title: Error and warning messages
description: Every message hatchrun validate and hatchrun convert print, with its cause and the fix.
banner:
  content: "Preview: hatchrun CI is not available yet. These pages document the configuration format and the planned service."
---

This page lists the messages `hatchrun validate` and `hatchrun convert`
print. Each example is real output. Names in backticks, line numbers
and sizes change with your file.

Search the page for a few words of your message. Names such as
`` `t` `` or `` `ci` `` are the job and workflow names from your file.

## validate: YAML and shape

These carry a line and column. `validate` stops at the first one, so
fix it and run again to see the next.

| Message | Cause | Fix |
| --- | --- | --- |
| `` .hatchrun/config.yml:4:5: unknown field `image`, expected one of executor, runs-on, parameters, parallelism, env, if, timeout-minutes, outputs, steps, services, container `` | A key the format does not have. The message lists the keys allowed there. | Fix the spelling, or remove the key. |
| `` .hatchrun/config.yml:1:1: unknown field `job`, expected one of executors, commands, jobs, workflows `` | An unknown top-level key. | Use one of the four top-level keys. |
| `` .hatchrun/config.yml:3:10: unknown field `release`, expected one of push, pull_request, schedule, workflow_dispatch `` | An event hatchrun CI does not start on. | Use one of the four events. |
| `` .hatchrun/config.yml:3:5: missing field `on` `` | A workflow without `on:`. | Add the missing key. |
| `` .hatchrun/config.yml:3:5: missing field `jobs` `` | A workflow without `jobs:`. | Add the missing key. |
| `` .hatchrun/config.yml:3:9: expected mapping start `` | A map was expected and something else was found. Most often `on: push` or `on: [push]`. | Write a map, such as `on: { push: {} }`. |
| `` .hatchrun/config.yml:4:22: invalid u32 `` | A whole number was expected, such as for `timeout-minutes` or `parallelism`. | Write a whole number without quotes. |
| `` .hatchrun/config.yml:3:3: duplicate key `t` `` | The same key twice in one map. | Remove or rename one. |
| `` .hatchrun/config.yml:7:13: invalid value: string "manual", expected approval `` | `type:` on a workflow entry with a value other than `approval`. | Write `type: approval`, or remove `type`. |
| `` .hatchrun/config.yml:3:13: docker is not supported yet; Docker services and containers come in a later release `` | `docker:` on an executor. | Use `runs-on:` and run containers with `docker run` in a step. |
| `` .hatchrun/config.yml:4:15: services is not supported yet; Docker services and containers come in a later release `` | `services:` on a job. | Start the service with `docker run` in a step. See [Migrate: services](/docs/ci/guides/migrate/#services). |
| `` .hatchrun/config.yml:4:16: container is not supported yet; Docker services and containers come in a later release `` | `container:` on a job. | Run the steps that need the image with `docker run`. |
| `` .hatchrun/config.yml:4:10: an enum parameter needs `enum:` values `` | `type: enum` without `enum:`. | Add `enum: [a, b]`. |
| `` .hatchrun/config.yml:4:10: `enum:` values need `type: enum` `` | `enum:` on a parameter of another type. | Set `type: enum`, or remove `enum:`. |
| `` .hatchrun/config.yml:5:9: a cache step takes no other keys, found `if` `` | A `cache`, `workspace` or `test-results` step with another key. | Remove the key. Built-in steps take no `name`, `if` or `env`. |
| `` .hatchrun/config.yml:5:9: unknown step key `greet`; a command step is a map with one key `` | A command call with other keys next to it, such as `name`. | Leave only the command name and its parameter values. |
| `` .hatchrun/config.yml:5:9: a step cannot have both run and uses `` | One step with `run` and `uses`. | Split it into two steps. |
| `` .hatchrun/config.yml:5:9: `with` is valid only on uses steps `` | `with:` on a `run` step. | Use `env:` to pass values to a script. |
| `` .hatchrun/config.yml:5:9: `shell` is valid only on run steps `` | `shell`, `working-directory` or `timeout-minutes` on a `uses` step. | Remove the key. |
| `` .hatchrun/config.yml:5:9: a step needs run, uses, cache, workspace, test-results or a command name `` | A step map with only keys such as `name` or `if`. | Add `run` or `uses`. |
| `` .hatchrun/config.yml:7:9: a workflow job entry is a map with one key, the job name; found `x` after `t` `` | A workflow entry's options are at the wrong indent, next to the job name. | Indent them under the job name. |
| `` .hatchrun/config.yml:7:269: the file is too large or nests too deeply to read `` | YAML nested too deeply, or expanded to too many values through anchors and aliases. | Flatten the value, or remove the aliases that multiply. |

## validate: the file

These print on standard error, before the file is read, and exit with 1.

| Message | Cause | Fix |
| --- | --- | --- |
| `` hatchrun: .hatchrun/config.yml is 1048579 bytes; the limit is 1048576 `` | The config is over 1 MiB. | Move long scripts into files in the repository. |
| `` hatchrun: read nope.yml: No such file or directory (os error 2) `` | The path does not exist. | Run from the repository root, or pass the path. |

## validate: jobs and commands

Each job and command is checked on its own, whether a workflow uses it
or not.

| Message | Cause | Fix |
| --- | --- | --- |
| `` .hatchrun/config.yml: command `run` has the name of a step key; rename it `` | A command named like a step key, such as `run` or `env`. | Rename the command. |
| `` .hatchrun/config.yml: executor `e` has `runs-on: ubuntu-24.04`, which names no runner template; use one of ubuntu-latest, ubuntu-26.04, ubuntu-26.04-arm, ubuntu-26.04-4core, ubuntu-26.04-4core-arm, ubuntu-26.04-8core, ubuntu-26.04-8core-arm, ubuntu-26.04-16core, ubuntu-26.04-16core-arm `` | An executor's label is not a template. | Use a label from the list. |
| `` .hatchrun/config.yml: job `t` has `runs-on: macos-latest`, which names no runner template; use one of ubuntu-latest, ubuntu-26.04, ubuntu-26.04-arm, ubuntu-26.04-4core, ubuntu-26.04-4core-arm, ubuntu-26.04-8core, ubuntu-26.04-8core-arm, ubuntu-26.04-16core, ubuntu-26.04-16core-arm `` | A job's label is not a template. | Use a label from the list. hatchrun runs Linux only. |
| `` .hatchrun/config.yml: job `t` has both `executor` and `runs-on`; use one `` | Both keys on one job. | Keep one. |
| `` .hatchrun/config.yml: job `t` needs `executor` or `runs-on` `` | A job with neither. | Add `runs-on: ubuntu-latest` or an executor. |
| `` .hatchrun/config.yml: job `t` uses executor `big`, which is not defined in `executors:` `` | The executor name is not under `executors:`. | Fix the name or add the executor. |
| `` .hatchrun/config.yml: job `t` has parallelism 0; it must be 1 to 64 `` | `parallelism` out of range. | Use 1 to 64. |
| `` .hatchrun/config.yml: job `t` has parameter `tags`, which a workflow entry reads as its own key; rename it `` | A job parameter named `name`, `requires`, `type`, `branches`, `tags` or `matrix`. | Rename the parameter. |
| `` .hatchrun/config.yml: job `t` parameter `n` must be an integer, found "many" `` | A `default` that does not fit the parameter's `type`. | Fix the default or the type. |
| `` .hatchrun/config.yml: job `t` uses command `setup`, which is not defined in `commands:` `` | A command step names a command that does not exist. Also a misspelled step key such as `rnu:`. | Fix the name, or add the command. |
| `` .hatchrun/config.yml: command `c` has no parameter `x` `` | A call passes a parameter the command does not declare. | Remove the value, or declare the parameter. |
| `` .hatchrun/config.yml: command `c` needs a value for parameter `who`, which is required `` | A parameter with no `default` and no value in the call. | Pass a value, or add a default. |
| `` .hatchrun/config.yml: command `c` parameter `n` must be an integer, found "two" `` | A value of the wrong type. | Pass a value of the declared type. |
| `` .hatchrun/config.yml: job `t` reads `${{ parameters.who }}` but declares no parameter `who` `` | A step reads a parameter its job or command does not declare. | Declare it under `parameters:`. |
| `` .hatchrun/config.yml: job `t` step 1 `if` reads `parameters` inside an expression; only a whole `${{ parameters.NAME }}` is substituted, and run time has no parameters `` | An expression does more than read a parameter, such as compare it. | Decide in the workflow instead: list the job twice with different values. |
| `` .hatchrun/config.yml: job `t` has `uses: docker://alpine:3`; `uses: docker://` is not supported yet; Docker services and containers come in a later release `` | A `docker://` action. | Use `docker run` in a `run:` step. |
| `` .hatchrun/config.yml: command `a` reaches itself: `a` -> `b` -> `a` `` | Commands call each other in a loop. | Break the loop. |
| `` .hatchrun/config.yml: command `c63` nests commands deeper than 64 `` | Command calls nest more than 64 deep. | Flatten the commands. |
| `` .hatchrun/config.yml: job `build` substitutes `${{ parameters.blob }}` into a value of 70005 bytes; the limit is 65536 `` | A filled-in string is over 64 KiB. | Pass a shorter value, or a file path. |

## validate: expressions

The byte offset at the end counts from the start of the string the
expression is in.

| Message | Cause | Fix |
| --- | --- | --- |
| `` .hatchrun/config.yml: job `t` step 1 `run` has a bad expression: unknown context 'strategy' (at byte 9) `` | A context hatchrun CI does not have. `strategy` and `jobs` are GitHub contexts with no equivalent. | Use one of the [contexts](/docs/ci/reference/contexts/). |
| `` .hatchrun/config.yml: job `t` step 1 `run` has a bad expression: unknown function 'toUpper' (at byte 9) `` | A function that does not exist. | Use one of the [functions](/docs/ci/reference/expressions/#functions). |
| `` .hatchrun/config.yml: job `t` step 1 `run` has a bad expression: contains() takes 2 arguments, got 1 (at byte 9) `` | A function call with the wrong number of arguments. | Fix the call. |
| `` .hatchrun/config.yml: job `t` step 1 `run` has a bad expression: expected an expression after '==' (at byte 20) `` | An operator with nothing after it. | Complete the expression. |
| `` .hatchrun/config.yml: job `t` step 1 `run` has a bad expression: '${{' has no closing '}}' (at byte 5) `` | A `${{` without `}}`. | Close the expression. |
| `` .hatchrun/config.yml: job `t` step 1 `run` has a bad expression: expression is longer than 4096 bytes (at byte 3) `` | An expression over 4,096 bytes. | Shorten it, or move the logic into a script. |

## validate: workflows

These come from planning each workflow for the branch `main`.

| Message | Cause | Fix |
| --- | --- | --- |
| `` .hatchrun/config.yml: workflow `ci`: `on.pull_request` has both `paths` and `paths-ignore`; use one `` | A filter and its `-ignore` form on one event. | Keep one. Fold exclusions into the include filter with `!`. |
| `` .hatchrun/config.yml: workflow `ci`: `on.workflow_dispatch` input `dry` default must be a boolean, found "maybe" `` | An input default of the wrong type. | Fix the default. |
| `` .hatchrun/config.yml: workflow `ci`: `on.push.branches` has 257 patterns; the limit is 256 `` | A filter with over 256 patterns. | Use wildcards to cover several names. |
| `` .hatchrun/config.yml: the config's filters have 4352 glob patterns; the limit is 4096 `` | Over 4,096 glob patterns across the config. | Use fewer, broader patterns. |
| `` .hatchrun/config.yml: workflow `ci` runs job `build`, which is not defined in `jobs:` `` | An entry names a job that does not exist. | Fix the name, or add the job. An approval needs `type: approval`. |
| `` .hatchrun/config.yml: workflow `ci` has a duplicate job id `t`; give one of them a `name` `` | Two entries with the same id. | Give one a `name`. |
| `` .hatchrun/config.yml: job `t` in workflow `ci` requires `build`, which is not a job of the workflow `` | `requires` names an id that no entry in this workflow has. | Fix the id. Use the entry's `name` if it has one. |
| `` .hatchrun/config.yml: workflow `ci` has a requires cycle between `a`, `b` `` | Entries wait for each other. | Remove one `requires` link. |
| `` .hatchrun/config.yml: workflow `ci` has two jobs with the id `t [1/2]`, from `t` and `t [1/2]` `` | Two entries expand to the same job id. | Rename one entry. |
| `` .hatchrun/config.yml: approval `hold` cannot have a `name`; its id is its key `` | `name` on an approval. | Rename the key instead. |
| `` .hatchrun/config.yml: approval `hold` takes no parameters, found `env` `` | An unknown key on an approval. | Remove it. Approvals take `requires`, `branches` and `tags`. |
| `` .hatchrun/config.yml: approval `hold` cannot have a matrix `` | `matrix` on an approval. | Remove it. |
| `` .hatchrun/config.yml: job `t` has no parameter `node` `` | An entry sets a value for a parameter the job does not declare. | Declare the parameter on the job, or remove the value. |
| `` .hatchrun/config.yml: `t` has matrix key `node` with no values `` | An empty matrix list. | Add values or remove the key. |
| `` .hatchrun/config.yml: `t` lists `20` twice in matrix key `node` `` | A repeated matrix value. | Remove the duplicate. |
| `` .hatchrun/config.yml: `t` sets `node` both in its matrix and as a parameter `` | The same key in `matrix` and as a parameter value. | Keep one. |
| `` .hatchrun/config.yml: `t` sets `node` to a value that reads `parameters`; a workflow has no parameters to read `` | An entry's value reads `${{ parameters... }}`. | Write the value itself. |
| `` .hatchrun/config.yml: `test` has a matrix of 272 entries; the limit is 256 `` | Over 256 combinations. | Cut values, or split the matrix. |
| `` .hatchrun/config.yml: workflow `ci` plans more than 256 jobs; the limit is 256 `` | Matrices, parallel copies and entries add up to over 256 jobs. | Cut matrices or parallelism, or split the workflow. |
| `` .hatchrun/config.yml: workflow `ci` expands to more than 50000 steps and command calls, counting each matrix entry and parallel node; the limit is 50000 `` | The planning step budget. | See [Limits](/docs/ci/reference/limits/#planning-budget). |
| `` .hatchrun/config.yml: workflow `ci` expands to more than 8388608 bytes of steps and values, counting each matrix entry and parallel node; the limit is 8388608 bytes `` | The planning byte budget. | See [Limits](/docs/ci/reference/limits/#planning-budget). |

## convert warnings

A warning means a key was dropped or changed. The config works
without it, and `convert` exits with 0 if there are no errors.

| Message | Cause | Fix |
| --- | --- | --- |
| `` `ci.yml`: `concurrency` is not supported and was dropped `` | Workflow-level `run-name`, `permissions` or `concurrency`. | Nothing to do, unless you relied on it. |
| `` `ci.yml`: unknown key `foo` was dropped `` | A key GitHub does not define. | Nothing to do. |
| `` `ci.yml`: `on.release` is not supported and was dropped; hatchrun runs on push, pull_request, schedule and workflow_dispatch `` | An event hatchrun CI does not start on. | Keep that workflow on GitHub Actions, or use another event. |
| `` `ci.yml`: input `n` is a number input and became an integer parameter `` | A `number` input. Decimals no longer fit. | Check the default and the values you pass. |
| `` `ci.yml`: input `env` is an environment input and became a string parameter `` | An `environment` input. | Nothing to do. |
| `` `ci.yml`: input `b`: `default: maybe` does not fit the input type and was dropped `` | An input default of the wrong type. | Add a valid default by hand. |
| `` `ci.yml` job `build`: `services` is not supported and was dropped; Docker services and containers come in a later release `` | Job `services` or `container`. | Start them with `docker run`. See [Migrate: services](/docs/ci/guides/migrate/#services). |
| `` `ci.yml` job `build`: `concurrency` is not supported and was dropped `` | Job `concurrency`, `permissions` or `continue-on-error`; the message names the key. | Nothing to do. |
| `` `ci.yml` job `build`: `environment.url` is not supported and was dropped `` | A job `environment` map with `url`. | Nothing to do. |
| `` `ci.yml` job `build`: unknown key `foo` was dropped `` | A job or step key GitHub does not define. | Nothing to do. |
| `` `ci.yml` job `build`: `strategy.max-parallel` is not supported and was dropped `` | A `strategy` key other than `matrix`. | Nothing to do. |
| `` `ci.yml` job `build`: `strategy.matrix.include` is not supported and was dropped; only plain value lists convert `` | Matrix `include` or `exclude`. | Rebuild with extra entries. See [Migrate: matrix](/docs/ci/guides/migrate/#matrix-include-and-exclude). |
| `` `ci.yml` job `build`: matrix key `n` has no values and was dropped `` | An empty matrix list. | Nothing to do. |
| `` `ci.yml` job `build`: matrix key `s` is `str`, not a list, and was dropped `` | A matrix key whose value is not a list. | Add the key by hand if it mattered. |
| `` `ci.yml` job `build`: `timeout-minutes: ${{ 5 }}` is not a whole number and was dropped `` | `timeout-minutes` as an expression. | Set a number by hand. |
| `` `ci.yml` job `build`: `env.L` is not a string and was dropped `` | An `env` or `outputs` value that is a list or map. | Set a string by hand. |
| `` `ci.yml` job `build`: `defaults.shell` is not supported and was dropped `` | `defaults` other than `run.shell` and `run.working-directory`. | Nothing to do. |
| `` `ci.yml` job `build` step 1: `continue-on-error: ${{ true }}` is an expression and was dropped; hatchrun takes only true or false `` | An expression in a step's `continue-on-error`. | Set `true` or `false` by hand. |
| `` `ci.yml` job `build` step 1: `with` on a run step was dropped `` | `with` on a run step. | Nothing to do; GitHub ignores it too. |
| `` `ci.yml` job `build` step 2: `shell` is valid only on run steps and was dropped `` | `shell`, `working-directory` or `timeout-minutes` on a `uses` step. | Nothing to do. |
| `` `ci.yml` job `lint`: `runs-on: ubuntu-24.04` became `ubuntu-latest`, which runs Ubuntu 26.04 `` | A retired Ubuntu label was mapped. | Check your tools work on 26.04. |
| `` `ci.yml` job `test`: matrix key `os` values `macos-latest` name no runner template and were dropped; hatchrun runs Linux only `` | Matrix legs for macOS or Windows. | Keep those on GitHub Actions. |
| `` `ci.yml` job `c`: matrix key `os` values `ubuntu-24.04` (same runner as `ubuntu-latest`) were dropped: each runs on the same runner template as an earlier value, so its legs would repeat that value's jobs `` | Two matrix values that map to one template. | Nothing to do. |
| `` `ci.yml` job `call` calls a reusable workflow, which is not supported; the job was dropped `` | A job with `uses:` at job level. | Copy the reusable workflow's jobs in by hand. |
| `` `ci.yml` job `after` was dropped: it needs `call`, which calls a reusable workflow `` | A job needs a dropped job. | Fix the job it needs, then convert again. |

## convert errors

An error means a job, an event, an input or a file was left out.
`convert` writes the rest and exits with 1. A job that needs a dropped
job is dropped too, with a warning.

| Message | Cause | Fix |
| --- | --- | --- |
| `` `ci.yml` job `a` has `runs-on: ["self-hosted","linux"]`, which names no runner template; use one of ubuntu-latest, ubuntu-26.04, ubuntu-26.04-arm, ubuntu-26.04-4core, ubuntu-26.04-4core-arm, ubuntu-26.04-8core, ubuntu-26.04-8core-arm, ubuntu-26.04-16core, ubuntu-26.04-16core-arm `` | `runs-on` with no matching template: macOS, Windows, self-hosted labels, a list of several labels, an expression. | Set a template label in the GitHub file, or add the job by hand. |
| `` `ci.yml` job `a` has `runs-on: ${{ matrix.os }}` over legs that run on `ubuntu-latest`, `ubuntu-26.04-arm`; a job runs on one runner template `` | Matrix legs that need two templates. | Split the job by runner. See [Migrate](/docs/ci/guides/migrate/#runs-on-is-an-expression). |
| `` `ci.yml` job `b` has `runs-on: ${{ matrix.os }}`, and matrix key `os` names no runner template; use one of ubuntu-latest, ubuntu-26.04, ubuntu-26.04-arm, ubuntu-26.04-4core, ubuntu-26.04-4core-arm, ubuntu-26.04-8core, ubuntu-26.04-8core-arm, ubuntu-26.04-16core, ubuntu-26.04-16core-arm `` | No matrix value names a template. | Keep the job on GitHub Actions. |
| `` `ci.yml` job `scan` step 1 has `uses: docker://aquasec/trivy:latest`; Docker steps are not supported yet and come in a later release `` | A `docker://` step. | Use `docker run` in a `run:` step. |
| `` `ci.yml` job `c` step 1 has both `run` and `uses` `` | A broken step. | Fix the GitHub file. |
| `` `ci.yml` job `c` step `empty` has neither `run` nor `uses` `` | A step with neither. | Fix the GitHub file. |
| `` `ci.yml` job `b` needs `zzz`, which is not a job of the workflow `` | `needs` names a job that does not exist. | Fix the GitHub file. |
| `` `ci.yml` job `e` has `needs: {"a":1}`; it must be a job id or a list `` | `needs` of the wrong shape. | Fix the GitHub file. |
| `` `ci.yml` job `f` is not a map `` | A job that is not a map. | Fix the GitHub file. |
| `` `ci.yml` job `d` reads the `strategy` context, which hatchrun does not provide; the job was dropped `` | A read of `strategy` or `jobs`. | Use `matrix` values, or job outputs through `needs`. |
| `` `ci.yml` job `d` has a bad expression: unknown context 'foo' (at byte 9); the job was dropped `` | An expression that does not parse or reads an unknown context. | Fix the expression. |
| `` `ci.yml` job `d`: `environment` must be a name or a map with `name` `` | An `environment` that is neither a string nor a map with a string `name`. The job is left out. | Write `environment: NAME`. |
| `` `ci.yml` job `d`: `environment` uses an expression; hatchrun reads environment names as written `` | `environment: ${{ ... }}`. The job is left out. | Write the name out, or split the job. |
| `` `ci.yml` job `d`: `environment` `prod env`: Use letters, digits, -, _ and . in environment names `` | A name with a space or another character hatchrun does not allow, or one longer than 255 characters. The job is left out. | Rename the environment. |
| `` `ci.yml` job `d` reads `parameters`, which a converted job does not declare; the job was dropped `` | A read of `parameters` in a GitHub file. | Remove it. |
| `` `ci.yml` and `ci.yaml` both become workflow `ci`; rename one of them `` | Two files with the same name before the extension. The second is skipped. | Rename one. |
| `` `.yml` has no name before its extension; rename it `` | A file named only `.yml`. | Rename it. |
| `` `a-b.yml` job `c` becomes job `a-b-c`, which another workflow already uses; rename one of them `` | Two files make the same `FILE-JOB` name. | Rename a file or a job. |
| `` `ci.yml`: input `c` is a choice input with no `options` `` | A `choice` input without options. The input is dropped. | Add `options`. |
| `` `ci.yml`: input `x` has type `secret`, which GitHub does not define `` | An unknown input type. The input is dropped. | Fix the type. |
| `` `ci.yml`: `on` is `5`; it must be an event name, a list or a map `` | An `on:` hatchrun cannot read. | Fix the GitHub file. |
| `` `ci.yml`: `on` lists `{"a":1}`, which is not an event name `` | A list entry in `on:` that is not a name. | Fix the GitHub file. |
| `` x.yml:1:5: unclosed bracket '[' `` | The GitHub file is not valid YAML. The file is skipped. | Fix the YAML. |
| `` workflow `many` plans more than 256 jobs; the limit is 256 `` | The converted workflow would fail `validate`. | Split the workflow or cut matrices. |
| `` .github/workflows/ci.yml is 1048579 bytes; the limit is 1048576 `` | A GitHub file over 1 MiB. It is left out and the other files convert. When every file is too big, no config is written. | Shrink the file, or keep that workflow on GitHub Actions. |
| `` hatchrun: a/ci.yml and b/ci.yml have the same file name; convert them separately `` | Two files in different directories with the same name. Nothing is converted. | Convert them in separate runs. |
| `` hatchrun: read .github/workflows: No such file or directory (os error 2) `` | No files given and no `.github/workflows/` directory. | Run from the repository root, or name the files. |

