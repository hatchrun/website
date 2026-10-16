// SPDX-FileCopyrightText: Copyright 2026 Gamunu Balagalla <gamunu.balagalla@gmail.com>
//
// SPDX-License-Identifier: Apache-2.0

// Code block colours from the 2026-10 redesign: bone text on Graphite,
// fog for keys and punctuation, chick for quoted strings, heat for
// keywords and numbers.
// A TextMate theme, read by Expressive Code.

import { ExpressiveCodeTheme } from "@astrojs/starlight/expressive-code";

const bone = "#ECE6D6";
const chick = "#FFCF33";
const heat = "#FF8A4C";
const fog = "#9A9FA6";
const comment = "#7E838A";
const passed = "#40FF80";
const failed = "#F06AA8";

export default new ExpressiveCodeTheme({
  name: "hatchrun-graphite",
  type: "dark",
  colors: {
    "editor.background": "#141517",
    "editor.foreground": bone,
    "editor.selectionBackground": "#34373C",
  },
  tokenColors: [
    { settings: { foreground: bone } },
    { scope: ["comment", "punctuation.definition.comment"], settings: { foreground: comment } },
    {
      scope: ["entity.name.tag", "support.type.property-name", "meta.object-literal.key", "variable.other.property"],
      settings: { foreground: fog },
    },
    { scope: ["punctuation", "meta.brace", "keyword.operator"], settings: { foreground: fog } },
    { scope: ["string", "constant.other", "markup.inline.raw"], settings: { foreground: chick } },
    // Unquoted YAML values (actions/checkout@v7, make test) stay bone.
    { scope: ["string.unquoted"], settings: { foreground: bone } },
    { scope: ["constant.numeric", "constant.language"], settings: { foreground: heat } },
    { scope: ["keyword", "storage", "support.function.builtin"], settings: { foreground: heat } },
    { scope: ["entity.name.function", "support.function"], settings: { foreground: bone } },
    { scope: ["variable.parameter", "variable.other"], settings: { foreground: bone } },
    { scope: ["markup.inserted"], settings: { foreground: passed } },
    { scope: ["markup.deleted"], settings: { foreground: failed } },
  ],
});
