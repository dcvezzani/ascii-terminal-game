import { describe, it, expect, beforeEach } from 'vitest';
import {
  mkdtempSync,
  mkdirSync,
  writeFileSync,
  readFileSync,
  existsSync
} from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { ensureClientConfig, ensureServerConfig } from '../../src/cli/ensureConfig.js';

describe('ensureConfig (Phase 3.2)', () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = mkdtempSync(join(tmpdir(), 'ascii-tag-test-'));
  });

  it('when client config missing, creates .ascii-tag/client.json and returns defaults', () => {
    const stderrChunks = [];
    const fakeStderr = {
      write(chunk, _enc, cb) {
        stderrChunks.push(chunk);
        if (typeof cb === 'function') cb();
        return true;
      }
    };
    const config = ensureClientConfig(tmpDir, { stderr: fakeStderr });
    expect(config.websocket.url).toMatch(/^ws:\/\/localhost:\d+$/);
    expect(existsSync(join(tmpDir, '.ascii-tag', 'client.json'))).toBe(true);
    const content = JSON.parse(
      readFileSync(join(tmpDir, '.ascii-tag', 'client.json'), 'utf-8')
    );
    expect(content.websocket.url).toBe(config.websocket.url);
    expect(stderrChunks.join('')).toContain('.ascii-tag/client.json');
  });

  it('when client config exists, returns parsed content without writing', () => {
    const dir = join(tmpDir, '.ascii-tag');
    mkdirSync(dir, { recursive: true });
    const custom = {
      websocket: { url: 'ws://localhost:9999' },
      logging: { level: 'warn' }
    };
    writeFileSync(join(dir, 'client.json'), JSON.stringify(custom));
    const stderrChunks = [];
    const fakeStderr = {
      write(chunk) {
        stderrChunks.push(chunk);
        return true;
      }
    };
    const config = ensureClientConfig(tmpDir, { stderr: fakeStderr });
    expect(config.websocket.url).toBe('ws://localhost:9999');
    expect(config.logging.level).toBe('warn');
    expect(stderrChunks.length).toBe(0);
  });

  it('when client config exists but is invalid JSON, throws', () => {
    mkdirSync(join(tmpDir, '.ascii-tag'), { recursive: true });
    writeFileSync(join(tmpDir, '.ascii-tag', 'client.json'), '{ invalid');
    expect(() => ensureClientConfig(tmpDir)).toThrow();
  });

  it('when server config missing, creates .ascii-tag/server.json and returns defaults', () => {
    const stderrChunks = [];
    const fakeStderr = {
      write(chunk) {
        stderrChunks.push(chunk);
        return true;
      }
    };
    const config = ensureServerConfig(tmpDir, { stderr: fakeStderr });
    expect(config.websocket.port).toBeDefined();
    expect(existsSync(join(tmpDir, '.ascii-tag', 'server.json'))).toBe(true);
    expect(stderrChunks.join('')).toContain('.ascii-tag/server.json');
  });

  it('when server config exists, returns parsed content', () => {
    mkdirSync(join(tmpDir, '.ascii-tag'), { recursive: true });
    const custom = {
      websocket: { port: 4000 },
      logging: { level: 'debug' }
    };
    writeFileSync(
      join(tmpDir, '.ascii-tag', 'server.json'),
      JSON.stringify(custom)
    );
    const config = ensureServerConfig(tmpDir);
    expect(config.websocket.port).toBe(4000);
  });
});
