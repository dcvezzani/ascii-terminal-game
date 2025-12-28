#!/usr/bin/env node

/**
 * Main entry point for the terminal game
 */

import { Game } from './game/Game.js';
import { Renderer } from './render/Renderer.js';
import { InputHandler } from './input/InputHandler.js';
import { validateTerminalSize } from './utils/terminal.js';
import { gameConfig } from './config/gameConfig.js';
import { serverConfig } from './config/serverConfig.js';
import { WebSocketClient } from './network/WebSocketClient.js';

/**
 * Run game in local (single-player) mode
 */
async function runLocalMode() {
  let game = null;
  let renderer = null;
  let inputHandler = null;
  let showingHelp = false;

  try {
    // Terminal Size Validation
    const sizeCheck = validateTerminalSize(
      gameConfig.terminal.minRows,
      gameConfig.terminal.minColumns
    );
    if (!sizeCheck.valid) {
      console.error(`\n${sizeCheck.message}`);
      console.error('Please resize your terminal and try again.\n');
      process.exit(1);
    }

    // Initialize game components
    game = new Game();
    renderer = new Renderer();
    inputHandler = new InputHandler({
      onMoveUp: () => {
        if (showingHelp) {
          showingHelp = false;
          if (renderer && game) {
            renderer.renderFull(game);
          }
          return;
        }
        if (game && game.isRunning()) {
          const oldPos = game.getPlayerPosition();
          if (game.movePlayer(0, -1)) {
            const newPos = game.getPlayerPosition();
            renderer.updatePlayerPosition(oldPos.x, oldPos.y, newPos.x, newPos.y, game.board);
          }
        }
      },
      onMoveDown: () => {
        if (showingHelp) {
          showingHelp = false;
          if (renderer && game) {
            renderer.renderFull(game);
          }
          return;
        }
        if (game && game.isRunning()) {
          const oldPos = game.getPlayerPosition();
          if (game.movePlayer(0, 1)) {
            const newPos = game.getPlayerPosition();
            renderer.updatePlayerPosition(oldPos.x, oldPos.y, newPos.x, newPos.y, game.board);
          }
        }
      },
      onMoveLeft: () => {
        if (showingHelp) {
          showingHelp = false;
          if (renderer && game) {
            renderer.renderFull(game);
          }
          return;
        }
        if (game && game.isRunning()) {
          const oldPos = game.getPlayerPosition();
          if (game.movePlayer(-1, 0)) {
            const newPos = game.getPlayerPosition();
            renderer.updatePlayerPosition(oldPos.x, oldPos.y, newPos.x, newPos.y, game.board);
          }
        }
      },
      onMoveRight: () => {
        if (showingHelp) {
          showingHelp = false;
          if (renderer && game) {
            renderer.renderFull(game);
          }
          return;
        }
        if (game && game.isRunning()) {
          const oldPos = game.getPlayerPosition();
          if (game.movePlayer(1, 0)) {
            const newPos = game.getPlayerPosition();
            renderer.updatePlayerPosition(oldPos.x, oldPos.y, newPos.x, newPos.y, game.board);
          }
        }
      },
      onQuit: () => {
        if (inputHandler) {
          inputHandler.stop();
        }
        if (game) {
          game.stop();
        }
      },
      onRestart: () => {
        if (showingHelp) {
          showingHelp = false;
        }
        if (game && renderer) {
          game.reset();
          renderer.renderFull(game);
        }
      },
      onHelp: () => {
        if (renderer && game) {
          if (showingHelp) {
            showingHelp = false;
            renderer.renderFull(game);
          } else {
            showingHelp = true;
            renderer.renderHelp();
          }
        }
      },
      onUnsupportedKey: () => {
        if (renderer && game) {
          renderer.renderFull(game);
        }
      },
    });

    // Initialize renderer
    renderer.initialize();

    // Start game
    game.start();

    // Initial render
    renderer.renderFull(game);

    // Start input handling
    inputHandler.start();

    // Wait for game to stop
    while (game.isRunning()) {
      await new Promise(resolve => setTimeout(resolve, 10));
    }
  } catch (error) {
    console.error('\nAn error occurred:', error.message);
    if (error.stack) {
      console.error(error.stack);
    }
  } finally {
    try {
      if (inputHandler) {
        inputHandler.stop();
      }
      if (renderer) {
        renderer.cleanup();
      }
    } catch (cleanupError) {
      console.error('Error during cleanup:', cleanupError.message);
    }
  }
}

/**
 * Run game in networked (multiplayer) mode
 */
