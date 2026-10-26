---
title: Cache dependencies
description: Keep downloaded dependencies and build output between runs with the built-in cache step.
banner:
  content: "Preview: hatchrun CI is not available yet. These pages document the configuration format and the planned service."
---

:::caution[Coming later]
The `cache` step is part of the format and `hatchrun validate` checks
it today. The storage behind it needs the hosted service.
:::

Every job starts on a fresh machine with nothing from earlier runs.
Downloading dependencies again each time is slow. The `cache` step
restores a saved directory at the start of a job and saves it again
when the job ends.

## Prerequisites

- A job that downloads dependencies or builds files that can be
  reused, such as `node_modules`, `~/.cargo` or `target/`.
- A lockfile whose contents change when the dependencies change.

:::steps

1. ## Choose a key

   The key names one saved copy. Build it from the lockfile's hash, so
   a dependency change makes a new key:

   ```text
   npm-${{ hashFiles('package-lock.json') }}
   ```

   `hashFiles` hashes the files matching its patterns on the machine.

2. ## Add the cache step before the install

   ```yaml title=".hatchrun/config.yml"
   jobs:
     test:
       runs-on: ubuntu-latest
       steps:
         - uses: actions/checkout@v5
         - cache:
             key: npm-${{ hashFiles('package-lock.json') }}
             restore-keys: [npm-]
             paths: [~/.npm]
         - run: npm ci
         - run: npm test
   ```

   - `key` is the exact copy to restore, and the name it saves under.
   - `restore-keys` are prefixes to fall back to, in order, when no
     copy has the exact key. `npm-` picks up the newest copy from any
     earlier lockfile.
   - `paths` are the directories to save and restore.

3. ## Validate

   ```sh
   hatchrun validate
   ```

:::

Expected result: the first run finds nothing and saves the cache when
the job ends. Later runs with the same lockfile restore it before
`npm ci`.

## Examples for other tools

```yaml title=".hatchrun/config.yml"
jobs:
  rust:
    runs-on: ubuntu-26.04-4core
    steps:
      - uses: actions/checkout@v5
      - cache:
          key: cargo-${{ hashFiles('Cargo.lock') }}
          restore-keys: [cargo-]
          paths: [~/.cargo/registry, ~/.cargo/git, target]
      - run: cargo test
  python:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v5
      - cache:
          key: pip-${{ hashFiles('requirements*.txt') }}
          paths: [~/.cache/pip]
      - run: pip install -r requirements.txt
```

## cache or actions/cache

GitHub's `actions/cache` is a `uses:` step and also appears in
converted configs. The built-in `cache` step is shorter and needs no
action download. Both are planned to work; pick one per job.

## Good to know

- The `cache` step takes `key`, `restore-keys` and `paths` only. It
  has no `name`, `if` or `env`.
- Keys and paths can hold expressions, such as `${{ matrix.node }}`,
  so each matrix job keeps its own cache.

## Next steps

- [Share files between jobs with workspaces](/docs/ci/guides/workspaces/)
- [Configuration reference: cache](/docs/ci/reference/configuration/#cache)
