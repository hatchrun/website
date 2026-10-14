---
title: Hosted beta
description: Join the hosted hatchrun beta.
---

In the hosted version, hatchrun runs the control plane and keeps the
runner images up to date. Your runners still run in your own AWS
account.

The hosted control plane is being built. The beta will be invite-only
and free. To get an invite, email
[support@hatchrun.io](mailto:support@hatchrun.io) with your GitHub
organization and the AWS regions you run in.

Setting up will take two steps, both coming in the beta:

1. Install the hatchrun GitHub App on your organization.
2. Create the hatchrun IAM role and launch template in your AWS account
   with the connect CloudFormation stack, from a Launch Stack link in
   the dashboard.

[How it works](/docs/how-it-works/) describes what happens after that,
and [Security](/docs/security/) what the role allows.

After the beta, the hosted control plane becomes a flat subscription
per GitHub organization. Self-hosting stays free.
