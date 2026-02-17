/**
 * Default config objects for CLI when .ascii-tag/client.json or server.json is missing.
 * Client websocket.url port must match server websocket.port.
 */

const DEFAULT_SERVER_PORT = 3000;

export function getDefaultServerConfig() {
  return {
    websocket: { enabled: true, port: DEFAULT_SERVER_PORT, host: '0.0.0.0' },
    logging: { level: 'info' },
    board: { defaultPath: 'boards/classic.json' },
    spawnPoints: {
      maxCount: 25,
      clearRadius: 3,
      waitMessage:
        'Thank you for waiting. A spawn point is being selected for you.'
    }
  };
}

export function getDefaultClientConfig() {
  const server = getDefaultServerConfig();
  return {
    websocket: { url: `ws://localhost:${server.websocket.port}` },
    logging: { level: 'debug' },
    rendering: {
      playerGlyph: '☻',
      spaceGlyph: ' ',
      wallGlyph: '#',
      playerColor: '00FF00',
      centerBoard: true,
      resizeDebounceMs: 200
    },
    prediction: { enabled: true, reconciliationInterval: 5000 },
    statusBar: { widthThreshold: 25 }
  };
}
