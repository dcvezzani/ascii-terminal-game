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
  let previousPredictedPosition = null; // Track previous predicted position for rendering
  let reconciliationTimer = null; // Timer for periodic reconciliation
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
    if (!wsClient.isConnected() || !localPlayerId) {
      return;
    }

    // Check if prediction is enabled
    if (clientConfig.prediction?.enabled !== false) {
      // Get current predicted position (or fall back to server position)
      const currentPos = localPlayerPredictedPosition.x !== null
        ? localPlayerPredictedPosition
        : getServerPlayerPosition();

      if (!currentPos || currentPos.x === null) {
        // Can't predict without valid position
        sendMoveToServer(dx, dy);
        return;
      }

      // Calculate new position
      const newX = currentPos.x + dx;
      const newY = currentPos.y + dy;

      // Validate new position
      if (validateMovement(newX, newY, currentState)) {
        // Valid movement - update prediction immediately
        const oldPos = { ...localPlayerPredictedPosition };
        localPlayerPredictedPosition = { x: newX, y: newY };

        // Create board adapter for rendering
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
          }
        };

        // Get other players for rendering
        const otherPlayers = (currentState.players || []).filter(
          p => p.playerId !== localPlayerId
        );
        const entities = currentState.entities || [];

        // Render immediately
        renderer.restoreCellContent(oldPos.x, oldPos.y, board, otherPlayers, entities);
        renderer.updateCell(
          newX,
          newY,
          renderer.config.playerGlyph,
          renderer.config.playerColor
        );

        // Update status bar with new position
        renderer.renderStatusBar(
          currentState.score || 0,
          { x: newX, y: newY },
          currentState.board.height
        );
      }
    }

    // Always send to server (server is authoritative)
    sendMoveToServer(dx, dy);
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
   * Send MOVE message to server
   * @param {number} dx - Delta X (-1, 0, or 1)
   * @param {number} dy - Delta Y (-1, 0, or 1)
   */
  function sendMoveToServer(dx, dy) {
    try {
      const moveMessage = MessageHandler.createMessage(MessageTypes.MOVE, { dx, dy });
      wsClient.send(moveMessage);
      logger.info(`Sent MOVE message: (${dx}, ${dy})`);
    } catch (error) {
      logger.error('Error sending MOVE message:', error);
    }
  }

  /**
   * Reconcile predicted position with server position
   */
  function reconcilePosition() {
    // Check prerequisites
    if (!localPlayerId) {
      return; // Can't reconcile without player ID
    }

    if (localPlayerPredictedPosition.x === null || localPlayerPredictedPosition.y === null) {
      return; // Can't reconcile without predicted position
    }

    if (!currentState || !currentState.players) {
      return; // Can't reconcile without server state
    }

    // Get server position
    const serverPlayer = currentState.players.find(p => p.playerId === localPlayerId);
    if (!serverPlayer) {
      logger.warn('Local player not found in server state, skipping reconciliation');
      return;
    }

    const serverPos = { x: serverPlayer.x, y: serverPlayer.y };
    const predictedPos = localPlayerPredictedPosition;

    // Compare positions
    if (serverPos.x !== predictedPos.x || serverPos.y !== predictedPos.y) {
      // Mismatch detected - correct to server position
      logger.debug(`Reconciliation: correcting position from (${predictedPos.x}, ${predictedPos.y}) to (${serverPos.x}, ${serverPos.y})`);

      // Create board adapter
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
        }
      };

      // Get other players
      const otherPlayers = (currentState.players || []).filter(
        p => p.playerId !== localPlayerId
      );
      const entities = currentState.entities || [];

      // Clear old predicted position
      renderer.restoreCellContent(
        predictedPos.x,
        predictedPos.y,
        board,
        otherPlayers,
        entities
      );

      // Update predicted position to server position
      localPlayerPredictedPosition = { x: serverPos.x, y: serverPos.y };

      // Draw player at server position
      renderer.updateCell(
        serverPos.x,
        serverPos.y,
        renderer.config.playerGlyph,
        renderer.config.playerColor
      );

      // Update status bar
      renderer.renderStatusBar(
        currentState.score || 0,
        serverPos,
        currentState.board.height
      );
    }
  }

  /**
   * Start reconciliation timer
   */
  function startReconciliationTimer() {
    if (reconciliationTimer) {
      clearInterval(reconciliationTimer);
    }

    const interval = clientConfig.prediction?.reconciliationInterval || 5000;
    reconciliationTimer = setInterval(() => {
      reconcilePosition();
    }, interval);
  }

  /**
   * Stop reconciliation timer
   */
  function stopReconciliationTimer() {
    if (reconciliationTimer) {
      clearInterval(reconciliationTimer);
      reconciliationTimer = null;
    }
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
    // If cell is null (out of bounds), it's not a valid position
    if (cell === null) return false;
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
          startReconciliationTimer(); // Start reconciliation timer
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
      
      // Get server position before updating state
      const serverPlayerBefore = currentState?.players?.find(p => p.playerId === localPlayerId);
      const serverPosBefore = serverPlayerBefore ? { x: serverPlayerBefore.x, y: serverPlayerBefore.y } : null;
      
      currentState = message.payload;
      
      // Get server position after updating state
      const serverPlayerAfter = currentState.players?.find(p => p.playerId === localPlayerId);
      const serverPosAfter = serverPlayerAfter ? { x: serverPlayerAfter.x, y: serverPlayerAfter.y } : null;
      
      // Log position comparison for debugging
      if (localPlayerPredictedPosition.x !== null && serverPosAfter) {
        logger.debug(`STATE_UPDATE: predicted=(${localPlayerPredictedPosition.x},${localPlayerPredictedPosition.y}) server=(${serverPosAfter.x},${serverPosAfter.y})`);
        if (serverPosBefore && (serverPosBefore.x !== serverPosAfter.x || serverPosBefore.y !== serverPosAfter.y)) {
          logger.debug(`STATE_UPDATE: server position changed from (${serverPosBefore.x},${serverPosBefore.y}) to (${serverPosAfter.x},${serverPosAfter.y})`);
        }
      }
      
      // Initialize prediction if not already set
      if (localPlayerPredictedPosition.x === null && localPlayerId && currentState.players) {
        const localPlayer = currentState.players.find(p => p.playerId === localPlayerId);
        if (localPlayer) {
          localPlayerPredictedPosition = { x: localPlayer.x, y: localPlayer.y };
          logger.debug(`Initialized prediction position from STATE_UPDATE: (${localPlayer.x}, ${localPlayer.y})`);
          startReconciliationTimer(); // Start reconciliation timer
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

      // Get local player position (predicted or server)
      const localPlayer = currentState.players?.find(p => p.playerId === localPlayerId);
      const serverPosition = localPlayer ? { x: localPlayer.x, y: localPlayer.y } : null;
      
      // Use predicted position if available, otherwise server position
      const position = localPlayerPredictedPosition.x !== null
        ? localPlayerPredictedPosition
        : serverPosition;

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
        previousPredictedPosition = position ? { ...position } : null;
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
        previousPredictedPosition = position ? { ...position } : null;
        return;
      }

      // Incremental render
      // Use stored previousPredictedPosition (will be updated after render)

      // Filter out local player from changes to prevent duplicate rendering
      // The local player is rendered separately using predicted position
      const filteredChanges = {
        players: {
          moved: changes.players.moved.filter(m => m.playerId !== localPlayerId),
          joined: changes.players.joined.filter(j => j.playerId !== localPlayerId),
          left: changes.players.left.filter(l => l.playerId !== localPlayerId)
        },
        scoreChanged: changes.scoreChanged
      };

      renderer.renderIncremental(
        filteredChanges,
        board,
        otherPlayers,
        currentState.entities || [],
        localPlayerId,
        currentState.score || 0,
        position,
        currentState.board.height
      );

      // Handle local player movement separately (using predicted position)
      let positionChanged = false;
      if (position && previousPredictedPosition) {
        if (previousPredictedPosition.x !== position.x || previousPredictedPosition.y !== position.y) {
          // Local player moved - clear old position and draw at new position
          renderer.restoreCellContent(
            previousPredictedPosition.x,
            previousPredictedPosition.y,
            board,
            otherPlayers,
            currentState.entities || []
          );
          renderer.updateCell(position.x, position.y, renderer.config.playerGlyph, renderer.config.playerColor);
          positionChanged = true;
        }
      } else if (position && !previousPredictedPosition) {
        // Local player just joined - draw at position
        renderer.updateCell(position.x, position.y, renderer.config.playerGlyph, renderer.config.playerColor);
        positionChanged = true;
      }

      // Update status bar if score changed or position changed
      if (changes.scoreChanged || positionChanged) {
        renderer.renderStatusBar(currentState.score || 0, position, currentState.board.height);
      }

      // Update previous state and predicted position for next render
      previousState = currentState;
      previousPredictedPosition = position ? { ...position } : null;
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
        // Get local player position (predicted or server)
        const localPlayer = currentState.players?.find(p => p.playerId === localPlayerId);
        const serverPosition = localPlayer ? { x: localPlayer.x, y: localPlayer.y } : null;
        const position = localPlayerPredictedPosition.x !== null
          ? localPlayerPredictedPosition
          : serverPosition;
        
        // Exclude local player from server state rendering
        const otherPlayersFallback = (currentState.players || []).filter(
          p => p.playerId !== localPlayerId
        );
        
        renderer.clearScreen();
        renderer.renderTitle();
        renderer.renderBoard(board, otherPlayersFallback);
        // Render local player separately using predicted/server position
        if (position) {
          renderer.updateCell(position.x, position.y, renderer.config.playerGlyph, renderer.config.playerColor);
        }
        renderer.renderStatusBar(currentState.score || 0, position, currentState.board.height);
        previousState = currentState;
        previousPredictedPosition = position ? { ...position } : null;
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

    // Stop reconciliation timer
    stopReconciliationTimer();
    
    // Reset prediction state
    localPlayerPredictedPosition = { x: null, y: null };
    previousPredictedPosition = null;

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
