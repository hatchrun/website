// SPDX-FileCopyrightText: Copyright 2026 Gamunu Balagalla <gamunu.balagalla@gmail.com>
//
// SPDX-License-Identifier: LicenseRef-hatchrun-Proprietary

// Expressive Code settings for the docs. Code blocks stay dark on the
// light docs, as in the 2026-10 redesign. Expressive Code wants a custom
// theme object here rather than in astro.config.mjs, where options must
// be serializable.

import { defineEcConfig } from "@astrojs/starlight/expressive-code";
import codeTheme from "./src/styles/code-theme.mjs";

export default defineEcConfig({
  themes: [codeTheme],
  useStarlightUiThemeColors: false,
  styleOverrides: {
    borderRadius: "6px",
    borderWidth: "2px",
    borderColor: "#141517",
    codeBackground: "#141517",
    codeFontFamily: "var(--hr-font-mono)",
    codeFontSize: "14px",
    codeLineHeight: "1.7",
    uiFontFamily: "var(--hr-font-mono)",
    uiFontSize: "12px",
    frames: {
      editorBackground: "#141517",
      editorTabBarBackground: "#141517",
      editorTabBarBorderBottomColor: "#34373c",
      editorActiveTabBackground: "#141517",
      editorActiveTabForeground: "#9a9fa6",
      editorActiveTabIndicatorTopColor: "transparent",
      editorActiveTabIndicatorBottomColor: "transparent",
      terminalBackground: "#141517",
      terminalTitlebarBackground: "#141517",
      terminalTitlebarBorderBottomColor: "#34373c",
      terminalTitlebarForeground: "#9a9fa6",
      inlineButtonForeground: "#ece6d6",
      inlineButtonBorder: "#34373c",
      frameBoxShadowCssValue: "none",
    },
  },
});
