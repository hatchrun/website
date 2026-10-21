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
region name. Both are set per organization or per repository.

## Set a secret or a variable

In [app.hatchrun.io](https://app.hatchrun.io), add each secret or
variable to the organization, so every repository gets it, or to one
repository. Give it a name and a value. Names are what steps use to
read it.

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
- A job gets the secrets of its repository and organization when it
  starts, and nothing else.
- The agent masks every secret value in every log line before the log
  leaves the machine.
- Pull requests from forks do not run at all, so code from a fork
  never sees a secret.
- The machine has no cloud credentials, and every token a job holds
  expires with the job.

Masking replaces the exact value. A step that changes the value, for
example by encoding it, can still print it. Do not print secrets.

## Next steps

- [Contexts](/docs/ci/reference/contexts/)
- [Organization settings](/docs/ci/setup/settings/)
