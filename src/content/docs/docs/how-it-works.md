---
title: How it works
description: The path of a job from the queue to a terminated instance.
---

## From queued job to running runner

1. A workflow job asks for a label that belongs to a hatchrun scale set.
2. GitHub tells the scaler through the runner scale set API, the same
   API that Actions Runner Controller uses. The scaler keeps one open
   session per scale set and gets the job within a second or two.
3. The scaler creates a just-in-time (JIT) runner config for the job and
   launches an instance from your launch template.
4. The instance gets a single-use ticket in its user data, not the
   config itself. The config waits in the handoff (below) until the
   agent claims it.
5. At boot, `hatchrun-agent` claims the config, starts the GitHub runner
   as the `runner` user and lets it take exactly one job.
6. When the runner exits, the agent exits and the instance powers off.
   The launch template makes power-off terminate the instance.

## Handing over the runner config

A JIT config lets whoever holds it register a runner, so it never sits
in user data, where anyone on the instance could read it later.

- **Broker**: a small service that stores each config under a random
  ticket for up to an hour. The first claim gets the config and deletes
  it; every later claim, or a claim after it expired, gets nothing.
- **SSM parameter**: on AWS the config can also wait in a Parameter
  Store parameter named by an instance tag. The agent reads and deletes
  it with the instance role.

The agent passes the config to the runner in an environment variable,
not on the command line, so other processes cannot read it and job steps
never see it.

## When things go wrong

- An instance that gets no config within 10 minutes powers off.
- An instance launched without hatchrun user data, by hand or by a
  security scanner, boots normally: the agent does not start, so it does
  not power the machine off.
- The scaler keeps no database. After a restart it rebuilds its view
  from GitHub's runner list and the tags on your instances, and takes
  over the instances that are still running jobs.
