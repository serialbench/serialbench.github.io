# 04 — Data processing layer: runs → dashboard payload

## What

Build the TypeScript data layer that converts raw YAML files from the
data repo into the structures the site's components consume. This is the
deep module between the data files and the presentation — one interface
(`loadBenchmarks()`), internally handles parsing, version extraction,
environment normalization, and aggregation.

## Interface

```typescript
interface BenchmarkStore {
  // All runs, sorted by date (oldest first)
  runs: DatedRun[];

  // Latest run's data (what the current dashboard shows)
  latest: DashboardPayload;

  // Version timeline for a serializer
  versionTimeline(serializer: string): VersionSpan[];

  // Trend data: performance of a serializer over time on an environment
  trend(serializer: string, envKey: string, op: string, size: string, format: string): TrendPoint[];

  // All distinct serializer versions ever measured
  versions: Map<string, Set<string>>;

  // All environments ever seen
  environments: Map<string, Environment>;
}

function loadBenchmarks(): BenchmarkStore;
```

## Internal processing

1. Parse each `{platform}-ruby-{version}.{format}.yaml` file
2. Extract the date from the directory name
3. Extract serializer versions from the `serializers` section
4. Normalize environment keys (platform string from filename)
5. Build the latest dashboard payload (same shape as the current
   `export-data` output)
6. Index by serializer × environment × date for trend queries

## OOP structure

```
src/lib/data/
  loader.ts          — loadBenchmarks(): BenchmarkStore
  parser.ts          — parseResultsYaml(yaml): ParsedRun
  aggregator.ts      — buildDashboardPayload(runs): DashboardPayload
  versions.ts        — buildVersionTimeline(runs, serializer): VersionSpan[]
  trend.ts           — buildTrend(runs, serializer, env, op, size, format): TrendPoint[]
  types.ts           — all interfaces
```

Each module has one responsibility. The loader is the only entry point;
the others are internal (not exported from the package).

## Acceptance

- [ ] `loadBenchmarks()` returns a fully-populated store from YAML files
- [ ] Dashboard payload shape matches what the current site consumes
- [ ] Version timelines group consecutive runs by version
- [ ] Trend queries return time-series points with version annotations
- [ ] Unit specs for each internal module
