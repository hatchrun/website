// SPDX-FileCopyrightText: Copyright 2026 Gamunu Balagalla <gamunu.balagalla@gmail.com>
//
// SPDX-License-Identifier: Apache-2.0

import { defineConfig } from "astro/config";
import starlight from "@astrojs/starlight";

export default defineConfig({
  site: "https://hatchrun.io",
  // Static files only: the site needs no server and no cookies.
  output: "static",
  telemetry: false,
  redirects: {
    "/docs": "/docs/overview/",
  },
  integrations: [
    starlight({
      title: "hatchrun",
      logo: { src: "./src/assets/brand/hatchrun-mark-micro.svg", alt: "" },
      favicon: "/favicon.svg",
      head: [
        { tag: "link", attrs: { rel: "icon", href: "/favicon-32.png", type: "image/png", sizes: "32x32" } },
        { tag: "link", attrs: { rel: "apple-touch-icon", href: "/apple-touch-icon.png" } },
      ],
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
          label: "Project",
          items: [{ label: "Roadmap", slug: "docs/roadmap" }],
        },
      ],
    }),
  ],
});
