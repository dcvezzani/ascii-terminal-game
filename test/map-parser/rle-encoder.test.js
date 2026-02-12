import { describe, it, expect } from 'vitest';
import { runLengthEncode } from '../../src/map-parser/index.js';

describe('Run-Length Encoder', () => {
  it('should encode single glyph without repeat property', () => {
    const input = [1];
    const expected = [{ entity: 1 }];
    expect(runLengthEncode(input)).toEqual(expected);
  });

  it('should encode repeated glyphs with repeat property', () => {
    const input = [1, 1, 1];
    const expected = [{ entity: 1, repeat: 3 }];
    expect(runLengthEncode(input)).toEqual(expected);
  });

  it('should encode alternating glyphs correctly', () => {
    const input = [1, 0, 1, 0];
    const expected = [
      { entity: 1 },
      { entity: 0 },
      { entity: 1 },
      { entity: 0 }
    ];
    expect(runLengthEncode(input)).toEqual(expected);
  });

  it('should encode mixed repeated and single glyphs', () => {
    const input = [1, 1, 0, 2, 2, 2, 1];
    const expected = [
      { entity: 1, repeat: 2 },
      { entity: 0 },
      { entity: 2, repeat: 3 },
      { entity: 1 }
    ];
    expect(runLengthEncode(input)).toEqual(expected);
  });

  it('should handle empty array', () => {
    const input = [];
    const expected = [];
    expect(runLengthEncode(input)).toEqual(expected);
  });
});