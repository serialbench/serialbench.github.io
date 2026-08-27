import { parseResultsYaml } from './parser';
import { buildDashboardPayload } from './aggregator';
import { buildVersionTimeline } from './versions';
import { buildTrend } from './trend';
import type { ParsedRun, BenchmarkStore, DashboardPayload, VersionSpan, TrendPoint, Environment } from './types';

// The single entry point: loads all YAML run files from the data
// directory (cloned by CI) and returns a fully-populated store.
//
// In development, falls back to the generated sample data if the
// data/ directory doesn't exist (CI provides it at build time).

export function loadBenchmarks(): BenchmarkStore {
  const runs = loadRuns();
  const latest = buildDashboardPayload(runs);

  const versions = new Map<string, Set<string>>();
  const environments = new Map<string, Environment>();

  for (const run of runs) {
    for (const s of run.serializers) {
      if (!versions.has(s.name)) versions.set(s.name, new Set());
      versions.get(s.name)!.add(s.version);
    }
    if (!environments.has(run.envKey)) {
      environments.set(run.envKey, {
        ruby_version: run.platform_info.ruby_version,
        os: run.platform_info.os,
        arch: run.platform_info.arch,
        timestamp: run.date,
      });
    }
  }

  return {
    runs,
    latest,
    versionTimeline: (serializer: string) => buildVersionTimeline(runs, serializer),
    trend: (serializer, envKey, op, size, format) =>
      buildTrend(runs, serializer, envKey, op, size, format),
    versions,
    environments,
  };
}

function loadRuns(): ParsedRun[] {
  // Try loading from the data repo clone (CI provides this)
  const modules = import.meta.glob('/data/runs/**/*.yaml', {
    eager: true,
    import: 'default',
  }) as Record<string, any>;

  const runs: ParsedRun[] = [];

  for (const [path, yaml] of Object.entries(modules)) {
    const filename = path.split('/').pop() ?? '';
    const parsed = parseResultsYaml(
      { ...yaml, __path: path },
      filename,
    );
    if (parsed) runs.push(parsed);
  }

  return runs;
}
