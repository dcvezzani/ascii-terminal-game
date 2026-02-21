import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync, readdirSync } from 'fs';

let cachedPackageRoot = null;

/**
 * Resolve package root (directory containing package.json).
 * Uses import.meta.url so it works when run from repo or from node_modules.
 */
export function getPackageRoot() {
  if (cachedPackageRoot) return cachedPackageRoot;
  let dir = dirname(fileURLToPath(import.meta.url));
  for (let i = 0; i < 10; i++) {
    const pkgPath = join(dir, 'package.json');
    if (existsSync(pkgPath)) {
      cachedPackageRoot = dir;
      return dir;
    }
    const parent = dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  throw new Error('Could not find package root (package.json)');
}

/**
 * Path to boards directory (package boards). Uses boards/ in repo until dist/boards exists (Phase 7).
 */
export function getPackageBoardsDir() {
  const root = getPackageRoot();
  const distBoards = join(root, 'dist', 'boards');
  if (existsSync(distBoards)) return distBoards;
  return join(root, 'boards');
}

/**
 * List available board files (.json) from package boards dir and cwd/boards.
 * @param {string} cwd - Current working directory
 * @returns {string[]} Board filenames (e.g. ['classic.json', 'my-board.json'])
 */
export function listAvailableBoards(cwd) {
  const result = [];
  const packageDir = getPackageBoardsDir();
  if (existsSync(packageDir)) {
    const files = readdirSync(packageDir);
    files.forEach((f) => {
      if (f.endsWith('.json') && f !== 'dimensions.json') result.push(join(packageDir, f));
    });
  }
  const cwdBoards = join(cwd, 'boards');
  if (existsSync(cwdBoards)) {
    const files = readdirSync(cwdBoards);
    files.forEach((f) => {
      if (f.endsWith('.json') && f !== 'dimensions.json') result.push(join(cwdBoards, f));
    });
  }
  return result;
}

/**
 * Resolve board path: try cwd first, then package boards dir.
 * @param {string} cwd - Current working directory
 * @param {string} pathArg - Board path (e.g. from --board)
 * @returns {string} Resolved absolute path
 * @throws {Error} If not found in cwd or package
 */
export function resolveBoardPath(cwd, pathArg) {
  const cwdPath = join(cwd, pathArg);
  if (existsSync(cwdPath)) return cwdPath;
  const packageDir = getPackageBoardsDir();
  const packagePath = join(packageDir, pathArg);
  if (existsSync(packagePath)) return packagePath;
  throw new Error(`Board file not found: ${pathArg}`);
}
