import type { ParsedRun, DashboardPayload, Environment } from './types';

// Builds the dashboard payload (same shape the site components consume)
// from all parsed runs. The LATEST run's data takes precedence; missing
// entries fall back to earlier runs.
export function buildDashboardPayload(runs: ParsedRun[]): DashboardPayload {
  const combined: DashboardPayload['combined_results'] = {};
  const environments: Record<string, Environment> = {};
  const versions = new Map<string, string>();

  // Process oldest → newest so later runs overwrite earlier ones
  const sorted = [...runs].sort((a, b) => a.date.localeCompare(b.date));

  for (const run of sorted) {
    for (const s of run.serializers) {
      versions.set(s.name, s.version);
    }

    environments[run.envKey] ??= {
      ruby_version: run.platform_info.ruby_version,
      os: run.platform_info.os,
      arch: run.platform_info.arch,
      timestamp: run.date,
    };

    for (const op of ['parsing', 'generation', 'streaming', 'memory'] as const) {
      const data = run[op];
      for (const [serializer, sizes] of Object.entries(data)) {
        for (const [size, metric] of Object.entries(sizes)) {
          combined[op] ??= {};
          combined[op][size] ??= {};
          combined[op][size][run.format] ??= {};
          combined[op][size][run.format][serializer] ??= {};
          combined[op][size][run.format][serializer][run.envKey] = metric;
        }
      }
    }
  }

  const libraries = [...versions.entries()].map(([name, version]) => ({
    name,
    version,
    format: inferFormat(name, runs),
    features: {},
  }));

  const latestRun = sorted[sorted.length - 1];

  return {
    combined_results: combined,
    environments,
    libraries,
    metadata: {
      latest_run: latestRun?.date ?? '',
      total_runs: new Set(sorted.map((r) => r.date)).size,
      generated_at: new Date().toISOString(),
    },
  };
}

function inferFormat(name: string, runs: ParsedRun[]): string {
  for (const run of runs) {
    if (run.serializers.some((s) => s.name === name)) return run.format;
  }
  return 'unknown';
}
