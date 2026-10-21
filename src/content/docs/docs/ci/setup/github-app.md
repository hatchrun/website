---
title: Install the GitHub App
description: Install the hatchrun GitHub App for CI, choose repositories, and what each permission is for.
banner:
  content: "Preview: hatchrun CI is not available yet. These pages document the configuration format and the planned service."
---

:::caution[Coming later]
hatchrun CI uses the same GitHub App as hatchrun.io runners. The extra
permissions CI needs are not requested yet. This page describes the
planned setup.
:::

hatchrun CI learns about pushes and pull requests through the hatchrun
GitHub App. The App also lets hatchrun read your config and report
check runs. Install it once per organization or user account.

## Prerequisites

- Owner rights on the GitHub organization, or your own user account.
- A repository with `.hatchrun/config.yml`. See the
  [Quickstart](/docs/ci/get-started/quickstart/).

## Install the App

:::steps

1. ## Sign in to the hatchrun app

   Open [app.hatchrun.io](https://app.hatchrun.io) and sign in with
   GitHub. hatchrun asks GitHub who you are and which organizations
   you belong to.

2. ## Start the install

   Choose to install the GitHub App. GitHub opens its install page and
   asks which account to install on. Pick the organization that owns
   the repository.

3. ## Choose repositories

   GitHub offers two choices:

   - **All repositories.** The App sees every current and future
     repository of the organization.
   - **Only select repositories.** The App sees only the ones you pick.

   hatchrun only acts on repositories it can see. Pick the ones that
   have, or will have, a `.hatchrun/config.yml`.

4. ## Review the permissions

   GitHub lists the permissions the App asks for. See
   [Permissions](#permissions) below for why each one is needed.
   Choose Install.

5. ## Return to hatchrun

   GitHub sends you back to the hatchrun app. The organization and the
   repositories you picked appear there.

:::

Expected result: the App appears under the organization's Settings,
GitHub Apps, Installed GitHub Apps. The next push to a repository
with a `.hatchrun/config.yml` starts its workflows.

## Permissions

The App already holds the permissions hatchrun.io runners use. CI adds
these:

| Permission | Access | What hatchrun does with it |
| --- | --- | --- |
| Contents | Read | Reads `.hatchrun/config.yml` at the event's commit, and lets jobs check out the code |
| Checks | Read and write | Creates a check run per job and updates it as steps finish |
| Pull requests | Read | Reads the pull request of a `pull_request` event, such as its base branch and changed files |
| Metadata | Read | Required by GitHub for every App |

GitHub also lets a workflow ask for a job token with more access
through `permissions:`. The App will hold the permissions such tokens
may ask for.

The `.hatchrun/config.yml` format has no `permissions:` key yet, and
`hatchrun convert` drops it with a warning.

## What happens on install

GitHub sends hatchrun an `installation` event with the account and the
repositories you chose. hatchrun records them. It runs nothing on
install. Workflows start on the next matching event.

## Change which repositories the App sees

1. On GitHub, open the organization's Settings, then GitHub Apps.
2. Choose Configure next to hatchrun.
3. Under Repository access, add or remove repositories, then save.

GitHub sends an `installation_repositories` event. A repository you
remove stops starting workflows at once.

## Approve new permissions

When the App asks for more permissions, GitHub emails the
organization's owners and shows a banner on the App's settings page.

Until an owner approves, the App keeps its old permissions. CI events
do not reach hatchrun until the CI permissions are approved.

## Uninstall the App

1. Open the organization's Settings, then GitHub Apps.
2. Choose Configure next to hatchrun.
3. Under Danger zone, choose Uninstall.

Uninstalling stops both hatchrun CI and hatchrun.io runners for the
whole organization. To stop CI for one repository only, remove the
repository from the App, or delete its `.hatchrun/config.yml`.

## Troubleshooting

:::note[The App is installed but nothing runs]
Check that the repository is in the App's repository list, that an
owner approved the latest permissions, and that the file is at
`.hatchrun/config.yml`. Then follow
[My workflow did not run](/docs/ci/troubleshooting/workflow-did-not-run/).
:::

## Next steps

- [How events reach hatchrun](/docs/ci/setup/events/)
- [Check runs and statuses](/docs/ci/setup/check-runs/)
