import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { fileURLToPath, pathToFileURL } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const repoRoot = join(__dirname, '..');

describe('CLI package identity and entry (Phase 1)', () => {
  it('package.json has name, engines.node, and bin', () => {
    const pkgPath = join(repoRoot, 'package.json');
    const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));
    expect(pkg.name).toBeDefined();
    expect(pkg.engines).toBeDefined();
    expect(pkg.engines.node).toBeDefined();
    expect(pkg.bin).toBeDefined();
    expect(typeof pkg.bin).toBe('object');
    const binEntry = pkg.bin['ascii-tag'];
    expect(binEntry).toBeDefined();
    expect(typeof binEntry).toBe('string');
  });

  it('CLI entry file exists and can be imported without throwing', async () => {
    const cliPath = join(repoRoot, 'src', 'cli.js');
    expect(existsSync(cliPath)).toBe(true);
    const url = pathToFileURL(cliPath).href;
    await expect(import(url)).resolves.toBeDefined();
  });
});
