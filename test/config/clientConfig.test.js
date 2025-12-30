/**
 * Unit tests for client configuration
 * Tests Phase 1.1: Prediction configuration
 */

import { describe, test, expect } from 'vitest';
import { clientConfig } from '../../src/config/clientConfig.js';

describe('Client Configuration - Phase 1.1', () => {
  describe('prediction configuration', () => {
    test('should have a prediction object', () => {
      expect(clientConfig).toHaveProperty('prediction');
      expect(typeof clientConfig.prediction).toBe('object');
    });

    test('prediction should have enabled property', () => {
      expect(clientConfig.prediction).toHaveProperty('enabled');
      expect(typeof clientConfig.prediction.enabled).toBe('boolean');
      expect(clientConfig.prediction.enabled).toBe(true);
    });

    test('prediction should have reconciliationInterval property', () => {
      expect(clientConfig.prediction).toHaveProperty('reconciliationInterval');
      expect(typeof clientConfig.prediction.reconciliationInterval).toBe('number');
      expect(clientConfig.prediction.reconciliationInterval).toBe(5000);
    });
  });
});
