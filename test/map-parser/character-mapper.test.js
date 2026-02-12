import { describe, it, expect } from 'vitest';
import { mapCharacters } from '../../src/map-parser/index.js';

describe('Character Mapper', () => {
  it('should map hash (#) to glyph 1', () => {
    const input = '#';
    const expected = [1];
    expect(mapCharacters(input)).toEqual(expected);
  });

  it('should map at (@) to glyph 2', () => {
    const input = '@';
    const expected = [2];
    expect(mapCharacters(input)).toEqual(expected);
  });

  it('should map space ( ) to glyph 0', () => {
    const input = ' ';
    const expected = [0];
    expect(mapCharacters(input)).toEqual(expected);
  });

  it('should throw error for invalid characters', () => {
    const input = 'X';
    expect(() => mapCharacters(input)).toThrow('Invalid character: X');
  });

  it('should map mixed content correctly', () => {
    const input = '# @ ';
    const expected = [1, 0, 2, 0];
    expect(mapCharacters(input)).toEqual(expected);
  });
});