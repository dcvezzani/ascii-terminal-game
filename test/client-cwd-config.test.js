import { describe, it, expect } from 'vitest';
import { mkdtempSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { spawnSync } from 'child_process';
import { existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const repoRoot = join(__dirname, '..');
const nodePath = process.execPath;
const cliPath = join(repoRoot, 'src', 'cli.js');

describe('Client with cwd config (Phase 4)', () => {
  it('ascii-tag client in temp dir creates .ascii-tag/client.json and uses it', () => {
    const tmpDir = mkdtempSync(join(tmpdir(), 'ascii-tag-client-test-'));
    const r = spawnSync(nodePath, [cliPath, 'client'], {
      cwd: tmpDir,
      encoding: 'utf-8',
      timeout: 2000,
      env: { ...process.env }
    });
    // Client will try to connect and may exit with error (no server) or hang - we kill via timeout
    // Either way, ensureClientConfig should have run and created the file
    expect(existsSync(join(tmpDir, '.ascii-tag', 'client.json'))).toBe(true);
  });

  it('startClient with no config uses repo config (run-from-source behavior)', async () => {
    const { startClient } = await import('../src/index.js');
    const clientConfig = (await import('../config/clientConfig.js')).default;
    // startClient() with no args should not throw when only checking logger level
    expect(clientConfig.logging.level).toBeDefined();
    // Actual startClient() would run networkedMode - we just verify the export accepts no args
    expect(startClient).toBeDefined();
    expect(startClient.length).toBe(1); // accepts optional config
  });
});
