---
title: Roadmap
description: What is done and what comes next.
---

## Done

- Runner scale set client and scaler, with restart without data loss.
- Warm pool for the scaler: pre-booted, stopped instances started per
  job.
- Scaler binaries and a container image published with each release,
  with checksums, SBOM and build provenance.
- `hatchrun-agent`, packaged as deb, rpm and tarball with signed build
  provenance.
- Ubuntu 26.04 runner images for amd64 and arm64, scanned and attested,
  in every AWS region enabled by default.
- Boot in 29.5 seconds from launch to job start (t4g.medium in
  ap-south-1).
- Connect CloudFormation stack: the role hatchrun.io assumes through
  OIDC, the launch template and the runner network.
- hatchrun.io Worker that records jobs from GitHub App webhooks and
  reads the [`runs-on` label](/docs/runs-on/).
- Worker launches and removes instances in connected accounts.
- Hosted service: GitHub App install, dashboard and Launch Stack links.

## Next

- GCP and Azure runners.
- CloudFormation template for self-hosting, with Launch Stack buttons.
- Windows runners.
