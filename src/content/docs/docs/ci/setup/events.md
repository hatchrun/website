---
title: How events reach hatchrun
description: The GitHub webhooks that start hatchrun CI workflows, schedules, manual runs, and what happens when a delivery fails or repeats.
banner:
  content: "Preview: hatchrun CI is not available yet. These pages document the configuration format and the planned service."
---

:::caution[Coming later]
This page describes the planned hosted service. The matching rules in
[Which workflows start](#which-workflows-start) are in the format and
work today in `hatchrun validate` and the planner.
:::

A workflow starts when an event matches its `on:` block. Two of the
four events come from GitHub webhooks. Schedules come from hatchrun's
own clock, and manual runs from the hatchrun app.

| `on:` key | Where the event comes from |
| --- | --- |
| `push` | GitHub `push` webhook |
| `pull_request` | GitHub `pull_request` webhook |
| `schedule` | hatchrun's scheduler, on the default branch |
| `workflow_dispatch` | The hatchrun app, when someone starts a run |

## push

GitHub sends a `push` webhook when someone pushes commits, a new
branch or a tag. hatchrun reads three things from it:

- the ref, such as `refs/heads/main` or `refs/tags/v1.2.0`;
- the commit at the tip of the push, where it reads the config;
- the changed files, for `paths` and `paths-ignore` filters.

A tag push never checks path filters.

## pull_request

GitHub sends a `pull_request` webhook for each activity on a pull
request. The `action` field says which one, such as `opened`,
`synchronize` (new commits pushed), `reopened` or `closed`.

A workflow with `pull_request: {}` starts on `opened`, `synchronize`
and `reopened`. List `types:` to choose others. Branch filters match
the base branch, the one the pull request merges into.

Pull requests from forks do not start workflows. A fork could
otherwise change the config and run code with your secrets.

## schedule

GitHub has no webhook for schedules. hatchrun reads the
`on.schedule` entries from the config on each repository's default
branch and starts the workflow when a cron expression comes due.
Times are in UTC.

A schedule in a config on any other branch does nothing. A scheduled
run's branch and tag filters see the default branch.

## Manual runs

`on.workflow_dispatch` lets people start a workflow by hand, with the
inputs it declares.

GitHub's own `workflow_dispatch` event only starts GitHub Actions
workflows, so hatchrun CI cannot use it. Manual runs will start from
the hatchrun app instead.

The config key keeps GitHub's name so converted workflows keep their
inputs. Until the app ships, `workflow_dispatch` only declares inputs.

## Which workflows start

For each event, hatchrun checks every workflow in the config at that
commit:

1. The event type must be a key of `on:`.
2. For a push, the branch or tag must pass the branch or tag filters.
3. For a pull request, the action must be in `types` and the base
   branch must pass the branch filters.
4. Path filters must pass. See
   [Path filters](/docs/ci/reference/triggers/#path-filters).

Every workflow that matches starts its own workflow run. The full
rules are in [Triggers and filter patterns](/docs/ci/reference/triggers/).

## Delivery and retries

GitHub signs every webhook with the App's secret. hatchrun checks the
signature and drops any delivery that fails it.

GitHub does not retry a failed delivery on its own. hatchrun runs a
reconciler on a timer that looks for events it missed and work that
stalled, the same pattern hatchrun.io runners use today.

GitHub can deliver one event twice. hatchrun records the delivery ID
GitHub sends in the `X-GitHub-Delivery` header before it acts. A second
delivery with the same ID, such as a redelivery, finds the record and
starts nothing. Two events with different IDs both run, even when their
payloads look alike.

## Next steps

- [Check runs and statuses](/docs/ci/setup/check-runs/)
- [Webhook delivery problems](/docs/ci/troubleshooting/webhooks/)
