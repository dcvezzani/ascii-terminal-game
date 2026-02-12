import { describe, it, expect } from 'vitest';
import { readMapFile } from '../../src/map-parser/index.js';

describe('File Reader', () => {
  it('should throw error when file does not exist', async () => {
    await expect(readMapFile('nonexistent.txt')).rejects.toThrow();
  });

  it('should read existing file content', async () => {
    // Using the existing boards/map1.txt
    const content = await readMapFile('boards/map1.txt');
    expect(typeof content).toBe('string');
    expect(content.length).toBeGreaterThan(0);
  });

  it('should throw error for empty file', async () => {
    // Create temporary empty file for testing
    const fs = await import('fs/promises');
    await fs.writeFile('test-empty.txt', '');
    await expect(readMapFile('test-empty.txt')).rejects.toThrow();
    await fs.unlink('test-empty.txt');
  });

  it('should handle file with only whitespace', async () => {
    const fs = await import('fs/promises');
    await fs.writeFile('test-whitespace.txt', '   \n   \n   ');
    await expect(readMapFile('test-whitespace.txt')).rejects.toThrow();
    await fs.unlink('test-whitespace.txt');
  });

  it('should preserve exact content including newlines', async () => {
    const content = await readMapFile('boards/map1.txt');
    // Should contain the exact map structure
    expect(content).toContain('#');
    expect(content).toContain('@');
    expect(content).toContain('\n');
  });
});