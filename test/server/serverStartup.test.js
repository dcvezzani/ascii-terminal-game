import { describe, it, expect, afterEach, vi } from 'vitest';
import { startServer } from '../../src/server/index.js';

describe('Server startup with board from JSON', () => {
  const TEST_PORT = 3010;
  let server;

  afterEach(async () => {
    if (server) {
      await server.stop();
      server = null;
    }
  });

  it('loads board from valid path and starts server with that game', async () => {
    const boardPath = 'test/fixtures/board-loader/valid-for-parse.json';
    server = await startServer(TEST_PORT, boardPath);

    expect(server).toBeDefined();
    expect(server.gameServer).toBeDefined();
    expect(server.gameServer.game.board.width).toBe(2);
    expect(server.gameServer.game.board.height).toBe(2);
    const state = server.gameServer.serializeState();
    expect(state.board.grid).toEqual([['#', '#'], ['#', '#']]);
  });

  it('on missing board file: logs error and exits with code 1', async () => {
    const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => {});
    const boardPath = 'boards/nonexistent-board-file.json';

    await startServer(TEST_PORT, boardPath);

    expect(exitSpy).toHaveBeenCalledWith(1);
    exitSpy.mockRestore();
  });
});
