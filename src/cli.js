#!/usr/bin/env node
import { fileURLToPath } from 'url';
import { resolve } from 'path';

/**
 * CLI entry for @dcvezzani/ascii-tag.
 * Parses argv and delegates to client, server, or init.
 * Node 22+ required; --version and --help handled here.
 */

// Minimal stub for Step 1.1: file runs without syntax errors when executed.
// Step 1.2 will add Node version check and --version/--help.
// Only exit when run as main script (not when imported by tests).
function run() {
  process.exit(0);
}

const scriptPath = fileURLToPath(import.meta.url);
const isMain = process.argv[1] && resolve(process.argv[1]) === resolve(scriptPath);
if (isMain) {
  run();
}

export { run };
