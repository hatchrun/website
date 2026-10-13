# hatchrun.dev

Source of [hatchrun.dev](https://hatchrun.dev), the website and
documentation of [hatchrun](https://github.com/hatchrun/hatchrun). It is
an [Astro Starlight](https://starlight.astro.build) site built to static
files.

Pages live in [`src/content/docs`](src/content/docs) as Markdown; the
sidebar is in [`astro.config.mjs`](astro.config.mjs).

```sh
npm ci
npm run dev      # http://localhost:4321
npm run build    # static site in dist/
```

Dependencies are pinned to exact versions at least two weeks old, and
Dependabot proposes new ones only after the same wait.

## Licence

Apache License, Version 2.0. See [LICENSE](LICENSE).
