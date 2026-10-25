---
title: Environments
description: Limit which branches may deploy, ask an organization admin to approve each job, and keep secrets for one deploy target.
banner:
  content: "Preview: hatchrun CI is not available yet. These pages document the configuration format and the planned service."
---

:::caution[Coming later]
Environments are set in the hatchrun app, which is not built yet. The
`environment` key on a job is part of the format today.
:::

An environment is a named deploy target of one repository, such as
`production` or `staging`. It can:

- allow only some branches to use it;
- hold each job until an organization admin approves it;
- carry its own secrets and variables.

A job opts in with `environment` and nothing else changes for jobs
that leave it out.

## Create an environment

In [app.hatchrun.io](https://app.hatchrun.io), open the repository's
settings and add an environment under Environments. You set:

| Setting | What it does |
| --- | --- |
| Name | What a job writes in `environment` |
| Branches | Patterns of branches allowed to use it. Empty allows any branch |
| Require approval | An organization admin approves each job attempt before it starts |
| Secrets and variables | Values only jobs in this environment get |

A name is 1 to 255 letters, digits, `-`, `_` or `.`, and cannot be only
dots. Names are unique per repository, ignoring case. Deleting an
environment deletes its secrets and variables, and jobs that use it
fail.

## Use an environment in a job

Set `environment` on a job to a name:

```yaml title=".hatchrun/config.yml"
jobs:
  deploy:
    runs-on: ubuntu-latest
    environment: production
    steps:
      - uses: actions/checkout@v5
      - run: ./deploy.sh
        env:
          DEPLOY_TOKEN: ${{ secrets.DEPLOY_TOKEN }}
```

Or to a map with a `name`, as GitHub Actions allows:

```yaml title=".hatchrun/config.yml"
jobs:
  deploy:
    runs-on: ubuntu-latest
    environment:
      name: production
    steps:
      - run: ./deploy.sh
```

The name is read as written. Only `${{ parameters.NAME }}` is filled in,
and any other expression is an error. GitHub's
`environment.url` has no effect, and `hatchrun convert` drops it with a
warning.

## Which branches may use it

Branches takes one pattern per line. Patterns are the same globs as
[branch filters](/docs/ci/reference/triggers/), and a leading `!`
removes matches. You can set up to 50 patterns of at most 255 bytes
each.

- An empty list allows any ref.
- A non-empty list allows only runs on a branch whose name matches. A
  push, a manual run or a scheduled run on that branch qualifies.
- Pull request runs never match a non-empty list, and neither do tag
  runs. A pull request job that names an environment with branch patterns fails.

A job whose run is refused fails, and its check run says why:

```text
Environment `production` allows only branches main, release/*; this run is on refs/heads/feature.
```

## Approval

With Require approval on, a job that names the environment stops before
it starts. Its check run says:

```text
Waiting for approval to use environment `production`. An admin of acme can approve or reject it at https://app.hatchrun.io/ci/acme/app/runs/1234.
```

An admin of the organization opens the run page and chooses Approve or
Reject.

- **Approve** lets the job go on. It then waits for a card, the spend
  cap and the concurrent job limit like any other job. See
  [Billing](/docs/ci/setup/billing/).
- **Reject** fails the job. The check run says `Rejected by LOGIN`,
  with the login of the admin who decided.
- Approval is per job attempt. A retry of the job asks again.
- A job waiting for approval does not count toward the 5 concurrent
  jobs and blocks no other job.
- Turning approval off, or deleting the environment, releases the jobs
  waiting on it.
- Only organization admins can decide. A second Approve on a job that
  was already decided is refused.

For a hold between jobs of one workflow that is not tied to an
environment, use [`type: approval`](/docs/ci/guides/requires-approvals/).

## When the environment is missing

A job that names an environment the repository does not have fails
before it starts:

```text
Environment `prod` does not exist in acme/app. Create it at https://app.hatchrun.io/ci/acme/app/settings.
```

The check happens when the job launches and again when a runner is
claimed, so a change made while the job waits still applies. If someone
deletes the environment in between, the job fails with:

```text
Environment `production` was deleted before the job started.
```

## Secrets and variables

An environment's secrets and variables are read like any others, as
`${{ secrets.NAME }}` and `${{ vars.NAME }}`. When the same name is set
at more than one level, the most specific one wins:

1. the environment;
2. the repository;
3. the organization.

A job without `environment` never sees an environment's values. See
[Secrets and variables](/docs/ci/setup/secrets/).

## Next steps

- [Secrets and variables](/docs/ci/setup/secrets/)
- [Billing](/docs/ci/setup/billing/)
- [A job did not start](/docs/ci/troubleshooting/job-did-not-start/)
