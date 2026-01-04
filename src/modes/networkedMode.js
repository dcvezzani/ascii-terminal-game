/**
 * Networked (multiplayer) mode implementation
 */

import { Game } from '../game/Game.js';
import { Board } from '../game/Board.js';
import { Renderer } from '../render/Renderer.js';
import { InputHandler } from '../input/InputHandler.js';
import { ModalManager } from '../ui/ModalManager.js';
import { Modal } from '../ui/Modal.js';
import { validateTerminalSize } from '../utils/terminal.js';
import { gameConfig } from '../config/gameConfig.js';
import { WebSocketClient } from '../network/WebSocketClient.js';
import { clientLogger } from '../utils/clientLogger.js';
import { compareStates } from '../utils/stateComparison.js';
import { createMessage } from '../network/MessageHandler.js';
import { MessageTypes } from '../network/MessageTypes.js';
import { PLAYER_CHAR, WALL_CHAR, EMPTY_SPACE_CHAR } from '../constants/gameConstants.js';
import { clientConfig } from '../config/clientConfig.js';
import { toZZTCharacterGlyph, toColorHexValue } from '../constants/gameConstants.js';
import ansiEscapes from 'ansi-escapes';
/**
 * Run game in networked (multiplayer) mode
 * @returns {Promise<void>}
 */
