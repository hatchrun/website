---
title: Organization settings
description: The settings hatchrun CI has for an organization and its repositories.
banner:
  content: "Preview: hatchrun CI is not available yet. These pages document the configuration format and the planned service."
---

hatchrun CI keeps almost everything in `.hatchrun/config.yml`, so a
change to how CI runs goes through a commit and a review. Few settings
live outside the file.

## In the config file

| What | Where |
| --- | --- |
| Which workflows run, and on what | `workflows.NAME.on` |
| Job order and approvals | `workflows.NAME.jobs` |
| Machine size | `runs-on` or `executors` |
| Timeouts | `timeout-minutes` on jobs and run steps |
| Environment variables | `env` on jobs and steps |

See the [configuration reference](/docs/ci/reference/configuration/).

## In the hatchrun app

:::caution[Coming later]
The hatchrun app's CI settings are not built yet.
:::

| Setting | Scope | What it does |
| --- | --- | --- |
| Secrets | Organization, repository | Values read as `${{ secrets.NAME }}`. See [Secrets and variables](/docs/ci/setup/secrets/) |
| Variables | Organization, repository | Values read as `${{ vars.NAME }}` |

## On GitHub

| Setting | Where | What it does |
| --- | --- | --- |
| Repository access | Organization settings, GitHub Apps, hatchrun | Which repositories hatchrun sees. See [Install the GitHub App](/docs/ci/setup/github-app/) |
| Required checks | Repository rules or branch protection | Which hatchrun check runs must pass before a merge |

## What you cannot change

- Runner templates. You pick from the
  [published set](/docs/ci/reference/runners/) and cannot define your
  own.
- Pull requests from forks never run.
- [Limits](/docs/ci/reference/limits/) on config size and planning are
  the same for everyone.
