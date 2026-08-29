// Core types for the benchmark data layer.
// A DatedRun is one platform×ruby×format file from one dated directory.
// The store aggregates all runs and provides the interfaces the site consumes.

export interface PerfMetric {
  iterations_per_second: number;
  time_per_iteration: number;
}

export interface MemoryMetric {
  allocated_memory: number;
  retained_memory: number;
}

export interface SerializerInfo {
  name: string;
  version: string;
  features?: Record<string, boolean>;
}

export interface PlatformInfo {
  os: string;
  arch: string;
  ruby_version: string;
}

export interface ParsedRun {
  date: string;
  platform: string;
  ruby: string;
  format: string;
  envKey: string;
  serializers: SerializerInfo[];
  platform_info: PlatformInfo;
  parsing: Record<string, Record<string, PerfMetric>>;
  generation: Record<string, Record<string, PerfMetric>>;
  xpath: Record<string, Record<string, PerfMetric>>;
  streaming: Record<string, Record<string, PerfMetric>>;
  memory: Record<string, Record<string, MemoryMetric>>;
}

export interface VersionSpan {
  version: string;
  from: string;
  to: string;
}

export interface TrendPoint {
  date: string;
  version: string;
  ips: number;
}

export interface Environment {
  ruby_version: string;
  os: string;
  arch: string;
  timestamp: string;
}

export interface LeaderRow {
  serializer: string;
  ips: number;
  ratioToRef: number | null;
}

export interface DashboardPayload {
  combined_results: Record<string, Record<string, Record<string, Record<string, Record<string, PerfMetric | MemoryMetric>>>>>;
  environments: Record<string, Environment>;
  libraries: { name: string; format: string; version: string; features: Record<string, boolean> }[];
  metadata: { latest_run: string; total_runs: number; generated_at: string };
}

export interface BenchmarkStore {
  runs: ParsedRun[];
  latest: DashboardPayload;
  versionTimeline(serializer: string): VersionSpan[];
  trend(serializer: string, envKey: string, op: string, size: string, format: string): TrendPoint[];
  versions: Map<string, Set<string>>;
  environments: Map<string, Environment>;
}
