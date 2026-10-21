// SPDX-FileCopyrightText: Copyright 2026 Gamunu Balagalla <gamunu.balagalla@gmail.com>
//
// SPDX-License-Identifier: LicenseRef-hatchrun-Proprietary

import { defineConfig } from "astro/config";
import starlight from "@astrojs/starlight";
import { satteri } from "@astrojs/markdown-satteri";
import stepsPlugin from "./src/plugins/steps.mjs";

export default defineConfig({
  site: "https://hatchrun.io",
  // Static files only: the site needs no server and no cookies.
  output: "static",
  telemetry: false,
  markdown: {
    processor: satteri({ mdastPlugins: [stepsPlugin()] }),
  },
  redirects: {
    "/docs": "/docs/overview/",
    // The hosted service is out of beta; the old beta page goes to setup.
    "/docs/beta": "/docs/getting-started/",
  },
  integrations: [
    starlight({
      title: "hatchrun",
      favicon: "/favicon.svg",
      customCss: ["./src/styles/starlight.css"],
      components: {
        SiteTitle: "./src/components/starlight/SiteTitle.astro",
        SocialIcons: "./src/components/starlight/SocialIcons.astro",
        PageTitle: "./src/components/starlight/PageTitle.astro",
        TableOfContents: "./src/components/starlight/TableOfContents.astro",
        ThemeProvider: "./src/components/starlight/ThemeProvider.astro",
        ThemeSelect: "./src/components/starlight/ThemeSelect.astro",
      },
      head: [
        { tag: "link", attrs: { rel: "icon", href: "/favicon-32.png", type: "image/png", sizes: "32x32" } },
        { tag: "link", attrs: { rel: "apple-touch-icon", href: "/apple-touch-icon.png" } },
      ],
      description:
        "Self-hosted GitHub Actions runners in your own cloud account. Open source, AGPL-3.0.",
      social: [
        { icon: "github", label: "GitHub", href: "https://github.com/hatchrun" },
      ],
      sidebar: [
        {
          label: "Start here",
          items: [
            { label: "Overview", slug: "docs/overview" },
            { label: "Getting started", slug: "docs/getting-started" },
          ],
        },
        {
          label: "Concepts",
          items: [
            { label: "How it works", slug: "docs/how-it-works" },
            { label: "Choosing a runner", slug: "docs/runs-on" },
            { label: "Runner images", slug: "docs/images" },
            { label: "Security", slug: "docs/security" },
            { label: "Costs", slug: "docs/costs" },
          ],
        },
        {
          label: "Self-hosting",
          items: [
            { label: "Self-hosting", slug: "docs/self-hosting" },
            { label: "Downloads", slug: "docs/downloads" },
          ],
        },
        {
          label: "hatchrun CI (preview)",
          items: [
            {
              label: "Get started",
              items: [
                { label: "Introduction", slug: "docs/ci/get-started/introduction" },
                { label: "Concepts", slug: "docs/ci/get-started/concepts" },
                { label: "Quickstart", slug: "docs/ci/get-started/quickstart" },
              ],
            },
            {
              label: "Set up",
              items: [
                { label: "Install the GitHub App", slug: "docs/ci/setup/github-app", badge: { text: "Coming", variant: "caution" } },
                { label: "How events reach hatchrun", slug: "docs/ci/setup/events", badge: { text: "Coming", variant: "caution" } },
                { label: "Check runs and statuses", slug: "docs/ci/setup/check-runs", badge: { text: "Coming", variant: "caution" } },
                { label: "Secrets and variables", slug: "docs/ci/setup/secrets", badge: { text: "Coming", variant: "caution" } },
                { label: "Organization settings", slug: "docs/ci/setup/settings" },
              ],
            },
            {
              label: "Guides",
              items: [
                { label: "Migrate from GitHub Actions", slug: "docs/ci/guides/migrate" },
                { label: "Write your first config", slug: "docs/ci/guides/first-config" },
                { label: "Reuse config", slug: "docs/ci/guides/reuse-config" },
                { label: "Requires and approvals", slug: "docs/ci/guides/requires-approvals" },
                { label: "Build a matrix", slug: "docs/ci/guides/matrix" },
                { label: "Filter by branch, tag and path", slug: "docs/ci/guides/filters" },
                { label: "Schedule a nightly workflow", slug: "docs/ci/guides/schedule" },
                { label: "Cache dependencies", slug: "docs/ci/guides/cache" },
                { label: "Share files with workspaces", slug: "docs/ci/guides/workspaces" },
                { label: "Collect test results", slug: "docs/ci/guides/test-results" },
                { label: "Split tests across parallel jobs", slug: "docs/ci/guides/test-splitting", badge: { text: "Coming", variant: "caution" } },
                { label: "Use GitHub actions in steps", slug: "docs/ci/guides/github-actions" },
                { label: "Choose a runner size", slug: "docs/ci/guides/runner-size" },
              ],
            },
            {
              label: "Reference",
              items: [
                { label: "Configuration reference", slug: "docs/ci/reference/configuration" },
                { label: "Expressions and functions", slug: "docs/ci/reference/expressions" },
                { label: "Contexts", slug: "docs/ci/reference/contexts" },
                { label: "Triggers and filter patterns", slug: "docs/ci/reference/triggers" },
                { label: "Runner templates and pricing", slug: "docs/ci/reference/runners" },
                { label: "CLI reference", slug: "docs/ci/reference/cli" },
                { label: "Limits", slug: "docs/ci/reference/limits" },
                { label: "Error and warning messages", slug: "docs/ci/reference/messages" },
              ],
            },
            {
              label: "Troubleshooting",
              items: [
                { label: "My workflow did not run", slug: "docs/ci/troubleshooting/workflow-did-not-run" },
                { label: "A job did not start", slug: "docs/ci/troubleshooting/job-did-not-start" },
                { label: "A step was skipped", slug: "docs/ci/troubleshooting/step-skipped" },
                { label: "Fix validate errors", slug: "docs/ci/troubleshooting/validate-errors" },
                { label: "convert warnings and errors", slug: "docs/ci/troubleshooting/convert-problems" },
                { label: "Webhook delivery problems", slug: "docs/ci/troubleshooting/webhooks", badge: { text: "Coming", variant: "caution" } },
                { label: "FAQ", slug: "docs/ci/troubleshooting/faq" },
              ],
            },
          ],
        },
        {
          label: "Project",
          items: [{ label: "Roadmap", slug: "docs/roadmap" }],
        },
      ],
    }),
  ],
});
