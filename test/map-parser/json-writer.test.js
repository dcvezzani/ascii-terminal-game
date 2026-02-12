import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { writeJsonMap } from '../../src/map-parser/index.js';
import fs from 'fs/promises';

describe('JSON Writer', () => {
  const testData = {
    cells: [
      { glyph: 1, repeat: 10 },
      { glyph: 0 },
      { glyph: 2, repeat: 3 }
    ]
  };

  beforeEach(async () => {
    // Clean up any existing test files
    try {
      await fs.unlink('test-output.json');
    } catch (e) {
      // File doesn't exist, that's fine
    }
  });

  afterEach(async () => {
    // Clean up test files after each test
    try {
      await fs.unlink('test-output.json');
    } catch (e) {
      // File doesn't exist, that's fine
    }
  });

  it('should write JSON file with correct structure', async () => {
    await writeJsonMap(testData, 'test-output.json');
    const content = await fs.readFile('test-output.json', 'utf8');
    const parsed = JSON.parse(content);
    expect(parsed).toEqual(testData);
  });

  it('should create file in current directory', async () => {
    await writeJsonMap(testData, 'test-output.json');
    const stats = await fs.stat('test-output.json');
    expect(stats.isFile()).toBe(true);
  });

  it('should write properly formatted JSON', async () => {
    await writeJsonMap(testData, 'test-output.json');
    const content = await fs.readFile('test-output.json', 'utf8');
    expect(() => JSON.parse(content)).not.toThrow();
  });

  it('should throw error for invalid file path', async () => {
    const invalidPath = '/nonexistent/directory/test.json';
    await expect(writeJsonMap(testData, invalidPath)).rejects.toThrow();
  });

  it('should overwrite existing file', async () => {
    // Create initial file
    await fs.writeFile('test-output.json', '{"old": "data"}');
    
    // Overwrite with new data
    await writeJsonMap(testData, 'test-output.json');
    
    const content = await fs.readFile('test-output.json', 'utf8');
    const parsed = JSON.parse(content);
    expect(parsed).toEqual(testData);
  });
});