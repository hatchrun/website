---
title: Hosted beta
description: Join the hosted hatchrun beta.
---

In the hosted version, hatchrun runs the control plane and keeps the
runner images up to date. Your runners still run in your own AWS
account.

The hosted control plane is being built. The beta will be invite-only
and free. To get an invite, email
[support@hatchrun.dev](mailto:support@hatchrun.dev) with your GitHub
organization and the AWS regions you run in.

Setting up will take two steps:

1. Install the hatchrun GitHub App on your organization.
2. Create the hatchrun IAM role and launch template in your AWS account
   with the CloudFormation stack the dashboard links to.

After the beta, the hosted control plane becomes a flat subscription
per GitHub organization. Self-hosting stays free.
