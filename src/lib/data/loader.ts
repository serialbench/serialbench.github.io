import { parseResultsYaml } from './parser';
import { buildDashboardPayload } from './aggregator';
import { buildVersionTimeline } from './versions';
import { buildTrend } from './trend';
import type { ParsedRun, BenchmarkStore, DashboardPayload, Environment } from './types';

// The single entry point: loads all YAML run files from the data
// directory (cloned by CI) and returns a fully-populated store.
// Falls back to the generated sample.json in development.

export function loadBenchmarks(): BenchmarkStore {
  const runs = loadRunsFromData();

  let latest: DashboardPayload;
  if (runs.length > 0) {
    latest = buildDashboardPayload(runs);
  } else {
    latest = loadFallbackPayload() ?? emptyPayload();
  }

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

  if (latest.environments) {
    for (const [key, env] of Object.entries(latest.environments)) {
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
  const sample = import.meta.glob('../data/sample.json', {
    eager: true,
    import: 'default',
  }) as Record<string, any>;

  const key = Object.keys(sample)[0];
  return key ? (sample[key] as DashboardPayload) : null;
}

function emptyPayload(): DashboardPayload {
  return {
    combined_results: {},
    environments: {},
    libraries: [],
    metadata: {
      latest_run: '',
      total_runs: 0,
      generated_at: new Date().toISOString(),
    },
  };
}
