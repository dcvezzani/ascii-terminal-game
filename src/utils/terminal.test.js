import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { getTerminalSize, validateTerminalSize, getHorizontalCenter, getVerticalCenter } from './terminal.js';

describe('Terminal Utilities', () => {
  describe('getTerminalSize()', () => {
    test('Returns object with rows and columns properties', () => {
      const size = getTerminalSize();
      expect(size).toHaveProperty('rows');
      expect(size).toHaveProperty('columns');
    });

    test('Returns valid numbers (not null/undefined)', () => {
      const size = getTerminalSize();
      expect(typeof size.rows).toBe('number');
      expect(typeof size.columns).toBe('number');
      expect(size.rows).not.toBeNull();
      expect(size.columns).not.toBeNull();
      expect(size.rows).not.toBeUndefined();
      expect(size.columns).not.toBeUndefined();
    });

    test('Returns reasonable default values if process.stdout.rows/columns unavailable', () => {
      // Save original values
      const originalRows = process.stdout.rows;
      const originalColumns = process.stdout.columns;
      
      // Temporarily remove properties
      delete process.stdout.rows;
      delete process.stdout.columns;
      
      const size = getTerminalSize();
      expect(size.rows).toBe(24); // Default
      expect(size.columns).toBe(80); // Default
      
      // Restore original values
      process.stdout.rows = originalRows;
      process.stdout.columns = originalColumns;
    });

    test('Values are positive integers', () => {
      const size = getTerminalSize();
      expect(size.rows).toBeGreaterThan(0);
      expect(size.columns).toBeGreaterThan(0);
      expect(Number.isInteger(size.rows)).toBe(true);
      expect(Number.isInteger(size.columns)).toBe(true);
    });
  });

  describe('validateTerminalSize()', () => {
    test('Returns valid: true for terminal meeting minimum requirements', () => {
      // Mock a large terminal
      const originalRows = process.stdout.rows;
      const originalColumns = process.stdout.columns;
      process.stdout.rows = 30;
      process.stdout.columns = 40;
      
      const result = validateTerminalSize(25, 30);
      expect(result.valid).toBe(true);
      expect(result.rows).toBe(30);
      expect(result.columns).toBe(40);
      expect(result.message).toBeUndefined();
      
      // Restore
      process.stdout.rows = originalRows;
      process.stdout.columns = originalColumns;
    });

    test('Returns valid: false for terminal too small (rows)', () => {
      const originalRows = process.stdout.rows;
      const originalColumns = process.stdout.columns;
      process.stdout.rows = 20;
      process.stdout.columns = 40;
      
      const result = validateTerminalSize(25, 30);
      expect(result.valid).toBe(false);
      expect(result.rows).toBe(20);
      expect(result.columns).toBe(40);
      expect(result.message).toContain('Terminal size too small');
      
      // Restore
      process.stdout.rows = originalRows;
      process.stdout.columns = originalColumns;
    });

    test('Returns valid: false for terminal too small (columns)', () => {
      const originalRows = process.stdout.rows;
      const originalColumns = process.stdout.columns;
      process.stdout.rows = 30;
      process.stdout.columns = 20;
      
      const result = validateTerminalSize(25, 30);
      expect(result.valid).toBe(false);
      expect(result.rows).toBe(30);
      expect(result.columns).toBe(20);
      expect(result.message).toContain('Terminal size too small');
      
      // Restore
      process.stdout.rows = originalRows;
      process.stdout.columns = originalColumns;
    });

    test('Returns valid: false for terminal too small (both dimensions)', () => {
      const originalRows = process.stdout.rows;
      const originalColumns = process.stdout.columns;
      process.stdout.rows = 20;
      process.stdout.columns = 20;
      
      const result = validateTerminalSize(25, 30);
      expect(result.valid).toBe(false);
      expect(result.message).toContain('Terminal size too small');
      
      // Restore
      process.stdout.rows = originalRows;
      process.stdout.columns = originalColumns;
    });

    test('Returns correct current size in result object', () => {
      const originalRows = process.stdout.rows;
      const originalColumns = process.stdout.columns;
      process.stdout.rows = 30;
      process.stdout.columns = 50;
      
      const result = validateTerminalSize(25, 30);
      expect(result.rows).toBe(30);
      expect(result.columns).toBe(50);
      
      // Restore
      process.stdout.rows = originalRows;
      process.stdout.columns = originalColumns;
    });

    test('Returns error message when terminal too small', () => {
      const originalRows = process.stdout.rows;
      const originalColumns = process.stdout.columns;
      process.stdout.rows = 20;
      process.stdout.columns = 20;
      
      const result = validateTerminalSize(25, 30);
      expect(result.message).toBeDefined();
      expect(result.message).toContain('Required: 25x30');
      expect(result.message).toContain('Current: 20x20');
      
      // Restore
      process.stdout.rows = originalRows;
      process.stdout.columns = originalColumns;
    });

    test('Uses default minimums (25x30) when not specified', () => {
      const originalRows = process.stdout.rows;
      const originalColumns = process.stdout.columns;
      process.stdout.rows = 20;
      process.stdout.columns = 20;
      
      const result = validateTerminalSize();
      expect(result.valid).toBe(false);
      expect(result.message).toContain('Required: 25x30');
      
      // Restore
      process.stdout.rows = originalRows;
      process.stdout.columns = originalColumns;
    });

    test('Accepts custom minimum size parameters', () => {
      const originalRows = process.stdout.rows;
      const originalColumns = process.stdout.columns;
      process.stdout.rows = 30;
      process.stdout.columns = 50;
      
      const result = validateTerminalSize(35, 60);
      expect(result.valid).toBe(false);
      expect(result.message).toContain('Required: 35x60');
      
      // Restore
      process.stdout.rows = originalRows;
      process.stdout.columns = originalColumns;
    });

    test('Handles edge case: terminal exactly at minimum size', () => {
      const originalRows = process.stdout.rows;
      const originalColumns = process.stdout.columns;
      process.stdout.rows = 25;
      process.stdout.columns = 30;
      
      const result = validateTerminalSize(25, 30);
      expect(result.valid).toBe(true);
      
      // Restore
      process.stdout.rows = originalRows;
      process.stdout.columns = originalColumns;
    });
  });

  describe('getHorizontalCenter()', () => {
    test('Returns correct center offset for content', () => {
      const originalColumns = process.stdout.columns;
      process.stdout.columns = 80;
      
      const offset = getHorizontalCenter(20);
      expect(offset).toBe(30); // (80 - 20) / 2 = 30
      
      // Restore
      process.stdout.columns = originalColumns;
    });

    test('Returns 0 or positive number (never negative)', () => {
      const originalColumns = process.stdout.columns;
      process.stdout.columns = 10;
      
      const offset = getHorizontalCenter(20);
      expect(offset).toBeGreaterThanOrEqual(0);
      
      // Restore
      process.stdout.columns = originalColumns;
    });

    test('Centers correctly for odd-width content', () => {
      const originalColumns = process.stdout.columns;
      process.stdout.columns = 81;
      
      const offset = getHorizontalCenter(21);
      expect(offset).toBe(30); // (81 - 21) / 2 = 30
      
      // Restore
      process.stdout.columns = originalColumns;
    });

    test('Centers correctly for even-width content', () => {
      const originalColumns = process.stdout.columns;
      process.stdout.columns = 80;
      
      const offset = getHorizontalCenter(20);
      expect(offset).toBe(30); // (80 - 20) / 2 = 30
      
      // Restore
      process.stdout.columns = originalColumns;
    });

    test('Uses current terminal width when not specified', () => {
      const originalColumns = process.stdout.columns;
      process.stdout.columns = 100;
      
      const offset = getHorizontalCenter(20);
      expect(offset).toBe(40); // (100 - 20) / 2 = 40
      
      // Restore
      process.stdout.columns = originalColumns;
    });

    test('Accepts custom terminal width parameter', () => {
      const offset = getHorizontalCenter(20, 100);
      expect(offset).toBe(40); // (100 - 20) / 2 = 40
    });

    test('Handles content wider than terminal (returns 0)', () => {
      const originalColumns = process.stdout.columns;
      process.stdout.columns = 10;
      
      const offset = getHorizontalCenter(20);
      expect(offset).toBe(0);
      
      // Restore
      process.stdout.columns = originalColumns;
    });
  });

  describe('getVerticalCenter()', () => {
    test('Returns correct center offset for content', () => {
      const originalRows = process.stdout.rows;
      process.stdout.rows = 50;
      
      const offset = getVerticalCenter(20);
      expect(offset).toBe(15); // (50 - 20) / 2 = 15
      
      // Restore
      process.stdout.rows = originalRows;
    });

    test('Returns 0 or positive number (never negative)', () => {
      const originalRows = process.stdout.rows;
      process.stdout.rows = 10;
      
      const offset = getVerticalCenter(20);
      expect(offset).toBeGreaterThanOrEqual(0);
      
      // Restore
      process.stdout.rows = originalRows;
    });

    test('Centers correctly for odd-height content', () => {
      const originalRows = process.stdout.rows;
      process.stdout.rows = 51;
      
      const offset = getVerticalCenter(21);
      expect(offset).toBe(15); // (51 - 21) / 2 = 15
      
      // Restore
      process.stdout.rows = originalRows;
    });

    test('Centers correctly for even-height content', () => {
      const originalRows = process.stdout.rows;
      process.stdout.rows = 50;
      
      const offset = getVerticalCenter(20);
      expect(offset).toBe(15); // (50 - 20) / 2 = 15
      
      // Restore
      process.stdout.rows = originalRows;
    });

    test('Uses current terminal height when not specified', () => {
      const originalRows = process.stdout.rows;
      process.stdout.rows = 60;
      
      const offset = getVerticalCenter(20);
      expect(offset).toBe(20); // (60 - 20) / 2 = 20
      
      // Restore
      process.stdout.rows = originalRows;
    });

    test('Accepts custom terminal height parameter', () => {
      const offset = getVerticalCenter(20, 60);
      expect(offset).toBe(20); // (60 - 20) / 2 = 20
    });

    test('Handles content taller than terminal (returns 0)', () => {
      const originalRows = process.stdout.rows;
      process.stdout.rows = 10;
      
      const offset = getVerticalCenter(20);
      expect(offset).toBe(0);
      
      // Restore
      process.stdout.rows = originalRows;
    });
  });
});

