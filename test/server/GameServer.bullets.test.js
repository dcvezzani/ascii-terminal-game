import { describe, it, expect, beforeEach } from 'vitest';
import GameServer from '../../src/server/GameServer.js';
import Game from '../../src/game/Game.js';

describe('GameServer bullets', () => {
  let gameServer;

  beforeEach(() => {
    const game = new Game();
    gameServer = new GameServer(game, {
      spawnList: [{ x: 5, y: 5 }, { x: 10, y: 5 }, { x: 15, y: 5 }]
    });
  });

  describe('fireBullet', () => {
    it('should return error if player not found', () => {
      const result = gameServer.fireBullet('nonexistent', 1, 0);
      expect(result.success).toBe(false);
      expect(result.error).toBe('Player not found');
    });

    it('should return error if player not spawned', () => {
      gameServer.addPlayer('client-1', 'player-1', 'Player 1');
      const result = gameServer.fireBullet('player-1', 1, 0);
      expect(result.success).toBe(false);
      expect(result.error).toBe('Player not spawned');
    });

    it('should create bullet for spawned player', () => {
      gameServer.addPlayer('client-1', 'player-1', 'Player 1');
      gameServer.spawnPlayer('player-1', 'Player 1');

      const result = gameServer.fireBullet('player-1', 1, 0);
      expect(result.success).toBe(true);
      expect(result.bullet).toBeDefined();
      expect(result.bullet.playerId).toBe('player-1');
      expect(result.bullet.dx).toBe(1);
      expect(result.bullet.dy).toBe(0);
    });

    it('should spawn bullet at player position', () => {
      gameServer.addPlayer('client-1', 'player-1', 'Player 1');
      gameServer.spawnPlayer('player-1', 'Player 1');
      const player = gameServer.getPlayer('player-1');

      const result = gameServer.fireBullet('player-1', 0, -1);
      expect(result.bullet.x).toBe(player.x);
      expect(result.bullet.y).toBe(player.y);
    });

    it('should return error if player already has active bullet', () => {
      gameServer.addPlayer('client-1', 'player-1', 'Player 1');
      gameServer.spawnPlayer('player-1', 'Player 1');

      const result1 = gameServer.fireBullet('player-1', 1, 0);
      expect(result1.success).toBe(true);

      const result2 = gameServer.fireBullet('player-1', -1, 0);
      expect(result2.success).toBe(false);
      expect(result2.error).toBe('Player already has active bullet');
    });

    it('should allow bullet in each direction', () => {
      gameServer.addPlayer('client-1', 'player-1', 'Player 1');
      gameServer.spawnPlayer('player-1', 'Player 1');

      const directions = [
        { dx: 0, dy: -1 },
        { dx: 0, dy: 1 },
        { dx: -1, dy: 0 },
        { dx: 1, dy: 0 }
      ];

      for (const dir of directions) {
        const bullet = gameServer.getPlayerBullet('player-1');
        if (bullet) {
          gameServer.destroyBullet(bullet.bulletId);
        }
        const result = gameServer.fireBullet('player-1', dir.dx, dir.dy);
        expect(result.success).toBe(true);
        expect(result.bullet.dx).toBe(dir.dx);
        expect(result.bullet.dy).toBe(dir.dy);
      }
    });
  });

  describe('getPlayerBullet', () => {
    it('should return null if player has no bullet', () => {
      gameServer.addPlayer('client-1', 'player-1', 'Player 1');
      expect(gameServer.getPlayerBullet('player-1')).toBeNull();
    });

    it('should return bullet if player has one', () => {
      gameServer.addPlayer('client-1', 'player-1', 'Player 1');
      gameServer.spawnPlayer('player-1', 'Player 1');
      gameServer.fireBullet('player-1', 1, 0);

      const bullet = gameServer.getPlayerBullet('player-1');
      expect(bullet).not.toBeNull();
      expect(bullet.playerId).toBe('player-1');
    });
  });

  describe('destroyBullet', () => {
    it('should remove bullet from game state', () => {
      gameServer.addPlayer('client-1', 'player-1', 'Player 1');
      gameServer.spawnPlayer('player-1', 'Player 1');
      const result = gameServer.fireBullet('player-1', 1, 0);

      expect(gameServer.getPlayerBullet('player-1')).not.toBeNull();

      gameServer.destroyBullet(result.bullet.bulletId);
      expect(gameServer.getPlayerBullet('player-1')).toBeNull();
    });

    it('should return false if bullet does not exist', () => {
      const result = gameServer.destroyBullet('nonexistent');
      expect(result).toBe(false);
    });
  });

  describe('updateBullets', () => {
    it('should move bullet in direction', () => {
      gameServer.addPlayer('client-1', 'player-1', 'Player 1');
      gameServer.spawnPlayer('player-1', 'Player 1');
      const player = gameServer.getPlayer('player-1');
      
      gameServer.fireBullet('player-1', 1, 0);
      const bulletBefore = gameServer.getPlayerBullet('player-1');
      expect(bulletBefore.x).toBe(player.x);

      gameServer.updateBullets();

      const bulletAfter = gameServer.getPlayerBullet('player-1');
      expect(bulletAfter.x).toBe(player.x + 1);
      expect(bulletAfter.y).toBe(player.y);
    });

    it('should destroy bullet on out of bounds', () => {
      gameServer.addPlayer('client-1', 'player-1', 'Player 1');
      gameServer.spawnPlayer('player-1', 'Player 1');
      const player = gameServer.getPlayer('player-1');
      
      gameServer.fireBullet('player-1', -1, 0);
      
      while (player.x > 0) {
        player.x--;
      }
      const bullet = gameServer.getPlayerBullet('player-1');
      bullet.x = 0;

      gameServer.updateBullets();
      expect(gameServer.getPlayerBullet('player-1')).toBeNull();
    });

    it('should destroy bullet on wall collision', () => {
      gameServer.addPlayer('client-1', 'player-1', 'Player 1');
      gameServer.spawnPlayer('player-1', 'Player 1');
      
      gameServer.fireBullet('player-1', 1, 0);
      const bullet = gameServer.getPlayerBullet('player-1');
      bullet.x = gameServer.game.board.width - 2;

      gameServer.updateBullets();
      expect(gameServer.getPlayerBullet('player-1')).toBeNull();
    });

    it('should destroy bullet without harming player on self-hit', () => {
      gameServer.addPlayer('client-1', 'player-1', 'Player 1');
      gameServer.spawnPlayer('player-1', 'Player 1');
      const player = gameServer.getPlayer('player-1');
      
      gameServer.fireBullet('player-1', 1, 0);
      const bullet = gameServer.getPlayerBullet('player-1');
      
      player.x = bullet.x + 1;
      player.y = bullet.y;

      const result = gameServer.updateBullets();
      
      expect(gameServer.getPlayerBullet('player-1')).toBeNull();
      expect(player.x).not.toBeNull();
      expect(player.y).not.toBeNull();
      expect(result.playerKills).toHaveLength(0);
    });
  });

  describe('player kill', () => {
    it('should kill other player and award point', () => {
      gameServer.addPlayer('client-1', 'player-1', 'Player 1');
      gameServer.addPlayer('client-2', 'player-2', 'Player 2');
      gameServer.spawnPlayer('player-1', 'Player 1');
      gameServer.spawnPlayer('player-2', 'Player 2');

      const player1 = gameServer.getPlayer('player-1');
      const player2 = gameServer.getPlayer('player-2');

      player1.x = 5;
      player1.y = 5;
      player2.x = 6;
      player2.y = 5;

      gameServer.fireBullet('player-1', 1, 0);
      
      const result = gameServer.updateBullets();

      expect(player2.x).toBeNull();
      expect(player2.y).toBeNull();
      expect(gameServer.getScore('player-1')).toBe(1);
      expect(result.playerKills).toHaveLength(1);
      expect(result.playerKills[0].killerId).toBe('player-1');
      expect(result.playerKills[0].victimId).toBe('player-2');
    });

    it('should schedule respawn for killed player', () => {
      gameServer.addPlayer('client-1', 'player-1', 'Player 1');
      gameServer.addPlayer('client-2', 'player-2', 'Player 2');
      gameServer.spawnPlayer('player-1', 'Player 1');
      gameServer.spawnPlayer('player-2', 'Player 2');

      const player1 = gameServer.getPlayer('player-1');
      const player2 = gameServer.getPlayer('player-2');

      player1.x = 5;
      player1.y = 5;
      player2.x = 6;
      player2.y = 5;

      gameServer.fireBullet('player-1', 1, 0);
      gameServer.updateBullets();

      expect(gameServer.respawnQueue).toHaveLength(1);
      expect(gameServer.respawnQueue[0].playerId).toBe('player-2');
    });
  });

  describe('scoring', () => {
    it('should track scores per player', () => {
      gameServer.addPlayer('client-1', 'player-1', 'Player 1');
      gameServer.addScore('player-1', 1);
      gameServer.addScore('player-1', 2);

      expect(gameServer.getScore('player-1')).toBe(3);
    });

    it('should return 0 for player with no score', () => {
      expect(gameServer.getScore('nonexistent')).toBe(0);
    });

    it('should include scores in serialized state', () => {
      gameServer.addPlayer('client-1', 'player-1', 'Player 1');
      gameServer.addScore('player-1', 5);

      const state = gameServer.serializeState();
      expect(state.scores['player-1']).toBe(5);
    });
  });

  describe('respawn', () => {
    it('should respawn player after delay', () => {
      gameServer.addPlayer('client-1', 'player-1', 'Player 1');
      gameServer.spawnPlayer('player-1', 'Player 1');
      const player = gameServer.getPlayer('player-1');
      
      player.x = null;
      player.y = null;
      gameServer.scheduleRespawn('player-1');

      gameServer.respawnQueue[0].respawnAt = Date.now() - 1;

      const respawned = gameServer.processRespawns();
      
      expect(respawned).toContain('player-1');
      expect(player.x).not.toBeNull();
      expect(player.y).not.toBeNull();
    });

    it('should retry respawn if spawn point occupied', () => {
      gameServer = new GameServer(new Game(), {
        spawnList: [{ x: 5, y: 5 }]
      });

      gameServer.addPlayer('client-1', 'player-1', 'Player 1');
      gameServer.addPlayer('client-2', 'player-2', 'Player 2');
      gameServer.spawnPlayer('player-1', 'Player 1');
      
      const player1 = gameServer.getPlayer('player-1');
      expect(player1.x).toBe(5);
      expect(player1.y).toBe(5);

      gameServer.scheduleRespawn('player-2');
      gameServer.respawnQueue[0].respawnAt = Date.now() - 1;

      gameServer.processRespawns();

      expect(gameServer.respawnQueue.length).toBeGreaterThan(0);
      expect(gameServer.respawnQueue[0].playerId).toBe('player-2');
    });
  });

  describe('serializeState', () => {
    it('should include bullets in state', () => {
      gameServer.addPlayer('client-1', 'player-1', 'Player 1');
      gameServer.spawnPlayer('player-1', 'Player 1');
      gameServer.fireBullet('player-1', 1, 0);

      const state = gameServer.serializeState();
      expect(state.bullets).toBeDefined();
      expect(Array.isArray(state.bullets)).toBe(true);
      expect(state.bullets).toHaveLength(1);
    });

    it('should include bullet properties in state', () => {
      gameServer.addPlayer('client-1', 'player-1', 'Player 1');
      gameServer.spawnPlayer('player-1', 'Player 1');
      gameServer.fireBullet('player-1', 1, 0);

      const state = gameServer.serializeState();
      const bullet = state.bullets[0];
      expect(bullet.bulletId).toBeDefined();
      expect(bullet.playerId).toBe('player-1');
      expect(bullet.dx).toBe(1);
      expect(bullet.dy).toBe(0);
    });
  });

  describe('removePlayer cleanup', () => {
    it('should remove player bullet when player leaves', () => {
      gameServer.addPlayer('client-1', 'player-1', 'Player 1');
      gameServer.spawnPlayer('player-1', 'Player 1');
      gameServer.fireBullet('player-1', 1, 0);

      expect(gameServer.getPlayerBullet('player-1')).not.toBeNull();

      gameServer.removePlayer('player-1');

      const state = gameServer.serializeState();
      const bulletExists = state.bullets.some(b => b.playerId === 'player-1');
      expect(bulletExists).toBe(false);
    });

    it('should clear player score when player leaves', () => {
      gameServer.addPlayer('client-1', 'player-1', 'Player 1');
      gameServer.addScore('player-1', 10);

      gameServer.removePlayer('player-1');

      expect(gameServer.getScore('player-1')).toBe(0);
    });
  });
});
