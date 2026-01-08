import clientConfig from '../../config/clientConfig.js';
import WebSocketClient from '../network/WebSocketClient.js';
import Renderer from '../render/Renderer.js';
import InputHandler from '../input/InputHandler.js';
import MessageHandler from '../network/MessageHandler.js';
import MessageTypes from '../network/MessageTypes.js';
import logger from '../utils/logger.js';
import { checkTerminalSize } from '../utils/terminal.js';

/**
 * Networked game mode - connects to server and plays multiplayer game
 */
export async function networkedMode() {
  const wsClient = new WebSocketClient(clientConfig.websocket.url);
  const renderer = new Renderer();
  const inputHandler = new InputHandler();

  let currentState = null;
  let localPlayerId = null;
  let running = true;

  // Set up WebSocket event handlers
  wsClient.on('connect', () => {
    logger.info('Connected to server');
    // Send CONNECT message
    const connectMessage = MessageHandler.createMessage(MessageTypes.CONNECT, {});
    wsClient.send(connectMessage);
  });

  wsClient.on('message', (message) => {
    try {
      if (message.type === MessageTypes.CONNECT) {
        handleConnect(message);
      } else if (message.type === MessageTypes.STATE_UPDATE) {
        handleStateUpdate(message);
      }
    } catch (error) {
      logger.error('Error handling message:', error);
    }
  });

  wsClient.on('error', (error) => {
    logger.error('WebSocket error:', error);
    shutdown('Connection error');
  });

  wsClient.on('close', () => {
    logger.info('Disconnected from server');
    shutdown('Disconnected from server');
  });

  // Set up input handlers
  inputHandler.onMove((dx, dy) => {
    if (wsClient.isConnected() && localPlayerId) {
      const moveMessage = MessageHandler.createMessage(MessageTypes.MOVE, { dx, dy });
      wsClient.send(moveMessage);
    }
  });

  inputHandler.onQuit(() => {
    shutdown('Quit by user');
  });

  /**
   * Handle CONNECT response
   */
  function handleConnect(message) {
    const { clientId, playerId, playerName, gameState } = message.payload;
    localPlayerId = playerId;
    currentState = gameState;
    
    logger.info(`Joined as ${playerName} (${playerId})`);
    
    // Initial render
    render();
  }

  /**
   * Handle STATE_UPDATE
   */
  function handleStateUpdate(message) {
    currentState = message.payload;
    render();
  }

  /**
   * Render the game
   */
  function render() {
    if (!currentState) {
      return;
    }

    try {
      renderer.clearScreen();
      renderer.renderTitle();
      
      // Create board adapter from state
      const board = {
        width: currentState.board.width,
        height: currentState.board.height,
        grid: currentState.board.grid,
        getCell: (x, y) => currentState.board.grid[y][x],
        isWall: (x, y) => currentState.board.grid[y][x] === '#',
        serialize: () => currentState.board.grid
      };

      renderer.renderBoard(board, currentState.players || []);
      
      // Find local player position
      const localPlayer = currentState.players?.find(p => p.playerId === localPlayerId);
      const position = localPlayer ? { x: localPlayer.x, y: localPlayer.y } : null;
      
      renderer.renderStatusBar(currentState.score || 0, position);
    } catch (error) {
      logger.error('Error rendering:', error);
    }
  }

  /**
   * Shutdown and cleanup
   */
  function shutdown(reason) {
    if (!running) {
      return;
    }

    running = false;
    logger.info(`Shutting down: ${reason}`);

    inputHandler.stop();
    renderer.showCursor();
    renderer.clearScreen();
    wsClient.disconnect();

    process.exit(0);
  }

  // Start
  try {
    // Check terminal size (minimum 25x25 for board + UI)
    checkTerminalSize(25, 25);
    
    renderer.hideCursor();
    inputHandler.start();
    wsClient.connect();

    // Keep process alive
    // The game runs until quit or disconnect
  } catch (error) {
    logger.error('Error starting networked mode:', error);
    shutdown('Startup error');
  }
}

export default networkedMode;
