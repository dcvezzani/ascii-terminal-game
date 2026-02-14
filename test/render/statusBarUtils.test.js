import { describe, it, expect } from 'vitest';
import {
  wrapAtSpaces,
  buildLine1,
  buildLine2,
  buildSimplifiedLine,
  padToWidth,
  formatBoxTopBottom,
  formatBoxRow
} from '../../src/render/statusBarUtils.js';

describe('wrapAtSpaces', () => {
  it('returns single segment for short string within maxWidth', () => {
    expect(wrapAtSpaces('Hi', 10)).toEqual(['Hi']);
  });

  it('returns single element when string fits on one line', () => {
    const str = 'Score: 0 | Position: (10, 12)';
    expect(wrapAtSpaces(str, 80)).toEqual([str]);
  });

  it('splits at spaces when string exceeds maxWidth', () => {
    const str = 'Score: 0 | Position: (10, 12)';
    const result = wrapAtSpaces(str, 15);
    expect(result.every(line => line.length <= 15)).toBe(true);
    expect(result.join(' ')).toBe(str);
  });

  it('places single token longer than maxWidth on its own line', () => {
    const str = 'Hello';
    expect(wrapAtSpaces(str, 2)).toEqual(['Hello']);
  });

  it('returns single empty string for empty input', () => {
    expect(wrapAtSpaces('', 10)).toEqual(['']);
  });
});

describe('buildLine1', () => {
  it('returns score and position string', () => {
    expect(buildLine1(0, { x: 10, y: 12 })).toBe('Score: 0 | Position: (10, 12)');
  });

  it('uses (?, ?) when position is null', () => {
    const result = buildLine1(0, null);
    expect(result).toContain('Position: (?, ?)');
    expect(result).toContain('Score: 0');
  });

  it('uses (?, ?) when position is undefined', () => {
    const result = buildLine1(5, undefined);
    expect(result).toContain('Position: (?, ?)');
    expect(result).toContain('Score: 5');
  });
});

describe('buildLine2', () => {
  it('returns fixed instructions string', () => {
    expect(buildLine2()).toBe('Arrow keys/WASD to move, Q/ESC to quit');
  });
});

describe('buildSimplifiedLine', () => {
  it('returns abbreviated score and position', () => {
    expect(buildSimplifiedLine(0, { x: 10, y: 12 })).toBe('S: 0 | P: (10, 12)');
  });

  it('uses P: (?, ?) when position is null', () => {
    const result = buildSimplifiedLine(0, null);
    expect(result).toContain('P: (?, ?)');
    expect(result).toContain('S: 0');
  });

  it('uses P: (?, ?) when position is undefined', () => {
    const result = buildSimplifiedLine(3, undefined);
    expect(result).toContain('P: (?, ?)');
    expect(result).toContain('S: 3');
  });
});

describe('padToWidth', () => {
  it('pads short string with spaces', () => {
    expect(padToWidth('Hi', 5)).toBe('Hi   ');
    expect(padToWidth('Hi', 5).length).toBe(5);
  });

  it('returns string unchanged when length equals width', () => {
    expect(padToWidth('Hello', 5)).toBe('Hello');
  });

  it('truncates long string', () => {
    expect(padToWidth('Hello', 3)).toBe('Hel');
  });
});

describe('formatBoxTopBottom', () => {
  it('returns boardWidth dash characters for top/bottom border', () => {
    expect(formatBoxTopBottom(5)).toBe('-----');
    expect(formatBoxTopBottom(10)).toBe('----------');
  });
});

describe('formatBoxRow', () => {
  it('wraps content in | with padding to boardWidth', () => {
    const row = formatBoxRow('Score: 0', 20);
    expect(row).toMatch(/^\| .* \|$/);
    expect(row.length).toBe(20);
    expect(row).toContain('Score: 0');
  });
});
