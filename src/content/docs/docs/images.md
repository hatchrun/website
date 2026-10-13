---
title: Runner images
description: What the hatchrun AMIs contain and how they are built and checked.
---

hatchrun publishes Ubuntu 26.04 AMIs for amd64 and arm64 every week from
[hatchrun/images](https://github.com/hatchrun/images).

## Contents

- the GitHub Actions runner in `/home/runner`, started by `hatchrun-agent`
  for exactly one job;
- the `runner` user, uid 1001, in the `docker`, `adm`, `systemd-journal`
  and `users` groups, with passwordless sudo;
- Docker CE with Buildx and Compose;
- `ImageOS=ubuntu26` and a tool cache in `/opt/hostedtoolcache`, so
  `actions/setup-*` behave as on GitHub-hosted runners;
- no snapd, no unattended upgrades and no apt timers, so nothing changes
  the machine during a job.

## Boot

A runner boots once per job, so boot time is paid on every job. The
images boot without cloud-init, read the runner's and Docker's files
ahead of their start, and start Docker while the runner connects to
GitHub. In our tests on a t4g.medium a job starts about 30 seconds after
the instance is launched.

Scripts in user data do not run on these images: user data is read by
`hatchrun-agent` alone.

## Build and checks

- Every download is pinned to a version and checked against its SHA-256
  sum, and Docker's signing key against its fingerprint.
- Trivy scans the image before the AMI is made. A fixable HIGH or
  CRITICAL vulnerability in an operating system package stops the build.
- Each release carries a CycloneDX SBOM per architecture and a
  `manifest.json` with the AMI id of every region, with a build
  provenance attestation:

```sh
gh attestation verify manifest.json --repo hatchrun/images
```

## Building your own

The Packer template and scripts are in the repository. You can build the
same image in your own account and keep it private.
