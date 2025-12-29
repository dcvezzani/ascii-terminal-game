/**
 * Game Server
 * Manages server-side game state for multiplayer support
 */

import { EventEmitter } from 'events';
import { Game } from '../game/Game.js';
import { gameConfig } from '../config/gameConfig.js';
import { randomUUID } from 'crypto';
import { logger } from '../utils/logger.js';
import { EventTypes } from './EventTypes.js';

/**
 * Game Server class
 * Maintains authoritative game state and manages multiple players
 * Extends EventEmitter to support event-driven architecture
 */
export class GameServer extends EventEmitter {
  constructor() {
    super(); // Call EventEmitter constructor
    this.game = new Game();
    // Map of playerId -> player info (active players)
    this.players = new Map();
    // Map of playerId -> { player, disconnectedAt } (disconnected players awaiting reconnection)
    this.disconnectedPlayers = new Map();
    this.updateInterval = null;
    this.purgeInterval = null;
    // Grace period: 1 minute (60000ms) before permanently removing disconnected players
    this.disconnectGracePeriod = 60000;
  }

  /**
   * Get the current game state
   * @returns {object} Game state object
   */
  getGameState() {
    return {
      board: {
        width: this.game.board.width,
        height: this.game.board.height,
        grid: this.game.board.grid,
      },
      players: Array.from(this.players.values()), // Only active players
      score: this.game.getScore(),
      running: this.game.isRunning(),
    };
  }

  /**
   * Add a player to the game
   * @param {string} playerId - Unique player ID
   * @param {string} playerName - Player name
   * @param {string} clientId - Client connection ID
   * @param {number} [x] - Optional X position (defaults to center)
   * @param {number} [y] - Optional Y position (defaults to center)
   * @returns {boolean} True if player was added, false if playerId already exists
   */
  addPlayer(playerId, playerName, clientId, x = null, y = null) {
    if (this.players.has(playerId)) {
      logger.warn(`Attempted to add duplicate player: ${playerId}`);
      return false;
    }

    // Use provided position or default to center
    let startX = x !== null ? x : gameConfig.player.initialX;
    let startY = y !== null ? y : gameConfig.player.initialY;

    // Validate position
    if (
      !this.game.board.isValidPosition(startX, startY) ||
      this.game.board.isWall(startX, startY)
    ) {
      // If invalid, try center position
      const centerX = gameConfig.player.initialX;
      const centerY = gameConfig.player.initialY;
      if (
        !this.game.board.isValidPosition(centerX, centerY) ||
        this.game.board.isWall(centerX, centerY)
      ) {
        logger.warn(
          `Invalid position for player ${playerId}: (${startX}, ${startY}), center also invalid`
        );
        return false;
      }
      // Use center position as fallback
      logger.debug(`Using fallback center position for player ${playerId}`);
      startX = centerX;
      startY = centerY;
    }

    const player = {
      playerId,
      playerName,
      clientId,
      x: startX,
      y: startY,
    };

    this.players.set(playerId, player);
    logger.info(`Player added: ${playerName} (${playerId}) at (${startX}, ${startY})`);
    return true;
  }

  /**
   * Mark a player as disconnected (moves to disconnectedPlayers map)
   * Player will be kept for grace period before permanent removal
   * @param {string} playerId - Player ID to mark as disconnected
   * @returns {boolean} True if player was marked as disconnected, false if not found
   */
  markPlayerDisconnected(playerId) {
    const player = this.players.get(playerId);
    if (!player) {
      logger.warn(`Attempted to mark non-existent player as disconnected: ${playerId}`);
      return false;
    }

    // Move player to disconnectedPlayers map with timestamp
    this.disconnectedPlayers.set(playerId, {
      player: { ...player }, // Copy player data
      disconnectedAt: Date.now(),
    });

    // Remove from active players
    this.players.delete(playerId);
    logger.info(`Player marked as disconnected: ${player.playerName} (${playerId})`);
    return true;
  }

