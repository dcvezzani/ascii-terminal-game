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

// Set logger level from config
logger.level = serverConfig.logging.level;

/**
 * Start the WebSocket server with board loaded from JSON.
 * @param {number} [port] - Optional port override
 * @param {string} [boardPath] - Optional board file path; when omitted, uses parseBoardPath(process.argv)
 * @returns {Promise<Server|null>} The started Server, or null if board load failed (process exits)
 */
async function startServer(port, boardPath) {
  const serverPort = port || serverConfig.websocket.port;
  const path = boardPath ?? parseBoardPath(process.argv);

  let boardData;
  try {
    boardData = loadBoardFromFiles(path);
  } catch (err) {
    logger.error(err.message);
    process.exit(1);
    return null;
  }

  const board = new Board(boardData.width, boardData.height);
  board.initializeFromGrid(boardData.grid);
  const game = new Game(boardData.width, boardData.height, board);
  const server = new Server(serverPort, game);

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
