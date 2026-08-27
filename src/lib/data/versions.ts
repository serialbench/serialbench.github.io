import type { ParsedRun, VersionSpan } from './types';

// Groups consecutive runs by serializer version: when the version changes,
// a new span starts.
export function buildVersionTimeline(
  runs: ParsedRun[],
  serializer: string,
): VersionSpan[] {
  const sorted = [...runs].sort((a, b) => a.date.localeCompare(b.date));
  const timeline: VersionSpan[] = [];

  for (const run of sorted) {
    const match = run.serializers.find((s) => s.name === serializer);
    if (!match) continue;

    const last = timeline[timeline.length - 1];
    if (last && last.version === match.version) {
      last.to = run.date;
    } else {
      timeline.push({ version: match.version, from: run.date, to: run.date });
    }
  }

  return timeline;
}
