import { describe, it, expect } from 'vitest';
import { buildDashboardPayload } from '../aggregator';
import type { ParsedRun } from '../types';

function mkRun(date: string, envKey: string, format: string): ParsedRun {
  return {
    date,
    platform: envKey.split('-ruby-')[0],
    ruby: envKey.split('-ruby-')[1] ?? '3.4',
    format,
    envKey,
    serializers: [{ name: 'nokogiri', version: '1.18.2' }],
    platform_info: { os: 'linux', arch: 'x86_64', ruby_version: '3.4' },
    parsing: {
      nokogiri: {
        large: { iterations_per_second: 9.9, time_per_iteration: 0.101 },
      },
    },
    generation: {},
    streaming: {},
    memory: {},
  };
}

describe('buildDashboardPayload', () => {
  it('builds combined results across runs', () => {
    const runs = [
      mkRun('2026-08-30', 'ubuntu-24.04-ruby-3.4', 'xml'),
      mkRun('2026-09-06', 'macos-26-ruby-3.4', 'xml'),
    ];
    const payload = buildDashboardPayload(runs);

    expect(payload.combined_results.parsing.large.xml.nokogiri).toBeDefined();
    expect(payload.combined_results.parsing.large.xml.nokogiri['ubuntu-24.04-ruby-3.4']).toBeDefined();
    expect(payload.combined_results.parsing.large.xml.nokogiri['macos-26-ruby-3.4']).toBeDefined();
  });

  it('latest run overwrites earlier data for the same env', () => {
    const old = mkRun('2026-08-30', 'ubuntu-24.04-ruby-3.4', 'xml');
    old.parsing.nokogiri.large.iterations_per_second = 8.0;

    const newer = mkRun('2026-09-06', 'ubuntu-24.04-ruby-3.4', 'xml');
    newer.parsing.nokogiri.large.iterations_per_second = 10.0;

    const payload = buildDashboardPayload([old, newer]);
    expect(payload.combined_results.parsing.large.xml.nokogiri['ubuntu-24.04-ruby-3.4'].iterations_per_second).toBe(10.0);
  });

  it('accumulates environments across runs', () => {
    const runs = [
      mkRun('2026-08-30', 'ubuntu-24.04-ruby-3.4', 'xml'),
      mkRun('2026-09-06', 'macos-26-ruby-3.4', 'xml'),
      mkRun('2026-09-13', 'windows-2025-ruby-4.0', 'xml'),
    ];
    const payload = buildDashboardPayload(runs);
    expect(Object.keys(payload.environments)).toHaveLength(3);
  });

  it('includes library versions from the latest run', () => {
    const runs = [
      mkRun('2026-08-30', 'ubuntu-24.04-ruby-3.4', 'xml'),
    ];
    const payload = buildDashboardPayload(runs);
    expect(payload.libraries).toContainEqual(
      expect.objectContaining({ name: 'nokogiri', version: '1.18.2' }),
    );
  });

  it('reports total distinct run dates', () => {
    const runs = [
      mkRun('2026-08-30', 'ubuntu-24.04-ruby-3.4', 'xml'),
      mkRun('2026-08-30', 'macos-26-ruby-3.4', 'xml'),
      mkRun('2026-09-06', 'ubuntu-24.04-ruby-3.4', 'xml'),
    ];
    const payload = buildDashboardPayload(runs);
    expect(payload.metadata.total_runs).toBe(2);
  });
});
