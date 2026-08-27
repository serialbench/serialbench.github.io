# 07 — Gem repo cleanup

## What

Remove everything from `serialbench/serialbench` that moved to other
repos, and clean up the workflow to its minimal form: run benchmarks,
push to data.

## Removals

- `site/` directory (moved to serialbench.github.io)
- `lib/serialbench/site_generator.rb` (site generation moves to the .io repo's TS layer)
- `spec/serialbench/cli/resultset_export_spec.rb` (export-data is no longer needed)
- `resultset export-data` CLI command
- All `deploy-pages` steps except: checkout → push to data → trigger site
- `config/benchmarks/full-*.yml` (per-format configs move into the data
  push step's logic, not separate files)

## What stays

- `lib/serialbench/serializers/` — all serializer adapters
- `lib/serialbench/models/` — Result, Platform (used by the CLI to produce YAML)
- `lib/serialbench/cli/` — environment execute, validate, ci prepare
- `lib/serialbench/runners/` — local runner
- `lib/serialbench/benchmark_runner.rb` — the benchmark engine
- `spec/` — serializer specs, model specs, availability spec
- `config/benchmarks/full.yml` — master benchmark config
- `.github/workflows/benchmark.yml` — runs benchmarks, pushes to data
- `.github/workflows/rake.yml` — test suite
- `.github/workflows/release.yml` — gem release

## Workflow shrinks to

1. Setup matrix (platforms × rubies)
2. `serialbench ci prepare` (platform bootstrapping)
3. `serialbench environment execute` (run benchmarks)
4. Push results to `serialbench/data`
5. Trigger site rebuild (repository_dispatch)

## Acceptance

- [ ] `site/` removed from the gem repo
- [ ] `site_generator.rb` removed
- [ ] `resultset export-data` removed
- [ ] benchmark.yml contains only benchmark + data-push + trigger steps
- [ ] All serializer specs still pass
- [ ] Gem can still be installed and used as a CLI tool
