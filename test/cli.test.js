import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { fileURLToPath, pathToFileURL } from 'url';
import { dirname, join } from 'path';
import { spawnSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const repoRoot = join(__dirname, '..');
const nodePath = process.execPath;
const cliPath = join(repoRoot, 'src', 'cli.js');

function runCli(args = []) {
  const r = spawnSync(nodePath, [cliPath, ...args], {
    cwd: repoRoot,
    encoding: 'utf-8',
    env: { ...process.env }
  });
  return { stdout: r.stdout || '', stderr: r.stderr || '', status: r.status, signal: r.signal };
}

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
    expect(existsSync(cliPath)).toBe(true);
    const url = pathToFileURL(cliPath).href;
    await expect(import(url)).resolves.toBeDefined();
  });
});

describe('CLI Node version check and --version/--help (Phase 1.2)', () => {
  it('--version prints package version to stdout and exits 0', () => {
    const pkg = JSON.parse(readFileSync(join(repoRoot, 'package.json'), 'utf-8'));
    const { stdout, stderr, status } = runCli(['--version']);
    expect(status).toBe(0);
    expect(stdout.trim()).toBe(pkg.version);
    expect(stderr).toBe('');
  });

  it('--help prints usage containing client, server, init and exits 0', () => {
    const { stdout, stderr, status } = runCli(['--help']);
    expect(status).toBe(0);
    expect(stdout).toContain('client');
    expect(stdout).toContain('server');
    expect(stdout).toContain('init');
    expect(stderr).toBe('');
  });

  it('when Node version is below 22 (or no version error when Node >= 22)', () => {
    // Mock by setting a fake version in a child: use node -e "process.version = 'v21.0.0'; ..."
    // Or run with a different node. Simpler: skip when Node >= 22, or test the message format.
    // We test that when we run without --version/--help, if node is < 22 we exit 1. We can't easily
    // change node version in child. So: run CLI with no args (will hit node check first). On Node >= 22
    // we'll get exit 0 (stub run()). So this test: only run on Node < 22, or test that the version
    // check function exists and would fail for v21. For TDD we need the behavior. Use a small script
    // that sets process.version and requires the check.
    const major = parseInt(process.version.slice(1).split('.')[0], 10);
    if (major >= 22) {
      // When Node >= 22, running with no args hits run() and exits 0. So we can't test "below 22"
      // in this environment. Test instead that running with invalid arg doesn't print version error
      // (our check runs first). So: run with no args, we should get exit 0 (stub).
      const { status, stderr } = runCli([]);
      expect(status).toBe(0);
      expect(stderr).not.toContain('Node.js 22'); // no version error when node is ok
      return;
    }
    const { status, stderr } = runCli([]);
    expect(status).toBe(1);
    expect(stderr).toMatch(/Node\.js 22|required/);
  });
});

describe('CLI subcommand parsing (Phase 2)', () => {
  it('no positional or "client" -> subcommand client', async () => {
    const { parseArgs } = await import(pathToFileURL(join(repoRoot, 'src', 'cli.js')).href);
    expect(parseArgs(['node', 'cli.js']).subcommand).toBe('client');
    expect(parseArgs(['node', 'cli.js', 'client']).subcommand).toBe('client');
  });

  it('"server" -> subcommand server', async () => {
    const { parseArgs } = await import(pathToFileURL(join(repoRoot, 'src', 'cli.js')).href);
    expect(parseArgs(['node', 'cli.js', 'server']).subcommand).toBe('server');
  });

  it('"server --board foo.json" -> subcommand server, boardPath foo.json', async () => {
    const { parseArgs } = await import(pathToFileURL(join(repoRoot, 'src', 'cli.js')).href);
    const r = parseArgs(['node', 'cli.js', 'server', '--board', 'foo.json']);
    expect(r.subcommand).toBe('server');
    expect(r.boardPath).toBe('foo.json');
  });

  it('"init" -> subcommand init', async () => {
    const { parseArgs } = await import(pathToFileURL(join(repoRoot, 'src', 'cli.js')).href);
    expect(parseArgs(['node', 'cli.js', 'init']).subcommand).toBe('init');
  });

  it('unknown subcommand exits 1 with stderr message', () => {
    const { status, stderr } = runCli(['unknown']);
    expect(status).toBe(1);
    expect(stderr).toMatch(/unknown|Unknown|error|Error/i);
  });
});
