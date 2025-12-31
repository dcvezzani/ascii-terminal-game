/**
 * Local (single-player) mode implementation
 */

import { Game } from '../game/Game.js';
import { Renderer } from '../render/Renderer.js';
import { InputHandler } from '../input/InputHandler.js';
import { ModalManager } from '../ui/ModalManager.js';
import { Modal } from '../ui/Modal.js';
import { validateTerminalSize } from '../utils/terminal.js';
import { gameConfig } from '../config/gameConfig.js';
import { clientLogger } from '../utils/clientLogger.js';

/**
 * Run game in local (single-player) mode
 * @returns {Promise<void>}
 */
export async function runLocalMode() {
  let game = null;
  let renderer = null;
  let inputHandler = null;
  let modalManager = null;
  let showingHelp = false;

  try {
    // Terminal Size Validation
    const sizeCheck = validateTerminalSize(
      gameConfig.terminal.minRows,
      gameConfig.terminal.minColumns
    );
    if (!sizeCheck.valid) {
      clientLogger.error(`\n${sizeCheck.message}`);
      clientLogger.error('Please resize your terminal and try again.\n');
      process.exit(1);
    }

    // Initialize game components
    game = new Game();
    modalManager = new ModalManager();
    renderer = new Renderer(modalManager);
    inputHandler = new InputHandler(
      {
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
        if (modalManager) {
          modalManager.reset();
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
      onRenderAllPlayers: () => {
        if (renderer && game) {
          renderer.renderFull(game);
        }
      },
      },
      modalManager,
      () => {
        // Callback when modal state changes (for re-rendering)
        clientLogger.debug('Modal state change callback triggered');
        if (renderer && modalManager) {
          if (modalManager.hasOpenModal()) {
            // Modal is open - re-render just the modal
            clientLogger.debug('Modal is open - re-rendering modal');
            const modal = modalManager.getCurrentModal();
            if (modal) {
              renderer.renderModalOnly(modal);
            }
          } else {
            // Modal was closed - re-render the full game to show game board
            clientLogger.debug('Modal is closed - re-rendering full game');
            if (game) {
              renderer.renderFull(game);
            }
          }
        }
      }
    );

    // Initialize renderer
    renderer.initialize();

    // Start game
    game.start();

    // Initial render
    renderer.renderFull(game);

    // Example: Create a "Game Over" modal (can be triggered later)
    // This demonstrates how to create and open modals
    const gameOverModal = new Modal({
      title: 'Game Over',
      content: [
        { type: 'message', text: 'Game Over!' },
        {
          type: 'option',
          label: 'Restart',
          action: () => {
            clientLogger.debug('Restart action executed');
            if (game) {
              game.reset();
              clientLogger.debug('Game reset complete');
            }
            // Don't call renderFull here - let the modal close callback handle it
            // This ensures the modal is closed before re-rendering
          },
        },
        {
          type: 'option',
          label: 'Quit',
          action: () => {
            if (inputHandler) {
              inputHandler.stop();
            }
            if (game) {
              game.stop();
            }
          },
        },
      ],
    });

    // Example: Open modal (uncomment to test)
    // modalManager.openModal(gameOverModal);
    // renderer.renderFull(game);

    // Start input handling
    inputHandler.start();

    // Wait for game to stop
    while (game.isRunning()) {
      await new Promise(resolve => setTimeout(resolve, 10));
    }
  } catch (error) {
    clientLogger.error('\nAn error occurred:', error.message);
    if (error.stack) {
      clientLogger.error(error.stack);
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
      clientLogger.error('Error during cleanup:', cleanupError.message);
    }
  }
}


