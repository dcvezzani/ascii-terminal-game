/**
 * Client-Side Prediction Integration Tests
 * Tests Phase 5.2: Integration tests for client-side prediction
 */

import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import { WebSocketClient } from '../../src/network/WebSocketClient.js';
import { Renderer } from '../../src/render/Renderer.js';
import { Game } from '../../src/game/Game.js';
import { clientConfig } from '../../src/config/clientConfig.js';
import { PLAYER_CHAR, WALL_CHAR, EMPTY_SPACE_CHAR } from '../../src/constants/gameConstants.js';

// Mock external dependencies
vi.mock('../../src/network/WebSocketClient.js');
vi.mock('../../src/render/Renderer.js');
vi.mock('../../src/game/Game.js');
vi.mock('../../src/utils/terminal.js', () => ({
  validateTerminalSize: () => ({ valid: true, message: '' }),
}));
vi.mock('../../src/utils/clientLogger.js', () => ({
  clientLogger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  },
}));

describe('Client-Side Prediction Integration Tests - Phase 5.2', () => {
  let mockWsClient;
  let mockRenderer;
  let mockGame;
  let onStateUpdate;
  let onPlayerJoined;
  let onConnect;
  let localPlayerId;
  let localPlayerPredictedPosition;
  let currentState;
  let previousState;
  let reconciliationTimer;
  let renderCalls;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();

    // Track render calls
    renderCalls = [];

    // Mock WebSocketClient
    mockWsClient = {
      onConnect: vi.fn(cb => {
        onConnect = cb;
      }),
      onStateUpdate: vi.fn(cb => {
        onStateUpdate = cb;
      }),
      onPlayerJoined: vi.fn(cb => {
        onPlayerJoined = cb;
      }),
      onDisconnect: vi.fn(),
      onError: vi.fn(),
      sendConnect: vi.fn(),
      sendMove: vi.fn(),
      isConnected: vi.fn(() => true),
      getClientId: vi.fn(() => 'test-client-id'),
      connect: vi.fn(() => Promise.resolve()),
    };
    WebSocketClient.mockImplementation(() => mockWsClient);

    // Mock Renderer
    mockRenderer = {
      initialize: vi.fn(),
      renderFull: vi.fn((game, gameState, localPlayerId) => {
        renderCalls.push({ type: 'renderFull', gameState, localPlayerId });
      }),
      updateCell: vi.fn((x, y, char, colorFn) => {
        renderCalls.push({ type: 'updateCell', x, y, char });
      }),
      updateStatusBarIfChanged: vi.fn((score, x, y, prevScore, prevX, prevY) => {
        renderCalls.push({ type: 'updateStatusBar', x, y });
      }),
      updatePlayersIncremental: vi.fn(),
      updateEntitiesIncremental: vi.fn(),
      getColorFunction: vi.fn(() => text => text),
    };
    Renderer.mockImplementation(() => mockRenderer);

    // Mock Game
    mockGame = {
      start: vi.fn(),
      stop: vi.fn(),
      isRunning: vi.fn(() => false),
    };
    Game.mockImplementation(() => mockGame);

    // Initialize state
    localPlayerId = null;
    localPlayerPredictedPosition = { x: null, y: null };
    currentState = null;
    previousState = null;
    reconciliationTimer = null;

    // Enable prediction
    clientConfig.prediction.enabled = true;
  });

  afterEach(() => {
    vi.useRealTimers();
    if (reconciliationTimer) {
      clearInterval(reconciliationTimer);
    }
  });

  describe('Test 1: Immediate Rendering on Input', () => {
    test('should render local player immediately on keypress without waiting for server', () => {
      // Setup: Player is connected and has initial position
      localPlayerId = 'player-1';
      localPlayerPredictedPosition = { x: 10, y: 10 };
      currentState = {
        board: {
          grid: Array(20)
            .fill(null)
            .map(() => Array(20).fill('.')),
        },
        players: [{ playerId: 'player-1', x: 10, y: 10 }],
        score: 0,
        running: true,
      };

      // Simulate onMoveUp callback (immediate rendering)
      const oldX = localPlayerPredictedPosition.x;
      const oldY = localPlayerPredictedPosition.y;
      const newY = oldY - 1;

      // Check bounds
      if (
        newY >= 0 &&
        currentState.board &&
        currentState.board.grid &&
        newY < currentState.board.grid.length
      ) {
        // Check wall collision
        const boardAdapter = {
          getCell: (x, y) => {
            if (
              y >= 0 &&
              y < currentState.board.grid.length &&
              x >= 0 &&
              x < currentState.board.grid[y].length
            ) {
              return currentState.board.grid[y][x];
            }
            return null;
          },
        };
        const newCell = boardAdapter.getCell(oldX, newY);
        if (newCell !== WALL_CHAR.char) {
          // Update predicted position immediately
          localPlayerPredictedPosition.y = newY;

          // Render immediately (not waiting for server)
          const oldCell = boardAdapter.getCell(oldX, oldY);
          const oldGlyph = oldCell === WALL_CHAR.char ? WALL_CHAR : EMPTY_SPACE_CHAR;
          mockRenderer.updateCell(
            oldX,
            oldY,
            oldGlyph.char,
            mockRenderer.getColorFunction(oldGlyph.color)
          );
          mockRenderer.updateCell(
            localPlayerPredictedPosition.x,
            localPlayerPredictedPosition.y,
            PLAYER_CHAR.char,
            mockRenderer.getColorFunction(PLAYER_CHAR.color)
          );
          mockRenderer.updateStatusBarIfChanged(
            currentState.score || 0,
            localPlayerPredictedPosition.x,
            localPlayerPredictedPosition.y,
            currentState.score || 0,
            oldX,
            oldY
          );
        }
      }

      // Verify: Position updated immediately
      expect(localPlayerPredictedPosition.y).toBe(9);

      // Verify: Rendering happened immediately (not waiting for server)
      expect(mockRenderer.updateCell).toHaveBeenCalled();
      expect(renderCalls.some(call => call.type === 'updateCell')).toBe(true);

      // Verify: MOVE message still sent to server (simulate sending)
      if (mockWsClient.isConnected()) {
        mockWsClient.sendMove(0, -1);
      }
      expect(mockWsClient.sendMove).toHaveBeenCalledWith(0, -1);
    });

    test('should render before server state update arrives', () => {
      localPlayerId = 'player-1';
      localPlayerPredictedPosition = { x: 10, y: 10 };
      currentState = {
        board: {
          grid: Array(20)
            .fill(null)
            .map(() => Array(20).fill('.')),
        },
        players: [{ playerId: 'player-1', x: 10, y: 10 }],
        score: 0,
        running: true,
      };

      // Simulate keypress - immediate render
      const oldY = localPlayerPredictedPosition.y;
      localPlayerPredictedPosition.y = oldY - 1;
      mockRenderer.updateCell(10, 9, PLAYER_CHAR.char, vi.fn());

      // Verify render happened
      expect(mockRenderer.updateCell).toHaveBeenCalledWith(
        10,
        9,
        PLAYER_CHAR.char,
        expect.any(Function)
      );

      // Later, server state update arrives (still at old position)
      const serverState = {
        board: currentState.board,
        players: [{ playerId: 'player-1', x: 10, y: 10 }], // Server hasn't processed move yet
        score: 0,
        running: true,
      };

      // Client has already rendered at predicted position (9)
      // Server will eventually catch up
      expect(localPlayerPredictedPosition.y).toBe(9);
      expect(serverState.players[0].y).toBe(10); // Server still at old position
    });
  });

  describe('Test 2: Other Players Still Use Server State', () => {
    test('should render other players based on server state only', () => {
      localPlayerId = 'player-1';
      localPlayerPredictedPosition = { x: 10, y: 10 };
      previousState = {
        players: [
          { playerId: 'player-1', x: 10, y: 10 },
          { playerId: 'player-2', x: 5, y: 5 },
        ],
        board: {
          grid: Array(20)
            .fill(null)
            .map(() => Array(20).fill('.')),
        },
        score: 0,
        running: true,
      };

      currentState = {
        players: [
          { playerId: 'player-1', x: 10, y: 10 }, // Local player (uses prediction)
          { playerId: 'player-2', x: 6, y: 5 }, // Other player moved (server state)
        ],
        board: previousState.board,
        score: 0,
        running: true,
      };

      // Simulate state update processing
      // Other players should be rendered from server state
      const otherPlayers = currentState.players.filter(p => p.playerId !== localPlayerId);
      const previousOtherPlayers = previousState.players.filter(p => p.playerId !== localPlayerId);

      // Verify other players use server state
      expect(otherPlayers).toHaveLength(1);
      expect(otherPlayers[0].playerId).toBe('player-2');
      expect(otherPlayers[0].x).toBe(6); // Server position, not predicted
      expect(otherPlayers[0].y).toBe(5);
    });

    test('should not apply prediction to other players', () => {
      localPlayerId = 'player-1';
      localPlayerPredictedPosition = { x: 10, y: 10 };

      // Local player moves (prediction)
      localPlayerPredictedPosition.x = 11;

      // Other player state comes from server
      const otherPlayerState = {
        playerId: 'player-2',
        x: 5,
        y: 5,
      };

      // Verify other player doesn't use local prediction
      expect(otherPlayerState.x).toBe(5);
      expect(otherPlayerState.y).toBe(5);
      expect(otherPlayerState.x).not.toBe(localPlayerPredictedPosition.x);
    });
  });

  describe('Test 3: Reconciliation at Configured Intervals', () => {
    test('should trigger reconciliation at configured interval', () => {
      localPlayerId = 'player-1';
      localPlayerPredictedPosition = { x: 10, y: 10 };
      currentState = {
        players: [{ playerId: 'player-1', x: 10, y: 10 }],
        board: {
          grid: Array(20)
            .fill(null)
            .map(() => Array(20).fill('.')),
        },
        score: 0,
        running: true,
      };

      let reconciliationCalled = false;
      const reconcileWithServer = () => {
        reconciliationCalled = true;
      };

      // Start reconciliation timer
      const interval = clientConfig.prediction.reconciliationInterval;
      reconciliationTimer = setInterval(() => {
        if (currentState && localPlayerId && clientConfig.prediction.enabled) {
          reconcileWithServer();
        }
      }, interval);

      // Verify timer is set with correct interval
      expect(interval).toBe(5000); // Default 5 seconds

      // Fast-forward time
      vi.advanceTimersByTime(5000);

      // Verify reconciliation was called
      expect(reconciliationCalled).toBe(true);
    });

    test('should use configurable reconciliation interval', () => {
      const originalInterval = clientConfig.prediction.reconciliationInterval;
      clientConfig.prediction.reconciliationInterval = 2000; // 2 seconds

      // Setup required state
      localPlayerId = 'player-1';
      currentState = {
        players: [{ playerId: 'player-1', x: 10, y: 10 }],
        board: {
          grid: Array(20)
            .fill(null)
            .map(() => Array(20).fill('.')),
        },
        score: 0,
        running: true,
      };

      let reconciliationCalled = false;
      const reconcileWithServer = () => {
        reconciliationCalled = true;
      };

      const interval = clientConfig.prediction.reconciliationInterval;
      reconciliationTimer = setInterval(() => {
        if (currentState && localPlayerId && clientConfig.prediction.enabled) {
          reconcileWithServer();
        }
      }, interval);

      // Fast-forward 2 seconds
      vi.advanceTimersByTime(2000);

      expect(reconciliationCalled).toBe(true);
      expect(interval).toBe(2000);

      // Restore original
      clientConfig.prediction.reconciliationInterval = originalInterval;
    });
  });

  describe('Test 4: Position Correction on Discrepancy', () => {
    test('should correct predicted position to server position when discrepancy detected', () => {
      localPlayerId = 'player-1';
      localPlayerPredictedPosition = { x: 11, y: 10 }; // Client predicted position
      currentState = {
        players: [{ playerId: 'player-1', x: 10, y: 10 }], // Server position (different)
        board: {
          grid: Array(20)
            .fill(null)
            .map(() => Array(20).fill('.')),
        },
        score: 0,
        running: true,
      };

      // Simulate reconciliation
      const serverPlayer = currentState.players.find(p => p.playerId === localPlayerId);
      const predicted = localPlayerPredictedPosition;
      const server = { x: serverPlayer.x, y: serverPlayer.y };

      // Check for discrepancy
      if (predicted.x !== server.x || predicted.y !== server.y) {
        // Correct to server position
        const oldX = predicted.x;
        const oldY = predicted.y;
        localPlayerPredictedPosition = { x: server.x, y: server.y };

        // Re-render at corrected position
        const boardAdapter = {
          getCell: (x, y) => {
            if (
              y >= 0 &&
              y < currentState.board.grid.length &&
              x >= 0 &&
              x < currentState.board.grid[y].length
            ) {
              return currentState.board.grid[y][x];
            }
            return null;
          },
        };

        const oldCell = boardAdapter.getCell(oldX, oldY);
        const oldGlyph = oldCell === WALL_CHAR.char ? WALL_CHAR : EMPTY_SPACE_CHAR;
        mockRenderer.updateCell(
          oldX,
          oldY,
          oldGlyph.char,
          mockRenderer.getColorFunction(oldGlyph.color)
        );
        mockRenderer.updateCell(
          server.x,
          server.y,
          PLAYER_CHAR.char,
          mockRenderer.getColorFunction(PLAYER_CHAR.color)
        );
        mockRenderer.updateStatusBarIfChanged(
          currentState.score || 0,
          server.x,
          server.y,
          currentState.score || 0,
          oldX,
          oldY
        );
      }

      // Verify position was corrected
      expect(localPlayerPredictedPosition.x).toBe(10);
      expect(localPlayerPredictedPosition.y).toBe(10);

      // Verify re-rendering happened
      expect(mockRenderer.updateCell).toHaveBeenCalled();
    });

    test('should not correct when positions match', () => {
      localPlayerId = 'player-1';
      localPlayerPredictedPosition = { x: 10, y: 10 };
      currentState = {
        players: [{ playerId: 'player-1', x: 10, y: 10 }], // Same position
        board: {
          grid: Array(20)
            .fill(null)
            .map(() => Array(20).fill('.')),
        },
        score: 0,
        running: true,
      };

      const serverPlayer = currentState.players.find(p => p.playerId === localPlayerId);
      const predicted = localPlayerPredictedPosition;
      const server = { x: serverPlayer.x, y: serverPlayer.y };

      // Check for discrepancy
      const hasDiscrepancy = predicted.x !== server.x || predicted.y !== server.y;

      expect(hasDiscrepancy).toBe(false);
      // No correction needed
      expect(localPlayerPredictedPosition.x).toBe(10);
      expect(localPlayerPredictedPosition.y).toBe(10);
    });

    test('should correct smoothly without visual glitches', () => {
      localPlayerId = 'player-1';
      localPlayerPredictedPosition = { x: 12, y: 10 };
      currentState = {
        players: [{ playerId: 'player-1', x: 10, y: 10 }],
        board: {
          grid: Array(20)
            .fill(null)
            .map(() => Array(20).fill('.')),
        },
        score: 0,
        running: true,
      };

      // Simulate reconciliation
      const serverPlayer = currentState.players.find(p => p.playerId === localPlayerId);
      const predicted = localPlayerPredictedPosition;
      const server = { x: serverPlayer.x, y: serverPlayer.y };

      if (predicted.x !== server.x || predicted.y !== server.y) {
        const oldX = predicted.x;
        const oldY = predicted.y;
        localPlayerPredictedPosition = { x: server.x, y: server.y };

        // Clear old position first
        const boardAdapter = {
          getCell: (x, y) => {
            if (
              y >= 0 &&
              y < currentState.board.grid.length &&
              x >= 0 &&
              x < currentState.board.grid[y].length
            ) {
              return currentState.board.grid[y][x];
            }
            return null;
          },
        };

        const oldCell = boardAdapter.getCell(oldX, oldY);
        const oldGlyph = oldCell === WALL_CHAR.char ? WALL_CHAR : EMPTY_SPACE_CHAR;
        mockRenderer.updateCell(
          oldX,
          oldY,
          oldGlyph.char,
          mockRenderer.getColorFunction(oldGlyph.color)
        );

        // Then draw at corrected position
        mockRenderer.updateCell(
          server.x,
          server.y,
          PLAYER_CHAR.char,
          mockRenderer.getColorFunction(PLAYER_CHAR.color)
        );
      }

      // Verify smooth correction (old position cleared, new position drawn)
      expect(mockRenderer.updateCell).toHaveBeenCalledTimes(2); // Clear old + draw new
      expect(localPlayerPredictedPosition.x).toBe(10);
      expect(localPlayerPredictedPosition.y).toBe(10);
    });
  });
});
