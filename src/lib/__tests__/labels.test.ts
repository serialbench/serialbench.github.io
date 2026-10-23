import { describe, expect, it } from 'vitest';
import { environmentLabel, runnerShortLabel, runtimeName } from '../dashboard';
import type { Environment } from '../dashboard';

function env(runtime?: string, rubyVersion = '3.4'): Environment {
  return { ruby_version: rubyVersion, os: 'macos', arch: 'arm64', timestamp: '2026-10-21', runtime };
}

describe('runtime labels', () => {
  it('names known runtimes', () => {
    expect(runtimeName('ruby')).toBe('Ruby');
    expect(runtimeName('python')).toBe('Python');
    expect(runtimeName('c')).toBe('C');
    expect(runtimeName('rust')).toBe('Rust');
    expect(runtimeName('js')).toBe('JavaScript');
  });

  it('defaults to Ruby when the environment predates the runtime field', () => {
    expect(runtimeName(undefined)).toBe('Ruby');
    expect(runtimeName('forth')).toBe('forth');
  });

  it('labels runner-shaped keys per runtime', () => {
    expect(environmentLabel('macos-26-ruby-3.4.8', env('ruby', '3.4.8'))).toBe('macOS 26 · arm64 · Ruby 3.4.8');
    expect(environmentLabel('ubuntu-24.04-python-3.13', env('python', '3.13'))).toBe('Ubuntu 24.04 · arm64 · Python 3.13');
    expect(environmentLabel('macos-26-intel-c-gcc', { ...env('c', 'gcc'), arch: 'x86_64' })).toBe('macOS 26 Intel · x64 · C gcc');
    expect(environmentLabel('ubuntu-24.04-rust-1.98.0', env('rust', '1.98.0'))).toBe('Ubuntu 24.04 · arm64 · Rust 1.98.0');
    expect(environmentLabel('macos-26-js-24.14.0', env('js', '24.14.0'))).toBe('macOS 26 · arm64 · JavaScript 24.14.0');
  });

  it('labels non-runner keys per runtime', () => {
    expect(environmentLabel('local-3.4', { ...env('ruby', '3.4'), os: 'macos' })).toBe('macOS · arm64 · Ruby 3.4');
  });

  it('strips any runtime segment from short runner labels', () => {
    expect(runnerShortLabel('macos-26-intel-ruby-3.4', env('ruby'))).toBe('macOS 26 Intel');
    expect(runnerShortLabel('ubuntu-24.04-c-gcc', env('c'))).toBe('Ubuntu 24.04');
    expect(runnerShortLabel('windows-2025-python-3.12', { ...env('python'), os: 'windows' })).toBe('Windows 2025');
  });
});
