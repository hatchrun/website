---
title: Quickstart
description: Install the hatchrun CLI, convert your GitHub workflows, validate the result and commit it.
banner:
  content: "Preview: hatchrun CI is not available yet. This page documents the configuration format."
---

This page turns the GitHub Actions workflows of a repository into a
`.hatchrun/config.yml` and checks it. You need a Linux machine (amd64
or arm64) and the [GitHub CLI](https://cli.github.com/) to download
the release.

:::steps

1. ## Install the CLI

   Every [release of hatchrun/hatchrun](https://github.com/hatchrun/hatchrun/releases/latest)
   ships the CLI as `hatchrun-VERSION-linux-amd64.tar.gz` and
   `hatchrun-VERSION-linux-arm64.tar.gz`. `VERSION` is the release tag
   without its `v`.

   ```sh
   VERSION=$(gh release view --repo hatchrun/hatchrun --json tagName -q .tagName | sed 's/^v//')
   gh release download "v$VERSION" --repo hatchrun/hatchrun \
     --pattern "hatchrun-${VERSION}-linux-amd64.tar.gz" --pattern SHA256SUMS
   sha256sum --check --ignore-missing SHA256SUMS
   tar -xzf "hatchrun-${VERSION}-linux-amd64.tar.gz"
   sudo install -m 0755 "hatchrun-${VERSION}-linux-amd64/hatchrun" /usr/local/bin/hatchrun
   hatchrun --version
   ```

   On arm64, use `linux-arm64` in the file names.

2. ## Convert your workflows

   From the root of the repository:

   ```sh
   hatchrun convert -o .hatchrun/config.yml
   ```

   With no file names, `convert` reads every `.yml` and `.yaml` file in
   `.github/workflows/`. Each file becomes one workflow, named after the
   file, and each job becomes a job named `FILE-JOB`. `-o` creates the
   `.hatchrun/` directory when it is missing.

3. ## Read the warnings

   `convert` prints what it changed or dropped on standard error. A
   typical run:

   ```text
   `ci.yml`: `concurrency` is not supported and was dropped
   `ci.yml` job `lint`: `runs-on: ubuntu-24.04` became `ubuntu-latest`, which runs Ubuntu 26.04
   `ci.yml` job `test`: `strategy.fail-fast` is not supported and was dropped
   `ci.yml` job `test`: matrix key `os` values `macos-latest` name no runner template and were dropped; hatchrun runs Linux only
   ```

   A warning means the config runs without that key. An error means a
   job, an event or a whole file was left out, and `convert` exits
   with 1. The file it writes still holds everything else. See
   [Migrating from GitHub Actions](/docs/ci/migrating/) for each case.

4. ## Validate

   ```sh
   hatchrun validate
   ```

   `validate` reads `.hatchrun/config.yml`, prints one line per
   problem and exits with 1 when it finds any. No output and exit code
   0 mean the file is valid. Run it again after every edit.

5. ## Commit the file

   ```sh
   git add .hatchrun/config.yml
   git commit -m "ci: add hatchrun config"
   ```

   GitHub keeps running the files in `.github/workflows/`. Once a
   workflow runs on hatchrun, delete the GitHub file it came from, or
   both will run the same jobs.

:::

## Next

- [Configuration reference](/docs/ci/configuration/) to edit the file
  by hand.
- [Runners](/docs/ci/runners/) to pick a bigger machine.
