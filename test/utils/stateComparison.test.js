import { describe, it, expect } from 'vitest';
import compareStates from '../../src/utils/stateComparison.js';

describe('stateComparison', () => {
  describe('compareStates', () => {
    describe('first render (previousState === null)', () => {
      it('should return all current players as joined', () => {
        const currentState = {
          players: [
            { playerId: 'player-1', x: 10, y: 10, playerName: 'Player 1' },
            { playerId: 'player-2', x: 11, y: 11, playerName: 'Player 2' }
          ],
          score: 0
        };

        const changes = compareStates(null, currentState);

        expect(changes.players.joined).toHaveLength(2);
        expect(changes.players.joined[0].playerId).toBe('player-1');
        expect(changes.players.joined[0].pos).toEqual({ x: 10, y: 10 });
        expect(changes.players.joined[0].playerName).toBe('Player 1');
        expect(changes.players.moved).toHaveLength(0);
        expect(changes.players.left).toHaveLength(0);
        expect(changes.scoreChanged).toBe(false);
      });

      it('should handle empty players array', () => {
        const currentState = {
          players: [],
          score: 0
        };

        const changes = compareStates(null, currentState);

        expect(changes.players.joined).toHaveLength(0);
        expect(changes.players.moved).toHaveLength(0);
        expect(changes.players.left).toHaveLength(0);
      });

      it('should handle missing players array', () => {
        const currentState = {
          score: 0
        };

        const changes = compareStates(null, currentState);

        expect(changes.players.joined).toHaveLength(0);
        expect(changes.players.moved).toHaveLength(0);
        expect(changes.players.left).toHaveLength(0);
      });
    });

    describe('no changes', () => {
      it('should return empty arrays when nothing changed', () => {
        const state = {
          players: [
            { playerId: 'player-1', x: 10, y: 10, playerName: 'Player 1' }
          ],
          score: 0
        };

        const changes = compareStates(state, state);

        expect(changes.players.moved).toHaveLength(0);
        expect(changes.players.joined).toHaveLength(0);
        expect(changes.players.left).toHaveLength(0);
        expect(changes.scoreChanged).toBe(false);
      });
    });

    describe('player moved', () => {
      it('should detect player movement', () => {
        const previousState = {
          players: [
            { playerId: 'player-1', x: 10, y: 10, playerName: 'Player 1' }
          ],
          score: 0
        };

        const currentState = {
          players: [
            { playerId: 'player-1', x: 11, y: 10, playerName: 'Player 1' }
          ],
          score: 0
        };

        const changes = compareStates(previousState, currentState);

        expect(changes.players.moved).toHaveLength(1);
        expect(changes.players.moved[0].playerId).toBe('player-1');
        expect(changes.players.moved[0].oldPos).toEqual({ x: 10, y: 10 });
        expect(changes.players.moved[0].newPos).toEqual({ x: 11, y: 10 });
        expect(changes.players.joined).toHaveLength(0);
        expect(changes.players.left).toHaveLength(0);
      });

      it('should detect vertical movement', () => {
        const previousState = {
          players: [
            { playerId: 'player-1', x: 10, y: 10, playerName: 'Player 1' }
          ],
          score: 0
        };

        const currentState = {
          players: [
            { playerId: 'player-1', x: 10, y: 11, playerName: 'Player 1' }
          ],
          score: 0
        };

        const changes = compareStates(previousState, currentState);

        expect(changes.players.moved).toHaveLength(1);
        expect(changes.players.moved[0].oldPos).toEqual({ x: 10, y: 10 });
        expect(changes.players.moved[0].newPos).toEqual({ x: 10, y: 11 });
      });

      it('should detect diagonal movement', () => {
        const previousState = {
          players: [
            { playerId: 'player-1', x: 10, y: 10, playerName: 'Player 1' }
          ],
          score: 0
        };

        const currentState = {
          players: [
            { playerId: 'player-1', x: 11, y: 11, playerName: 'Player 1' }
          ],
          score: 0
        };

        const changes = compareStates(previousState, currentState);

        expect(changes.players.moved).toHaveLength(1);
        expect(changes.players.moved[0].oldPos).toEqual({ x: 10, y: 10 });
        expect(changes.players.moved[0].newPos).toEqual({ x: 11, y: 11 });
      });
    });

    describe('player joined', () => {
      it('should detect new player', () => {
        const previousState = {
          players: [
            { playerId: 'player-1', x: 10, y: 10, playerName: 'Player 1' }
          ],
          score: 0
        };

        const currentState = {
          players: [
            { playerId: 'player-1', x: 10, y: 10, playerName: 'Player 1' },
            { playerId: 'player-2', x: 11, y: 11, playerName: 'Player 2' }
          ],
          score: 0
        };

        const changes = compareStates(previousState, currentState);

        expect(changes.players.joined).toHaveLength(1);
        expect(changes.players.joined[0].playerId).toBe('player-2');
        expect(changes.players.joined[0].pos).toEqual({ x: 11, y: 11 });
        expect(changes.players.joined[0].playerName).toBe('Player 2');
        expect(changes.players.moved).toHaveLength(0);
        expect(changes.players.left).toHaveLength(0);
      });
    });

    describe('player left', () => {
      it('should detect player leaving', () => {
        const previousState = {
          players: [
            { playerId: 'player-1', x: 10, y: 10, playerName: 'Player 1' },
            { playerId: 'player-2', x: 11, y: 11, playerName: 'Player 2' }
          ],
          score: 0
        };

        const currentState = {
          players: [
            { playerId: 'player-1', x: 10, y: 10, playerName: 'Player 1' }
          ],
          score: 0
        };

        const changes = compareStates(previousState, currentState);

        expect(changes.players.left).toHaveLength(1);
        expect(changes.players.left[0].playerId).toBe('player-2');
        expect(changes.players.left[0].pos).toEqual({ x: 11, y: 11 });
        expect(changes.players.moved).toHaveLength(0);
        expect(changes.players.joined).toHaveLength(0);
      });
    });

    describe('score changed', () => {
      it('should detect score change', () => {
        const previousState = {
          players: [],
          score: 0
        };

        const currentState = {
          players: [],
          score: 10
        };

        const changes = compareStates(previousState, currentState);

        expect(changes.scoreChanged).toBe(true);
      });

      it('should detect score unchanged', () => {
        const state = {
          players: [],
          score: 10
        };

        const changes = compareStates(state, state);

        expect(changes.scoreChanged).toBe(false);
      });

      it('should handle missing score (defaults to 0)', () => {
        const previousState = {
          players: [],
          score: 0
        };

        const currentState = {
          players: []
        };

        const changes = compareStates(previousState, currentState);

        expect(changes.scoreChanged).toBe(false);
      });
    });

    describe('multiple changes', () => {
      it('should detect multiple players moved', () => {
        const previousState = {
          players: [
            { playerId: 'player-1', x: 10, y: 10, playerName: 'Player 1' },
            { playerId: 'player-2', x: 11, y: 11, playerName: 'Player 2' }
          ],
          score: 0
        };

        const currentState = {
          players: [
            { playerId: 'player-1', x: 11, y: 10, playerName: 'Player 1' },
            { playerId: 'player-2', x: 12, y: 11, playerName: 'Player 2' }
          ],
          score: 0
        };

        const changes = compareStates(previousState, currentState);

        expect(changes.players.moved).toHaveLength(2);
        expect(changes.players.joined).toHaveLength(0);
        expect(changes.players.left).toHaveLength(0);
      });

      it('should detect mixed changes (moved, joined, left)', () => {
        const previousState = {
          players: [
            { playerId: 'player-1', x: 10, y: 10, playerName: 'Player 1' },
            { playerId: 'player-2', x: 11, y: 11, playerName: 'Player 2' }
          ],
          score: 0
        };

        const currentState = {
          players: [
            { playerId: 'player-1', x: 11, y: 10, playerName: 'Player 1' },
            { playerId: 'player-3', x: 12, y: 12, playerName: 'Player 3' }
          ],
          score: 5
        };

        const changes = compareStates(previousState, currentState);

        expect(changes.players.moved).toHaveLength(1);
        expect(changes.players.moved[0].playerId).toBe('player-1');
        expect(changes.players.joined).toHaveLength(1);
        expect(changes.players.joined[0].playerId).toBe('player-3');
        expect(changes.players.left).toHaveLength(1);
        expect(changes.players.left[0].playerId).toBe('player-2');
        expect(changes.scoreChanged).toBe(true);
      });
    });

    describe('edge cases', () => {
      it('should handle currentState === null', () => {
        const previousState = {
          players: [
            { playerId: 'player-1', x: 10, y: 10, playerName: 'Player 1' }
          ],
          score: 0
        };

        const changes = compareStates(previousState, null);

        expect(changes.players.left).toHaveLength(1);
        expect(changes.players.left[0].playerId).toBe('player-1');
        expect(changes.players.moved).toHaveLength(0);
        expect(changes.players.joined).toHaveLength(0);
      });

      it('should handle both states null', () => {
        const changes = compareStates(null, null);

        expect(changes.players.moved).toHaveLength(0);
        expect(changes.players.joined).toHaveLength(0);
        expect(changes.players.left).toHaveLength(0);
        expect(changes.scoreChanged).toBe(false);
      });

      it('should handle undefined states', () => {
        const changes = compareStates(undefined, undefined);

        expect(changes.players.moved).toHaveLength(0);
        expect(changes.players.joined).toHaveLength(0);
        expect(changes.players.left).toHaveLength(0);
      });

      it('should handle invalid positions gracefully', () => {
        const previousState = {
          players: [
            { playerId: 'player-1', x: 10, y: 10, playerName: 'Player 1' }
          ],
          score: 0
        };

        const currentState = {
          players: [
            { playerId: 'player-1', x: null, y: 10, playerName: 'Player 1' }
          ],
          score: 0
        };

        // Should not crash, but may produce unexpected results
        // This is acceptable for MVP - invalid positions are server's responsibility
        const changes = compareStates(previousState, currentState);

        expect(changes).toBeDefined();
        expect(changes.players.moved).toBeDefined();
      });
    });
  });
});
