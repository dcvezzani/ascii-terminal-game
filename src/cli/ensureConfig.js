import { mkdirSync, readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';
import { getDefaultClientConfig, getDefaultServerConfig } from '../config/defaults.js';

const CONFIG_DIR = '.ascii-tag';
const CLIENT_CONFIG_FILE = 'client.json';
const SERVER_CONFIG_FILE = 'server.json';

/**
 * Ensure client config exists in cwd; create with defaults if missing.
 * @param {string} cwd - Current working directory
 * @param {{ stderr?: NodeJS.WritableStream }} [opts] - Optional stderr (default process.stderr)
 * @returns {object} Parsed client config
 */
export function ensureClientConfig(cwd, opts = {}) {
  const stderr = opts.stderr ?? process.stderr;
  const dir = join(cwd, CONFIG_DIR);
  const path = join(dir, CLIENT_CONFIG_FILE);
  if (existsSync(path)) {
    try {
      return JSON.parse(readFileSync(path, 'utf-8'));
    } catch (err) {
      throw new Error(`Invalid JSON in ${path}: ${err.message}`);
    }
  }
  mkdirSync(dir, { recursive: true });
  const config = getDefaultClientConfig();
  writeFileSync(path, JSON.stringify(config, null, 2));
  stderr.write(`Created default config at .ascii-tag/${CLIENT_CONFIG_FILE}\n`);
  return config;
}

/**
 * Ensure server config exists in cwd; create with defaults if missing.
 * @param {string} cwd - Current working directory
 * @param {{ stderr?: NodeJS.WritableStream }} [opts] - Optional stderr (default process.stderr)
 * @returns {object} Parsed server config
 */
export function ensureServerConfig(cwd, opts = {}) {
  const stderr = opts.stderr ?? process.stderr;
  const dir = join(cwd, CONFIG_DIR);
  const path = join(dir, SERVER_CONFIG_FILE);
  if (existsSync(path)) {
    try {
      return JSON.parse(readFileSync(path, 'utf-8'));
    } catch (err) {
      throw new Error(`Invalid JSON in ${path}: ${err.message}`);
    }
  }
  mkdirSync(dir, { recursive: true });
  const config = getDefaultServerConfig();
  writeFileSync(path, JSON.stringify(config, null, 2));
  stderr.write(`Created default config at .ascii-tag/${SERVER_CONFIG_FILE}\n`);
  return config;
}
