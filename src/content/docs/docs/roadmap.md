---
title: Roadmap
description: What is done and what comes next.
---

## Done

- Runner scale set client and scaler, with restart without data loss.
- `hatchrun-agent`, packaged as deb, rpm and tarball with signed build
  provenance.
- Ubuntu 26.04 runner images for amd64 and arm64, scanned and attested,
  in every AWS region enabled by default.
- Boot in about 30 seconds from launch to job start.

## Next

- Warm pool: pre-booted, stopped instances started per job.
- CloudFormation template for self-hosting, with Launch Stack buttons.
- Hosted control plane and dashboard.
- Runner images in AWS Marketplace.
- Windows runners.
