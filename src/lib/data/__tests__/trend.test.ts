import { describe, it, expect } from 'vitest';
import { buildTrend } from '../trend';
import type { ParsedRun } from '../types';

function mkRun(date: string, envKey: string, format: string, ips: number, version: string): ParsedRun {
  return {
    date,
    platform: envKey.split('-ruby-')[0],
    ruby: envKey.split('-ruby-')[1] ?? '3.4',
    format,
    envKey,
    serializers: [{ name: 'nokogiri', version }],
    platform_info: { os: 'linux', arch: 'x86_64', ruby_version: '3.4' },
    parsing: {
      nokogiri: {
        large: { iterations_per_second: ips, time_per_iteration: 1000 / ips },
      },
    },
    generation: {},
    streaming: {},
    memory: {},
  };
}

describe('buildTrend', () => {
  it('returns time-series points sorted by date', () => {
    const runs = [
      mkRun('2026-09-06', 'ubuntu-24.04-ruby-3.4', 'xml', 9.5, '1.18.2'),
      mkRun('2026-08-30', 'ubuntu-24.04-ruby-3.4', 'xml', 9.9, '1.18.2'),
    ];
    const points = buildTrend(runs, 'nokogiri', 'ubuntu-24.04-ruby-3.4', 'parsing', 'large', 'xml');

    expect(points).toHaveLength(2);
    expect(points[0].date).toBe('2026-08-30');
    expect(points[1].date).toBe('2026-09-06');
    expect(points[0].ips).toBe(9.9);
    expect(points[1].ips).toBe(9.5);
  });

  it('includes the version at each point', () => {
    const runs = [
      mkRun('2026-08-30', 'ubuntu-24.04-ruby-3.4', 'xml', 9.9, '1.18.2'),
      mkRun('2026-09-06', 'ubuntu-24.04-ruby-3.4', 'xml', 11.2, '1.19.4'),
    ];
    const points = buildTrend(runs, 'nokogiri', 'ubuntu-24.04-ruby-3.4', 'parsing', 'large', 'xml');

    expect(points[0].version).toBe('1.18.2');
    expect(points[1].version).toBe('1.19.4');
  });

  it('filters by environment', () => {
    const runs = [
      mkRun('2026-08-30', 'ubuntu-24.04-ruby-3.4', 'xml', 9.9, '1.18.2'),
      mkRun('2026-08-30', 'macos-26-ruby-3.4', 'xml', 12.0, '1.18.2'),
    ];
    const points = buildTrend(runs, 'nokogiri', 'macos-26-ruby-3.4', 'parsing', 'large', 'xml');

    expect(points).toHaveLength(1);
    expect(points[0].ips).toBe(12.0);
  });

  it('returns empty when no data matches', () => {
    const runs = [mkRun('2026-08-30', 'ubuntu-24.04-ruby-3.4', 'xml', 9.9, '1.18.2')];
    expect(buildTrend(runs, 'nokogiri', 'ubuntu-24.04-ruby-3.4', 'parsing', 'large', 'json')).toEqual([]);
    expect(buildTrend(runs, 'oga', 'ubuntu-24.04-ruby-3.4', 'parsing', 'large', 'xml')).toEqual([]);
  });
});
