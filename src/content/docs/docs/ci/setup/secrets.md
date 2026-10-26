---
title: Secrets and variables
description: Where hatchrun CI secrets and variables are set, how steps read them, and how they are protected.
banner:
  content: "Preview: hatchrun CI is not available yet. These pages document the configuration format and the planned service."
---

:::caution[Coming later]
Secrets and variables are set in the hatchrun app, which is not built
yet. The `secrets` and `vars` contexts are part of the format today.
:::

Secrets hold values a job needs but nobody should read, such as a
deploy token. Variables hold values that are not secret, such as a
region name. Both are set per organization, per repository or per
[environment](/docs/ci/setup/environments/).

## Set a secret or a variable

In [app.hatchrun.io](https://app.hatchrun.io), add each secret or
variable to the organization, to one repository, or to one environment
of a repository. Give it a name and a value. Names are what steps use to
read it.

## Which repositories an organization value reaches

An organization secret or variable has a repository access setting:

- **All repositories**, the default. Every repository of the
  organization gets it.
- **Selected repositories**. Only the repositories you pick get it.

A selection must hold at least one repository, because an empty list
would reach none. The app will not save one. A repository that moves to
another organization leaves the old organization's selections.

## Which value wins

When the same name is set at more than one level, the most specific
value is used:

1. the environment, for a job with `environment`;
2. the repository;
3. the organization, when its repository access includes the
   repository.

An organization value limited to other repositories is not visible to
the job at all. It reads as an empty string like any secret that is not
set.

## Read them in a step

Steps read secrets from the `secrets` context and variables from the
`vars` context. Pass a secret to a step through `env` or `with`:

```yaml title=".hatchrun/config.yml"
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v5
      - run: ./deploy.sh --region "$REGION"
        env:
          DEPLOY_TOKEN: ${{ secrets.DEPLOY_TOKEN }}
          REGION: ${{ vars.AWS_REGION }}
```

A secret that is not set reads as an empty string.

## How they are protected

- hatchrun stores values encrypted, with a key only the control plane
  holds.
- A job gets the secrets of its environment, its repository and the
  organization values that reach its repository when it starts, and
  nothing else.
- An environment can limit which branches use it and can wait for an
  admin to approve each job, so a feature branch cannot read production
  keys. See [Environments](/docs/ci/setup/environments/).
- The agent masks every secret value in every log line before the log
  leaves the machine.
- Pull requests from forks do not run at all, so code from a fork
  never sees a secret.
- The machine has no cloud credentials, and every token a job holds
  expires with the job.

Masking replaces the exact value. A step that changes the value, for
example by encoding it, can still print it. Do not print secrets.

## Next steps

- [Environments](/docs/ci/setup/environments/)
- [Contexts](/docs/ci/reference/contexts/)
- [Organization settings](/docs/ci/setup/settings/)