async function runNetworkedMode() {
  let game = null;
  let renderer = null;
  let inputHandler = null;
  let wsClient = null;
  let showingHelp = false;
  let currentState = null;
  let localPlayerId = null;
  let running = true;

  try {
    // Terminal Size Validation
    const sizeCheck = validateTerminalSize(
      gameConfig.terminal.minRows,
      gameConfig.terminal.minColumns
    );
    if (!sizeCheck.valid) {
      console.error(`\n${sizeCheck.message}`);
      console.error('Please resize your terminal and try again.\n');
      process.exit(1);
    }

    // Initialize components
    game = new Game(); // Keep for compatibility, but state comes from server
    renderer = new Renderer();
    wsClient = new WebSocketClient();

    // Set up WebSocket callbacks
    wsClient.onConnect(() => {
      console.log('Connected to server');
      // Send CONNECT message to join game
      wsClient.sendConnect();
    });

    wsClient.onStateUpdate(gameState => {
      currentState = gameState;
      if (renderer && localPlayerId) {
        renderer.renderFull(game, gameState, localPlayerId);
      }
    });

    wsClient.onPlayerJoined(payload => {
      if (payload.clientId === wsClient.getClientId()) {
        localPlayerId = payload.playerId;
      }
    });

    wsClient.onError(error => {
      console.error('WebSocket error:', error);
    });

    wsClient.onDisconnect(() => {
      console.log('Disconnected from server');
      running = false;
      if (game) {
        game.stop();
      }
    });

    // Set up input handler for networked mode
    inputHandler = new InputHandler({
      onMoveUp: () => {
        if (showingHelp) {
          showingHelp = false;
          if (renderer && currentState) {
            renderer.renderFull(game, currentState, localPlayerId);
          }
          return;
        }
        if (wsClient && wsClient.isConnected()) {
          wsClient.sendMove(0, -1);
        }
      },
      onMoveDown: () => {
        if (showingHelp) {
          showingHelp = false;
          if (renderer && currentState) {
            renderer.renderFull(game, currentState, localPlayerId);
          }
          return;
        }
        if (wsClient && wsClient.isConnected()) {
          wsClient.sendMove(0, 1);
        }
      },
      onMoveLeft: () => {
        if (showingHelp) {
          showingHelp = false;
          if (renderer && currentState) {
            renderer.renderFull(game, currentState, localPlayerId);
          }
          return;
        }
        if (wsClient && wsClient.isConnected()) {
          wsClient.sendMove(-1, 0);
        }
      },
      onMoveRight: () => {
        if (showingHelp) {
          showingHelp = false;
          if (renderer && currentState) {
            renderer.renderFull(game, currentState, localPlayerId);
          }
          return;
        }
        if (wsClient && wsClient.isConnected()) {
          wsClient.sendMove(1, 0);
        }
      },
      onQuit: () => {
        if (inputHandler) {
          inputHandler.stop();
        }
        if (wsClient) {
          wsClient.sendDisconnect();
          wsClient.disconnect();
        }
        running = false;
        if (game) {
          game.stop();
        }
      },
      onRestart: () => {
        // Restart not supported in networked mode
        if (showingHelp) {
          showingHelp = false;
        }
        if (renderer && currentState) {
          renderer.renderFull(game, currentState, localPlayerId);
        }
      },
      onHelp: () => {
        if (renderer && currentState) {
          if (showingHelp) {
            showingHelp = false;
            renderer.renderFull(game, currentState, localPlayerId);
          } else {
            showingHelp = true;
            renderer.renderHelp();
          }
        }
      },
      onUnsupportedKey: () => {
        if (renderer && currentState) {
          renderer.renderFull(game, currentState, localPlayerId);
        }
      },
    });

    // Initialize renderer
    renderer.initialize();

    // Connect to server
    console.log('Connecting to server...');
    await wsClient.connect();

    // Start input handling
    inputHandler.start();

    // Wait for disconnect or quit
    while (running) {
      await new Promise(resolve => setTimeout(resolve, 10));
    }
  } catch (error) {
    console.error('\nAn error occurred:', error.message);
    if (error.stack) {
      console.error(error.stack);
    }
  } finally {
    try {
      if (inputHandler) {
        inputHandler.stop();
      }
      if (wsClient) {
        wsClient.disconnect();
      }
      if (renderer) {
        renderer.cleanup();
      }
    } catch (cleanupError) {
      console.error('Error during cleanup:', cleanupError.message);
    }
  }
}

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
  console.error('Fatal error:', error);
  process.exit(1);
});
