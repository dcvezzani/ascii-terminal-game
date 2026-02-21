import clientConfig from '../../config/clientConfig.js';
import { resolveRenderingConfig } from '../config/resolveRendering.js';
import WebSocketClient from '../network/WebSocketClient.js';
import Renderer from '../render/Renderer.js';
import Canvas from '../render/Canvas.js';
import InputHandler from '../input/InputHandler.js';
import MessageHandler from '../network/MessageHandler.js';
import MessageTypes from '../network/MessageTypes.js';
import logger from '../utils/logger.js';
import { checkTerminalSize, getTerminalSize, startupClear } from '../utils/terminal.js';
import compareStates from '../utils/stateComparison.js';
import { computeLayout, getContentRegionFromLayout } from '../render/layout.js';
import { getStatusBarHeight } from '../render/statusBarUtils.js';
import Message from '../render/Message.js';

/**
 * Networked game mode - connects to server and plays multiplayer game
 */
export async function networkedMode() {
  const wsClient = new WebSocketClient(clientConfig.websocket.url);
  const renderer = new Renderer({logger})
  const canvas = new Canvas({
    ...clientConfig.rendering,
    statusBar: clientConfig.statusBar,
    logger: logger
  });
  const inputHandler = new InputHandler();

  let currentState = null;
  let previousState = null; // Track previous state for change detection
  let localPlayerId = null;
  let localPlayerPredictedPosition = { x: null, y: null }; // Predicted position for client-side prediction
  let previousPredictedPosition = null; // Track previous predicted position for rendering
  let reconciliationTimer = null; // Timer for periodic reconciliation
  let running = true;
  let displayEmptyDuringResize = false;
  let resizeDebounceTimer = null;
  let cachedLayout = null;
  let lastContentRegion = null;
  let wasTooSmall = false;

  // Remote entity interpolation (smooth other players between server updates)
  const INTERPOLATION_DELAY_MS = 150;
  const INTERPOLATION_TICK_MS = 50;
  const REMOTE_ENTITY_BUFFER_MAX = 20;
  const EXTRAPOLATION_MAX_MS = 300;
  const remoteEntityBuffers = {};       // { [playerId]: [{ t, x, y, playerName }] }
  const remoteEntityInterpolated = {};  // { [playerId]: { x, y, playerName } }
  const lastDrawnInterpolatedPositions = {}; // { [playerId]: { x, y } }
  let interpolationTickTimer = null;

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
        canvas.restoreCellContent(oldPos.x, oldPos.y, board, otherPlayers, entities);
        canvas.updateCell(
          newX,
          newY,
          canvas.config.playerGlyph,
          canvas.config.playerColor
        );

        // Update status bar with new position
        if (cachedLayout) {
          canvas.renderStatusBar(
            currentState.score || 0,
            { x: newX, y: newY },
            60,
            currentState.board.height,
            cachedLayout
          );
        } else {
          canvas.renderStatusBar(
            currentState.score || 0,
            { x: newX, y: newY },
            currentState.board.width,
            currentState.board.height
          );
        }

        renderer.render(canvas);
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
      // logger.info(`Sent MOVE message: (${dx}, ${dy})`);
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
      const distance = Math.abs(serverPos.x - predictedPos.x) + Math.abs(serverPos.y - predictedPos.y);
      // Only log if the difference is significant (more than 1 tile)
      if (distance > 1) {
        logger.debug(`Reconciliation: correcting position from (${predictedPos.x}, ${predictedPos.y}) to (${serverPos.x}, ${serverPos.y}) [distance: ${distance}]`);
      }

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
      canvas.restoreCellContent(
        predictedPos.x,
        predictedPos.y,
        board,
        otherPlayers,
        entities
      );

      // Update predicted position to server position
      localPlayerPredictedPosition = { x: serverPos.x, y: serverPos.y };

      // Draw player at server position
      canvas.updateCell(
        serverPos.x,
        serverPos.y,
        canvas.config.playerGlyph,
        canvas.config.playerColor
      );

      // Update status bar
      if (cachedLayout) {
        canvas.renderStatusBar(
          currentState.score || 0,
          serverPos,
          60,
          currentState.board.height,
          cachedLayout
        );
      } else {
        canvas.renderStatusBar(
          currentState.score || 0,
          serverPos,
          currentState.board.width,
          currentState.board.height
        );
      }
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
   * Compute interpolated or extrapolated position for one entity from its buffer.
   * When board is provided, clamps to latest position if computed position is inside a wall.
   * @param {Array} buffer - Array of { t, x, y, playerName }
   * @param {number} renderTime - Time to render at (ms)
   * @param {{ getCell: (x: number, y: number) => string|null }} [board] - Optional board to clamp position (no drawing in walls)
   * @returns {{ x: number, y: number, playerName?: string } | null}
   */
  function getInterpolatedPosition(buffer, renderTime, board) {
    if (!buffer || buffer.length === 0) return null;
    const latest = buffer[buffer.length - 1];
    function clampToBoard(pos, latestSnapshot) {
      if (!board || !board.getCell) return pos;
      const rx = Math.round(pos.x);
      const ry = Math.round(pos.y);
      const cell = board.getCell(rx, ry);
      if (cell === '#') {
        return { x: latestSnapshot.x, y: latestSnapshot.y, playerName: latestSnapshot.playerName };
      }
      return pos;
    }
    if (buffer.length === 1) {
      return { x: latest.x, y: latest.y, playerName: latest.playerName };
    }
    // Find two snapshots surrounding renderTime
    let i = 0;
    while (i < buffer.length - 1 && buffer[i + 1].t < renderTime) {
      i++;
    }
    const a = buffer[i];
    const b = buffer[i + 1];
    if (b && renderTime >= a.t && renderTime <= b.t) {
      const total = b.t - a.t;
      const portion = renderTime - a.t;
      const ratio = total > 0 ? portion / total : 1;
      const lerped = {
        x: a.x + (b.x - a.x) * ratio,
        y: a.y + (b.y - a.y) * ratio,
        playerName: b.playerName ?? a.playerName
      };
      return clampToBoard(lerped, latest);
    }
    // renderTime is past last snapshot: extrapolate or hold
    if (renderTime <= latest.t) return { x: latest.x, y: latest.y, playerName: latest.playerName };
    const timePast = renderTime - latest.t;
    if (timePast > EXTRAPOLATION_MAX_MS) {
      return { x: latest.x, y: latest.y, playerName: latest.playerName };
    }
    const timePastSec = timePast / 1000;
    let vx = 0;
    let vy = 0;
    if (typeof latest.vx === 'number' && typeof latest.vy === 'number') {
      vx = latest.vx;
      vy = latest.vy;
    } else {
      const prev = buffer[buffer.length - 2];
      const dt = latest.t - (prev?.t ?? latest.t);
      vx = dt > 0 ? (latest.x - (prev?.x ?? latest.x)) / (dt / 1000) : 0;
      vy = dt > 0 ? (latest.y - (prev?.y ?? latest.y)) / (dt / 1000) : 0;
    }
    const extrapolated = {
      x: latest.x + vx * timePastSec,
      y: latest.y + vy * timePastSec,
      playerName: latest.playerName
    };
    return clampToBoard(extrapolated, latest);
  }

  /**
   * Run interpolation tick: update interpolated positions and redraw remote player cells
   */
  function runInterpolationTick() {
    if (!currentState || !currentState.board) return;
    const renderTime = Date.now() - INTERPOLATION_DELAY_MS;
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
    const entities = currentState.entities || [];
    for (const playerId of Object.keys(remoteEntityBuffers)) {
      const pos = getInterpolatedPosition(remoteEntityBuffers[playerId], renderTime, board);
      if (pos) {
        remoteEntityInterpolated[playerId] = pos;
      }
    }
    const otherPlayersAtInterpolated = Object.values(remoteEntityInterpolated)
      .filter(o => o && typeof o.x === 'number' && typeof o.y === 'number')
      .map(o => ({ x: Math.round(o.x), y: Math.round(o.y) }));
    let anyChanged = false;
    for (const [playerId, interp] of Object.entries(remoteEntityInterpolated)) {
      const newX = Math.round(interp.x);
      const newY = Math.round(interp.y);
      const last = lastDrawnInterpolatedPositions[playerId];
      const lastX = last ? last.x : null;
      const lastY = last ? last.y : null;
      if (lastX !== newX || lastY !== newY) {
        if (lastX != null && lastY != null) {
          canvas.restoreCellContent(
            lastX,
            lastY,
            board,
            otherPlayersAtInterpolated,
            entities
          );
        }
        canvas.updateCell(newX, newY, canvas.config.playerGlyph, canvas.config.playerColor);
        lastDrawnInterpolatedPositions[playerId] = { x: newX, y: newY };
        anyChanged = true;
      }
    }
    if (anyChanged) {
      renderer.render(canvas);
    }
  }

  /**
   * Start interpolation tick (runs when we have state and localPlayerId)
   */
  function startInterpolationTick() {
    if (interpolationTickTimer) return;
    interpolationTickTimer = setInterval(() => {
      if (running && currentState && localPlayerId) {
        runInterpolationTick();
      }
    }, INTERPOLATION_TICK_MS);
  }

  /**
   * Stop interpolation tick
   */
  function stopInterpolationTick() {
    if (interpolationTickTimer) {
      clearInterval(interpolationTickTimer);
      interpolationTickTimer = null;
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
      
      startInterpolationTick();
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
      
      currentState = message.payload; //dcv
      
      // Push remote player positions to interpolation buffers (use message timestamp)
      const timestamp = typeof message.timestamp === 'number' ? message.timestamp : Date.now();
      const remotePlayers = (currentState.players || []).filter(p => p.playerId !== localPlayerId);
      const currentRemoteIds = new Set(remotePlayers.map(p => p.playerId));
      for (const p of remotePlayers) {
        if (!p.playerId || typeof p.x !== 'number' || typeof p.y !== 'number') continue;
        if (!remoteEntityBuffers[p.playerId]) remoteEntityBuffers[p.playerId] = [];
        const buf = remoteEntityBuffers[p.playerId];
        const vx = typeof p.vx === 'number' ? p.vx : undefined;
        const vy = typeof p.vy === 'number' ? p.vy : undefined;
        buf.push({ t: timestamp, x: p.x, y: p.y, playerName: p.playerName, vx, vy });
        if (buf.length > REMOTE_ENTITY_BUFFER_MAX) buf.shift();
      }
      // Remove buffers and clear cells for players who left
      for (const playerId of Object.keys(remoteEntityBuffers)) {
        if (currentRemoteIds.has(playerId)) continue;
        const lastPos = lastDrawnInterpolatedPositions[playerId];
        if (lastPos != null && currentState.board) {
          const board = {
            width: currentState.board.width,
            height: currentState.board.height,
            grid: currentState.board.grid,
            getCell: (x, y) => {
              if (y < 0 || y >= currentState.board.grid.length) return null;
              if (x < 0 || x >= currentState.board.grid[y].length) return null;
              return currentState.board.grid[y][x];
            },
            isWall: () => false,
            serialize: () => currentState.board.grid
          };
          const otherPlayersHere = Object.values(remoteEntityInterpolated)
            .filter(o => o && typeof o.x === 'number' && typeof o.y === 'number')
            .map(o => ({ x: Math.round(o.x), y: Math.round(o.y) }));
          canvas.restoreCellContent(lastPos.x, lastPos.y, board, otherPlayersHere, currentState.entities || []);
        }
        delete remoteEntityBuffers[playerId];
        delete remoteEntityInterpolated[playerId];
        delete lastDrawnInterpolatedPositions[playerId];
      }
      
      // Get server position after updating state
      const serverPlayerAfter = currentState.players?.find(p => p.playerId === localPlayerId);
      const serverPosAfter = serverPlayerAfter ? { x: serverPlayerAfter.x, y: serverPlayerAfter.y } : null;
      
      // Log position comparison for debugging
      if (localPlayerPredictedPosition.x !== null && serverPosAfter) {
        // logger.debug(`STATE_UPDATE: predicted=(${localPlayerPredictedPosition.x},${localPlayerPredictedPosition.y}) server=(${serverPosAfter.x},${serverPosAfter.y})`);
        if (serverPosBefore && (serverPosBefore.x !== serverPosAfter.x || serverPosBefore.y !== serverPosAfter.y)) {
          // logger.debug(`STATE_UPDATE: server position changed from (${serverPosBefore.x},${serverPosBefore.y}) to (${serverPosAfter.x},${serverPosAfter.y})`);
        }
      }
      
      // Initialize prediction if not already set
      if (localPlayerPredictedPosition.x === null && localPlayerId && currentState.players) {
        const localPlayer = currentState.players.find(p => p.playerId === localPlayerId);
        if (localPlayer) {
          localPlayerPredictedPosition = { x: localPlayer.x, y: localPlayer.y };
          logger.debug(`Initialized prediction position from STATE_UPDATE: (${localPlayer.x}, ${localPlayer.y})`);
          startReconciliationTimer(); // Start reconciliation timer (for periodic checks)
        }
      } else if (localPlayerPredictedPosition.x !== null && localPlayerId && currentState.players) {
        // Reconcile on every STATE_UPDATE to catch server rejections immediately
        // This prevents large position drifts when server rejects moves
        reconcilePosition();
      }
      
      render();
    } catch (error) {
      logger.error('Error handling STATE_UPDATE:', error);
    }
  }

  inputHandler.onRender(() => {
    runNormalRenderPath();
  });

  /**
   * Normal render path: size check → too small message or clear-then-draw.
   * Used for first render, resize debounce, and too-many-changes full redraw.
   * @returns {boolean} true if content was drawn, false if too small or no state
   */
  function runNormalRenderPath() {
    if (!currentState) return false;

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
    const serverPosition = localPlayer ? { x: localPlayer.x, y: localPlayer.y } : null;
    const position = localPlayerPredictedPosition.x !== null
      ? localPlayerPredictedPosition
      : serverPosition;

    // Use interpolated positions for remotes when available (single source of truth for remote display)
    const remotePlayersFromState = (currentState.players || []).filter(
      p => p.playerId !== localPlayerId
    );
    const otherPlayers = remotePlayersFromState.map((p) => {
      const interp = remoteEntityInterpolated[p.playerId];
      if (interp != null && typeof interp.x === 'number' && typeof interp.y === 'number') {
        return { x: Math.round(interp.x), y: Math.round(interp.y), playerName: interp.playerName };
      }
      return { x: p.x, y: p.y, playerName: p.playerName };
    });

    const centerBoard = clientConfig.rendering?.centerBoard !== false;
    let layout = null;

    renderer.moveCursorToHome(); 
    if (centerBoard) {
      const { columns, rows } = getTerminalSize();
      const statusBarHeight = getStatusBarHeight(
        currentState.score || 0,
        position,
        60
      );
      layout = computeLayout(
        columns,
        rows,
        board.width,
        board.height,
        statusBarHeight,
        { centerBoard: true }
      );
      if (!layout.fitsInTerminal) {
        Message.apply(canvas, { terminalColumns: columns, terminalRows: rows });
        renderer.render(canvas);
        wasTooSmall = true;
        return false;
      }
    }

    if (wasTooSmall) {
      canvas.clearScreen();
    }
    wasTooSmall = false;
    renderer.moveCursorToHome();
    canvas.clearContentRegion(lastContentRegion);
    const titleString = '=== Multiplayer Terminal Game ===';
    if (layout) {
      canvas.renderTitle(titleString, layout);
      canvas.renderBoard(board, otherPlayers, layout);
    } else {
      canvas.renderTitle(titleString);
      canvas.renderBoard(board, otherPlayers);
    }
    if (position) {
      canvas.updateCell(position.x, position.y, canvas.config.playerGlyph, canvas.config.playerColor);
    }
    
    if (layout) {
      canvas.renderStatusBar(
        currentState.score || 0,
        position,
        60,
        currentState.board.height,
        layout
      );
    } else {
      canvas.renderStatusBar(
        currentState.score || 0,
        position,
        currentState.board.width,
        currentState.board.height
      );
    }
    lastContentRegion = layout ? getContentRegionFromLayout(layout) : null;
    cachedLayout = layout;
    canvas._currentLayout = layout || null;
    renderer.render(canvas);
    return true;
  }

  /**
   * Render the game
   */
  function render() {
    if (
      !currentState
      || !changesSinceLastRender(previousState, currentState)
      || displayEmptyDuringResize
    ) {
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

      // Exclude local player from server state rendering
      const otherPlayers = (currentState.players || []).filter(
        p => p.playerId !== localPlayerId
      );

      const centerBoard = clientConfig.rendering?.centerBoard !== false;
      let layout = null;
      if (centerBoard) {
        const { columns, rows } = getTerminalSize();
        const statusBarHeight = getStatusBarHeight(
          currentState.score || 0,
          position,
          60
        );
        layout = computeLayout(
          columns,
          rows,
          board.width,
          board.height,
          statusBarHeight,
          { centerBoard: true }
        );
        if (!layout.fitsInTerminal) {
          Message.apply(canvas, { terminalColumns: columns, terminalRows: rows });
          previousState = currentState
          renderer.render(canvas);
          return;
        }
      }
      canvas._currentLayout = layout || null;
      cachedLayout = layout;

      const titleString = '=== Multiplayer Terminal Game ===';

      // First render: use normal render path only
      if (previousState === null) {
        runNormalRenderPath();
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

      // Fallback to full render if too many changes (use normal render path)
      if (totalChanges > 10) {
        runNormalRenderPath();
        previousState = currentState;
        previousPredictedPosition = position ? { ...position } : null;
        return;
      }

      // Incremental render
      // Use stored previousPredictedPosition (will be updated after render)

      // Filter so incremental render does not draw remote player positions (interpolation tick owns those)
      // Only local player moves are passed; remote moves are excluded to avoid snapping remotes to server
      const filteredChanges = {
        players: {
          moved: changes.players.moved.filter(m => m.playerId === localPlayerId),
          joined: changes.players.joined.filter(j => j.playerId !== localPlayerId),
          left: changes.players.left.filter(l => l.playerId !== localPlayerId)
        },
        scoreChanged: changes.scoreChanged
      };

      canvas.renderIncremental(
        filteredChanges,
        board,
        otherPlayers,
        currentState.entities || [],
        localPlayerId,
        currentState.score || 0,
        position
      );

      // Handle local player movement separately (using predicted position)
      let positionChanged = false;
      if (position && previousPredictedPosition) {
        if (previousPredictedPosition.x !== position.x || previousPredictedPosition.y !== position.y) {
          // Local player moved - clear old position and draw at new position
          canvas.restoreCellContent(
            previousPredictedPosition.x,
            previousPredictedPosition.y,
            board,
            otherPlayers,
            currentState.entities || []
          );
          canvas.updateCell(position.x, position.y, canvas.config.playerGlyph, canvas.config.playerColor);
          positionChanged = true;
        }
      } else if (position && !previousPredictedPosition) {
        // Local player just joined - draw at position
        canvas.updateCell(position.x, position.y, canvas.config.playerGlyph, canvas.config.playerColor);
        positionChanged = true;
      }

      // Update status bar if score changed or position changed
      if (changes.scoreChanged || positionChanged) {
        if (layout) {
          canvas.renderStatusBar(
            currentState.score || 0,
            position,
            60,
            currentState.board.height,
            layout
          );
        } else {
          canvas.renderStatusBar(
            currentState.score || 0,
            position,
            currentState.board.width,
            currentState.board.height
          );
        }
      }

      // Update previous state and predicted position for next render
      previousState = currentState;
      previousPredictedPosition = position ? { ...position } : null;
      renderer.render(canvas);
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
        
        // Use interpolated positions for remotes when available (same as runNormalRenderPath)
        const remotePlayersFromStateFallback = (currentState.players || []).filter(
          p => p.playerId !== localPlayerId
        );
        const otherPlayersFallback = remotePlayersFromStateFallback.map((p) => {
          const interp = remoteEntityInterpolated[p.playerId];
          if (interp != null && typeof interp.x === 'number' && typeof interp.y === 'number') {
            return { x: Math.round(interp.x), y: Math.round(interp.y), playerName: interp.playerName };
          }
          return { x: p.x, y: p.y, playerName: p.playerName };
        });

        canvas.clearContentRegion(lastContentRegion);
        const centerBoardFallback = clientConfig.rendering?.centerBoard !== false;
        const fallbackLayout = centerBoardFallback ? computeLayout(
          getTerminalSize().columns,
          getTerminalSize().rows,
          currentState.board.width,
          currentState.board.height,
          getStatusBarHeight(currentState.score || 0, position, 60),
          { centerBoard: true }
        ) : null;
        if (fallbackLayout?.fitsInTerminal) {
          canvas._currentLayout = fallbackLayout;
          canvas.renderTitle('=== Multiplayer Terminal Game ===', fallbackLayout);
          canvas.renderBoard(board, otherPlayersFallback, fallbackLayout);
        } else {
          canvas._currentLayout = null;
          canvas.renderTitle('=== Multiplayer Terminal Game ===');
          canvas.renderBoard(board, otherPlayersFallback);
        }
        // Render local player separately using predicted/server position
        if (position) {
          canvas.updateCell(position.x, position.y, canvas.config.playerGlyph, canvas.config.playerColor);
        }
        if (fallbackLayout?.fitsInTerminal) {
          canvas.renderStatusBar(
            currentState.score || 0,
            position,
            60,
            currentState.board.height,
            fallbackLayout
          );
        } else {
          canvas.renderStatusBar(
            currentState.score || 0,
            position,
            currentState.board.width,
            currentState.board.height
          );
        }
        lastContentRegion = fallbackLayout ? getContentRegionFromLayout(fallbackLayout) : null;
        previousState = currentState;
        previousPredictedPosition = position ? { ...position } : null;
      } catch (fallbackError) {
        logger.error('Error during fallback render:', fallbackError);
      }
    }
  }

  function changesSinceLastRender(previousState, currentState) {
    const changes = compareStates(previousState, currentState);
    return changes.players.moved.length > 0 || changes.players.joined.length > 0 || changes.players.left.length > 0 || changes.scoreChanged;
  } 

  /**
   * Shutdown and cleanup
   */
  function shutdown(reason) {
    if (!running) {
      return;
    }

    renderer.clearScreen();

    running = false;
    logger.info(`Shutting down: ${reason}`);

    // Stop reconciliation timer
    stopReconciliationTimer();
    stopInterpolationTick();

    // Reset prediction state
    localPlayerPredictedPosition = { x: null, y: null };
    previousPredictedPosition = null;

    try {
      inputHandler.stop();
      renderer.showCursor();
      canvas.clearScreen();
      wsClient.disconnect();
    } catch (error) {
      logger.error('Error during shutdown:', error);
    }

    process.exit(0);
  }

  // Resize handling: clear during resize, full re-render when debounce fires
  const renderingConfig = resolveRenderingConfig(clientConfig);
  if (process.stdout.isTTY) {
    process.stdout.on('resize', () => {
      displayEmptyDuringResize = true;
      renderer.clearScreen();
      if (resizeDebounceTimer) {
        clearTimeout(resizeDebounceTimer);
      }
      const debounceMs = renderingConfig.resizeDebounceMs;
      resizeDebounceTimer = setTimeout(() => {
        resizeDebounceTimer = null;
        displayEmptyDuringResize = false;
        runNormalRenderPath();
        if (currentState) {
          previousState = currentState;
          const pos = localPlayerPredictedPosition.x !== null
            ? localPlayerPredictedPosition
            : (currentState.players?.find(p => p.playerId === localPlayerId) || {});
          previousPredictedPosition = pos && pos.x != null ? { ...pos } : null;
        }
      }, debounceMs);
    });
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

    await startupClear(process.stdout);

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
