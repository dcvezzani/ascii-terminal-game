import { describe, it, expect } from 'vitest';
import logger from '../../src/utils/logger.js';

describe('logger', () => {
  it('should be defined', () => {
    expect(logger).toBeDefined();
  });

  it('should have log methods', () => {
    expect(typeof logger.info).toBe('function');
    expect(typeof logger.error).toBe('function');
    expect(typeof logger.warn).toBe('function');
    expect(typeof logger.debug).toBe('function');
  });

  it('should log messages', () => {
    // Just verify logger doesn't throw
    expect(() => logger.info('test message')).not.toThrow();
  });
});
