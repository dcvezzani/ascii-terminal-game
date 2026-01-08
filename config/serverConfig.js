import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

let config = null;

try {
  const configPath = join(__dirname, 'serverConfig.json');
  const configFile = readFileSync(configPath, 'utf-8');
  config = JSON.parse(configFile);
} catch (error) {
  // Use defaults if config file doesn't exist
  config = {
    websocket: {
      enabled: true,
      port: 3000,
      host: '0.0.0.0'
    },
    logging: {
      level: 'info'
    }
  };
}

export default config;
