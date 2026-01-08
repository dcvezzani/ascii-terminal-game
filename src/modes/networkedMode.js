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
  const renderer = new Renderer(clientConfig.rendering);
  const inputHandler = new InputHandler();

  let currentState = null;
  let previousState = null; // Track previous state for change detection
  let localPlayerId = null;
  let localPlayerPredictedPosition = { x: null, y: null }; // Predicted position for client-side prediction
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
   * Get server player position
   * @returns {{x: number, y: number}|null} Server position or null if not found
   */
  function getServerPlayerPosition() {
    if (!currentState || !currentState.players) {
      return null;
    }
    const localPlayer = currentState.players.find(p => p.playerId === localPlayerId);
    return localPlayer ? { x: localPlayer.x, y: localPlayer.y } : null;
  }

  /**
   * Validate if position is within board bounds
   * @param {number} x - X coordinate
   * @param {number} y - Y coordinate
   * @param {object} board - Board object with width and height
   * @returns {boolean} True if within bounds
   */
  function validateBounds(x, y, board) {
    if (!board) return false;
    return x >= 0 && x < board.width && y >= 0 && y < board.height;
  }

  /**
   * Validate if position is not a wall
   * @param {number} x - X coordinate
   * @param {number} y - Y coordinate
   * @param {object} board - Board object with getCell method
   * @returns {boolean} True if not a wall
   */
  function validateWall(x, y, board) {
    if (!board || !board.getCell) return false;
    const cell = board.getCell(x, y);
    return cell !== '#';
  }

  /**
   * Validate if no solid entity at position
   * @param {number} x - X coordinate
   * @param {number} y - Y coordinate
   * @param {Array} entities - Array of entity objects
   * @returns {boolean} True if no solid entity at position
   */
  function validateEntityCollision(x, y, entities) {
    if (!entities || entities.length === 0) return true;
    
    // Check for solid entities at position
    const solidEntity = entities.find(
      e => e.x === x && e.y === y && e.solid === true
    );
    return !solidEntity;
  }

  /**
   * Validate if no other player at position
   * @param {number} x - X coordinate
   * @param {number} y - Y coordinate
   * @param {Array} players - Array of player objects
   * @param {string} excludePlayerId - Player ID to exclude from check
   * @returns {boolean} True if no other player at position
   */
  function validatePlayerCollision(x, y, players, excludePlayerId) {
    if (!players || players.length === 0) return true;
    
    // Check for other players at position
    const otherPlayer = players.find(
      p => p.playerId !== excludePlayerId && p.x === x && p.y === y
    );
    return !otherPlayer;
  }

  /**
   * Validate movement (all checks)
   * @param {number} x - X coordinate
   * @param {number} y - Y coordinate
   * @param {object} currentState - Current game state
   * @returns {boolean} True if movement is valid
   */
  function validateMovement(x, y, currentState) {
    if (!currentState || !currentState.board) return false;

    // Create board adapter
    const board = {
      width: currentState.board.width,
      height: currentState.board.height,
      getCell: (x, y) => {
        if (y < 0 || y >= currentState.board.grid.length) return null;
        if (x < 0 || x >= currentState.board.grid[y].length) return null;
        return currentState.board.grid[y][x];
      }
    };

    // Get other players (exclude local player)
    const otherPlayers = (currentState.players || []).filter(
      p => p.playerId !== localPlayerId
    );

    // Get entities
    const entities = currentState.entities || [];

    // Validate all checks
    if (!validateBounds(x, y, board)) return false;
    if (!validateWall(x, y, board)) return false;
    if (!validateEntityCollision(x, y, entities)) return false;
    if (!validatePlayerCollision(x, y, otherPlayers, localPlayerId)) return false;

    return true;
  }

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
      
      // Initialize prediction from server position
      if (gameState.players) {
        const localPlayer = gameState.players.find(p => p.playerId === localPlayerId);
        if (localPlayer) {
          localPlayerPredictedPosition = { x: localPlayer.x, y: localPlayer.y };
          logger.debug(`Initialized prediction position: (${localPlayer.x}, ${localPlayer.y})`);
        }
      }
      
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
      
      // Initialize prediction if not already set
      if (localPlayerPredictedPosition.x === null && localPlayerId && currentState.players) {
        const localPlayer = currentState.players.find(p => p.playerId === localPlayerId);
        if (localPlayer) {
          localPlayerPredictedPosition = { x: localPlayer.x, y: localPlayer.y };
          logger.debug(`Initialized prediction position from STATE_UPDATE: (${localPlayer.x}, ${localPlayer.y})`);
        }
      }
      
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
        // Render local player separately
        if (position) {
          renderer.updateCell(position.x, position.y, renderer.config.playerGlyph, renderer.config.playerColor);
        }
        renderer.renderStatusBar(currentState.score || 0, position, currentState.board.height);
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
        // Render local player separately
        if (position) {
          renderer.updateCell(position.x, position.y, renderer.config.playerGlyph, renderer.config.playerColor);
        }
        renderer.renderStatusBar(currentState.score || 0, position, currentState.board.height);
        previousState = currentState;
        return;
      }

      // Incremental render
      // Track local player position changes
      const previousLocalPlayer = previousState.players?.find(p => p.playerId === localPlayerId);
      const previousLocalPosition = previousLocalPlayer ? { x: previousLocalPlayer.x, y: previousLocalPlayer.y } : null;

      renderer.renderIncremental(
        changes,
        board,
        otherPlayers,
        currentState.entities || [],
        localPlayerId,
        currentState.score || 0,
        position,
        currentState.board.height
      );

      // Handle local player movement separately
      if (position && previousLocalPosition) {
        if (previousLocalPosition.x !== position.x || previousLocalPosition.y !== position.y) {
          // Local player moved - clear old position and draw at new position
          renderer.restoreCellContent(
            previousLocalPosition.x,
            previousLocalPosition.y,
            board,
            otherPlayers,
            currentState.entities || []
          );
          renderer.updateCell(position.x, position.y, renderer.config.playerGlyph, renderer.config.playerColor);
        }
      } else if (position && !previousLocalPosition) {
        // Local player just joined - draw at position
        renderer.updateCell(position.x, position.y, renderer.config.playerGlyph, renderer.config.playerColor);
      }

      // Update status bar if score changed
      if (changes.scoreChanged) {
        renderer.renderStatusBar(currentState.score || 0, position, currentState.board.height);
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
        // Render local player separately
        if (position) {
          renderer.updateCell(position.x, position.y, renderer.config.playerGlyph, renderer.config.playerColor);
        }
        renderer.renderStatusBar(currentState.score || 0, position, currentState.board.height);
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
