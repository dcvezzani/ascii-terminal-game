import { describe, it, expect } from 'vitest';
import { validateDimensions, DEFAULT_WIDTH, DEFAULT_HEIGHT } from '../../src/map-parser/index.js';

describe('Dimension Validator', () => {
  it('should throw error for content with too few rows', () => {
    const content = '#\n'.repeat(DEFAULT_HEIGHT - 1);
    expect(() => validateDimensions(content)).toThrow(`Expected ${DEFAULT_HEIGHT} rows, got ${DEFAULT_HEIGHT - 1}`);
  });

  it('should throw error for content with too many rows', () => {
    const content = '#\n'.repeat(DEFAULT_HEIGHT + 1);
    expect(() => validateDimensions(content)).toThrow(`Expected ${DEFAULT_HEIGHT} rows, got ${DEFAULT_HEIGHT + 1}`);
  });

  it('should throw error for content with too few columns', () => {
    const content = Array(DEFAULT_HEIGHT).fill('#'.repeat(DEFAULT_WIDTH - 1)).join('\n');
    expect(() => validateDimensions(content)).toThrow(`Expected ${DEFAULT_WIDTH} columns, got ${DEFAULT_WIDTH - 1}`);
  });

  it('should throw error for content with too many columns', () => {
    const content = Array(DEFAULT_HEIGHT).fill('#'.repeat(DEFAULT_WIDTH + 1)).join('\n');
    expect(() => validateDimensions(content)).toThrow(`Expected ${DEFAULT_WIDTH} columns, got ${DEFAULT_WIDTH + 1}`);
  });

  it('should pass validation for correct default dimensions', () => {
    const content = Array(DEFAULT_HEIGHT).fill('#'.repeat(DEFAULT_WIDTH)).join('\n');
    expect(() => validateDimensions(content)).not.toThrow();
  });
});