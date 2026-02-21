import { mkdirSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';
import { getDefaultClientConfig, getDefaultServerConfig } from '../config/defaults.js';

const CONFIG_DIR = '.ascii-tag';
const CLIENT_CONFIG_FILE = 'client.json';
const SERVER_CONFIG_FILE = 'server.json';

/**
 * Create .ascii-tag/ and default client.json/server.json only if each does not exist; never overwrite.
 * @param {string} cwd - Current working directory
 * @param {{ stderr?: NodeJS.WritableStream }} [opts] - Optional stderr (default process.stderr)
 */
export function runInit(cwd, opts = {}) {
  const stderr = opts.stderr ?? process.stderr;
  const dir = join(cwd, CONFIG_DIR);
  mkdirSync(dir, { recursive: true });

  const clientPath = join(dir, CLIENT_CONFIG_FILE);
  if (!existsSync(clientPath)) {
    writeFileSync(clientPath, JSON.stringify(getDefaultClientConfig(), null, 2));
    stderr.write(`Created default config at .ascii-tag/${CLIENT_CONFIG_FILE}\n`);
  }

  const serverPath = join(dir, SERVER_CONFIG_FILE);
  if (!existsSync(serverPath)) {
    writeFileSync(serverPath, JSON.stringify(getDefaultServerConfig(), null, 2));
    stderr.write(`Created default config at .ascii-tag/${SERVER_CONFIG_FILE}\n`);
  }
}
