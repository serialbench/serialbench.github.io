# 06 — Data repo triggers site rebuild

## What

Wire the data repo's pushes to trigger the .io repo's build, so the site
rebuilds automatically when new benchmark data arrives — without waiting
for the Monday scheduled rebuild.

## Mechanism

The benchmark workflow (in the gem repo) pushes to `serialbench/data`.
After the push, it sends a `repository_dispatch` event to
`serialbench/serialbench.github.io`:

```yaml
- name: Trigger site rebuild
  if: github.ref == 'refs/heads/main'
  env:
    GH_TOKEN: ${{ secrets.SITE_TRIGGER_TOKEN }}
  run: |
    curl -sf -X POST \
      -H "Authorization: Bearer $GH_TOKEN" \
      -H "Accept: application/vnd.github+json" \
      https://api.github.com/repos/serialbench/serialbench.github.io/dispatches \
      -d '{"event_type": "data-updated"}'
```

The .io repo's build workflow listens for this:

```yaml
on:
  repository_dispatch:
    types: [data-updated]
```

## Debouncing

Multiple legs pushing to data in quick succession would trigger multiple
rebuilds. The .io workflow uses a concurrency group to debounce:

```yaml
concurrency:
  group: pages
  cancel-in-progress: true
```

Only the last trigger in a burst actually builds.

## Acceptance

- [ ] Data repo pushes trigger a site rebuild via repository_dispatch
- [ ] Concurrency group prevents rebuild storms
- [ ] Site rebuilds within 5 minutes of data arrival
