import { describe, it, expect } from 'vitest';
import { parseResultsYaml } from '../parser';
import { load as yamlLoad } from 'js-yaml';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const fixtureDir = resolve(__dirname, 'fixtures/runs/2026-08-30');

function loadFixture(name: string) {
  const content = readFileSync(resolve(fixtureDir, name), 'utf8');
  return yamlLoad(content) as Record<string, any>;
}

describe('parseResultsYaml', () => {
  it('parses a valid results file with platform info from the filename', () => {
    const data = loadFixture('ubuntu-24.04-ruby-3.4.xml.yaml');
    const run = parseResultsYaml({ ...data, __path: 'runs/2026-08-30/ubuntu-24.04-ruby-3.4.xml.yaml' }, 'ubuntu-24.04-ruby-3.4.xml.yaml');

    expect(run).not.toBeNull();
    expect(run!.platform).toBe('ubuntu-24.04');
    expect(run!.ruby).toBe('3.4');
    expect(run!.format).toBe('xml');
    expect(run!.date).toBe('2026-08-30');
    expect(run!.envKey).toBe('ubuntu-24.04-ruby-3.4');
  });

  it('extracts serializer versions', () => {
    const data = loadFixture('ubuntu-24.04-ruby-3.4.xml.yaml');
    const run = parseResultsYaml({ ...data, __path: 'runs/2026-08-30/ubuntu-24.04-ruby-3.4.xml.yaml' }, 'ubuntu-24.04-ruby-3.4.xml.yaml');

    const nokogiri = run!.serializers.find((s) => s.name === 'nokogiri');
    expect(nokogiri?.version).toBe('1.18.2');
    const leptris = run!.serializers.find((s) => s.name === 'leptris');
    expect(leptris?.version).toBe('1.6.0');
  });

  it('indexes parsing metrics by serializer and size', () => {
    const data = loadFixture('ubuntu-24.04-ruby-3.4.xml.yaml');
    const run = parseResultsYaml({ ...data, __path: 'runs/2026-08-30/ubuntu-24.04-ruby-3.4.xml.yaml' }, 'ubuntu-24.04-ruby-3.4.xml.yaml');

    expect(run!.parsing['nokogiri']['small'].iterations_per_second).toBe(1900);
    expect(run!.parsing['nokogiri']['large'].iterations_per_second).toBe(9.9);
    expect(run!.parsing['leptris']['large'].iterations_per_second).toBe(123);
  });

  it('returns null for unparseable filenames', () => {
    expect(parseResultsYaml({}, 'not-a-valid-name.yaml')).toBeNull();
    expect(parseResultsYaml({}, '')).toBeNull();
  });

  it('returns null when no date is available', () => {
    const data = loadFixture('ubuntu-24.04-ruby-3.4.xml.yaml');
    expect(parseResultsYaml(data, 'ubuntu-24.04-ruby-3.4.xml.yaml')).toBeNull();
  });
});
