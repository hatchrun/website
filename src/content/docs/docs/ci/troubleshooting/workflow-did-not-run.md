---
title: My workflow did not run
description: A checklist for a push or pull request that started no hatchrun CI workflow.
banner:
  content: "Preview: hatchrun CI is not available yet. These pages document the configuration format and the planned service."
---

You pushed, or opened a pull request, and no hatchrun check runs
appeared. Work through this list in order. Each item says how to check
it and how to fix it.

:::caution[Coming later]
Items 1 and 8 depend on the hosted service. The others you can check
today with the config and `hatchrun validate`.
:::

## 1. The App sees the repository

The hatchrun GitHub App must be installed on the organization, with
access to this repository, and an owner must have approved its latest
permissions.

Check on GitHub under the organization's Settings, GitHub Apps,
hatchrun, Configure. See
[Install the GitHub App](/docs/ci/setup/github-app/).

## 2. The file is at the right path

hatchrun reads only `.hatchrun/config.yml` at the commit of the event.
`.hatchrun/config.yaml`, `hatchrun.yml` or a file on another branch
does nothing.

```sh
git show HEAD:.hatchrun/config.yml | head
```

For a pull request, the file must be in the pull request's head
commit.

## 3. The file is valid

```sh
hatchrun validate
```

A problem in a workflow stops that workflow. A problem that belongs to
the whole file, such as an executor with an unknown label, stops every
workflow.

Fix every line `validate` prints. See [Fix validate
errors](/docs/ci/troubleshooting/validate-errors/).

## 4. The file is under 1 MiB

A config over 1,048,576 bytes is refused. `hatchrun validate` says
`` hatchrun: .hatchrun/config.yml is 1048579 bytes; the limit is 1048576 ``.
Check the size:

```sh
wc -c .hatchrun/config.yml
```

## 5. on: lists the event

The workflow's `on:` must have a key for the event: `push` for a push,
`pull_request` for a pull request. A workflow with only `schedule`
never starts on a push.

## 6. The filters let the event through

- **Branch filters.** For a push, the pushed branch must pass
  `branches` or `branches-ignore`. For a pull request, the base
  branch must pass, not the head branch.
- **Tag filters.** A push trigger with only `tags` never starts on a
  branch push. One with only `branches` never starts on a tag push.
- **Pull request types.** With no `types`, only `opened`,
  `synchronize` and `reopened` start a workflow. Labelling or editing
  a pull request does not.
- **Patterns.** The last matching pattern decides. A name no pattern
  matches does not pass. `release/*` does not match `release/1.0/x`;
  use `release/**`.

See [Triggers and filter patterns](/docs/ci/reference/triggers/).

## 7. Path filters see the changed file

- Only the first 300 changed files are checked. In a large pull
  request, the file that matters may be past them.
- With `paths-ignore`, a change that touches only ignored files does
  not start the workflow.
- Tag pushes skip path filters.

## 8. The pull request is not from a fork

Pull requests from forks never start workflows. Push the branch to the
repository itself, or ask a maintainer to.

## 9. The jobs are not all filtered out

The workflow can start and still plan no jobs. `branches` and `tags`
on workflow entries drop jobs whose ref does not match, and every
entry that requires a dropped one is dropped too.

A workflow whose every entry is dropped shows no check runs.

## 10. Schedules come from the default branch

A `schedule` runs only from the config on the default branch. A
schedule added on a feature branch does nothing until it is merged.

## Still nothing

Push an empty commit to send a new event:

```sh
git commit --allow-empty -m "ci: trigger"
git push
```

If that starts the workflow, the first event was probably lost. See
[Webhook delivery problems](/docs/ci/troubleshooting/webhooks/).
