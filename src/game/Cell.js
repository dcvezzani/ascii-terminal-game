import { EMPTY_SPACE_CHAR, WALL_CHAR } from '../constants/gameConstants.js';

/**
 * Cell class represents a single cell on the board with a queue of glyphs/entities
 * Handles prioritization: solid entities always on top, non-solid entities in FIFO order
 */
export class Cell {
  constructor(baseChar) {
    this.baseChar = baseChar; // Base board cell (wall or empty space)
    this.solidEntity = null; // Only one solid entity allowed per cell
    this.nonSolidEntities = []; // FIFO queue of non-solid entities
  }

  /**
   * Add an entity to the cell
   * @param {Object} entity - Entity to add { char, color, id, solid }
   * @throws {Error} If validation fails (e.g., trying to add solid entity when one exists)
   */
  addEntity(entity) {
    if (entity.solid) {
      // Solid entity - only one allowed
      if (this.solidEntity !== null) {
        throw new Error(
          `Cannot add solid entity ${entity.id} to cell: solid entity ${this.solidEntity.id} already exists`
        );
      }
      this.solidEntity = {
        char: entity.char,
        color: entity.color,
        id: entity.id,
        solid: true,
      };
    } else {
      // Non-solid entity - add to FIFO queue
      this.nonSolidEntities.push({
        char: entity.char,
        color: entity.color,
        id: entity.id,
        solid: false,
      });
    }
  }

  /**
   * Remove an entity from the cell by ID
   * @param {string} id - ID of the entity to remove
   * @returns {boolean} True if entity was found and removed
   */
  removeEntity(id) {
    // Check solid entity
    if (this.solidEntity && this.solidEntity.id === id) {
      this.solidEntity = null;
      return true;
    }

    // Check non-solid entities
    const index = this.nonSolidEntities.findIndex(e => e.id === id);
    if (index !== -1) {
      this.nonSolidEntities.splice(index, 1);
      return true;
    }

    return false;
  }

  /**
   * Get what should be displayed (prioritized: solid entity > non-solid entity > base cell)
   * @returns {Object} { char, color }
   */
  getDisplay() {
    // Solid entity has highest priority
    if (this.solidEntity) {
      return { char: this.solidEntity.char, color: this.solidEntity.color };
    }

    // Then non-solid entities (FIFO - first one added)
    if (this.nonSolidEntities.length > 0) {
      const top = this.nonSolidEntities[0];
      return { char: top.char, color: top.color };
    }

    // Fall back to base cell
    if (this.baseChar === WALL_CHAR.char) {
      return { char: WALL_CHAR.char, color: WALL_CHAR.color };
    }
    return { char: EMPTY_SPACE_CHAR.char, color: EMPTY_SPACE_CHAR.color };
  }

  /**
   * Get the base cell character (for backward compatibility)
   * @returns {string} Base cell character
   */
  getBaseChar() {
    return this.baseChar;
  }

  /**
   * Check if cell has a solid entity
   * @returns {boolean} True if cell has a solid entity
   */
  hasSolidEntity() {
    return this.solidEntity !== null;
  }

  /**
   * Get the solid entity if present
   * @returns {Object|null} Solid entity or null
   */
  getSolidEntity() {
    return this.solidEntity;
  }
}

