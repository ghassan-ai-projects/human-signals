import { beforeEach, describe, expect, it } from 'vitest';
import {
  clearDiagnostics,
  formatDiagnostics,
  readDiagnostics,
  recordDiagnostic,
} from '../../src/platform/diagnostics.ts';

describe('local diagnostics buffer', () => {
  beforeEach(() => {
    clearDiagnostics();
  });

  it('keeps at most 100 entries and drops the oldest first', () => {
    for (let i = 0; i < 120; i += 1) recordDiagnostic('CONTENT_NETWORK', 'home');
    expect(readDiagnostics()).toHaveLength(100);
  });

  it('records only the fields document 08 allows', () => {
    recordDiagnostic('WEBGL_UNAVAILABLE', 'journey');
    const entry = readDiagnostics()[0]!;
    expect(Object.keys(entry).sort()).toEqual(['appBuild', 'at', 'code', 'contentVersion', 'routeKind']);
  });

  it('formats a plain-text report the user can read before copying', () => {
    expect(formatDiagnostics()).toContain('no recorded events');
    recordDiagnostic('STORAGE_UNAVAILABLE', 'learn');
    expect(formatDiagnostics()).toContain('STORAGE_UNAVAILABLE');
  });
});
