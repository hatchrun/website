---
title: Use GitHub actions in steps
description: Run actions from the GitHub Marketplace in hatchrun CI with uses, pass inputs, and read their outputs.
banner:
  content: "Preview: hatchrun CI is not available yet. These pages document the configuration format and the planned service."
---

A `uses:` step runs a GitHub action, the same as in a GitHub
workflow. Checkout, language setup, caching and most Marketplace
actions carry over unchanged.

## Prerequisites

- The action's `owner/repo@ref`, from its Marketplace page or README.

:::steps

1. ## Add a uses step

   ```yaml title=".hatchrun/config.yml"
   jobs:
     build:
       runs-on: ubuntu-latest
       steps:
         - uses: actions/checkout@v5
         - uses: actions/setup-go@v5
           with:
             go-version: '1.25'
         - run: go build ./...
   ```

   hatchrun fetches the action from GitHub at the ref you name.

2. ## Pass inputs with with

   `with` holds the action's inputs. Values can hold expressions:

   ```yaml title=".hatchrun/config.yml"
   jobs:
     upload:
       runs-on: ubuntu-latest
       steps:
         - uses: actions/upload-artifact@v4
           with:
             name: report-${{ github.sha }}
             path: reports/
             retention-days: 7
   ```

3. ## Read an action's outputs

   Give the step an `id`. Later steps read its outputs as
   `${{ steps.ID.outputs.NAME }}`:

   ```yaml title=".hatchrun/config.yml"
   jobs:
     tag:
       runs-on: ubuntu-latest
       steps:
         - uses: actions/checkout@v5
         - id: meta
           uses: docker/metadata-action@v5
           with:
             images: ghcr.io/my-org/app
         - run: echo "${{ steps.meta.outputs.tags }}"
   ```

4. ## Pin the ref

   Pin third-party actions to a full commit SHA. A tag such as `v5`
   can be moved to new code; a SHA cannot:

   ```yaml title=".hatchrun/config.yml"
   jobs:
     build:
       runs-on: ubuntu-latest
       steps:
         - uses: actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1 # v7.0.1
   ```

5. ## Validate

   ```sh
   hatchrun validate
   ```

:::

## What works

| Action type | Status |
| --- | --- |
| JavaScript actions | At launch |
| Composite actions | At launch |
| Local actions, `uses: ./path` | At launch |
| Docker container actions | A later release |
| `uses: docker://image` | A later release; an error today |

The machine provides the `github` context and the `GITHUB_*`
variables and files that actions expect, such as `GITHUB_OUTPUT` and
`GITHUB_ENV`.

## Keys a uses step takes

`uses`, `with`, `name`, `id`, `env`, `if` and `continue-on-error`.
`shell`, `working-directory` and `timeout-minutes` belong to `run:`
steps only.

## Troubleshooting

:::note[validate says `with` is valid only on uses steps]
A `run:` step has a `with:`. Move the values to `env:`.
:::

:::note[validate says uses: docker:// is not supported yet]
Run the image from a `run:` step with `docker run`. See
[Migrate: Docker steps](/docs/ci/guides/migrate/#docker-steps).
:::

## Next steps

- [Expressions and functions](/docs/ci/reference/expressions/)
- [Contexts](/docs/ci/reference/contexts/)
