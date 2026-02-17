import serverConfig from '../../config/serverConfig.js';
import { configureLogger } from '../utils/logger.js';
import logger from '../utils/logger.js';
import Server from './server.js';
import { parseBoardPath } from './parseBoardArgv.js';
import { loadBoardFromFiles } from '../board/boardLoader.js';
import Board from '../game/Board.js';
import Game from '../game/Game.js';

// Configure logger for server mode (console + files)
configureLogger('server');

// Set logger level from config (may be overridden when startServer is called with config)
logger.level = serverConfig.logging.level;

/**
 * Start the WebSocket server with board loaded from JSON.
 * @param {number} [port] - Optional port override
 * @param {string} [boardPath] - Optional board file path; when omitted, uses parseBoardPath(process.argv) or config default
 * @param {object} [injectedConfig] - Optional server config (when provided, used instead of repo config; used by CLI)
 * @returns {Promise<Server|null>} The started Server, or null if board load failed (process exits)
 */
async function startServer(port, boardPath, injectedConfig) {
  const config = injectedConfig ?? serverConfig;
  if (injectedConfig) logger.level = config.logging.level;

  const serverPort = port || config.websocket.port;
  const path =
    boardPath ?? parseBoardPath(process.argv, config.board?.defaultPath);

  let boardData;
  try {
    boardData = loadBoardFromFiles(path);
  } catch (err) {
    logger.error(err.message);
    process.exit(1);
    return null;
  }

  const board = new Board(boardData);
  const game = new Game(board);

  const maxCount = config.spawnPoints?.maxCount ?? 25;
  const rawSpawns = boardData.spawnPoints ?? [];
  const spawnList =
    rawSpawns.length > 0
      ? rawSpawns.slice(0, maxCount)
      : [
          {
            x: Math.floor(board.width / 2),
            y: Math.floor(board.height / 2)
          }
        ];
  const spawnConfig = {
    clearRadius: config.spawnPoints?.clearRadius ?? 3,
    waitMessage:
      config.spawnPoints?.waitMessage ??
      'Thank you for waiting. A spawn point is being selected for you.'
  };

  const server = new Server(serverPort, game, {
    spawnList,
    spawnConfig
  });

  // Set up graceful shutdown
  const shutdown = async () => {
    logger.info('Shutting down server...');
    await server.stop();
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);

  try {
    await server.start();
    logger.info(`Server started on port ${serverPort}`);
    
    // Returning the server so that it may be mocked for tests
    return server;
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
    return null;
  }
}

// Start server if this file is run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  startServer();
}

export { startServer };
export default startServer;
