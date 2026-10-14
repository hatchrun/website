# hatchrun.io

Source of [hatchrun.io](https://hatchrun.io), the website and
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

Every push to `main` is published to Cloudflare Pages by the
[deploy workflow](.github/workflows/deploy.yml).

Dependencies are pinned to exact versions at least two weeks old, and
Dependabot proposes new ones only after the same wait.

## Before you commit

Run `pre-commit install` once after cloning. The hook runs gitleaks on
staged changes with the rules in `.gitleaks.toml` and stops the commit
when it finds a secret or a Cloudflare or AWS account ID. CI scans the
full history with the same rules. Pass account IDs through CI secrets
or variables; a finding that is not a secret goes in `.gitleaksignore`
by fingerprint, with a comment saying why.

## Licence

Apache License, Version 2.0. See [LICENSE](LICENSE).
