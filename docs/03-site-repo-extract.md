# 03 — Site repo: extract Astro site from the gem

## What

Move the `site/` directory from `serialbench/serialbench` to
`serialbench/serialbench.github.io`. The site becomes a standalone repo
with its own CI that fetches data from `serialbench/data` and builds.

## Changes

1. Copy `site/` from the gem repo to `serialbench.github.io/`
2. Remove `site/` from the gem repo
3. Remove site-related steps from the gem's `benchmark.yml` deploy job
   (export-data, setup-node, npm ci, astro build — all move to the .io repo)
4. The gem repo's deploy-pages job shrinks to: checkout → download
   artifacts → add to resultset → push to data repo
5. Create `.github/workflows/build.yml` in the .io repo

## Site build workflow (.io repo)

```yaml
name: build-and-deploy
on:
  push:
    branches: [main]
  schedule:
    - cron: '0 4 * * 1'  # rebuild Mondays after Sunday runs
  workflow_dispatch:
  repository_dispatch:
    types: [data-updated]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Fetch benchmark data
        run: git clone --depth 1 https://github.com/serialbench/data.git data
      - uses: actions/setup-node@v4
        with:
          node-version: '24'
          cache: npm
      - run: npm ci
      - run: npm run build
      - uses: actions/configure-pages@v4
      - uses: actions/upload-pages-artifact@v3
        with:
          path: dist
  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
    steps:
      - id: deployment
        uses: actions/deploy-pages@v4
```

## Data loading

The site's TypeScript layer uses Vite's `import.meta.glob` to load all
YAML files from the cloned `data/` directory at build time:

```typescript
const modules = import.meta.glob('/data/runs/**/*.yaml', { eager: true });
```

This requires the `data/` directory to exist relative to the Astro
project root at build time (the CI clone step provides it).

## Acceptance

- [ ] `serialbench.github.io` repo contains the full Astro site
- [ ] Build workflow fetches data from `serialbench/data` and builds
- [ ] Gem repo no longer contains `site/`
- [ ] Gem's benchmark.yml no longer has Node/Astro steps
- [ ] Site deploys to `serialbench.github.io/serialbench`
