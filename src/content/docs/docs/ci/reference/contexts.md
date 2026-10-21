---
title: Contexts
description: The contexts hatchrun CI expressions can read, what each holds, and where each comes from.
banner:
  content: "Preview: hatchrun CI is not available yet. These pages document the configuration format and the planned service."
---

A context is a named object that expressions read, such as
`github.sha` or `matrix.node`. hatchrun CI has eleven. Context names
ignore case.

| Context | Holds | Filled in |
| --- | --- | --- |
| [`github`](#github) | The event and the run | At run time |
| [`env`](#env) | Environment variables from `env` | At run time |
| [`vars`](#vars-and-secrets) | Organization and repository variables | At run time |
| [`secrets`](#vars-and-secrets) | Organization and repository secrets | At run time |
| [`inputs`](#inputs) | Inputs of a manual run | At run time |
| [`matrix`](#matrix) | This job's matrix values | At run time |
| [`needs`](#needs) | Outputs of jobs this job requires | At run time |
| [`steps`](#steps) | Outputs of earlier steps | At run time |
| [`runner`](#runner-and-job) | The machine | At run time |
| [`job`](#runner-and-job) | The current job | At run time |
| [`parameters`](#parameters) | Job and command parameters | When the run is planned |

Any other name is an error in `validate`. GitHub's `strategy` and
`jobs` contexts do not exist in hatchrun CI.

:::caution[Coming later]
Run-time contexts are filled in by the agent on the machine, which is
not shipped yet. Their names and shape follow GitHub's.
:::

## github

The event and the run, following GitHub's `github` context:
`github.sha`, `github.ref`, `github.ref_name`, `github.event_name`,
`github.repository`, `github.actor`, and the whole webhook payload as
`github.event`.

```yaml title=".hatchrun/config.yml"
jobs:
  info:
    runs-on: ubuntu-latest
    steps:
      - run: echo "${{ github.event_name }} on ${{ github.ref }} at ${{ github.sha }}"
```

## env

Environment variables set by the job's and the step's `env`.

## vars and secrets

Variables and secrets set in the hatchrun app, for the organization or
the repository. See [Secrets and variables](/docs/ci/setup/secrets/).
A name that is not set reads as an empty string.

```yaml title=".hatchrun/config.yml"
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - run: ./deploy.sh
        env:
          TOKEN: ${{ secrets.DEPLOY_TOKEN }}
          REGION: ${{ vars.REGION }}
```

## inputs

The inputs of a manual run, as declared in
`on.workflow_dispatch.inputs`. Empty for every other event.

## matrix

The values of this job's [matrix](/docs/ci/reference/configuration/#matrix)
combination, one property per key.

## needs

`needs.ID.outputs.NAME` reads the `outputs` of a job this job
requires. `ID` is the required entry's id.

## steps

`steps.ID.outputs.NAME` reads the outputs of an earlier step in the
same job that has `id: ID`.

## runner and job

Information about the machine and the current job, following GitHub's
`runner` and `job` contexts.

## parameters

`${{ parameters.NAME }}` reads a job or command parameter. hatchrun
replaces it when it plans the run, so only a whole
`${{ parameters.NAME }}` works. See
[Reading parameters](/docs/ci/reference/configuration/#reading-parameters).
