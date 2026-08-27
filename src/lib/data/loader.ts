import { parseResultsYaml } from './parser';
import { buildDashboardPayload } from './aggregator';
import { buildVersionTimeline } from './versions';
import { buildTrend } from './trend';
import type { ParsedRun, BenchmarkStore, DashboardPayload, VersionSpan, TrendPoint, Environment } from './types';

// The single entry point: loads all YAML run files from the data
// directory (cloned by CI) and returns a fully-populated store.
//
// Falls back to the legacy sample.json if the data/ directory doesn't
// exist (development without a data clone).

export function loadBenchmarks(): BenchmarkStore {
  const runs = loadRunsFromData();
  const fallback = runs.length === 0 ? loadFallbackPayload() : null;

  const latest = runs.length > 0 ? buildDashboardPayload(runs) : (fallback as DashboardPayload);

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

  if (fallback && fallback.environments) {
    for (const [key, env] of Object.entries(fallback.environments)) {
      if (!environments.has(key)) environments.set(key, env);
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

function loadRunsFromData(): ParsedRun[] {
  const modules = import.meta.glob('/data/runs/**/*.yaml', {
    eager: true,
    import: 'default',
  }) as Record<string, any>;

  const runs: ParsedRun[] = [];
  for (const [path, yaml] of Object.entries(modules)) {
    const filename = path.split('/').pop() ?? '';
    const parsed = parseResultsYaml({ ...yaml, __path: path }, filename);
    if (parsed) runs.push(parsed);
  }
  return runs;
}

function loadFallbackPayload(): DashboardPayload | null {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const sample = require('../../data/sample.json');
    return sample as DashboardPayload;
  } catch {
    return null;
  }
}