export async function runNetworkedMode() {
  let game = null;
  let renderer = null;
  let inputHandler = null;
  let wsClient = null;
  let modalManager = null;
  let showingHelp = false;
  let currentState = null;
  let localPlayerId = null;
  let previousState = null; // Track previous state for incremental rendering
  // Phase 1: Client-side prediction state tracking
  let localPlayerPredictedPosition = { x: null, y: null };
  let lastReconciliationTime = Date.now();
  let reconciliationTimer = null;
  let running = true;
  // Phase 4: Queue state updates that arrive before localPlayerId is set
  let queuedStateUpdate = null;

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

    // Initialize components
    game = new Game(); // Keep for compatibility, but state comes from server
    modalManager = new ModalManager();
    renderer = new Renderer(modalManager);
    wsClient = new WebSocketClient();

// Example: Create a test modal (add this after wsClient.connect() or in onConnect callback)
const testModal = new Modal({
  title: 'Network Test',
  content: [
    { type: 'message', text: 'Connected to server!' },
    { type: 'message', text: 'This is a test modal in networked mode.' },
    {
      type: 'option',
      label: 'Close',
      action: () => {
        clientLogger.info('Close option selected');
        // Modal will close automatically after action
      },
    },
    {
      type: 'option',
      label: 'Quit',
      action: () => {
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
    },
  ],
});
		
    // Set up WebSocket callbacks
    wsClient.onConnect(() => {
      clientLogger.info('Connected to server');
      // Only send CONNECT if not reconnecting (reconnection will send it with playerId)
      if (!wsClient.reconnecting) {
      wsClient.sendConnect();
      }

// Open the modal after connection is established
modalManager.openModal(testModal);
if (renderer && currentState) {
  renderer.renderFull(game, currentState, localPlayerId);
}
			
    });

    // Phase 3: Server Reconciliation - Reconciliation function
    // Phase 4.3: Enhanced with edge case handling
    function reconcileWithServer(gameState) {
      // Phase 4.3: Handle null/undefined predicted position
      if (
        !localPlayerId ||
        localPlayerPredictedPosition.x === null ||
        localPlayerPredictedPosition.y === null ||
        localPlayerPredictedPosition.x === undefined ||
        localPlayerPredictedPosition.y === undefined
      ) {
        return;
      }

      const serverPlayer = gameState.players.find(p => p.playerId === localPlayerId);
      if (!serverPlayer) {
        return;
      }

      const predicted = localPlayerPredictedPosition;
      const server = { x: serverPlayer.x, y: serverPlayer.y };

      // Phase 4.3: Validate server position
      if (
        server.x === null ||
        server.y === null ||
        server.x === undefined ||
        server.y === undefined
      ) {
        clientLogger.warn(`Invalid server player position: (${server.x}, ${server.y})`);
        return;
      }

      // Phase 4.3: Validate predicted position is within bounds
      if (
        gameState.board &&
        gameState.board.grid &&
        (predicted.x < 0 ||
          predicted.y < 0 ||
          predicted.y >= gameState.board.grid.length ||
          (gameState.board.grid[predicted.y] &&
            predicted.x >= gameState.board.grid[predicted.y].length))
      ) {
        clientLogger.warn(
          `Predicted position out of bounds: (${predicted.x}, ${predicted.y}), correcting to server position`
        );
        // Correct to server position immediately
        localPlayerPredictedPosition = { x: server.x, y: server.y };
        return;
      }

      // Check for discrepancy
      // Phase 4.3: Handle server rejecting moves (position doesn't change on server)
      if (predicted.x !== server.x || predicted.y !== server.y) {
        clientLogger.debug(
          `Reconciliation: Predicted (${predicted.x}, ${predicted.y}) != Server (${server.x}, ${server.y})`
        );

        // Correct to server position
        const oldX = predicted.x;
        const oldY = predicted.y;
        localPlayerPredictedPosition = { x: server.x, y: server.y };

        // Re-render at corrected position
        if (renderer) {
          const board = Board.fromSerialized(gameState.board);

          // Clear old predicted position - use getCellContent to check for entities
          // The old position might have an entity (like the ruffian we collided with)
          const oldContent = renderer.getCellContent(
            oldX,
            oldY,
            board,
            gameState.entities || [],
            gameState.players || [],
            null,
            null
          );
          const oldColorFn = renderer.getColorFunction(oldContent.color);
          renderer.updateCell(oldX, oldY, oldContent.glyph.char, oldColorFn);

          // Draw at corrected server position
          const playerColorFn = renderer.getColorFunction(PLAYER_CHAR.color);
          renderer.updateCell(server.x, server.y, PLAYER_CHAR.char, playerColorFn);

          // Update status bar
          renderer.updateStatusBarIfChanged(
            gameState.score || 0,
            server.x,
            server.y,
            gameState.score || 0,
            oldX,
            oldY
          );
        }
      }

      lastReconciliationTime = Date.now();
    }

    // Phase 3: Server Reconciliation - Start reconciliation timer
    function startReconciliationTimer() {
      if (reconciliationTimer) {
        clearInterval(reconciliationTimer);
      }

      const interval = clientConfig.prediction.reconciliationInterval;
      reconciliationTimer = setInterval(() => {
        if (currentState && localPlayerId && clientConfig.prediction.enabled) {
          reconcileWithServer(currentState);
        }
      }, interval);
    }

    /**
     * Check if there's a solid entity at the given position
     * @param {number} x - X coordinate
     * @param {number} y - Y coordinate
     * @param {Array} entities - Array of all entities
     * @returns {boolean} True if there's a solid entity at the position
     */
    function hasSolidEntityAt(x, y, entities) {
      if (!entities || entities.length === 0) {
        return false;
      }
      return entities.some(entity => entity.x === x && entity.y === y && entity.solid === true);
    }


    wsClient.onStateUpdate(gameState => {
      currentState = gameState;
      if (!renderer) {
        return; // Wait for renderer
      }

      // Create Board instance from server data
      const board = Board.fromSerialized(gameState.board);

      // Phase 4.1: Handle state update arriving before localPlayerId is set
      if (!localPlayerId) {
        // Queue the state update to process once localPlayerId is set
        queuedStateUpdate = gameState;
        return;
      }

      try {
        // Handle case where local player is missing from state (e.g., after restart)
        if (localPlayerId && gameState.players) {
          const localPlayer = gameState.players.find(p => p.playerId === localPlayerId);
          if (!localPlayer && previousState !== null) {
            // Player was in previous state but not in current - likely a restart
            clientLogger.info('Local player not found in state, reconnecting after restart...');
            // Reset state tracking to force full render
            previousState = null;
            localPlayerPredictedPosition = { x: null, y: null };
            // Re-send CONNECT to rejoin
            if (wsClient && wsClient.connected) {
              wsClient.sendConnect();
            }
            return; // Wait for next state update after rejoin
          }
        }

        // Phase 1: Client-side prediction - Initialize predicted position on first update
        // Phase 4.1: Handle initial state and mid-game join
        if (previousState === null && localPlayerId) {
          const localPlayer = gameState.players.find(p => p.playerId === localPlayerId);
          if (localPlayer) {
            // Phase 4.3: Validate position before initializing
            if (
              localPlayer.x !== null &&
              localPlayer.y !== null &&
              localPlayer.x !== undefined &&
              localPlayer.y !== undefined
            ) {
              localPlayerPredictedPosition = { x: localPlayer.x, y: localPlayer.y };
              lastReconciliationTime = Date.now();
              // Phase 3: Start reconciliation timer after first state update
              // Phase 4.2: Restart timer on reconnect (if already exists, it will be cleared)
              if (clientConfig.prediction.enabled) {
                startReconciliationTimer();
              }
            } else {
              clientLogger.warn(
                `Invalid initial player position: (${localPlayer.x}, ${localPlayer.y})`
              );
            }
          }
        }

        // Check if modal is open - skip rendering updates if so
        // State updates are still received and stored (currentState updated above)
        // but rendering is skipped to prevent overwriting modal content
        if (modalManager && modalManager.hasOpenModal()) {
          // Modal is open - skip rendering updates
          // State is still updated (currentState = gameState on line 242)
          // When modal closes, next state update will trigger full render
          // Still do reconciliation for state tracking purposes
          if (clientConfig.prediction.enabled && localPlayerId) {
            reconcileWithServer(gameState);
          }
          return; // Skip rendering updates
        }

        // Phase 1: State Tracking - Handle initial render detection
        if (previousState === null) {
          // First render - use renderFull()
          renderer.renderFull(game, gameState, localPlayerId);
          // Store state after successful render (deep copy)
          previousState = JSON.parse(JSON.stringify(gameState));
        } else {
          // Phase 4: Subsequent renders - use incremental updates
          // Board instance already created from gameState.board above

          // Compare states to detect changes
          const changes = compareStates(previousState, gameState);

          // Calculate total changes for fallback threshold (per Q4: Option D)
          const totalChanges =
            changes.players.moved.length +
            changes.players.joined.length +
            changes.players.left.length +
            changes.entities.moved.length +
            changes.entities.spawned.length +
            changes.entities.despawned.length +
            changes.entities.animated.length;

          const FALLBACK_THRESHOLD = 10; // Configurable threshold

          // Fallback to full render if too many changes
          if (totalChanges > FALLBACK_THRESHOLD) {
            clientLogger.debug(
              `Too many changes (${totalChanges}), falling back to full render`
            );
            renderer.renderFull(game, gameState, localPlayerId);
            previousState = JSON.parse(JSON.stringify(gameState));
            return;
          }

          // Apply incremental updates
          // Phase 2: Exclude local player from server state rendering (local player uses prediction)
          const otherPlayers = (gameState.players || []).filter(
            p => p.playerId !== localPlayerId
          );
          const previousOtherPlayers = (previousState.players || []).filter(
            p => p.playerId !== localPlayerId
          );

          // Recalculate changes for other players only
          const otherPlayerChanges = compareStates(
            { ...previousState, players: previousOtherPlayers },
            { ...gameState, players: otherPlayers }
          ).players;

          // Update other players (not local player)
          if (
            otherPlayerChanges.moved.length > 0 ||
            otherPlayerChanges.joined.length > 0 ||
            otherPlayerChanges.left.length > 0
          ) {
            renderer.updatePlayersIncremental(
              previousOtherPlayers,
              otherPlayers,
              board,
              otherPlayerChanges,
              gameState.entities || []
            );
          }

          // Update entities
          if (
            changes.entities.moved.length > 0 ||
            changes.entities.spawned.length > 0 ||
            changes.entities.despawned.length > 0 ||
            changes.entities.animated.length > 0
          ) {
            renderer.updateEntitiesIncremental(
              previousState.entities || [],
              gameState.entities || [],
              board,
              changes.entities
            );
          }

          // Update status bar if changed
          // Phase 2: Use predicted position for status bar (not server position)
          if (localPlayerPredictedPosition.x !== null && localPlayerPredictedPosition.y !== null) {
            const prevLocalPlayer = previousState.players.find(
              p => p.playerId === localPlayerId
            );
            const prevPredictedX = prevLocalPlayer?.x ?? localPlayerPredictedPosition.x;
            const prevPredictedY = prevLocalPlayer?.y ?? localPlayerPredictedPosition.y;
            renderer.updateStatusBarIfChanged(
              gameState.score || 0,
              localPlayerPredictedPosition.x,
              localPlayerPredictedPosition.y,
              previousState.score || 0,
              prevPredictedX,
              prevPredictedY
            );
          }

          // Store state after successful incremental update (deep copy)
          previousState = JSON.parse(JSON.stringify(gameState));
        }

        // Phase 3: Optionally reconcile on every state update (in addition to timer)
        // This provides more frequent reconciliation if needed
        if (clientConfig.prediction.enabled && localPlayerId) {
          reconcileWithServer(gameState);
        }
      } catch (error) {
        // Phase 4: Error Recovery (per Q8: Option C)
        clientLogger.error('Error during incremental update:', error);
        // Fall back to full render on error
        try {
          renderer.renderFull(game, gameState, localPlayerId);
          previousState = JSON.parse(JSON.stringify(gameState));
        } catch (fallbackError) {
          clientLogger.error('Error during fallback render:', fallbackError);
          // If even fallback fails, reset previousState to force full render next time
          previousState = null;
        }
      }
    });

    wsClient.onPlayerJoined(payload => {
      if (payload.clientId === wsClient.getClientId()) {
        localPlayerId = payload.playerId;
        // Phase 4.1: Process queued state update if one exists
        if (queuedStateUpdate && renderer) {
          // Process the queued state update now that localPlayerId is set
          // Trigger the state update handler with the queued state
          currentState = queuedStateUpdate;
          const gameState = queuedStateUpdate;
          queuedStateUpdate = null;

          // Process the state update (same logic as onStateUpdate callback)
          try {
            // Phase 1: Client-side prediction - Initialize predicted position on first update
            // Phase 4.1: Handle initial state and mid-game join
            if (previousState === null && localPlayerId) {
              const localPlayer = gameState.players.find(p => p.playerId === localPlayerId);
              if (localPlayer) {
                // Phase 4.3: Validate position before initializing
                if (
                  localPlayer.x !== null &&
                  localPlayer.y !== null &&
                  localPlayer.x !== undefined &&
                  localPlayer.y !== undefined
                ) {
                  localPlayerPredictedPosition = { x: localPlayer.x, y: localPlayer.y };
                  lastReconciliationTime = Date.now();
                  // Phase 3: Start reconciliation timer after first state update
                  // Phase 4.2: Restart timer on reconnect (if already exists, it will be cleared)
                  if (clientConfig.prediction.enabled) {
                    startReconciliationTimer();
                  }
                } else {
                  clientLogger.warn(
                    `Invalid initial player position: (${localPlayer.x}, ${localPlayer.y})`
                  );
                }
              }
            }

            // Phase 1: State Tracking - Handle initial render detection
            if (previousState === null) {
              // First render - use renderFull()
              renderer.renderFull(game, gameState, localPlayerId);
              // Store state after successful render (deep copy)
              previousState = JSON.parse(JSON.stringify(gameState));
            }
            // Note: We only handle initial render here, incremental updates will happen on next STATE_UPDATE
          } catch (error) {
            clientLogger.error('Error processing queued state update:', error);
          }
        }
      }
    });

    wsClient.onError(error => {
      clientLogger.error('WebSocket error:', error);
    });

    wsClient.onDisconnect(() => {
      clientLogger.info('Disconnected from server');
      // Phase 4.2: Reset predicted position on disconnect
      localPlayerPredictedPosition = { x: null, y: null };
      // Phase 3: Clear reconciliation timer on disconnect
      if (reconciliationTimer) {
        clearInterval(reconciliationTimer);
        reconciliationTimer = null;
      }
      // Phase 4.2: Clear queued state update
      queuedStateUpdate = null;
      running = false;
      if (game) {
        game.stop();
      }
    });

    wsClient.onServerRestart(() => {
      clientLogger.info('Server restarted - resetting client state');
      // Reset state like pressing 'r' key
      previousState = null;
      localPlayerPredictedPosition = { x: null, y: null };
      lastReconciliationTime = Date.now();
      localPlayerId = null; // Will be set when new PLAYER_JOINED arrives
      queuedStateUpdate = null;
      
      // Clear reconciliation timer
      if (reconciliationTimer) {
        clearInterval(reconciliationTimer);
        reconciliationTimer = null;
      }
      
      // Clear help screen if showing
      if (showingHelp) {
        showingHelp = false;
      }
      
      // Reset modal manager
      if (modalManager) {
        modalManager.reset();
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

        // Phase 2: Client-side prediction - Update and render immediately
        // Phase 4.3: Handle edge cases (null/undefined, invalid positions, rapid input)
        if (
          clientConfig.prediction.enabled &&
          localPlayerPredictedPosition.x !== null &&
          localPlayerPredictedPosition.y !== null &&
          localPlayerPredictedPosition.x !== undefined &&
          localPlayerPredictedPosition.y !== undefined &&
          renderer &&
          currentState
        ) {
          const oldX = localPlayerPredictedPosition.x;
          const oldY = localPlayerPredictedPosition.y;
          const newY = oldY - 1;

          // Phase 4.3: Validate bounds before movement
          // Optional: Check for wall collision
          if (
            newY >= 0 &&
            currentState.board &&
            currentState.board.grid &&
            newY < currentState.board.grid.length &&
            oldX >= 0 &&
            oldX < (currentState.board.grid[newY]?.length || 0)
          ) {
            const board = Board.fromSerialized(currentState.board);
            const newCell = board.getCell(oldX, newY);
            if (newCell && newCell.getBaseChar() === WALL_CHAR.char) {
              // Wall collision - don't move
              return;
            }

            // Check for solid entity collision (includes other players, who are solid entities)
            if (hasSolidEntityAt(oldX, newY, currentState.entities || [])) {
              // Solid entity collision - don't move
              return;
            }

            // Check for other player collision (players are solid entities, but we need to check players array
            // since they're not in entities array - they're tracked separately)
            const hasOtherPlayer = (currentState.players || []).some(
              p => p.playerId !== localPlayerId && p.x === oldX && p.y === newY
            );
            if (hasOtherPlayer) {
              // Other player collision - don't move
              return;
            }

            // Update predicted position
            localPlayerPredictedPosition.y = newY;

            // Clear old position - check for entity first, then board cell
            const oldContent = renderer.getCellContent(
              oldX,
              oldY,
              board,
              currentState.entities || [],
              [] // No other players when checking what to restore
            );
            const oldColorFn = renderer.getColorFunction(oldContent.color);
            renderer.updateCell(oldX, oldY, oldContent.glyph.char, oldColorFn);

            // Draw at new position
            const playerColorFn = renderer.getColorFunction(PLAYER_CHAR.color);
            renderer.updateCell(
              localPlayerPredictedPosition.x,
              localPlayerPredictedPosition.y,
              PLAYER_CHAR.char,
              playerColorFn
            );

            // Update status bar with predicted position
            renderer.updateStatusBarIfChanged(
              currentState?.score || 0,
              localPlayerPredictedPosition.x,
              localPlayerPredictedPosition.y,
              currentState?.score || 0,
              oldX,
              oldY
            );
          }
        }

        // Still send to server
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

        // Phase 2: Client-side prediction - Update and render immediately
        // Phase 4.3: Handle edge cases (null/undefined, invalid positions, rapid input)
        if (
          clientConfig.prediction.enabled &&
          localPlayerPredictedPosition.x !== null &&
          localPlayerPredictedPosition.y !== null &&
          localPlayerPredictedPosition.x !== undefined &&
          localPlayerPredictedPosition.y !== undefined &&
          renderer &&
          currentState
        ) {
          const oldX = localPlayerPredictedPosition.x;
          const oldY = localPlayerPredictedPosition.y;
          const newY = oldY + 1;

          // Phase 4.3: Validate bounds before movement
          // Optional: Check for wall collision
          if (
            currentState.board &&
            currentState.board.grid &&
            newY >= 0 &&
            newY < currentState.board.grid.length &&
            oldX >= 0 &&
            oldX < (currentState.board.grid[newY]?.length || 0)
          ) {
            const board = Board.fromSerialized(currentState.board);
            const newCell = board.getCell(oldX, newY);
            if (newCell && newCell.getBaseChar() === WALL_CHAR.char) {
              // Wall collision - don't move
              return;
            }

            // Check for solid entity collision (includes other players, who are solid entities)
            if (hasSolidEntityAt(oldX, newY, currentState.entities || [])) {
              // Solid entity collision - don't move
              return;
            }

            // Check for other player collision (players are solid entities, but we need to check players array
            // since they're not in entities array - they're tracked separately)
            const hasOtherPlayer = (currentState.players || []).some(
              p => p.playerId !== localPlayerId && p.x === oldX && p.y === newY
            );
            if (hasOtherPlayer) {
              // Other player collision - don't move
              return;
            }

            // Update predicted position
            localPlayerPredictedPosition.y = newY;

            // Clear old position - check for entity first, then board cell
            const oldContent = renderer.getCellContent(
              oldX,
              oldY,
              board,
              currentState.entities || [],
              [] // No other players when checking what to restore
            );
            const oldColorFn = renderer.getColorFunction(oldContent.color);
            renderer.updateCell(oldX, oldY, oldContent.glyph.char, oldColorFn);

            // Draw at new position
            const playerColorFn = renderer.getColorFunction(PLAYER_CHAR.color);
            renderer.updateCell(
              localPlayerPredictedPosition.x,
              localPlayerPredictedPosition.y,
              PLAYER_CHAR.char,
              playerColorFn
            );

            // Update status bar with predicted position
            renderer.updateStatusBarIfChanged(
              currentState?.score || 0,
              localPlayerPredictedPosition.x,
              localPlayerPredictedPosition.y,
              currentState?.score || 0,
              oldX,
              oldY
            );
          }
        }

        // Still send to server
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

        // Phase 2: Client-side prediction - Update and render immediately
        // Phase 4.3: Handle edge cases (null/undefined, invalid positions, rapid input)
        if (
          clientConfig.prediction.enabled &&
          localPlayerPredictedPosition.x !== null &&
          localPlayerPredictedPosition.y !== null &&
          localPlayerPredictedPosition.x !== undefined &&
          localPlayerPredictedPosition.y !== undefined &&
          renderer &&
          currentState
        ) {
          const oldX = localPlayerPredictedPosition.x;
          const oldY = localPlayerPredictedPosition.y;
          const newX = oldX - 1;

          // Phase 4.3: Validate bounds before movement
          // Optional: Check for wall collision
          if (
            newX >= 0 &&
            currentState.board &&
            currentState.board.grid &&
            oldY >= 0 &&
            oldY < currentState.board.grid.length &&
            newX < (currentState.board.grid[oldY]?.length || 0)
          ) {
            const board = Board.fromSerialized(currentState.board);
            const newCell = board.getCell(newX, oldY);
            if (newCell && newCell.getBaseChar() === WALL_CHAR.char) {
              // Wall collision - don't move
              return;
            }

            // Check for solid entity collision (includes other players, who are solid entities)
            if (hasSolidEntityAt(newX, oldY, currentState.entities || [])) {
              // Solid entity collision - don't move
              return;
            }

            // Check for other player collision (players are solid entities, but we need to check players array
            // since they're not in entities array - they're tracked separately)
            const hasOtherPlayer = (currentState.players || []).some(
              p => p.playerId !== localPlayerId && p.x === newX && p.y === oldY
            );
            if (hasOtherPlayer) {
              // Other player collision - don't move
              return;
            }

            // Update predicted position
            localPlayerPredictedPosition.x = newX;

            // Clear old position - check for entity first, then board cell
            const oldContent = renderer.getCellContent(
              oldX,
              oldY,
              board,
              currentState.entities || [],
              [] // No other players when checking what to restore
            );
            const oldColorFn = renderer.getColorFunction(oldContent.color);
            renderer.updateCell(oldX, oldY, oldContent.glyph.char, oldColorFn);

            // Draw at new position
            const playerColorFn = renderer.getColorFunction(PLAYER_CHAR.color);
            renderer.updateCell(
              localPlayerPredictedPosition.x,
              localPlayerPredictedPosition.y,
              PLAYER_CHAR.char,
              playerColorFn
            );

            // Update status bar with predicted position
            renderer.updateStatusBarIfChanged(
              currentState?.score || 0,
              localPlayerPredictedPosition.x,
              localPlayerPredictedPosition.y,
              currentState?.score || 0,
              oldX,
              oldY
            );
          }
        }

        // Still send to server
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

        // Phase 2: Client-side prediction - Update and render immediately
        // Phase 4.3: Handle edge cases (null/undefined, invalid positions, rapid input)
        if (
          clientConfig.prediction.enabled &&
          localPlayerPredictedPosition.x !== null &&
          localPlayerPredictedPosition.y !== null &&
          localPlayerPredictedPosition.x !== undefined &&
          localPlayerPredictedPosition.y !== undefined &&
          renderer &&
          currentState
        ) {
          const oldX = localPlayerPredictedPosition.x;
          const oldY = localPlayerPredictedPosition.y;
          const newX = oldX + 1;

          // Phase 4.3: Validate bounds before movement
          // Optional: Check for wall collision
          if (
            currentState.board &&
            currentState.board.grid &&
            oldY >= 0 &&
            oldY < currentState.board.grid.length &&
            newX >= 0 &&
            newX < (currentState.board.grid[oldY]?.length || 0)
          ) {
            const board = Board.fromSerialized(currentState.board);
            const newCell = board.getCell(newX, oldY);
            if (newCell && newCell.getBaseChar() === WALL_CHAR.char) {
              // Wall collision - don't move
              return;
            }

            // Check for solid entity collision (includes other players, who are solid entities)
            if (hasSolidEntityAt(newX, oldY, currentState.entities || [])) {
              // Solid entity collision - don't move
              return;
            }

            // Check for other player collision (players are solid entities, but we need to check players array
            // since they're not in entities array - they're tracked separately)
            const hasOtherPlayer = (currentState.players || []).some(
              p => p.playerId !== localPlayerId && p.x === newX && p.y === oldY
            );
            if (hasOtherPlayer) {
              // Other player collision - don't move
              return;
            }

            // Update predicted position
            localPlayerPredictedPosition.x = newX;

            // Clear old position - check for entity first, then board cell
            const oldContent = renderer.getCellContent(
              oldX,
              oldY,
              board,
              currentState.entities || [],
              [] // No other players when checking what to restore
            );
            const oldColorFn = renderer.getColorFunction(oldContent.color);
            renderer.updateCell(oldX, oldY, oldContent.glyph.char, oldColorFn);

            // Draw at new position
            const playerColorFn = renderer.getColorFunction(PLAYER_CHAR.color);
            renderer.updateCell(
              localPlayerPredictedPosition.x,
              localPlayerPredictedPosition.y,
              PLAYER_CHAR.char,
              playerColorFn
            );

            // Update status bar with predicted position
            renderer.updateStatusBarIfChanged(
              currentState?.score || 0,
              localPlayerPredictedPosition.x,
              localPlayerPredictedPosition.y,
              currentState?.score || 0,
              oldX,
              oldY
            );
          }
        }

        // Still send to server
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
        // Reset client state
        previousState = null;
        localPlayerPredictedPosition = { x: null, y: null };
        lastReconciliationTime = Date.now();
        localPlayerId = null; // Clear player ID to force rejoin as new player
        
        // Clear help screen if showing
        if (showingHelp) {
          showingHelp = false;
        }
        
        // Reset modal manager
        if (modalManager) {
          modalManager.reset();
        }
        
        // Send RESTART message to server
        if (wsClient && wsClient.connected) {
          try {
            wsClient.sendRestart();
            clientLogger.info('Restart requested: server will reset game state');
            // Rejoin as new player after restart
            setTimeout(() => {
              if (wsClient && wsClient.connected) {
                wsClient.sendConnect(); // Rejoin without playerId to create new player
                clientLogger.info('Rejoining game after restart...');
              }
            }, 100); // Small delay to ensure server has processed restart
          } catch (error) {
            clientLogger.error('Failed to send restart message:', error.message);
          }
        } else {
          clientLogger.warn('Cannot restart: WebSocket not connected');
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
      onRenderAllPlayers: () => {
        if (renderer && currentState) {
            renderer.renderFull(game, currentState, localPlayerId);
          }
      },
      onRenderOtherPlayer_001: () => {
        if (renderer && currentState) {
					const colorFn = renderer.getColorFunction(toColorHexValue('red'))
					const myChar = toZZTCharacterGlyph('player', toColorHexValue('white')).char
          clientLogger.debug(">>> myChar: " + myChar);
          renderer.updateCell(15, 15, myChar, colorFn);

          // process.stdout.write('\b \b');
          process.stdout.write(ansiEscapes.cursorTo(0, renderer.statusBarOffset + 2));
        }
      },
      onRenderOtherPlayer: () => {
        clientLogger.debug(">>> onRenderOtherPlayer");
        if (wsClient && wsClient.connected) {
          try {
            const testMessage = createMessage(MessageTypes.TEST, { test: 'dcv-test' }, wsClient.clientId);
            wsClient.sendMessage(testMessage);
            clientLogger.debug(">>> Sent test message to server: 'dcv-test'");
          } catch (error) {
            clientLogger.error(">>> Failed to send test message:", error.message);
          }
        } else {
          clientLogger.warn(">>> Cannot send test message: WebSocket not connected");
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
          if (renderer && currentState) {
            renderer.renderFull(game, currentState, localPlayerId);
          }
        }
      }
    });

    // Initialize renderer
    renderer.initialize();

    // Connect to server
    clientLogger.info('Connecting to server...');
    await wsClient.connect();

    // Start input handling
    inputHandler.start();

    // Wait for disconnect or quit
    while (running) {
      await new Promise(resolve => setTimeout(resolve, 10));
    }
  } catch (error) {
    clientLogger.error('\nAn error occurred:', error.message);
    if (error.stack) {
      clientLogger.error(error.stack);
    }
  } finally {
    try {
      // Phase 3: Clear reconciliation timer on cleanup
      if (reconciliationTimer) {
        clearInterval(reconciliationTimer);
        reconciliationTimer = null;
      }
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
      clientLogger.error('Error during cleanup:', cleanupError.message);
    }
  }
}


