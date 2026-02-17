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
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { runInit } from '../../src/cli/init.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(__dirname, '..', '..');

describe('init (Phase 6.1)', () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = mkdtempSync(join(tmpdir(), 'ascii-init-test-'));
  });

  it('in empty dir runInit creates both client.json and server.json', () => {
    const stderrChunks = [];
    const fakeStderr = { write(chunk) { stderrChunks.push(chunk); return true; } };
    runInit(tmpDir, { stderr: fakeStderr });
    expect(existsSync(join(tmpDir, '.ascii-tag', 'client.json'))).toBe(true);
    expect(existsSync(join(tmpDir, '.ascii-tag', 'server.json'))).toBe(true);
    const client = JSON.parse(readFileSync(join(tmpDir, '.ascii-tag', 'client.json'), 'utf-8'));
    const server = JSON.parse(readFileSync(join(tmpDir, '.ascii-tag', 'server.json'), 'utf-8'));
    expect(client.websocket.url).toMatch(/^ws:\/\/localhost:\d+$/);
    expect(server.websocket.port).toBeDefined();
  });

  it('runInit again does not overwrite existing files', () => {
    runInit(tmpDir);
    const clientPath = join(tmpDir, '.ascii-tag', 'client.json');
    const custom = { websocket: { url: 'ws://custom:9999' } };
    writeFileSync(clientPath, JSON.stringify(custom));
    runInit(tmpDir);
    const after = JSON.parse(readFileSync(clientPath, 'utf-8'));
    expect(after.websocket.url).toBe('ws://custom:9999');
  });

  it('with only client.json present runInit creates only server.json', () => {
    mkdirSync(join(tmpDir, '.ascii-tag'), { recursive: true });
    writeFileSync(join(tmpDir, '.ascii-tag', 'client.json'), '{"custom":true}');
    runInit(tmpDir);
    expect(existsSync(join(tmpDir, '.ascii-tag', 'server.json'))).toBe(true);
    expect(readFileSync(join(tmpDir, '.ascii-tag', 'client.json'), 'utf-8')).toBe('{"custom":true}');
  });
});
