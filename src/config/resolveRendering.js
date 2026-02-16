/**
 * Resolve rendering-related config from CLI, env, and config file.
 * Precedence: CLI (--resize-debounce=N) → env (RESIZE_DEBOUNCE_MS) → config file → 250 ms.
 * @param {object} config - Client config (e.g. from clientConfig.js)
 * @param {{ argv?: string[], env?: NodeJS.ProcessEnv }} [options] - Optional argv/env for testing
 * @returns {{ resizeDebounceMs: number }}
 */
export function resolveRenderingConfig(config, options = {}) {
  const argv = options.argv ?? process.argv;
  const env = options.env ?? process.env;

  const DEFAULT_RESIZE_DEBOUNCE_MS = 250;

  function parsePositiveInt(value) {
    if (value == null || value === '') return null;
    const n = parseInt(value, 10);
    if (Number.isNaN(n) || n < 1) return null;
    return n;
  }

  // CLI: --resize-debounce=N
  const cliArg = argv.find((arg) => arg.startsWith('--resize-debounce='));
  if (cliArg) {
    const n = parsePositiveInt(cliArg.split('=')[1]);
    if (n != null) return { resizeDebounceMs: n };
  }

  // Env: RESIZE_DEBOUNCE_MS
  const envVal = env.RESIZE_DEBOUNCE_MS;
  if (envVal != null) {
    const n = parsePositiveInt(envVal);
    if (n != null) return { resizeDebounceMs: n };
  }

  // Config file
  const configMs = config?.rendering?.resizeDebounceMs;
  if (configMs != null) {
    const n = typeof configMs === 'number' ? (configMs >= 1 ? configMs : null) : parsePositiveInt(String(configMs));
    if (n != null) return { resizeDebounceMs: n };
  }

  return { resizeDebounceMs: DEFAULT_RESIZE_DEBOUNCE_MS };
}
