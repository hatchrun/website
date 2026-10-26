---
title: Quickstart
description: Install the hatchrun CLI, write and validate a config, and run it on hatchrun CI.
banner:
  content: "Preview: hatchrun CI is not available yet. These pages document the configuration format and the planned service."
---

This guide takes one repository from nothing to a green check run.
Steps 1 to 4 work today. Steps 5 and 6 need the hosted service and are
marked "Coming later".

## Prerequisites

- A GitHub repository you can push to.
- A card on file for your organization. hatchrun CI jobs wait until
  there is one, and an organization that already pays for hatchrun.io
  runners has one. See [Billing](/docs/ci/setup/billing/#a-card-is-required).
- A Linux machine on x86-64 or arm64 for the prebuilt CLI. On macOS
  or anything else, you need [Rust](https://rustup.rs/) to build it.
- The [GitHub CLI](https://cli.github.com/) to download the release.
  You can also download the files from the release page by hand.

:::steps

1. ## Install the CLI

   Prebuilt binaries are for Linux on x86-64 and arm64 for now. Each
   [release of hatchrun/hatchrun](https://github.com/hatchrun/hatchrun/releases/latest)
   has `hatchrun-VERSION-linux-amd64.tar.gz` and
   `hatchrun-VERSION-linux-arm64.tar.gz`.

   ```sh
   VERSION=$(gh release view --repo hatchrun/hatchrun --json tagName -q .tagName | sed 's/^v//')
   gh release download "v$VERSION" --repo hatchrun/hatchrun \
     --pattern "hatchrun-${VERSION}-linux-amd64.tar.gz" --pattern SHA256SUMS
   sha256sum --check --ignore-missing SHA256SUMS
   tar -xzf "hatchrun-${VERSION}-linux-amd64.tar.gz"
   sudo install -m 0755 "hatchrun-${VERSION}-linux-amd64/hatchrun" /usr/local/bin/hatchrun
   ```

   On arm64, write `linux-arm64` in the file names. On macOS, build
   from source instead:

   ```sh
   cargo install --locked --git https://github.com/hatchrun/hatchrun hatchrun-cli
   ```

   Cargo puts the `hatchrun` binary in `~/.cargo/bin`. Check the
   install:

   ```sh
   hatchrun --version
   ```

   You see `hatchrun` and the version number.

2. ## Write a config

   In the root of the repository, create `.hatchrun/config.yml`:

   ```yaml title=".hatchrun/config.yml"
   jobs:
     test:
       runs-on: ubuntu-latest
       steps:
         - uses: actions/checkout@v5
         - run: make test

   workflows:
     ci:
       on:
         push:
           branches: [main]
         pull_request: {}
       jobs:
         - test
   ```

   Replace `make test` with your own test command. The workflow `ci`
   runs the job `test` on every push to `main` and on every pull
   request.

   If the repository already has GitHub Actions workflows, convert
   them instead of writing the file:

   ```sh
   hatchrun convert -o .hatchrun/config.yml
   ```

   Read [Migrate from GitHub Actions](/docs/ci/guides/migrate/) before
   you trust the result.

3. ## Validate the config

   ```sh
   hatchrun validate
   ```

   No output and exit code 0 mean the file is valid. Otherwise each
   line names a problem. Fix them and run it again. See
   [Fix validate errors](/docs/ci/troubleshooting/validate-errors/).

4. ## Commit the config

   ```sh
   git add .hatchrun/config.yml
   git commit -m "ci: add hatchrun config"
   ```

   Do not push yet if the GitHub App is not installed. Nothing reads
   the file until it is.

5. ## Install the GitHub App

   :::caution[Coming later]
   The CI permissions and events are not live yet.
   :::

   Install the hatchrun GitHub App on the repository. See
   [Install the GitHub App](/docs/ci/setup/github-app/) for each screen
   and the permissions it asks for.

6. ## Push and watch the check run

   :::caution[Coming later]
   Running jobs needs the hosted service.
   :::

   Push the commit to `main`, or open a pull request. The example
   config starts only on pushes to `main` and on pull requests, so a
   push to another branch without a pull request starts nothing. A
   check run named after the job, here `test`, appears as queued, then
   in progress, then passes.

   If nothing appears within a minute, work through
   [My workflow did not run](/docs/ci/troubleshooting/workflow-did-not-run/).

:::

## Next steps

- [Write your first config by hand](/docs/ci/guides/first-config/)
  builds a fuller config step by step.
- [Choose a runner size](/docs/ci/guides/runner-size/) moves a slow job
  to a bigger machine.
- [Concepts](/docs/ci/get-started/concepts/) explains every term on
  this page.
