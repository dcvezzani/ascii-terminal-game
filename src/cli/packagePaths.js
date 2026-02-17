import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync } from 'fs';

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
