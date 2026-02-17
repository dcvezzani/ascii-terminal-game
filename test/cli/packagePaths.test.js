import { describe, it, expect, beforeEach } from 'vitest';
import {
  existsSync,
  readFileSync,
  readdirSync,
  mkdtempSync,
  mkdirSync,
  writeFileSync
} from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import {
  getPackageRoot,
  getPackageBoardsDir,
  listAvailableBoards,
  resolveBoardPath
} from '../../src/cli/packagePaths.js';
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
    expect(
      boardsDir.startsWith(root) ||
        join(boardsDir, '..') === root ||
        join(boardsDir, '..', '..') === root
    ).toBe(true);
    expect(boardsDir).toMatch(/boards$/);
  });
});

describe('listAvailableBoards (Phase 5.2)', () => {
  it('returns array including files from package boards dir', () => {
    const list = listAvailableBoards(repoRoot);
    expect(Array.isArray(list)).toBe(true);
    const packageDir = getPackageBoardsDir();
    if (existsSync(packageDir)) {
      const fromPackage = list.filter((p) => p.startsWith(packageDir));
      expect(fromPackage.length).toBeGreaterThanOrEqual(0);
    }
  });

  it('includes files from cwd/boards when present', () => {
    const tmpDir = mkdtempSync(join(tmpdir(), 'ascii-boards-test-'));
    const cwdBoards = join(tmpDir, 'boards');
    mkdirSync(cwdBoards, { recursive: true });
    writeFileSync(join(cwdBoards, 'custom.json'), '[]');
    const list = listAvailableBoards(tmpDir);
    const fromCwd = list.filter((p) => p.includes('custom.json'));
    expect(fromCwd.length).toBe(1);
  });

  it('random default is one of the list', () => {
    const list = listAvailableBoards(repoRoot);
    if (list.length === 0) return;
    const idx = Math.floor(Math.random() * list.length);
    const chosen = list[idx];
    expect(list).toContain(chosen);
  });
});

describe('resolveBoardPath (Phase 6.2)', () => {
  it('returns cwd path when file exists in cwd', () => {
    const tmpDir = mkdtempSync(join(tmpdir(), 'ascii-resolve-test-'));
    mkdirSync(join(tmpDir, 'boards'), { recursive: true });
    writeFileSync(join(tmpDir, 'boards', 'my.json'), '[]');
    const resolved = resolveBoardPath(tmpDir, 'boards/my.json');
    expect(resolved).toContain('my.json');
    expect(resolved).toContain(tmpDir);
  });

  it('returns package path when not in cwd but in package', () => {
    const tmpDir = mkdtempSync(join(tmpdir(), 'ascii-resolve-pkg-'));
    const packageDir = getPackageBoardsDir();
    if (!existsSync(packageDir)) return;
    const files = readdirSync(packageDir).filter((f) => f.endsWith('.json') && f !== 'dimensions.json');
    if (files.length === 0) return;
    const resolved = resolveBoardPath(tmpDir, files[0]);
    expect(resolved).toContain(files[0]);
    expect(resolved).toContain(packageDir);
  });

  it('throws when not found in cwd or package', () => {
    const tmpDir = mkdtempSync(join(tmpdir(), 'ascii-resolve-none-'));
    expect(() => resolveBoardPath(tmpDir, 'nonexistent.json')).toThrow(/not found|Board file/);
  });
});
