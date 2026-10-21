---
title: convert warnings and errors
description: What hatchrun convert's warnings and errors mean, how to tell them apart, and what to do about each kind.
banner:
  content: "Preview: hatchrun CI is not available yet. These pages document the configuration format and the planned service."
---

`hatchrun convert` prints warnings first, then errors, on standard
error. This page sorts them by what you need to do. Every message is
in [Error and warning messages](/docs/ci/reference/messages/#convert-warnings).

## Warning or error

| | Warning | Error |
| --- | --- | --- |
| What it means | A key was dropped or changed | A job, event, input or file was left out |
| Exit code | 0 if there are no errors | 1 |
| The config | Has the job, without that key | Lacks the job; has everything else |
| Typical words | "was dropped", "became" | "names no runner template", "has neither", "the job was dropped" |

A job that needs a dropped job is dropped too, with a warning that
ends in "which did not convert" or "which calls a reusable workflow".
Fix the first job and the others come back.

## Safe to ignore

These change nothing a job does:

- unknown keys, `` unknown key `foo` was dropped ``;
- `permissions` and `run-name`;
- `strategy.fail-fast` and `strategy.max-parallel`;
- `with` on a run step, and `shell` or `working-directory` on a uses
  step, which GitHub ignores too;
- a matrix value that runs on the same template as an earlier one.

## Needs a decision

- **`concurrency`.** hatchrun will not cancel older runs of a branch.
  Fine for most repositories.
- **`environment`.** Its protection rules and secrets are gone. Move
  the secrets to [hatchrun secrets](/docs/ci/setup/secrets/) and add an
  [approval](/docs/ci/guides/requires-approvals/) for the review.
- **A retired Ubuntu label became `ubuntu-latest`.** The job now runs
  on Ubuntu 26.04. Run it once and check the tools.
- **macOS or Windows matrix legs were dropped.** Keep a GitHub workflow
  for them.
- **An event other than push, pull_request, schedule or
  workflow_dispatch.** Keep that workflow on GitHub Actions.

## Needs a fix

- **`services` or `container`.** Start the containers with `docker run`
  in a step. See [Migrate: services](/docs/ci/guides/migrate/#services).
- **Matrix `include` or `exclude`.** Rebuild with extra workflow
  entries. See [Migrate: matrix](/docs/ci/guides/migrate/#matrix-include-and-exclude).
- **`timeout-minutes` or `continue-on-error` as an expression.** Set a
  value by hand.
- **A reusable workflow call.** Copy its jobs in. See
  [Migrate: reusable workflows](/docs/ci/guides/migrate/#reusable-workflows).

## Errors

| Error | Fix |
| --- | --- |
| `runs-on` names no runner template | Use a template label, or keep the job on GitHub |
| `runs-on: ${{ matrix.KEY }}` over two templates | Split the job by runner |
| `uses: docker://...` | Use `docker run` in a `run:` step |
| `strategy` or `jobs` context | Use `matrix` and `needs` |
| A bad expression | Fix it in the GitHub file |
| Two files become one workflow | Rename one file |
| A file that is not valid YAML | Fix the YAML; the file is skipped |

## When nothing is written

`convert` writes no config when nothing converted at all, when a file
cannot be read or is over 1 MiB, or when there is no `.github/workflows/` and you named
no files. The messages say which.
