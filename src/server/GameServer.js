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
import { EMPTY_SPACE_CHAR, WALL_CHAR, PLAYER_CHAR } from '../constants/gameConstants.js';

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
    // Map of entityId -> entity info
    this.entities = new Map();
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
    // Serialize board grid - convert Cell objects to base characters for network transmission
    const grid = [];
    for (let y = 0; y < this.game.board.height; y++) {
      const row = [];
      for (let x = 0; x < this.game.board.width; x++) {
        const cell = this.game.board.getCell(x, y);
        row.push(cell ? cell.getBaseChar() : EMPTY_SPACE_CHAR.char);
      }
      grid.push(row);
    }

    return {
      board: {
        width: this.game.board.width,
        height: this.game.board.height,
        grid: grid, // Serialized grid with base characters
      },
      players: Array.from(this.players.values()), // Only active players
      entities: Array.from(this.entities.values()), // All entities
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

    // Validate position and check for conflicts
    if (
      !this.game.board.isValidPosition(startX, startY) ||
      this.game.board.isWall(startX, startY) ||
      this.game.board.hasSolidEntity(startX, startY)
    ) {
      // If invalid or occupied, try to find an available position near center
      const centerX = gameConfig.player.initialX;
      const centerY = gameConfig.player.initialY;
      let foundPosition = false;

      // Try center first
      if (
        this.game.board.isValidPosition(centerX, centerY) &&
        !this.game.board.isWall(centerX, centerY) &&
        !this.game.board.hasSolidEntity(centerX, centerY)
      ) {
        startX = centerX;
        startY = centerY;
        foundPosition = true;
      } else {
        // Search in a spiral pattern around center for an available position
        const maxRadius = Math.min(this.game.board.width, this.game.board.height);
        for (let radius = 1; radius < maxRadius && !foundPosition; radius++) {
          for (let dx = -radius; dx <= radius && !foundPosition; dx++) {
            for (let dy = -radius; dy <= radius && !foundPosition; dy++) {
              // Only check positions on the edge of the current radius
              if (Math.abs(dx) === radius || Math.abs(dy) === radius) {
                const testX = centerX + dx;
                const testY = centerY + dy;
                if (
                  this.game.board.isValidPosition(testX, testY) &&
                  !this.game.board.isWall(testX, testY) &&
                  !this.game.board.hasSolidEntity(testX, testY)
                ) {
                  startX = testX;
                  startY = testY;
                  foundPosition = true;
                  logger.debug(`Found available position for player ${playerId} at (${testX}, ${testY})`);
                }
              }
            }
          }
        }
      }

      if (!foundPosition) {
        logger.warn(
          `No available position found for player ${playerId} near center (${centerX}, ${centerY})`
        );
        return false;
      }
    }

    const player = {
      playerId,
      playerName,
      clientId,
      x: startX,
      y: startY,
    };

    // Add player to board cell queue (players are solid, block movement)
    try {
      this.game.board.addEntity(startX, startY, {
        char: PLAYER_CHAR.char,
        color: PLAYER_CHAR.color,
        id: `player-${playerId}`,
        solid: true, // Players are solid entities, block movement
      });
    } catch (error) {
      logger.warn(`Failed to add player to board at (${startX}, ${startY}): ${error.message}`);
      return false;
    }

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

    // Remove player from board (but keep in disconnectedPlayers for potential reconnection)
    this.game.board.removeEntity(player.x, player.y, `player-${playerId}`);

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

    // Remove player from board
    if (player) {
      this.game.board.removeEntity(player.x, player.y, `player-${playerId}`);
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

    // Add player back to board at their position
    try {
      this.game.board.addEntity(player.x, player.y, {
        char: PLAYER_CHAR.char,
        color: PLAYER_CHAR.color,
        id: `player-${playerId}`,
        solid: true, // Players are solid entities
      });
    } catch (error) {
      logger.warn(`Failed to restore player to board at (${player.x}, ${player.y}): ${error.message}`);
      // Still restore player even if board add fails
    }

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

    // Check for solid entity at new position (blocks movement)
    // This includes other players (who are solid entities) and other solid entities
    if (this.game.board.hasSolidEntity(newX, newY)) {
      // Check if the solid entity is another player for event purposes
      const otherPlayer = Array.from(this.players.values()).find(
        p => p.playerId !== playerId && p.x === newX && p.y === newY
      );

      if (otherPlayer) {
        // Emit targeted collision event for player collision
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
      } else {
        // Emit targeted collision event for solid entity collision
        this.emit(EventTypes.BUMP, {
          scope: 'targeted',
          type: EventTypes.ENTITY_COLLISION,
          targetId: playerId,
          playerId: playerId,
          attemptedPosition: { x: newX, y: newY },
          currentPosition: { x: player.x, y: player.y },
          collisionType: 'solid-entity',
          timestamp: Date.now(),
        });
        logger.debug(`Solid entity collision for player ${playerId} at (${newX}, ${newY})`);
      }

      return false;
    }

    // Remove player from old position on board
    this.game.board.removeEntity(player.x, player.y, `player-${playerId}`);

    // Move player
    player.x = newX;
    player.y = newY;

    // Add player to new position on board
    try {
      this.game.board.addEntity(newX, newY, {
        char: PLAYER_CHAR.char,
        color: PLAYER_CHAR.color,
        id: `player-${playerId}`,
        solid: true, // Players are solid entities
      });
    } catch (error) {
      logger.error(`Failed to add player to board at (${newX}, ${newY}): ${error.message}`);
      // Rollback position
      player.x = player.x - dx;
      player.y = player.y - dy;
      // Try to restore to old position
      try {
        this.game.board.addEntity(player.x, player.y, {
          char: PLAYER_CHAR.char,
          color: PLAYER_CHAR.color,
          id: `player-${playerId}`,
          solid: true, // Players are solid entities
        });
      } catch (restoreError) {
        logger.error(`Failed to restore player to old position: ${restoreError.message}`);
      }
      return false;
    }

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
    this.game.reset(); // This creates a new Board, clearing all cell queues
    this.players.clear();
    this.disconnectedPlayers.clear();
    this.entities.clear();
    logger.info('Game reset: cleared all players, disconnected players, and entities');
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
   * @param {object} [options] - Optional entity properties (glyph, color, solid, etc.)
   * @returns {string|null} Entity ID if spawned successfully, null if failed
   */
  spawnEntity(entityType, x, y, options = {}) {
    // Generate unique entity ID
    const entityId = randomUUID();

    // Determine if entity is solid (default: true for ruffian, false for collectibles)
    const isSolid = options.solid !== undefined ? options.solid : true;

    // Get glyph and color
    const glyph = options.glyph || null;
    const color = options.color || 'white';

    // Create entity object for tracking
    const entity = {
      entityId,
      entityType,
      x,
      y,
      solid: isSolid,
      glyph,
      color,
      ...options, // Include any additional options
    };

    // Add to entities map first (for tracking)
    this.entities.set(entityId, entity);

    // Add entity to board cell queue (Board will validate)
    try {
      this.game.board.addEntity(x, y, {
        char: glyph || '?',
        color: color,
        id: entityId,
        solid: isSolid,
      });
      logger.info(`Entity spawned: ${entityType} (${entityId}) at (${x}, ${y}), solid: ${isSolid}`);
      return entityId;
    } catch (error) {
      // Validation failed - remove from entities map
      this.entities.delete(entityId);
      logger.warn(`Failed to spawn entity ${entityType} at (${x}, ${y}): ${error.message}`);
      return null;
    }
  }
}
