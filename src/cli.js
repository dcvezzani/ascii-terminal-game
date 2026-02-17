#!/usr/bin/env node
import { fileURLToPath } from 'url';
import { resolve, dirname, join } from 'path';
import { readFileSync } from 'fs';

/**
 * CLI entry for @dcvezzani/ascii-tag.
 * Parses argv and delegates to client, server, or init.
 * Node 22+ required; --version and --help handled here.
 */

const scriptPath = fileURLToPath(import.meta.url);
const scriptDir = dirname(scriptPath);
const packageRoot = resolve(scriptDir, '..');

function getPackageVersion() {
  const pkgPath = join(packageRoot, 'package.json');
  const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));
  return pkg.version;
}

function checkNodeVersion() {
  const major = parseInt(process.version.slice(1).split('.')[0], 10);
  if (major < 22) {
    process.stderr.write(
      `Node.js 22 or higher is required. Detected: ${process.version}.\n`
    );
    process.exit(1);
  }
}

function run(argv = process.argv) {
  checkNodeVersion();

  const args = argv.slice(2);
  if (args.includes('--version')) {
    process.stdout.write(getPackageVersion() + '\n');
    process.exit(0);
  }
  if (args.includes('--help')) {
    process.stdout.write(
      'Usage: ascii-tag [client|server|init] [options]\n' +
        '  client  - Run the game client (default)\n' +
        '  server  - Run the game server\n' +
        '  init    - Create default config in .ascii-tag/\n'
    );
    process.exit(0);
  }

  // Step 2 will add subcommand dispatch
  process.exit(0);
}

const isMain = process.argv[1] && resolve(process.argv[1]) === resolve(scriptPath);
if (isMain) {
  run();
}

export { run, checkNodeVersion, getPackageVersion };
