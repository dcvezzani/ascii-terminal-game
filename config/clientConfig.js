import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

let config = null;

try {
  const configPath = join(__dirname, 'clientConfig.json');
  const configFile = readFileSync(configPath, 'utf-8');
  config = JSON.parse(configFile);
  if (!config.statusBar) {
    config.statusBar = { widthThreshold: 25 };
  }
  if (config.statusBar && config.statusBar.widthThreshold === undefined) {
    config.statusBar.widthThreshold = 25;
  }
} catch (error) {
  // Use defaults if config file doesn't exist
  config = {
    websocket: {
      url: 'ws://localhost:3000'
    },
    logging: {
      level: 'info'
    },
    rendering: {
      playerGlyph: '@',
      playerColor: '00FF00',
      spaceGlyph: '.',
      wallGlyph: '#'
    },
    prediction: {
      enabled: true,
      reconciliationInterval: 5000
    },
    statusBar: {
      widthThreshold: 25
    }
  };
}

export default config;
