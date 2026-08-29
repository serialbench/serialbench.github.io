import type { ParsedRun, PerfMetric, MemoryMetric } from './types';

// Parses one results.yaml file into a ParsedRun, extracting the
// environment key from the filename.
export function parseResultsYaml(
  yaml: Record<string, any>,
  filename: string,
): ParsedRun | null {
  const match = filename.match(/^([a-z0-9.-]+)-ruby-(\d+\.\d+)\.(\w+)\.yaml$/);
  if (!match) return null;

  const [, platform, ruby, format] = match;
  const date = extractDateFromPath(yaml.__path ?? '');
  if (!date) return null;

  const envKey = `${platform}-ruby-${ruby}`;
  const br = yaml.benchmark_result ?? {};

  return {
    date,
    platform,
    ruby,
    format,
    envKey,
    serializers: (br.serializers ?? []).map((s: any) => ({
      name: s.name,
      version: s.version ?? 'unknown',
      features: s.features ?? undefined,
    })),
    platform_info: {
      os: yaml.platform?.os ?? platform.split('-')[0],
      arch: yaml.platform?.arch ?? 'unknown',
      ruby_version: yaml.platform?.ruby_version ?? ruby,
    },
    parsing: indexBySerializer(br.parsing, 'iterations_per_second'),
    generation: indexBySerializer(br.generation, 'iterations_per_second'),
    xpath: indexBySerializer(br.xpath, 'iterations_per_second'),
    streaming: indexBySerializer(br.streaming, 'iterations_per_second'),
    memory: indexBySerializer(br.memory, 'allocated_memory'),
  };
}

function extractDateFromPath(path: string): string | null {
  const m = path.match(/runs\/(\d{4}-\d{2}-\d{2})\//);
  return m ? m[1] : null;
}

function indexBySerializer(
  entries: any[] | undefined,
  valueKey: string,
): Record<string, Record<string, PerfMetric | MemoryMetric>> {
  const result: Record<string, Record<string, PerfMetric | MemoryMetric>> = {};
  if (!Array.isArray(entries)) return result;

  for (const e of entries) {
    const serializer = e.adapter;
    if (!serializer) continue;
    const size = e.data_size ?? 'unknown';
    result[serializer] ??= {};
    result[serializer][size] = {
      iterations_per_second: e.iterations_per_second,
      time_per_iteration: e.time_per_iteration,
      allocated_memory: e.allocated_memory,
      retained_memory: e.retained_memory,
    } as PerfMetric & MemoryMetric;
  }
  return result;
}
