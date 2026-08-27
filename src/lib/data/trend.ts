import type { ParsedRun, TrendPoint } from './types';

// Builds a time-series for one serializer on one environment, operation,
// size, and format. Points are sorted by date and carry the version at
// that date for version-change markers.
export function buildTrend(
  runs: ParsedRun[],
  serializer: string,
  envKey: string,
  op: string,
  size: string,
  format: string,
): TrendPoint[] {
  const sorted = [...runs].sort((a, b) => a.date.localeCompare(b.date));
  const points: TrendPoint[] = [];

  for (const run of sorted) {
    if (run.format !== format || run.envKey !== envKey) continue;

    const versionMatch = run.serializers.find((s) => s.name === serializer);
    if (!versionMatch) continue;

    const metric = run[op]?.[serializer]?.[size];
    if (!metric || (metric as any).iterations_per_second == null) continue;

    points.push({
      date: run.date,
      version: versionMatch.version,
      ips: (metric as any).iterations_per_second,
    });
  }

  return points;
}
