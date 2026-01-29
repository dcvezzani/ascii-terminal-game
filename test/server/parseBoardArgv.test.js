import { describe, it, expect } from 'vitest';
import { parseBoardPath } from '../../src/server/parseBoardArgv.js';

describe('parseBoardPath', () => {
  it('returns path when --board is provided', () => {
    const argv = ['node', 'index.js', '--board', 'boards/foo.json'];
    expect(parseBoardPath(argv)).toBe('boards/foo.json');
  });

  it('returns default when --board is not provided', () => {
    const argv = ['node', 'index.js'];
    expect(parseBoardPath(argv)).toBe('./boards/classic.json');
  });

  it('returns path for --board with nested path', () => {
    const argv = ['node', 'index.js', '--board', 'boards/levels/level1.json'];
    expect(parseBoardPath(argv)).toBe('boards/levels/level1.json');
  });
});
