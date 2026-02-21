import Game from '../game/Game.js';
import logger from '../utils/logger.js';
import { isSpawnAvailable } from './spawnAvailability.js';

const DEFAULT_SPAWN_CONFIG = {
  clearRadius: 3,
  waitMessage: 'Thank you for waiting. A spawn point is being selected for you.'
};

/**
 * GameServer class for managing game state and players
 * @param {Game} [game] - Game instance
 * @param {{ spawnList?: Array<{x: number, y: number}>, spawnConfig?: { clearRadius: number, waitMessage: string } }} [options] - Spawn list (from board or fallback) and config
 */
export class GameServer {
  constructor(game, options = {}) {
    this.game = game != null && typeof game.board !== 'undefined' ? game : new Game();
    this.players = new Map();
    const list = options.spawnList;
    const width = this.game.board.width;
    const height = this.game.board.height;
    if (list != null && list.length > 0) {
      this.spawnList = list;
    } else {
      this.spawnList = [
        { x: Math.floor(width / 2), y: Math.floor(height / 2) }
      ];
    }
    this.spawnConfig = { ...DEFAULT_SPAWN_CONFIG, ...options.spawnConfig };
  }

  /**
   * Add a player to the game
   * @param {string} clientId - Client identifier
   * @param {string} playerId - Player identifier
   * @param {string} playerName - Player name
   */
  addPlayer(clientId, playerId, playerName) {
    const player = {
      playerId,
      clientId,
      playerName,
      x: null,
      y: null,
      lastX: null,
      lastY: null,
      lastT: null
    };
    this.players.set(playerId, player);
    logger.debug(`Player added: ${playerId} (${playerName})`);
  }

  /**
   * Remove a player from the game
   * @param {string} playerId - Player identifier
   */
  removePlayer(playerId) {
    this.players.delete(playerId);
    logger.debug(`Player removed: ${playerId}`);
  }

  /**
   * Get player by playerId
   * @param {string} playerId - Player identifier
   * @returns {object|undefined} Player object or undefined
   */
  getPlayer(playerId) {
    return this.players.get(playerId);
  }

  /**
   * Get all players
   * @returns {Array} Array of player objects
   */
  getAllPlayers() {
    return Array.from(this.players.values());
  }

  /**
   * Get all spawns that are currently available (clear circle, not occupied).
   * @returns {Array<{ x: number, y: number }>}
   */
  _getAvailableSpawns() {
    const players = this.getAllPlayers();
    const board = this.game.board;
    const R = this.spawnConfig.clearRadius;
    return this.spawnList.filter((spawn) =>
      isSpawnAvailable(spawn, board, players, R)
    );
  }

  /**
   * Pick one available spawn at random, or null if none available.
   * @returns {{ x: number, y: number } | null}
   */
  _pickAvailableSpawn() {
    const available = this._getAvailableSpawns();
    if (available.length === 0) return null;
    const index = Math.floor(Math.random() * available.length);
    return available[index];
  }

  /**
   * Spawn player at next available spawn, or leave waiting (x/y null).
   * @param {string} playerId - Player identifier
   * @param {string} playerName - Player name
   * @returns {{ spawned: boolean, waiting?: boolean }} spawned true if placed; waiting true if deferred
   */
  spawnPlayer(playerId, playerName) {
    const player = this.players.get(playerId);
    if (!player) {
      logger.warn(`Cannot spawn player ${playerId}: player not found`);
      return { spawned: false };
    }

    player.playerName = playerName;
    const spawn = this._pickAvailableSpawn();
    if (spawn) {
      player.x = spawn.x;
      player.y = spawn.y;
      player.lastX = player.x;
      player.lastY = player.y;
      player.lastT = Date.now();
      logger.debug(`Player spawned: ${playerId} at (${player.x}, ${player.y})`);
      return { spawned: true };
    }

    logger.debug(`Player ${playerId} waiting for spawn`);
    return { spawned: false, waiting: true };
  }

  /**
   * Try to assign spawns to waiting players (FIFO). Call after a player disconnects.
   * @returns {string[]} Player IDs that were just spawned
   */
  trySpawnWaitingPlayers() {
    const spawned = [];
    const waiting = this.getAllPlayers().filter(
      (p) => p.x === null && p.y === null
    );
    for (const player of waiting) {
      const result = this.spawnPlayer(player.playerId, player.playerName);
      if (result.spawned) {
        spawned.push(player.playerId);
      }
    }
    return spawned;
  }

  /**
   * Get the configured wait message when no spawn is available
   * @returns {string}
   */
  getSpawnWaitMessage() {
    return this.spawnConfig.waitMessage;
  }

  /**
   * Validate a move for a player
   * @param {string} playerId - Player identifier
   * @param {number} dx - Delta X (-1, 0, or 1)
   * @param {number} dy - Delta Y (-1, 0, or 1)
   * @returns {boolean} True if move is valid
   */
  validateMove(playerId, dx, dy) {
    const player = this.getPlayer(playerId);
    if (!player) {
      logger.warn(`Cannot validate move: player ${playerId} not found`);
      return false;
    }

    if (player.x === null || player.y === null) {
      logger.warn(`Cannot validate move: player ${playerId} not spawned`);
      return false;
    }

    const newX = player.x + dx;
    const newY = player.y + dy;

    // Check bounds
    if (newX < 0 || newX >= this.game.board.width || newY < 0 || newY >= this.game.board.height) {
      return false;
    }

    // Check walls
    if (this.game.board.isWall(newX, newY)) {
      return false;
    }

    // Check player collisions
    const allPlayers = this.getAllPlayers();
    const occupied = allPlayers.some(p => 
      p.playerId !== playerId && p.x === newX && p.y === newY
    );
    if (occupied) {
      return false;
    }

    return true;
  }

  /**
   * Move a player
   * @param {string} playerId - Player identifier
   * @param {number} dx - Delta X (-1, 0, or 1)
   * @param {number} dy - Delta Y (-1, 0, or 1)
   * @returns {boolean} True if move was successful
   */
  movePlayer(playerId, dx, dy) {
    if (!this.validateMove(playerId, dx, dy)) {
      return false;
    }

    const player = this.getPlayer(playerId);
    player.lastX = player.x;
    player.lastY = player.y;
    player.lastT = Date.now();
    player.x += dx;
    player.y += dy;

    logger.debug(`Player ${playerId} moved to (${player.x}, ${player.y})`);
    return true;
  }

  /**
   * Serialize game state for broadcasting
   * @returns {object} Serialized game state
   */
  serializeState() {
    return {
      board: {
        width: this.game.board.width,
        height: this.game.board.height,
        grid: this.game.board.serialize()
      },
      players: this.getAllPlayers().map(player => {
        const now = Date.now();
        let vx = 0;
        let vy = 0;
        if (player.lastX != null && player.lastY != null && player.lastT != null && (player.x !== player.lastX || player.y !== player.lastY)) {
          const dtSec = (now - player.lastT) / 1000;
          if (dtSec > 0) {
            vx = (player.x - player.lastX) / dtSec;
            vy = (player.y - player.lastY) / dtSec;
          }
        }
        return {
          playerId: player.playerId,
          x: player.x,
          y: player.y,
          playerName: player.playerName,
          vx,
          vy
        };
      }),
      score: this.game.score
    };
  }
}

// Default export
export default GameServer;
