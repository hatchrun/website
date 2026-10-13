// SPDX-FileCopyrightText: Copyright 2026 Gamunu Balagalla <gamunu.balagalla@gmail.com>
//
// SPDX-License-Identifier: Apache-2.0

import { defineConfig } from "astro/config";
import starlight from "@astrojs/starlight";

export default defineConfig({
  site: "https://hatchrun.dev",
  // Static files only: the site needs no server and no cookies.
  output: "static",
  telemetry: false,
  redirects: {
    "/docs": "/docs/overview/",
  },
  integrations: [
    starlight({
      title: "hatchrun",
      description:
        "Open-source autoscaler for GitHub Actions runners on your own AWS account.",
      social: [
        { icon: "github", label: "GitHub", href: "https://github.com/hatchrun" },
      ],
      sidebar: [
        {
          label: "Start here",
          items: [
            { label: "Overview", slug: "docs/overview" },
            { label: "Hosted beta", slug: "docs/beta" },
          ],
        },
        {
          label: "Concepts",
          items: [
            { label: "How it works", slug: "docs/how-it-works" },
            { label: "Runner images", slug: "docs/images" },
            { label: "Security", slug: "docs/security" },
            { label: "Costs", slug: "docs/costs" },
          ],
        },
        {
          label: "Self-hosting",
          items: [{ label: "Status", slug: "docs/self-hosting" }],
        },
        {
          label: "Project",
          items: [{ label: "Roadmap", slug: "docs/roadmap" }],
        },
      ],
    }),
  ],
});
