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
            { label: "Overview", slug: "docs/ci/overview" },
            { label: "Quickstart", slug: "docs/ci/quickstart" },
            { label: "Configuration reference", slug: "docs/ci/configuration" },
            { label: "Triggers", slug: "docs/ci/triggers" },
            { label: "Expressions and contexts", slug: "docs/ci/expressions" },
            { label: "Runners", slug: "docs/ci/runners" },
            { label: "Test splitting", slug: "docs/ci/test-splitting" },
            { label: "Migrating from GitHub Actions", slug: "docs/ci/migrating" },
            { label: "CLI reference", slug: "docs/ci/cli" },
            { label: "Limits", slug: "docs/ci/limits" },
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
