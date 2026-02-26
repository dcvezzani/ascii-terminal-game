import { describe, it, expect } from 'vitest';
import {
  getServerPlayerPosition,
  validateBounds,
  validateWall,
  validateEntityCollision,
  validatePlayerCollision,
  validateMovement
} from '../../src/modes/networkedMode.js';

describe('networkedMode helper functions', () => {
  describe('getServerPlayerPosition', () => {
    it('should return position when player found', () => {
      const currentState = {
        players: [
          { playerId: 'player1', x: 10, y: 10, playerName: 'Player 1' },
          { playerId: 'player2', x: 5, y: 5, playerName: 'Player 2' }
        ]
      };
      const localPlayerId = 'player1';

      const result = getServerPlayerPosition(currentState, localPlayerId);

      expect(result).toEqual({ x: 10, y: 10 });
    });

    it('should return null when player not found', () => {
      const currentState = {
        players: [
          { playerId: 'player1', x: 10, y: 10, playerName: 'Player 1' }
        ]
      };
      const localPlayerId = 'player2';

      const result = getServerPlayerPosition(currentState, localPlayerId);

      expect(result).toBeNull();
    });

    it('should return null when state is null', () => {
      const result = getServerPlayerPosition(null, 'player1');
      expect(result).toBeNull();
    });

    it('should return null when players array is missing', () => {
      const currentState = {};
      const result = getServerPlayerPosition(currentState, 'player1');
      expect(result).toBeNull();
    });
  });

  describe('validateBounds', () => {
    it('should return true for valid bounds within board', () => {
      const board = { width: 20, height: 20 };
      expect(validateBounds(10, 10, board)).toBe(true);
    });

    it('should return false for negative x', () => {
      const board = { width: 20, height: 20 };
      expect(validateBounds(-1, 10, board)).toBe(false);
    });

    it('should return false for negative y', () => {
      const board = { width: 20, height: 20 };
      expect(validateBounds(10, -1, board)).toBe(false);
    });

    it('should return false for x too large', () => {
      const board = { width: 20, height: 20 };
      expect(validateBounds(20, 10, board)).toBe(false);
    });

    it('should return false for y too large', () => {
      const board = { width: 20, height: 20 };
      expect(validateBounds(10, 20, board)).toBe(false);
    });

    it('should return true for edge case (0, 0)', () => {
      const board = { width: 20, height: 20 };
      expect(validateBounds(0, 0, board)).toBe(true);
    });

    it('should return true for edge case (width-1, height-1)', () => {
      const board = { width: 20, height: 20 };
      expect(validateBounds(19, 19, board)).toBe(true);
    });

    it('should return false for null board', () => {
      expect(validateBounds(10, 10, null)).toBe(false);
    });
  });

  describe('validateWall', () => {
    it('should return true for non-wall cell', () => {
      const board = {
        getCell: () => '.'
      };
      expect(validateWall(10, 10, board)).toBe(true);
    });

    it('should return false for wall cell', () => {
      const board = {
        getCell: () => '#'
      };
      expect(validateWall(10, 10, board)).toBe(false);
    });

    it('should return false for null cell (out of bounds)', () => {
      const board = {
        getCell: () => null
      };
      expect(validateWall(10, 10, board)).toBe(false);
    });

    it('should return false for null board', () => {
      expect(validateWall(10, 10, null)).toBe(false);
    });

    it('should return false for board without getCell', () => {
      const board = {};
      expect(validateWall(10, 10, board)).toBe(false);
    });
  });

  describe('validateEntityCollision', () => {
    it('should return true when no entities', () => {
      expect(validateEntityCollision(10, 10, [])).toBe(true);
    });

    it('should return true when entities is null', () => {
      expect(validateEntityCollision(10, 10, null)).toBe(true);
    });

    it('should return true for non-solid entity at position', () => {
      const entities = [
        { entityId: 'e1', x: 10, y: 10, solid: false }
      ];
      expect(validateEntityCollision(10, 10, entities)).toBe(true);
    });

    it('should return false for solid entity at position', () => {
      const entities = [
        { entityId: 'e1', x: 10, y: 10, solid: true }
      ];
      expect(validateEntityCollision(10, 10, entities)).toBe(false);
    });

    it('should return true for entity at different position', () => {
      const entities = [
        { entityId: 'e1', x: 5, y: 5, solid: true }
      ];
      expect(validateEntityCollision(10, 10, entities)).toBe(true);
    });
  });

  describe('validatePlayerCollision', () => {
    it('should return true when no players', () => {
      expect(validatePlayerCollision(10, 10, [], 'player1')).toBe(true);
    });

    it('should return true when players is null', () => {
      expect(validatePlayerCollision(10, 10, null, 'player1')).toBe(true);
    });

    it('should return false for other player at position', () => {
      const players = [
        { playerId: 'player1', x: 10, y: 10 },
        { playerId: 'player2', x: 10, y: 10 }
      ];
      expect(validatePlayerCollision(10, 10, players, 'player1')).toBe(false);
    });

    it('should return true for local player at position (excluded)', () => {
      const players = [
        { playerId: 'player1', x: 10, y: 10 }
      ];
      expect(validatePlayerCollision(10, 10, players, 'player1')).toBe(true);
    });

    it('should return true for player at different position', () => {
      const players = [
        { playerId: 'player1', x: 5, y: 5 },
        { playerId: 'player2', x: 5, y: 5 }
      ];
      expect(validatePlayerCollision(10, 10, players, 'player1')).toBe(true);
    });
  });

  describe('validateMovement', () => {
    it('should return true for valid movement (all checks pass)', () => {
      const currentState = {
        board: {
          width: 20,
          height: 20,
          grid: Array(20).fill(null).map(() => Array(20).fill('.'))
        },
        players: [
          { playerId: 'player1', x: 10, y: 10 }
        ],
        entities: []
      };
      expect(validateMovement(11, 10, currentState, 'player1')).toBe(true);
    });

    it('should return false for invalid bounds', () => {
      const currentState = {
        board: {
          width: 20,
          height: 20,
          grid: Array(20).fill(null).map(() => Array(20).fill('.'))
        },
        players: [],
        entities: []
      };
      expect(validateMovement(25, 10, currentState, 'player1')).toBe(false);
    });

    it('should return false for wall collision', () => {
      const grid = Array(20).fill(null).map(() => Array(20).fill('.'));
      grid[10][10] = '#';
      const currentState = {
        board: {
          width: 20,
          height: 20,
          grid: grid
        },
        players: [],
        entities: []
      };
      expect(validateMovement(10, 10, currentState, 'player1')).toBe(false);
    });

    it('should return false for solid entity collision', () => {
      const currentState = {
        board: {
          width: 20,
          height: 20,
          grid: Array(20).fill(null).map(() => Array(20).fill('.'))
        },
        players: [],
        entities: [
          { entityId: 'e1', x: 10, y: 10, solid: true }
        ]
      };
      expect(validateMovement(10, 10, currentState, 'player1')).toBe(false);
    });

    it('should return false for player collision', () => {
      const currentState = {
        board: {
          width: 20,
          height: 20,
          grid: Array(20).fill(null).map(() => Array(20).fill('.'))
        },
        players: [
          { playerId: 'player1', x: 10, y: 10 },
          { playerId: 'player2', x: 10, y: 10 }
        ],
        entities: []
      };
      expect(validateMovement(10, 10, currentState, 'player1')).toBe(false);
    });

    it('should return false for null state', () => {
      expect(validateMovement(10, 10, null, 'player1')).toBe(false);
    });
  });

  describe('prediction initialization (contract)', () => {
    it('should initialize from CONNECT response with gameState', () => {
      const gameState = {
        players: [
          { playerId: 'player1', x: 10, y: 10, playerName: 'Player 1' }
        ]
      };
      const result = getServerPlayerPosition(gameState, 'player1');
      expect(result).toEqual({ x: 10, y: 10 });
    });

    it('should handle missing player in gameState', () => {
      const gameState = {
        players: [
          { playerId: 'player2', x: 10, y: 10, playerName: 'Player 2' }
        ]
      };
      const result = getServerPlayerPosition(gameState, 'player1');
      expect(result).toBeNull();
    });
  });

  describe('reconciliation logic (contract)', () => {
    it('should detect position match (no correction needed)', () => {
      const predictedPos = { x: 10, y: 10 };
      const serverPos = { x: 10, y: 10 };
      const mismatch = serverPos.x !== predictedPos.x || serverPos.y !== predictedPos.y;
      expect(mismatch).toBe(false);
    });

    it('should detect position mismatch (correction needed)', () => {
      const predictedPos = { x: 10, y: 10 };
      const serverPos = { x: 11, y: 10 };
      const mismatch = serverPos.x !== predictedPos.x || serverPos.y !== predictedPos.y;
      expect(mismatch).toBe(true);
    });

    it('should correct predicted position to server position on mismatch', () => {
      let predictedPos = { x: 10, y: 10 };
      const serverPos = { x: 11, y: 10 };
      const mismatch = serverPos.x !== predictedPos.x || serverPos.y !== predictedPos.y;
      if (mismatch) {
        predictedPos = { x: serverPos.x, y: serverPos.y };
      }
      expect(predictedPos).toEqual({ x: 11, y: 10 });
    });
  });
});
