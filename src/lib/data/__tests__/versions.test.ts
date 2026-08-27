import { describe, it, expect } from 'vitest';
import { buildVersionTimeline } from '../versions';
import type { ParsedRun } from '../types';

function mkRun(date: string, serializer: string, version: string): ParsedRun {
  return {
    date,
    platform: 'ubuntu-24.04',
    ruby: '3.4',
    format: 'xml',
    envKey: 'ubuntu-24.04-ruby-3.4',
    serializers: [{ name: serializer, version }],
    platform_info: { os: 'linux', arch: 'x86_64', ruby_version: '3.4' },
    parsing: {},
    generation: {},
    streaming: {},
    memory: {},
  };
}

describe('buildVersionTimeline', () => {
  it('groups consecutive runs with the same version', () => {
    const runs = [
      mkRun('2026-08-30', 'nokogiri', '1.18.2'),
      mkRun('2026-09-06', 'nokogiri', '1.18.2'),
      mkRun('2026-09-13', 'nokogiri', '1.18.2'),
    ];
    const timeline = buildVersionTimeline(runs, 'nokogiri');

    expect(timeline).toHaveLength(1);
    expect(timeline[0].version).toBe('1.18.2');
    expect(timeline[0].from).toBe('2026-08-30');
    expect(timeline[0].to).toBe('2026-09-13');
  });

  it('creates a new span when the version changes', () => {
    const runs = [
      mkRun('2026-08-30', 'nokogiri', '1.18.2'),
      mkRun('2026-09-06', 'nokogiri', '1.18.2'),
      mkRun('2026-09-13', 'nokogiri', '1.19.4'),
      mkRun('2026-09-20', 'nokogiri', '1.19.4'),
    ];
    const timeline = buildVersionTimeline(runs, 'nokogiri');

    expect(timeline).toHaveLength(2);
    expect(timeline[0]).toEqual({ version: '1.18.2', from: '2026-08-30', to: '2026-09-06' });
    expect(timeline[1]).toEqual({ version: '1.19.4', from: '2026-09-13', to: '2026-09-20' });
  });

  it('handles a single run', () => {
    const runs = [mkRun('2026-08-30', 'leptris', '1.6.0')];
    const timeline = buildVersionTimeline(runs, 'leptris');

    expect(timeline).toHaveLength(1);
    expect(timeline[0]).toEqual({ version: '1.6.0', from: '2026-08-30', to: '2026-08-30' });
  });

  it('returns empty for a serializer that never ran', () => {
    const runs = [mkRun('2026-08-30', 'nokogiri', '1.18.2')];
    expect(buildVersionTimeline(runs, 'oga')).toEqual([]);
  });
});
