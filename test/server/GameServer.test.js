import { describe, it, expect, beforeEach } from 'vitest';
import GameServer from '../../src/server/GameServer.js';
import Game from '../../src/game/Game.js';

describe('GameServer', () => {
  let gameServer;

  beforeEach(() => {
    gameServer = new GameServer(20, 20);
  });

  describe('constructor', () => {
    it('should create GameServer with board dimensions', () => {
      expect(gameServer.game).toBeDefined();
      expect(gameServer.game instanceof Game).toBe(true);
      expect(gameServer.game.board.width).toBe(20);
      expect(gameServer.game.board.height).toBe(20);
    });

    it('should initialize players map', () => {
      expect(gameServer.players).toBeDefined();
      expect(gameServer.players instanceof Map).toBe(true);
    });
  });

  describe('addPlayer', () => {
    it('should add player to game', () => {
      const clientId = 'client-1';
      const playerId = 'player-1';
      const playerName = 'Player 1';

      gameServer.addPlayer(clientId, playerId, playerName);

      const player = gameServer.getPlayer(playerId);
      expect(player).toBeDefined();
      expect(player.playerId).toBe(playerId);
      expect(player.clientId).toBe(clientId);
      expect(player.playerName).toBe(playerName);
    });
  });

  describe('removePlayer', () => {
    it('should remove player from game', () => {
      const clientId = 'client-1';
      const playerId = 'player-1';
      const playerName = 'Player 1';

      gameServer.addPlayer(clientId, playerId, playerName);
      expect(gameServer.getPlayer(playerId)).toBeDefined();

      gameServer.removePlayer(playerId);
      expect(gameServer.getPlayer(playerId)).toBeUndefined();
    });
  });

  describe('getPlayer', () => {
    it('should return player by playerId', () => {
      const clientId = 'client-1';
      const playerId = 'player-1';
      const playerName = 'Player 1';

      gameServer.addPlayer(clientId, playerId, playerName);
      const player = gameServer.getPlayer(playerId);

      expect(player).toBeDefined();
      expect(player.playerId).toBe(playerId);
    });

    it('should return undefined for non-existent player', () => {
      expect(gameServer.getPlayer('non-existent')).toBeUndefined();
    });
  });

  describe('getAllPlayers', () => {
    it('should return empty array when no players', () => {
      const players = gameServer.getAllPlayers();
      expect(players).toEqual([]);
    });

    it('should return all players', () => {
      gameServer.addPlayer('client-1', 'player-1', 'Player 1');
      gameServer.addPlayer('client-2', 'player-2', 'Player 2');

      const players = gameServer.getAllPlayers();
      expect(players.length).toBe(2);
      expect(players.some(p => p.playerId === 'player-1')).toBe(true);
      expect(players.some(p => p.playerId === 'player-2')).toBe(true);
    });
  });

  describe('spawnPlayer', () => {
    it('should spawn player at initial position (10, 10)', () => {
      const clientId = 'client-1';
      const playerId = 'player-1';
      const playerName = 'Player 1';

      gameServer.addPlayer(clientId, playerId, playerName);
      gameServer.spawnPlayer(playerId, playerName);

      const player = gameServer.getPlayer(playerId);
      expect(player).toBeDefined();
      expect(player.x).toBe(10);
      expect(player.y).toBe(10);
    });

    it('should set player name', () => {
      const clientId = 'client-1';
      const playerId = 'player-1';
      const playerName = 'Player 1';

      gameServer.addPlayer(clientId, playerId, playerName);
      gameServer.spawnPlayer(playerId, playerName);

      const player = gameServer.getPlayer(playerId);
      expect(player.playerName).toBe(playerName);
    });
  });

  describe('serializeState', () => {
    it('should return serialized game state', () => {
      const state = gameServer.serializeState();

      expect(state).toBeDefined();
      expect(state.board).toBeDefined();
      expect(state.board.width).toBe(20);
      expect(state.board.height).toBe(20);
      expect(state.board.grid).toBeDefined();
      expect(Array.isArray(state.board.grid)).toBe(true);
      expect(state.players).toBeDefined();
      expect(Array.isArray(state.players)).toBe(true);
      expect(state.score).toBeDefined();
      expect(typeof state.score).toBe('number');
    });

    it('should include players in serialized state', () => {
      gameServer.addPlayer('client-1', 'player-1', 'Player 1');
      gameServer.spawnPlayer('player-1', 'Player 1');

      const state = gameServer.serializeState();
      expect(state.players.length).toBe(1);
      expect(state.players[0].playerId).toBe('player-1');
    });

    it('should include board grid in serialized state', () => {
      const state = gameServer.serializeState();
      expect(state.board.grid.length).toBe(20);
      expect(state.board.grid[0].length).toBe(20);
    });
  });

  describe('validateMove', () => {
    beforeEach(() => {
      gameServer.addPlayer('client-1', 'player-1', 'Player 1');
      gameServer.spawnPlayer('player-1', 'Player 1');
    });

    it('should return true for valid move', () => {
      const isValid = gameServer.validateMove('player-1', 1, 0); // Move right
      expect(isValid).toBe(true);
    });

    it('should return false for out of bounds (x too large)', () => {
      const player = gameServer.getPlayer('player-1');
      player.x = 19; // At right edge
      const isValid = gameServer.validateMove('player-1', 1, 0); // Move right
      expect(isValid).toBe(false);
    });

    it('should return false for out of bounds (x too small)', () => {
      const player = gameServer.getPlayer('player-1');
      player.x = 0; // At left edge
      const isValid = gameServer.validateMove('player-1', -1, 0); // Move left
      expect(isValid).toBe(false);
    });

    it('should return false for out of bounds (y too large)', () => {
      const player = gameServer.getPlayer('player-1');
      player.y = 19; // At bottom edge
      const isValid = gameServer.validateMove('player-1', 0, 1); // Move down
      expect(isValid).toBe(false);
    });

    it('should return false for out of bounds (y too small)', () => {
      const player = gameServer.getPlayer('player-1');
      player.y = 0; // At top edge
      const isValid = gameServer.validateMove('player-1', 0, -1); // Move up
      expect(isValid).toBe(false);
    });

    it('should return false for wall collision', () => {
      const player = gameServer.getPlayer('player-1');
      player.x = 1;
      player.y = 0; // Next to top wall
      const isValid = gameServer.validateMove('player-1', 0, -1); // Move up into wall
      expect(isValid).toBe(false);
    });

    it('should return false for player collision', () => {
      // Add second player
      gameServer.addPlayer('client-2', 'player-2', 'Player 2');
      gameServer.spawnPlayer('player-2', 'Player 2');
      
      const player1 = gameServer.getPlayer('player-1');
      player1.x = 9;
      player1.y = 10;
      
      const player2 = gameServer.getPlayer('player-2');
      player2.x = 10;
      player2.y = 10;

      // Player 1 tries to move into player 2's position
      const isValid = gameServer.validateMove('player-1', 1, 0);
      expect(isValid).toBe(false);
    });
  });

  describe('movePlayer', () => {
    beforeEach(() => {
      gameServer.addPlayer('client-1', 'player-1', 'Player 1');
      gameServer.spawnPlayer('player-1', 'Player 1');
    });

    it('should update position on valid move', () => {
      const player = gameServer.getPlayer('player-1');
      const oldX = player.x;
      const oldY = player.y;

      const success = gameServer.movePlayer('player-1', 1, 0); // Move right

      expect(success).toBe(true);
      expect(player.x).toBe(oldX + 1);
      expect(player.y).toBe(oldY);
    });

    it('should reject invalid move', () => {
      const player = gameServer.getPlayer('player-1');
      player.x = 19; // At right edge
      const oldX = player.x;

      const success = gameServer.movePlayer('player-1', 1, 0); // Move right (invalid)

      expect(success).toBe(false);
      expect(player.x).toBe(oldX); // Position unchanged
    });
  });
});
