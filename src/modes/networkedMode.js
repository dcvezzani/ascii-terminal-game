import clientConfig from '../../config/clientConfig.js';
import WebSocketClient from '../network/WebSocketClient.js';
import Renderer from '../render/Renderer.js';
import InputHandler from '../input/InputHandler.js';
import MessageHandler from '../network/MessageHandler.js';
import MessageTypes from '../network/MessageTypes.js';
import logger from '../utils/logger.js';
import { checkTerminalSize } from '../utils/terminal.js';
import compareStates from '../utils/stateComparison.js';

/**
 * Networked game mode - connects to server and plays multiplayer game
 */
export async function networkedMode() {
  const wsClient = new WebSocketClient(clientConfig.websocket.url);
  const renderer = new Renderer();
  const inputHandler = new InputHandler();

  let currentState = null;
  let previousState = null; // Track previous state for change detection
  let localPlayerId = null;
  let running = true;

  // Set up WebSocket event handlers
  wsClient.on('connect', () => {
    logger.info('Connected to server');
    // Send CONNECT message to request joining the game
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
    // Don't shutdown immediately on error - let close handler handle it
  });

  wsClient.on('close', () => {
    if (running) {
      logger.info('Disconnected from server');
      shutdown('Disconnected from server');
    }
  });

  // Set up input handlers
  inputHandler.onMove((dx, dy) => {
    if (wsClient.isConnected() && localPlayerId) {
      try {
        const moveMessage = MessageHandler.createMessage(MessageTypes.MOVE, { dx, dy });
        wsClient.send(moveMessage);
      } catch (error) {
        logger.error('Error sending MOVE message:', error);
      }
    }
  });

  inputHandler.onQuit(() => {
    shutdown('Quit by user');
  });

  /**
   * Handle CONNECT response
   */
  function handleConnect(message) {
    try {
      const { clientId, playerId, playerName, gameState } = message.payload;
      
      // Only process CONNECT messages that have playerId and gameState
      // (these are the server's response to our CONNECT request)
      // Ignore any other CONNECT messages
      if (!playerId || !gameState) {
        logger.debug('Received CONNECT message without playerId/gameState, ignoring');
        return;
      }
      
      localPlayerId = playerId;
      currentState = gameState;
      
      logger.info(`Joined as ${playerName} (${playerId})`);
      
      // Initial render
      render();
    } catch (error) {
      logger.error('Error handling CONNECT:', error);
      shutdown('Connection error');
    }
  }

  /**
   * Handle STATE_UPDATE
   */
  function handleStateUpdate(message) {
    try {
      if (!message.payload) {
        logger.warn('Invalid STATE_UPDATE: missing payload');
        return;
      }
      
      currentState = message.payload;
      render();
    } catch (error) {
      logger.error('Error handling STATE_UPDATE:', error);
    }
  }

  /**
   * Render the game
   */
  function render() {
    if (!currentState) {
      return;
    }

    try {
      // Create board adapter from state
      const board = {
        width: currentState.board.width,
        height: currentState.board.height,
        grid: currentState.board.grid,
        getCell: (x, y) => {
          if (y < 0 || y >= currentState.board.grid.length) return null;
          if (x < 0 || x >= currentState.board.grid[y].length) return null;
          return currentState.board.grid[y][x];
        },
        isWall: (x, y) => {
          const cell = board.getCell(x, y);
          return cell === '#';
        },
        serialize: () => currentState.board.grid
      };

      // Find local player position
      const localPlayer = currentState.players?.find(p => p.playerId === localPlayerId);
      const position = localPlayer ? { x: localPlayer.x, y: localPlayer.y } : null;

      // First render: use full render
      // Exclude local player from server state rendering
      const otherPlayers = (currentState.players || []).filter(
        p => p.playerId !== localPlayerId
      );

      if (previousState === null) {
        renderer.clearScreen();
        renderer.renderTitle();
        renderer.renderBoard(board, otherPlayers);
        renderer.renderStatusBar(currentState.score || 0, position);
        previousState = currentState;
        return;
      }

      // Compare states for incremental rendering
      const changes = compareStates(previousState, currentState);
      const totalChanges = 
        changes.players.moved.length +
        changes.players.joined.length +
        changes.players.left.length;

      // Fallback to full render if too many changes
      if (totalChanges > 10) {
        renderer.clearScreen();
        renderer.renderTitle();
        renderer.renderBoard(board, otherPlayers);
        renderer.renderStatusBar(currentState.score || 0, position);
        previousState = currentState;
        return;
      }

      // Incremental render

      renderer.renderIncremental(
        changes,
        board,
        otherPlayers,
        currentState.entities || [],
        localPlayerId,
        currentState.score || 0,
        position
      );

      // Update status bar if score changed
      if (changes.scoreChanged) {
        renderer.renderStatusBar(currentState.score || 0, position);
      }

      previousState = currentState;
    } catch (error) {
      logger.error('Error during incremental render, falling back to full render:', error);
      // Fallback to full render on error
      try {
        const board = {
          width: currentState.board.width,
          height: currentState.board.height,
          grid: currentState.board.grid,
          getCell: (x, y) => {
            if (y < 0 || y >= currentState.board.grid.length) return null;
            if (x < 0 || x >= currentState.board.grid[y].length) return null;
            return currentState.board.grid[y][x];
          },
          isWall: (x, y) => {
            const cell = board.getCell(x, y);
            return cell === '#';
          },
          serialize: () => currentState.board.grid
        };
        const localPlayer = currentState.players?.find(p => p.playerId === localPlayerId);
        const position = localPlayer ? { x: localPlayer.x, y: localPlayer.y } : null;
        
        // Exclude local player from server state rendering
        const otherPlayersFallback = (currentState.players || []).filter(
          p => p.playerId !== localPlayerId
        );
        
        renderer.clearScreen();
        renderer.renderTitle();
        renderer.renderBoard(board, otherPlayersFallback);
        renderer.renderStatusBar(currentState.score || 0, position);
        previousState = currentState;
      } catch (fallbackError) {
        logger.error('Error during fallback render:', fallbackError);
      }
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

    try {
      inputHandler.stop();
      renderer.showCursor();
      renderer.clearScreen();
      wsClient.disconnect();
    } catch (error) {
      logger.error('Error during shutdown:', error);
    }

    process.exit(0);
  }

  // Start
  try {
    // Check terminal size (minimum 25x25 for board + UI)
    const terminalOk = checkTerminalSize(25, 25);
    if (!terminalOk) {
      logger.warn('Terminal size warning - game may not display correctly');
    }
    
    renderer.hideCursor();
    inputHandler.start();
    
    logger.info(`Connecting to ${clientConfig.websocket.url}...`);
    wsClient.connect();

    // Keep process alive
    // The game runs until quit or disconnect
  } catch (error) {
    logger.error('Error starting networked mode:', error);
    shutdown('Startup error');
  }
}

export default networkedMode;
