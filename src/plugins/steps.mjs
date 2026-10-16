// SPDX-FileCopyrightText: Copyright 2026 Gamunu Balagalla <gamunu.balagalla@gmail.com>
//
// SPDX-License-Identifier: Apache-2.0

// Turns a `:::steps` block around an ordered list into
// <div class="hr-steps">, which src/styles/starlight.css draws as
// numbered setup steps. It keeps the page plain Markdown: importing a
// component into MDX makes the Astro build warn.
//
// Starlight enables `:::` directives for its asides and turns the ones
// nobody claimed back into text. A node with `data` set counts as
// claimed.

export default function stepsPlugin() {
  return {
    name: "hatchrun-steps",
    containerDirective(node) {
      if (node.name !== "steps") return;
      return {
        type: "paragraph",
        data: { hName: "div", hProperties: { className: ["hr-steps"] } },
        children: [...node.children],
      };
    },
  };
}