  /**
   * Remove a player from the game permanently
   * @param {string} playerId - Player ID to remove
   * @returns {boolean} True if player was removed, false if not found
   */
  removePlayer(playerId) {
    // Remove from active players
    const player = this.players.get(playerId);
    const removed = this.players.delete(playerId);

    // Also remove from disconnected players if present
    this.disconnectedPlayers.delete(playerId);

    if (removed && player) {
      logger.info(`Player permanently removed: ${player.playerName} (${playerId})`);
    } else if (!removed) {
      logger.warn(`Attempted to remove non-existent player: ${playerId}`);
    }
    return removed;
  }

  /**
   * Restore a disconnected player (reconnection)
   * @param {string} playerId - Player ID to restore
   * @param {string} newClientId - New client ID for the reconnected player
   * @returns {boolean} True if player was restored, false if not found in disconnected players
   */
  restorePlayer(playerId, newClientId) {
    const disconnected = this.disconnectedPlayers.get(playerId);
    if (!disconnected) {
      return false;
    }

    // Restore player to active players
    const player = {
      ...disconnected.player,
      clientId: newClientId,
    };
    this.players.set(playerId, player);

    // Remove from disconnected players
    this.disconnectedPlayers.delete(playerId);

    logger.info(`Player restored: ${player.playerName} (${playerId})`);
    return true;
  }

  /**
   * Purge players that have been disconnected for longer than grace period
   * @returns {number} Number of players purged
   */
  purgeDisconnectedPlayers() {
    const now = Date.now();
    const playersToPurge = [];

    for (const [playerId, { player, disconnectedAt }] of this.disconnectedPlayers.entries()) {
      if (now - disconnectedAt > this.disconnectGracePeriod) {
        playersToPurge.push({ playerId, player });
      }
    }

    // Remove purged players
    for (const { playerId, player } of playersToPurge) {
      this.disconnectedPlayers.delete(playerId);
      logger.info(
        `Purging disconnected player after grace period: ${player.playerName} (${playerId})`
      );
    }

    return playersToPurge.length;
  }

  /**
   * Check if a player exists (active or disconnected)
   * @param {string} playerId - Player ID
   * @returns {boolean} True if player exists (active or disconnected)
   */
  hasPlayer(playerId) {
    return this.players.has(playerId) || this.disconnectedPlayers.has(playerId);
  }

  hasRecentPlayer(playerId) {
    // console.log("hasRecentPlayer playerId", playerId);
    // console.log("hasRecentPlayer players", this.players);
    // console.log("hasRecentPlayer disconnectedPlayers", this.disconnectedPlayers);
    return this.players.has(playerId) || this.disconnectedPlayers.has(playerId);
  }

  /**
   * Get player information (checks both active and disconnected players)
   * @param {string} playerId - Player ID
   * @returns {object | null} Player info or null if not found
   */
  getPlayer(playerId) {
    // Check active players first
    const activePlayer = this.players.get(playerId);
    if (activePlayer) {
      return activePlayer;
    }

    // Check disconnected players
    const disconnected = this.disconnectedPlayers.get(playerId);
    if (disconnected) {
      return disconnected.player;
    }

    return null;
  }

