---
title: Webhook delivery problems
description: What to check when GitHub events do not reach hatchrun CI, or seem to arrive twice.
banner:
  content: "Preview: hatchrun CI is not available yet. These pages document the configuration format and the planned service."
---

:::caution[Coming later]
Event delivery needs the hosted service. This page describes the
planned behaviour.
:::

hatchrun learns about pushes and pull requests from webhooks GitHub
sends to the hatchrun GitHub App. See
[How events reach hatchrun](/docs/ci/setup/events/) for the full path.

## Events do not arrive

Work through these:

1. **The App can see the repository.** Check the App's repository
   access in the organization's settings.
2. **The latest permissions are approved.** Until an owner approves
   new permissions, GitHub keeps sending only the events the old ones
   cover.
3. **GitHub is up.** Check [githubstatus.com](https://www.githubstatus.com/)
   for webhook delays.
4. **Send a new event.** Push an empty commit:

   ```sh
   git commit --allow-empty -m "ci: trigger"
   git push
   ```

If the new event starts the workflow, the earlier one was lost or
delayed. hatchrun's reconciler looks for missed events on a timer, so
a late run may still appear.

## A run appears twice

GitHub can deliver one event more than once. hatchrun records each
event before acting on it, and a second delivery of the same event
starts nothing.

Two runs for one push usually have another cause:

- **Two workflows match.** Each workflow whose `on:` matches starts
  its own run.
- **Push and pull request both match.** A push to a branch with an
  open pull request is a `push` event and a `pull_request`
  `synchronize` event. A workflow with both triggers runs twice.
  Limit `push` to `main` with `branches: [main]`.
- **GitHub Actions still runs the old workflow.** Delete the file in
  `.github/workflows/` once hatchrun runs it.

## Schedules do not fire

Schedules come from hatchrun's scheduler. GitHub sends no webhook for
them. Check that the
config on the default branch has the `schedule`, and that the cron
time is in UTC.
