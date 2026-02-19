import { describe, it, expect, vi, beforeEach } from 'vitest';
import { startupClear } from '../../src/utils/terminal.js';

describe('terminal', () => {
  describe('startupClear', () => {
    it('writes rows newlines when stream is TTY with rows', async () => {
      const writes = [];
      const stream = {
        isTTY: true,
        rows: 24,
        write(chunk, encoding, callback) {
          writes.push(chunk);
          if (typeof encoding === 'function') {
            encoding();
          } else if (callback) {
            callback();
          }
          return true;
        }
      };
      await startupClear(stream);
      expect(writes.length).toBe(1);
      expect(writes[0]).toBe('\n'.repeat(24));
    });

    it('waits for drain when write returns false', async () => {
      const writes = [];
      let drainHandler;
      const stream = {
        isTTY: true,
        rows: 10,
        write(chunk, encoding, callback) {
          writes.push(chunk);
          if (typeof encoding === 'function') {
            encoding();
          } else if (callback) {
            callback();
          }
          return false; // backpressure
        },
        once(event, handler) {
          if (event === 'drain') {
            drainHandler = handler;
          }
        }
      };
      const p = startupClear(stream);
      expect(drainHandler).toBeDefined();
      drainHandler();
      await p;
      expect(writes[0]).toBe('\n'.repeat(10));
    });

    it('is no-op when stream is not TTY', async () => {
      const stream = {
        isTTY: false,
        rows: 24,
        write: vi.fn()
      };
      await startupClear(stream);
      expect(stream.write).not.toHaveBeenCalled();
    });

    it('is no-op when stream has no rows', async () => {
      const stream = {
        isTTY: true,
        rows: undefined,
        write: vi.fn()
      };
      await startupClear(stream);
      expect(stream.write).not.toHaveBeenCalled();
    });
  });
});
