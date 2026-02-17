import { describe, it, expect } from 'vitest';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { getPackageRoot, getPackageBoardsDir } from '../../src/cli/packagePaths.js';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(__dirname, '..', '..');

describe('packagePaths (Phase 5.1)', () => {
  it('getPackageRoot() returns a path that contains package.json', () => {
    const root = getPackageRoot();
    expect(root).toBeDefined();
    expect(typeof root).toBe('string');
    const pkgPath = join(root, 'package.json');
    expect(existsSync(pkgPath)).toBe(true);
    const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));
    expect(pkg.name).toBeDefined();
  });

  it('getPackageBoardsDir() returns a path under package root (boards or dist/boards)', () => {
    const root = getPackageRoot();
    const boardsDir = getPackageBoardsDir();
    expect(boardsDir).toBeDefined();
    expect(boardsDir.startsWith(root) || join(boardsDir, '..') === root || join(boardsDir, '..', '..') === root).toBe(true);
    expect(boardsDir).toMatch(/boards$/);
  });
});
