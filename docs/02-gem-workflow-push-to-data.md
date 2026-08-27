# 02 — Gem workflow: push results to data repo

## What

Modify the benchmark workflow in `serialbench/serialbench` to push each
leg's results directly to `serialbench/data` instead of using GitHub
Actions artifacts. This replaces the artifact upload/download intermediate
step with a durable, versioned data store.

## Changes

1. Remove all `actions/upload-artifact` steps from the benchmark job
2. Add a `push-to-data` step after each format's benchmark completes
3. The step pushes `{platform}-ruby-{version}.{format}.yaml` to
   `serialbench/data` under `runs/{date}/`
4. Uses a fine-grained PAT with write access to `serialbench/data` only
5. Each push is a separate commit (not one big commit at the end) so
   partial runs still deposit their data

## Implementation

```yaml
- name: Push xml results to data repo
  if: ${{ !cancelled() }}
  env:
    DATA_TOKEN: ${{ secrets.DATA_REPO_TOKEN }}
  run: |
    FILE="results/runs/ci-ruby-${{ matrix.ruby-version }}-${{ matrix.platform }}/xml/results.yaml"
    if [ -f "$FILE" ]; then
      DATE=$(date -u +%Y-%m-%d)
      NAME="${{ matrix.platform }}-ruby-${{ matrix.ruby-version }}.xml.yaml"
      git clone "https://x-access-token:${DATA_TOKEN}@github.com/serialbench/data.git" /tmp/data
      mkdir -p "/tmp/data/runs/${DATE}"
      cp "$FILE" "/tmp/data/runs/${DATE}/${NAME}"
      cd /tmp/data
      git config user.name "serialbench-bot"
      git config user.email "serialbench-bot@users.noreply.github.com"
      git add "runs/${DATE}/${NAME}"
      git commit -m "run ${DATE}: ${{ matrix.platform }} ruby-${{ matrix.ruby-version }} xml"
      git push origin main
    fi
```

## Acceptance

- [ ] Benchmark legs push YAML files to `serialbench/data`
- [ ] A partial run (evictions) still pushes whatever completed
- [ ] Files land under `runs/{date}/` with the correct naming
- [ ] Remove `actions/upload-artifact` and `actions/download-artifact` from the workflow
