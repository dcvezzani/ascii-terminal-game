#!/usr/bin/env node

/**
 * Main entry point for the terminal game
 */

import { Game } from './game/Game.js';
import { Renderer } from './render/Renderer.js';
import { InputHandler } from './input/InputHandler.js';
import { validateTerminalSize } from './utils/terminal.js';

/**
 * Main game function
 */
async function main() {
  let game = null;
  let renderer = null;
  let inputHandler = null;

  try {
    // Step 8.2: Terminal Size Validation
    const sizeCheck = validateTerminalSize(25, 30);
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
        if (game && game.isRunning()) {
          const oldPos = game.getPlayerPosition();
          if (game.movePlayer(0, -1)) {
            const newPos = game.getPlayerPosition();
            renderer.updatePlayerPosition(
              oldPos.x,
              oldPos.y,
              newPos.x,
              newPos.y,
              game.board
            );
          }
        }
      },
      onMoveDown: () => {
        if (game && game.isRunning()) {
          const oldPos = game.getPlayerPosition();
          if (game.movePlayer(0, 1)) {
            const newPos = game.getPlayerPosition();
            renderer.updatePlayerPosition(
              oldPos.x,
              oldPos.y,
              newPos.x,
              newPos.y,
              game.board
            );
          }
        }
      },
      onMoveLeft: () => {
        if (game && game.isRunning()) {
          const oldPos = game.getPlayerPosition();
          if (game.movePlayer(-1, 0)) {
            const newPos = game.getPlayerPosition();
            renderer.updatePlayerPosition(
              oldPos.x,
              oldPos.y,
              newPos.x,
              newPos.y,
              game.board
            );
          }
        }
      },
      onMoveRight: () => {
        if (game && game.isRunning()) {
          const oldPos = game.getPlayerPosition();
          if (game.movePlayer(1, 0)) {
            const newPos = game.getPlayerPosition();
            renderer.updatePlayerPosition(
              oldPos.x,
              oldPos.y,
              newPos.x,
              newPos.y,
              game.board
            );
          }
        }
      },
      onQuit: () => {
        if (game) {
          game.stop();
        }
      },
      onRestart: () => {
        if (game && renderer) {
          game.reset();
          renderer.renderFull(game);
        }
      },
      onHelp: () => {
        if (renderer) {
          renderer.renderHelp();
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
      // Small delay to prevent CPU spinning
      await new Promise(resolve => setTimeout(resolve, 10));
    }

  } catch (error) {
    // Step 8.3: Error Handling
    console.error('\nAn error occurred:', error.message);
    if (error.stack) {
      console.error(error.stack);
    }
  } finally {
    // Step 8.4: Cleanup on exit
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

