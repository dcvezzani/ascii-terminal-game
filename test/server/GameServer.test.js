import { describe, test, expect, beforeEach } from 'vitest';
import { GameServer } from '../../src/server/GameServer.js';
import { gameConfig } from '../../src/config/gameConfig.js';

describe('GameServer', () => {
  let gameServer;

  beforeEach(() => {
    gameServer = new GameServer();
  });

  describe('getGameState', () => {
    test('should return game state with board and players', () => {
      const state = gameServer.getGameState();

      expect(state).toBeDefined();
      expect(state.board).toBeDefined();
      expect(state.board.width).toBe(gameConfig.board.width);
      expect(state.board.height).toBe(gameConfig.board.height);
      expect(state.board.grid).toBeDefined();
      expect(Array.isArray(state.players)).toBe(true);
      expect(typeof state.score).toBe('number');
      expect(typeof state.running).toBe('boolean');
    });
  });

  describe('addPlayer', () => {
    test('should add player successfully', () => {
      const added = gameServer.addPlayer('player-1', 'TestPlayer', 'client-1');

      expect(added).toBe(true);
      expect(gameServer.hasPlayer('player-1')).toBe(true);
    });

    test('should add player with position within board bounds', () => {
      gameServer.addPlayer('player-1', 'TestPlayer', 'client-1');
      const player = gameServer.getPlayer('player-1');

      // Verify position is within board bounds
      expect(player.x).toBeGreaterThanOrEqual(0);
      expect(player.x).toBeLessThan(gameConfig.board.width);
      expect(player.y).toBeGreaterThanOrEqual(0);
      expect(player.y).toBeLessThan(gameConfig.board.height);
    });

    test('should add player at specified position', () => {
      gameServer.addPlayer('player-1', 'TestPlayer', 'client-1', 5, 5);
      const player = gameServer.getPlayer('player-1');

      expect(player.x).toBe(5);
      expect(player.y).toBe(5);
    });

    test('should return false if player ID already exists', () => {
      gameServer.addPlayer('player-1', 'TestPlayer', 'client-1');
      const added = gameServer.addPlayer('player-1', 'AnotherPlayer', 'client-2');

      expect(added).toBe(false);
    });

    test('should validate position against walls', () => {
      // Try to add player at wall position (0, 0 is a wall)
      const added = gameServer.addPlayer('player-1', 'TestPlayer', 'client-1', 0, 0);

      // Should fall back to center position or nearby available position
      const player = gameServer.getPlayer('player-1');
      expect(player).toBeDefined();
      const centerX = gameConfig.player.initialX;
      const centerY = gameConfig.player.initialY;
      // Allow for small offset due to spawn logic finding nearby available position
      expect(Math.abs(player.x - centerX)).toBeLessThanOrEqual(1);
      expect(Math.abs(player.y - centerY)).toBeLessThanOrEqual(1);
    });

    test('should include player info in state', () => {
      gameServer.addPlayer('player-1', 'TestPlayer', 'client-1');
      const state = gameServer.getGameState();

      expect(state.players.length).toBe(1);
      expect(state.players[0].playerId).toBe('player-1');
      expect(state.players[0].playerName).toBe('TestPlayer');
      expect(state.players[0].clientId).toBe('client-1');
    });

    test('should place multiple players at different positions', () => {
      gameServer.addPlayer('player-1', 'Player1', 'client-1');
      gameServer.addPlayer('player-2', 'Player2', 'client-2');

      const player1 = gameServer.getPlayer('player-1');
      const player2 = gameServer.getPlayer('player-2');

      // Both players should have valid positions within board bounds
      expect(player1.x).toBeGreaterThanOrEqual(0);
      expect(player1.x).toBeLessThan(gameConfig.board.width);
      expect(player1.y).toBeGreaterThanOrEqual(0);
      expect(player1.y).toBeLessThan(gameConfig.board.height);

      expect(player2.x).toBeGreaterThanOrEqual(0);
      expect(player2.x).toBeLessThan(gameConfig.board.width);
      expect(player2.y).toBeGreaterThanOrEqual(0);
      expect(player2.y).toBeLessThan(gameConfig.board.height);

      // Players should be at different positions
      expect(player1.x !== player2.x || player1.y !== player2.y).toBe(true);
    });
  });

  describe('removePlayer', () => {
    test('should remove player successfully', () => {
      gameServer.addPlayer('player-1', 'TestPlayer', 'client-1');
      const removed = gameServer.removePlayer('player-1');

      expect(removed).toBe(true);
      expect(gameServer.hasPlayer('player-1')).toBe(false);
    });

    test('should return false if player not found', () => {
      const removed = gameServer.removePlayer('non-existent-player');
      expect(removed).toBe(false);
    });
  });

  describe('movePlayer', () => {
    beforeEach(() => {
      gameServer.addPlayer('player-1', 'TestPlayer', 'client-1');
    });

    test('should move player successfully', () => {
      // Get player's starting position (may vary due to spawn logic)
      const startPlayer = gameServer.getPlayer('player-1');
      const startX = startPlayer.x;
      const startY = startPlayer.y;

      const moved = gameServer.movePlayer('player-1', 1, 0);
      expect(moved).toBe(true);

      const player = gameServer.getPlayer('player-1');
      expect(player.x).toBe(startX + 1);
      expect(player.y).toBe(startY);
    });

    test('should return false if player not found', () => {
      const moved = gameServer.movePlayer('non-existent-player', 1, 0);
      expect(moved).toBe(false);
    });

    test('should prevent movement into walls', () => {
      // Move player to edge (0, center) - left edge is a wall
      const player = gameServer.getPlayer('player-1');
      const startX = player.x;

      // Try to move left into wall
      const moved = gameServer.movePlayer('player-1', -startX - 1, 0);
      expect(moved).toBe(false);

      // Position should not change
      const updatedPlayer = gameServer.getPlayer('player-1');
      expect(updatedPlayer.x).toBe(startX);
    });

    test('should prevent movement out of bounds', () => {
      const player = gameServer.getPlayer('player-1');
      const startX = player.x;

      // Try to move way out of bounds
      const moved = gameServer.movePlayer('player-1', 1000, 0);
      expect(moved).toBe(false);

      const updatedPlayer = gameServer.getPlayer('player-1');
      expect(updatedPlayer.x).toBe(startX);
    });

    test('should prevent player collisions', () => {
      gameServer.addPlayer('player-2', 'Player2', 'client-2', 5, 5);
      gameServer.addPlayer('player-3', 'Player3', 'client-3', 6, 5);

      // Try to move player-2 into player-3's position
      const moved = gameServer.movePlayer('player-2', 1, 0);
      expect(moved).toBe(false);

      const player2 = gameServer.getPlayer('player-2');
      expect(player2.x).toBe(5);
    });
  });

  describe('getPlayer', () => {
    test('should return player info', () => {
      gameServer.addPlayer('player-1', 'TestPlayer', 'client-1');
      const player = gameServer.getPlayer('player-1');

      expect(player).toBeDefined();
      expect(player.playerId).toBe('player-1');
      expect(player.playerName).toBe('TestPlayer');
      expect(player.clientId).toBe('client-1');
      expect(typeof player.x).toBe('number');
      expect(typeof player.y).toBe('number');
    });

    test('should return null if player not found', () => {
      const player = gameServer.getPlayer('non-existent-player');
      expect(player).toBeNull();
    });
  });

  describe('getAllPlayers', () => {
    test('should return empty array when no players', () => {
      const players = gameServer.getAllPlayers();
      expect(players).toEqual([]);
    });

    test('should return all players', () => {
      gameServer.addPlayer('player-1', 'Player1', 'client-1');
      gameServer.addPlayer('player-2', 'Player2', 'client-2');

      const players = gameServer.getAllPlayers();
      expect(players.length).toBe(2);
      expect(players.map(p => p.playerId)).toContain('player-1');
      expect(players.map(p => p.playerId)).toContain('player-2');
    });
  });

  describe('resetGame', () => {
    test('should reset game and clear players', () => {
      gameServer.addPlayer('player-1', 'TestPlayer', 'client-1');
      gameServer.startGame();

      gameServer.resetGame();

      expect(gameServer.getPlayerCount()).toBe(0);
      expect(gameServer.getGameState().running).toBe(true);
    });
  });

  describe('startGame and stopGame', () => {
    test('should start and stop game', () => {
      gameServer.startGame();
      expect(gameServer.getGameState().running).toBe(true);

      gameServer.stopGame();
      expect(gameServer.getGameState().running).toBe(false);
    });
  });

  describe('getPlayerCount', () => {
    test('should return 0 when no players', () => {
      expect(gameServer.getPlayerCount()).toBe(0);
    });

    test('should return correct count', () => {
      gameServer.addPlayer('player-1', 'Player1', 'client-1');
      gameServer.addPlayer('player-2', 'Player2', 'client-2');
      expect(gameServer.getPlayerCount()).toBe(2);
    });
  });

  describe('hasPlayer', () => {
    test('should return true if player exists', () => {
      gameServer.addPlayer('player-1', 'TestPlayer', 'client-1');
      expect(gameServer.hasPlayer('player-1')).toBe(true);
    });

    test('should return false if player does not exist', () => {
      expect(gameServer.hasPlayer('non-existent-player')).toBe(false);
    });
  });
});
