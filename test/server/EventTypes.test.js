/**
 * Unit tests for EventTypes constants
 * Phase 2: Event Type Constants
 */

import { describe, it, expect } from 'vitest';
import { EventTypes } from '../../src/server/EventTypes.js';

describe('EventTypes', () => {
  describe('Collision Event Types', () => {
    it('should define BUMP constant', () => {
      expect(EventTypes.BUMP).toBe('bump');
    });

    it('should define PLAYER_COLLISION constant', () => {
      expect(EventTypes.PLAYER_COLLISION).toBe('playerCollision');
    });

    it('should define WALL_COLLISION constant', () => {
      expect(EventTypes.WALL_COLLISION).toBe('wallCollision');
    });

    it('should define ENTITY_COLLISION constant', () => {
      expect(EventTypes.ENTITY_COLLISION).toBe('entityCollision');
    });
  });

  describe('Combat Event Types', () => {
    it('should define SHOT constant', () => {
      expect(EventTypes.SHOT).toBe('shot');
    });

    it('should define DAMAGE constant', () => {
      expect(EventTypes.DAMAGE).toBe('damage');
    });

    it('should define HEAL constant', () => {
      expect(EventTypes.HEAL).toBe('heal');
    });

    it('should define DEATH constant', () => {
      expect(EventTypes.DEATH).toBe('death');
    });

    it('should define ATTACK constant', () => {
      expect(EventTypes.ATTACK).toBe('attack');
    });

    it('should define DEFEND constant', () => {
      expect(EventTypes.DEFEND).toBe('defend');
    });
  });

  describe('Alignment Event Types', () => {
    it('should define ALIGNED_VERTICALLY constant', () => {
      expect(EventTypes.ALIGNED_VERTICALLY).toBe('alignedVertically');
    });

    it('should define ALIGNED_HORIZONTALLY constant', () => {
      expect(EventTypes.ALIGNED_HORIZONTALLY).toBe('alignedHorizontally');
    });

    it('should define FORMATION constant', () => {
      expect(EventTypes.FORMATION).toBe('formation');
    });

    it('should define LINE_OF_SIGHT constant', () => {
      expect(EventTypes.LINE_OF_SIGHT).toBe('lineOfSight');
    });
  });

  describe('Entity Event Types', () => {
    it('should define SPAWN constant', () => {
      expect(EventTypes.SPAWN).toBe('spawn');
    });

    it('should define DESPAWN constant', () => {
      expect(EventTypes.DESPAWN).toBe('despawn');
    });

    it('should define MOVE constant', () => {
      expect(EventTypes.MOVE).toBe('move');
    });

    it('should define ANIMATE constant', () => {
      expect(EventTypes.ANIMATE).toBe('animate');
    });

    it('should define STATE_CHANGE constant', () => {
      expect(EventTypes.STATE_CHANGE).toBe('stateChange');
    });
  });

  describe('State Event Types', () => {
    it('should define PLAYER_JOINED constant', () => {
      expect(EventTypes.PLAYER_JOINED).toBe('playerJoined');
    });

    it('should define PLAYER_LEFT constant', () => {
      expect(EventTypes.PLAYER_LEFT).toBe('playerLeft');
    });

    it('should define GAME_STATE_CHANGE constant', () => {
      expect(EventTypes.GAME_STATE_CHANGE).toBe('gameStateChange');
    });

    it('should define SCORE_CHANGE constant', () => {
      expect(EventTypes.SCORE_CHANGE).toBe('scoreChange');
    });
  });

  describe('Type Safety', () => {
    it('should have all constants as strings', () => {
      const allConstants = Object.values(EventTypes);
      allConstants.forEach(constant => {
        expect(typeof constant).toBe('string');
      });
    });

    it('should have unique values for all constants', () => {
      const allConstants = Object.values(EventTypes);
      const uniqueConstants = new Set(allConstants);
      expect(uniqueConstants.size).toBe(allConstants.length);
    });
  });
});
