# 08 — Specs for the data layer

## What

Write test specs for the TypeScript data processing layer in
`serialbench.github.io`. These test the deep module (`loadBenchmarks`)
and its internal helpers through their public interfaces.

## Test files

```
src/lib/data/
  __tests__/
    loader.test.ts      — loadBenchmarks from fixture YAML files
    parser.test.ts      — parseResultsYaml edge cases
    aggregator.test.ts  — buildDashboardPayload correctness
    versions.test.ts    — versionTimeline grouping
    trend.test.ts       — buildTrend time-series correctness
```

## Test data

Fixture YAML files in `src/lib/data/__tests__/fixtures/`:
- Two dated runs (e.g., `2026-08-30/` and `2026-09-06/`)
- Each with 2 platforms × 2 rubies × 2 formats
- One with a version change between runs (e.g., nokogiri 1.18 → 1.19)
- One with a partial run (missing one platform)

## What each spec covers

### loader.test.ts
- Loads all YAML files from a directory
- Sorts runs by date (oldest first)
- Handles empty data directory
- Handles partial runs (missing files)

### parser.test.ts
- Parses a valid results.yaml
- Extracts serializer versions
- Extracts platform/ruby from filename
- Handles missing or malformed fields gracefully

### aggregator.test.ts
- Builds correct dashboard payload from multiple runs
- Latest run takes precedence for the dashboard
- Availability matrix reflects all runs (not just latest)
- Environments accumulate across runs

### versions.test.ts
- Groups consecutive runs by version
- Creates new span when version changes
- Returns empty for unknown serializer
- Handles single-version serializers

### trend.test.ts
- Returns time-series points sorted by date
- Points include the version at that date
- Handles single data point
- Filters by environment, operation, size, format

## Runner

Vitest (pairs with Vite 8, zero config for TS).

## Acceptance

- [ ] All spec files created with meaningful assertions
- [ ] Fixture data covers the edge cases listed above
- [ ] `npm test` passes
- [ ] Coverage of the data layer modules ≥ 90%
