import { describe, it, expect } from 'vitest';
import { resolveRenderingConfig } from '../../src/config/resolveRendering.js';

describe('resolveRenderingConfig', () => {
  const configWithResizeDebounce = (ms) => ({
    rendering: { resizeDebounceMs: ms }
  });

  describe('resizeDebounceMs precedence', () => {
    it('uses CLI value when --resize-debounce=N is valid', () => {
      const argv = ['node', 'index.js', '--resize-debounce=100'];
      const result = resolveRenderingConfig(configWithResizeDebounce(200), { argv, env: {} });
      expect(result.resizeDebounceMs).toBe(100);
    });

    it('uses env RESIZE_DEBOUNCE_MS when no valid CLI', () => {
      const argv = ['node', 'index.js'];
      const env = { RESIZE_DEBOUNCE_MS: '300' };
      const result = resolveRenderingConfig(configWithResizeDebounce(200), { argv, env });
      expect(result.resizeDebounceMs).toBe(300);
    });

    it('CLI overrides env when both set', () => {
      const argv = ['node', 'index.js', '--resize-debounce=100'];
      const env = { RESIZE_DEBOUNCE_MS: '300' };
      const result = resolveRenderingConfig(configWithResizeDebounce(200), { argv, env });
      expect(result.resizeDebounceMs).toBe(100);
    });

    it('uses config file value when env and CLI not set', () => {
      const argv = ['node', 'index.js'];
      const result = resolveRenderingConfig(configWithResizeDebounce(200), { argv, env: {} });
      expect(result.resizeDebounceMs).toBe(200);
    });

    it('defaults to 250 when no valid CLI, env, or config', () => {
      const argv = ['node', 'index.js'];
      const result = resolveRenderingConfig({ rendering: {} }, { argv, env: {} });
      expect(result.resizeDebounceMs).toBe(250);
    });

    it('defaults to 250 when config has no rendering', () => {
      const argv = ['node', 'index.js'];
      const result = resolveRenderingConfig({}, { argv, env: {} });
      expect(result.resizeDebounceMs).toBe(250);
    });
  });

  describe('invalid values fall back without throwing', () => {
    it('invalid CLI falls back to env', () => {
      const argv = ['node', 'index.js', '--resize-debounce=abc'];
      const env = { RESIZE_DEBOUNCE_MS: '300' };
      const result = resolveRenderingConfig(configWithResizeDebounce(200), { argv, env });
      expect(result.resizeDebounceMs).toBe(300);
    });

    it('invalid CLI and invalid env fall back to config', () => {
      const argv = ['node', 'index.js', '--resize-debounce=0'];
      const env = { RESIZE_DEBOUNCE_MS: '-1' };
      const result = resolveRenderingConfig(configWithResizeDebounce(200), { argv, env });
      expect(result.resizeDebounceMs).toBe(200);
    });

    it('all invalid fall back to 250', () => {
      const argv = ['node', 'index.js', '--resize-debounce=0'];
      const env = { RESIZE_DEBOUNCE_MS: 'x' };
      const result = resolveRenderingConfig(configWithResizeDebounce(-5), { argv, env });
      expect(result.resizeDebounceMs).toBe(250);
    });

    it('missing RESIZE_DEBOUNCE_MS uses config then default', () => {
      const argv = ['node', 'index.js'];
      const env = {};
      const result = resolveRenderingConfig(configWithResizeDebounce(200), { argv, env });
      expect(result.resizeDebounceMs).toBe(200);
    });
  });
});
