---
title: Schedule a nightly workflow
description: Run a workflow on a cron schedule, and keep scheduled jobs apart from push jobs.
banner:
  content: "Preview: hatchrun CI is not available yet. These pages document the configuration format and the planned service."
---

Some jobs run on a clock: a nightly dependency audit, a weekly full
test suite, a daily cache warm-up. This guide adds a schedule to a
config.

## Prerequisites

- A job to run on the schedule. This guide uses `audit`.

:::steps

1. ## Write the cron expression

   A cron expression has five fields, in UTC:

   | Field | Values |
   | --- | --- |
   | minute | 0 to 59 |
   | hour | 0 to 23 |
   | day of month | 1 to 31 |
   | month | 1 to 12 |
   | day of week | 0 to 6, Sunday is 0 |

   `30 2 * * *` is 02:30 UTC every day. `0 6 * * 1` is 06:00 UTC every
   Monday.

2. ## Add a scheduled workflow

   ```yaml title=".hatchrun/config.yml"
   jobs:
     audit:
       runs-on: ubuntu-latest
       steps:
         - uses: actions/checkout@v5
         - run: npm audit --audit-level=high

   workflows:
     nightly:
       on:
         schedule:
           - cron: '30 2 * * *'
       jobs:
         - audit
   ```

   Quote the expression. YAML reads an unquoted value that starts with
   `*` as an alias, and fails.

3. ## Add more schedules if needed

   `schedule` is a list, so one workflow can have several:

   ```yaml title=".hatchrun/config.yml"
   jobs:
     full-test:
       runs-on: ubuntu-26.04-8core
       steps:
         - run: make test-all

   workflows:
     weekly:
       on:
         schedule:
           - cron: '0 6 * * 1'
           - cron: '0 6 * * 4'
       jobs:
         - full-test
   ```

4. ## Commit to the default branch

   Validate, then merge the change into the default branch:

   ```sh
   hatchrun validate
   ```

   hatchrun reads schedules only from the config on the default
   branch.

:::

Expected result: after the merge, the workflow runs at the next due
time on the default branch's latest commit, and its check runs appear
on that commit.

:::caution[Coming later]
The scheduler needs the hosted service.
:::

## Good to know

- `hatchrun validate` does not check cron expressions. Check the five
  fields by eye.
- Scheduled runs see the default branch. A `branches: [main]` filter
  on an entry passes when `main` is the default branch.
- A workflow can have `schedule` and other events together. Keep
  long scheduled jobs in their own workflow so pushes do not run them.

## Troubleshooting

:::note[The schedule never runs]
Check that the config with the schedule is on the default branch, and
that the cron has five fields. Times are UTC.
:::

## Next steps

- [Cache dependencies](/docs/ci/guides/cache/)
- [Triggers: schedule](/docs/ci/reference/triggers/#schedule)
