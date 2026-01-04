#!/usr/bin/env node

/**
 * Main entry point for the terminal game
 */

// Load environment variables from .env file (must be before config imports)
import dotenv from 'dotenv';
dotenv.config();

import { serverConfig } from './config/serverConfig.js';
import { clientLogger } from './utils/clientLogger.js';
import { runLocalMode } from './modes/localMode.js';
import { runNetworkedMode } from './modes/networkedMode.js';

// Attach clientLogger to globalThis for debugging access
// This allows debug logging in components that don't have direct access to the logger
globalThis.clientLogger = clientLogger;

// Re-export for backward compatibility
export { runNetworkedMode };

/**
 * Main game function
 */
async function main() {
  // Check if networked mode is enabled
  if (serverConfig.websocket.enabled) {
    await runNetworkedMode();
  } else {
    await runLocalMode();
  }
}

// Handle process termination
process.on('SIGINT', () => {
  process.exit(0);
});

process.on('SIGTERM', () => {
  process.exit(0);
});

// Run the game
main().catch(error => {
  clientLogger.error('Fatal error:', error);
  process.exit(1);
});
