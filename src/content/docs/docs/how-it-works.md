---
title: How it works
description: The path of a job from the queue to a terminated instance.
---

This page describes the hosted service. The self-hosted scaler takes
jobs a different way, described in [Self-hosting](/docs/self-hosting/).

```text
 GitHub                 hatchrun.io                     your AWS account
 ------                 -----------                     ----------------
 workflow_job  ──────►  Worker ── D1 (jobs)
 webhook                  │
                          │ OIDC token, sub tenant:<id>
                          ├───────────────────────────►  STS: assume the
                          │                              hatchrun role
                          │ RunInstances, ticket in
                          │ user data
                          ├───────────────────────────►  runner instance
                          │                                 │
                        broker  ◄──── claim config once ────┤
                                                            │
 Actions  ◄──────────────── runner takes one job ───────────┘
                                                         power off,
                                                         terminate
```

## From queued job to running runner

1. A workflow job asks for a runner with `runs-on: hatchrun` or
   `runs-on: hatchrun/<options>`. See [Choosing a runner](/docs/runs-on/).
2. The hatchrun GitHub App, installed on your organization, sends a
   `workflow_job` webhook to the hatchrun.io Worker, which runs on
   Cloudflare. The Worker checks the webhook's signature and skips jobs
   that do not ask for a hatchrun runner.
3. The Worker records the job in D1, keyed by GitHub's job id. GitHub
   can deliver a webhook more than once; the second delivery finds the
   row and launches nothing.
4. The Worker gets credentials for your account (below), creates a
   just-in-time (JIT) runner config for the job and launches an
   instance from the launch template your connect stack created.
5. The instance gets a single-use ticket in its user data, not the
   config itself. The config waits in the broker until the agent claims
   it.
6. At boot, `hatchrun-agent` claims the config, starts the GitHub runner
   as the `runner` user and lets it take exactly one job.
7. When the runner exits, the agent exits and the instance powers off.
   The launch template makes power-off terminate the instance.

The Worker records jobs from webhooks today. Launching instances from
the Worker is being built for the [beta](/docs/beta/).

## Getting into your account

You connect an AWS account and region with a CloudFormation stack. It
creates an IAM role, a launch template, a security group and, if you do
not pick one, a VPC. The role trusts the OIDC issuer at
`oidc.hatchrun.io`, and only for tokens whose subject is
`tenant:<your tenant id>`.

For each use, the Worker signs a short-lived token for your tenant and
trades it with AWS STS for one-hour credentials
(`AssumeRoleWithWebIdentity`). No access keys exist for the role, and a
token for another tenant gets nothing. [Security](/docs/security/) lists
what the role can and cannot do.

## Handing over the runner config

A JIT config lets whoever holds it register a runner, so it never sits
in user data, where anyone on the instance could read it later.

The broker stores each config under a random ticket for up to an hour.
The first claim gets the config and deletes it; every later claim, or a
claim after it expired, gets nothing. Runners have no instance profile,
so the ticket is the only thing an instance holds, and it is useless
once claimed.

The agent passes the config to the runner in an environment variable,
not on the command line, so other processes cannot read it and job steps
never see it.

## When things go wrong

- An instance that gets no config within 10 minutes powers off.
- An instance launched without hatchrun user data, by hand or by a
  security scanner, boots normally: the agent does not start, so it does
  not power the machine off.
- A job whose `runs-on` has other labels next to a hatchrun label is
  skipped and waits in GitHub's queue. See
  [Choosing a runner](/docs/runs-on/) for why.
