/**
 * Unit tests for dotenv environment variable loading
 * Tests Phase 1: dotenv support
 */

import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import dotenv from 'dotenv';
import { readFileSync, writeFileSync, unlinkSync, existsSync } from 'fs';
import { join } from 'path';

describe('dotenv Environment Variable Loading', () => {
  let originalEnv;
  const testEnvPath = join(process.cwd(), '.env.test');

  beforeEach(() => {
    // Save original environment
    originalEnv = { ...process.env };
    // Clear any existing env vars we're testing
    delete process.env.TEST_ENV_VAR;
    delete process.env.WEBSOCKET_URL;
    delete process.env.DOTENV_TEST_VAR;
    
    // Clean up test .env file if it exists
    if (existsSync(testEnvPath)) {
      unlinkSync(testEnvPath);
    }
  });

  afterEach(() => {
    // Restore original environment
    process.env = originalEnv;
    // Clean up test .env file
    if (existsSync(testEnvPath)) {
      unlinkSync(testEnvPath);
    }
    vi.clearAllMocks();
  });

  test('should be able to access environment variables', () => {
    // Set a test environment variable
    process.env.TEST_ENV_VAR = 'test-value';
    
    // Verify it's accessible
    expect(process.env.TEST_ENV_VAR).toBe('test-value');
  });

  test('should load environment variables from .env file', () => {
    // Create a test .env file
    writeFileSync(testEnvPath, 'DOTENV_TEST_VAR=loaded-from-file\n');
    
    // Load it using dotenv
    const result = dotenv.config({ path: testEnvPath });
    
    // Verify dotenv loaded successfully
    expect(result.error).toBeUndefined();
    expect(result.parsed).toBeDefined();
    
    // Verify the variable is accessible
    expect(process.env.DOTENV_TEST_VAR).toBe('loaded-from-file');
  });

  test('should handle missing .env file gracefully', () => {
    // Try to load a non-existent .env file
    const result = dotenv.config({ path: '.env.non-existent' });
    
    // Should not throw error, but should indicate file not found
    expect(result.error).toBeDefined();
    expect(result.error.code).toBe('ENOENT');
  });

  test('should load multiple environment variables from .env file', () => {
    // Create a test .env file with multiple variables
    writeFileSync(
      testEnvPath,
      'VAR1=value1\nVAR2=value2\nVAR3=value3\n'
    );
    
    // Load it using dotenv
    const result = dotenv.config({ path: testEnvPath });
    
    // Verify dotenv loaded successfully
    expect(result.error).toBeUndefined();
    
    // Verify all variables are accessible
    expect(process.env.VAR1).toBe('value1');
    expect(process.env.VAR2).toBe('value2');
    expect(process.env.VAR3).toBe('value3');
  });
});