  /**
   * Move a player by delta
   * @param {string} playerId - Player ID
   * @param {number} dx - Change in X direction (-1, 0, or 1)
   * @param {number} dy - Change in Y direction (-1, 0, or 1)
   * @returns {boolean} True if movement was successful, false if blocked or invalid
   */
  movePlayer(playerId, dx, dy) {
    const player = this.players.get(playerId);
    if (!player) {
      logger.warn(`Attempted to move non-existent player: ${playerId}`);
      return false;
    }

    const newX = player.x + dx;
    const newY = player.y + dy;

    // Validate new position
    if (!this.game.board.isValidPosition(newX, newY)) {
      logger.debug(`Invalid position for player ${playerId}: (${newX}, ${newY})`);
      return false;
    }

    if (this.game.board.isWall(newX, newY)) {
      // Emit targeted collision event
      this.emit(EventTypes.BUMP, {
        scope: 'targeted',
        type: EventTypes.WALL_COLLISION,
        targetId: playerId,
        playerId: playerId,
        attemptedPosition: { x: newX, y: newY },
        currentPosition: { x: player.x, y: player.y },
        collisionType: 'wall',
        timestamp: Date.now(),
      });

      logger.debug(`Wall collision for player ${playerId} at (${newX}, ${newY})`);
      return false;
    }

    // Check for collision with other players
    const hasCollision = Array.from(this.players.values()).some(
      otherPlayer =>
        otherPlayer.playerId !== playerId && otherPlayer.x === newX && otherPlayer.y === newY
    );

    if (hasCollision) {
      const otherPlayer = Array.from(this.players.values()).find(
        p => p.playerId !== playerId && p.x === newX && p.y === newY
      );

      // Emit targeted collision event
      this.emit(EventTypes.BUMP, {
        scope: 'targeted',
        type: EventTypes.PLAYER_COLLISION,
        targetId: playerId,
        playerId: playerId,
        attemptedPosition: { x: newX, y: newY },
        currentPosition: { x: player.x, y: player.y },
        collisionType: 'player',
        otherPlayerId: otherPlayer.playerId,
        timestamp: Date.now(),
      });

      logger.debug(`Player collision for player ${playerId} at (${newX}, ${newY})`);
      return false;
    }

    // Move player
    player.x = newX;
    player.y = newY;
    logger.debug(`Player ${playerId} moved to (${newX}, ${newY})`);
    return true;
  }

  /**
   * Get all players
   * @returns {Array<object>} Array of player objects
   */
  getAllPlayers() {
    return Array.from(this.players.values());
  }

  /**
   * Reset the game to initial state
   */
  resetGame() {
    this.game.reset();
    this.players.clear();
  }

  /**
   * Start the game
   */
  startGame() {
    this.game.start();
  }

  /**
   * Stop the game
   */
  stopGame() {
    this.game.stop();
  }

  /**
   * Get the number of players
   * @returns {number} Number of players
   */
  getPlayerCount() {
    return this.players.size;
  }

  /**
   * Spawn an entity on the board
   * @param {string} entityType - Type of entity (e.g., 'ruffian', 'enemy')
   * @param {number} x - X position
   * @param {number} y - Y position
   * @param {object} [options] - Optional entity properties (glyph, color, etc.)
   * @returns {string|null} Entity ID if spawned successfully, null if failed
   */
  spawnEntity(entityType, x, y, options = {}) {
    // Validate position
    if (!this.game.board.isValidPosition(x, y)) {
      logger.warn(`Invalid position for entity spawn: (${x}, ${y})`);
      return null;
    }

    if (this.game.board.isWall(x, y)) {
      logger.warn(`Cannot spawn entity on wall at (${x}, ${y})`);
      return null;
    }

    // Check for collision with players
    const hasPlayerCollision = Array.from(this.players.values()).some(
      player => player.x === x && player.y === y
    );
    if (hasPlayerCollision) {
      logger.warn(`Cannot spawn entity on player at (${x}, ${y})`);
      return null;
    }

    // Check for collision with other entities
    const hasEntityCollision = Array.from(this.entities.values()).some(
      entity => entity.x === x && entity.y === y
    );
    if (hasEntityCollision) {
      logger.warn(`Cannot spawn entity on existing entity at (${x}, ${y})`);
      return null;
    }

    // Generate unique entity ID
    const entityId = randomUUID();

    // Create entity object
    const entity = {
      entityId,
      entityType,
      x,
      y,
      ...options, // Include any additional options (glyph, color, etc.)
    };

    // Add to entities map
    this.entities.set(entityId, entity);
    logger.info(`Entity spawned: ${entityType} (${entityId}) at (${x}, ${y})`);

    return entityId;
  }
}
