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

/**
 * Parse argv into subcommand and optional --board path.
 * @param {string[]} argv - e.g. process.argv
 * @returns {{ subcommand: 'client'|'server'|'init', boardPath?: string }}
 */
function parseArgs(argv) {
  const args = argv.slice(2);
  const first = args[0];
  const subcommand =
    first === 'server' ? 'server' : first === 'init' ? 'init' : 'client';

  let boardPath;
  if (subcommand === 'server') {
    const idx = args.indexOf('--board');
    if (idx !== -1 && idx + 1 < args.length) {
      boardPath = args[idx + 1];
    }
  }

  return { subcommand, boardPath };
}

async function runClient() {
  const { ensureClientConfig } = await import('./cli/ensureConfig.js');
  const { startClient } = await import('./index.js');
  const cwd = process.cwd();
  const config = ensureClientConfig(cwd);
  await startClient(config);
}

async function runServer(boardPath) {
  const { ensureServerConfig } = await import('./cli/ensureConfig.js');
  const {
    listAvailableBoards,
    resolveBoardPath
  } = await import('./cli/packagePaths.js');
  const { startServer } = await import('./server/index.js');
  const cwd = process.cwd();
  const config = ensureServerConfig(cwd);
  const port = config.websocket.port;

  let pathToUse;
  if (boardPath) {
    try {
      pathToUse = resolveBoardPath(cwd, boardPath);
    } catch (err) {
      console.error(err.message);
      process.exit(1);
    }
  } else {
    const boards = listAvailableBoards(cwd);
    if (boards.length > 0) {
      const idx = Math.floor(Math.random() * boards.length);
      pathToUse = boards[idx];
    } else {
      pathToUse = config.board?.defaultPath ?? 'boards/classic.json';
    }
  }
  await startServer(port, pathToUse, config);
}

function runInit() {
  import('./cli/init.js').then(({ runInit: doInit }) => {
    doInit(process.cwd());
  });
}

const VALID_SUBCOMMANDS = ['client', 'server', 'init'];

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

  const { subcommand, boardPath } = parseArgs(argv);
  const firstArg = args[0];
  if (firstArg && !VALID_SUBCOMMANDS.includes(firstArg)) {
    process.stderr.write(`Unknown command: ${firstArg}\n`);
    process.exit(1);
  }

  if (subcommand === 'client') {
    runClient().catch((err) => {
      console.error(err);
      process.exit(1);
    });
  } else if (subcommand === 'server') {
    runServer(boardPath).catch((err) => {
      console.error(err);
      process.exit(1);
    });
  } else if (subcommand === 'init') runInit();
}

const isMain = process.argv[1] && resolve(process.argv[1]) === resolve(scriptPath);
if (isMain) {
  run();
}

export { run, checkNodeVersion, getPackageVersion, parseArgs };
