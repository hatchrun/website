---
title: Getting started
description: Install the GitHub App, add a config and run the first job on hatchrun CI.
---

Set up hatchrun for one GitHub organization and run a first job. Setup
starts in [app.hatchrun.io](https://app.hatchrun.io), and the app sends
you to GitHub for the steps that happen there.

Jobs are billed per second, with a 60-second minimum per job, and there
are no free minutes. Jobs wait until the organization has a card on
file. See [Billing](/docs/ci/setup/billing/).

## Before you start

You need:

- owner rights on the GitHub organization, or your own user account;
- a repository you can push to;
- a card, added in the app.

:::steps

1. ## Install the GitHub App

   Sign in to [app.hatchrun.io](https://app.hatchrun.io) with GitHub and
   install the hatchrun GitHub App on your organization. GitHub shows
   the permissions the App asks for and lets you pick the repositories
   it sees. See [Install the GitHub App](/docs/ci/setup/github-app/).

1. ## Add a card

   Under Billing on the organization's CI page, choose Add a card. Jobs
   do not start until a card is on file. You can also set the monthly
   spend cap there.

1. ## Add a config

   Create `.hatchrun/config.yml` in the repository:

   ```yaml title=".hatchrun/config.yml"
   jobs:
     test:
       runs-on: ubuntu-latest
       steps:
         - uses: actions/checkout@v5
         - run: make test

   workflows:
     ci:
       on:
         push:
           branches: [main]
         pull_request: {}
       jobs:
         - test
   ```

   Replace `make test` with your own command. If the repository has
   GitHub Actions workflows, `hatchrun convert` writes a first config
   from them. Check any config with `hatchrun validate`. The
   [Quickstart](/docs/ci/get-started/quickstart/) covers installing the
   CLI.

1. ## Push and watch the check run

   Push the commit to `main`, or open a pull request. A check run named
   after the job, here `test`, appears as queued, then in progress, then
   passes. Open it to read the live logs in the app.

   If nothing appears, work through
   [My workflow did not run](/docs/ci/troubleshooting/workflow-did-not-run/).

:::

## Next steps

- [Secrets and variables](/docs/ci/setup/secrets/) and
  [Environments](/docs/ci/setup/environments/) hold what jobs need at
  run time.
- [Choose a runner size](/docs/ci/guides/runner-size/) moves a slow job
  to a bigger machine.
- [Migrate from GitHub Actions](/docs/ci/guides/migrate/) moves the
  workflows you have, one at a time.
