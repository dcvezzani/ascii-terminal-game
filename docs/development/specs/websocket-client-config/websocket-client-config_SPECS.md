# Specification: WebSocket Client Configuration

## Overview

This specification details the implementation of WebSocket connection configuration in the client configuration file, allowing the client to configure its own connection settings independently of the server configuration. This improves separation of concerns and provides flexibility for testing and deployment.

**Reference Card**: `docs/development/cards/enhancements/ENHANCEMENT_websocket_client_config.md`

## Goals

1. Move WebSocket connection configuration from server config to client config
2. Enable client-side control over WebSocket connection settings
3. Support environment variable overrides via dotenv
4. Implement exponential backoff for reconnection retries
5. Remove tight coupling between client and server configuration
6. Improve testing and deployment flexibility

## Current State

**Current Architecture**:

- `src/config/clientConfig.js` - Client configuration
  - Contains logging and prediction settings
  - Has comment mentioning "WebSocket settings" but no actual configuration
- `src/config/serverConfig.js` - Server configuration
  - Contains WebSocket server settings (host, port, broadcast intervals)
  - Contains reconnection settings (enabled, maxAttempts, retryDelay)
- `src/network/WebSocketClient.js` - WebSocket client class
  - Imports `serverConfig` to get connection URL and reconnection settings
  - Constructs URL from `serverConfig.websocket.host` and `serverConfig.websocket.port`
  - Uses `serverConfig.reconnection` for reconnection behavior
  - Hardcoded logic: `0.0.0.0` → `localhost` conversion

**Current Code**:

```javascript
// In WebSocketClient.js
import { serverConfig } from '../config/serverConfig.js';

constructor(url = null) {
  this.url =
    url ||
    `ws://${serverConfig.websocket.host === '0.0.0.0' ? 'localhost' : serverConfig.websocket.host}:${serverConfig.websocket.port}`;
  // ...
  // Uses serverConfig.reconnection.enabled, maxAttempts, retryDelay
}
```

**Current Limitations**:

- Client depends on server configuration, violating separation of concerns
- No client-side control over connection settings
- Hardcoded URL construction logic
- Cannot easily point client to different servers without code changes
- Makes testing and deployment more difficult

## Target State

**New Architecture**:

- `src/config/clientConfig.js` - Enhanced client configuration
  - New `websocket` section with URL property
  - New `reconnection` section with all reconnection settings
  - Environment variable support via dotenv
- `src/network/WebSocketClient.js` - Updated WebSocket client class
  - Imports `clientConfig` instead of `serverConfig`
  - Uses `clientConfig.websocket.url` for connection URL
  - Uses `clientConfig.reconnection` for reconnection behavior
  - Implements exponential backoff for reconnection retries
  - No dependency on `serverConfig`
- Environment variable support
  - Uses `dotenv` npm module
  - Environment variables override config file values
  - Supports `.env` files for local development

**New Configuration Flow**:

1. Application startup: Load environment variables via dotenv
2. Load `clientConfig.js` with default values
3. Environment variables override config values
4. `WebSocketClient` uses `clientConfig` for all settings
5. Constructor parameter can override URL (for testing)

**Benefits**:

- Clean separation of concerns (client/server config independence)
- Flexible configuration via config file and environment variables
- Better testing support (easy to override settings)
- Improved deployment flexibility (different configs per environment)
- Exponential backoff improves reconnection behavior

## Functional Requirements

### FR1: WebSocket Connection Configuration

**Requirement**: Client must be able to configure WebSocket connection URL independently of server configuration.

**Details**:

- Configuration in `clientConfig.websocket.url`
- Single URL property (no separate host/port/protocol)
- Default value: `'ws://localhost:3000'`
- Support `ws://` protocol only (no `wss://` for now)
- URL can be overridden via constructor parameter (for testing)
- Environment variable `WEBSOCKET_URL` can override config value

**Configuration Structure**:

```javascript
websocket: {
  url: 'ws://localhost:3000', // Full WebSocket URL (default: 'ws://localhost:3000')
}
```

**URL Resolution Priority**:

1. Constructor parameter (if provided) - highest priority
2. Environment variable `WEBSOCKET_URL` - second priority
3. Config file `clientConfig.websocket.url` - default/fallback

**Acceptance Criteria**:

- [ ] `clientConfig.websocket.url` exists with default value
- [ ] `WebSocketClient` uses `clientConfig.websocket.url` for connection
- [ ] Constructor parameter overrides config URL
- [ ] Environment variable `WEBSOCKET_URL` overrides config URL
- [ ] Default URL is `'ws://localhost:3000'`
- [ ] No dependency on `serverConfig` for URL

### FR2: Reconnection Configuration

**Requirement**: Client must be able to configure reconnection behavior independently of server configuration.

**Details**:

- Configuration in `clientConfig.reconnection`
- Enable/disable reconnection
- Maximum reconnection attempts
- Initial retry delay
- Exponential backoff enabled by default
- Maximum retry delay cap for exponential backoff

**Configuration Structure**:

```javascript
reconnection: {
  enabled: true, // Enable reconnection support (default: true)
  maxAttempts: 5, // Maximum reconnection attempts (default: 5)
  retryDelay: 1000, // Initial retry delay in milliseconds (default: 1000ms)
  exponentialBackoff: true, // Use exponential backoff (default: true)
  maxRetryDelay: 30000, // Maximum retry delay when using exponential backoff (default: 30000ms)
}
```

**Exponential Backoff Algorithm**:

- Initial delay: `retryDelay` (e.g., 1000ms)
- Each attempt: delay = `retryDelay * (2 ^ attemptNumber)`
- Capped at: `maxRetryDelay` (e.g., 30000ms)
- Example: 1000ms → 2000ms → 4000ms → 8000ms → 16000ms → 30000ms (capped)

**Environment Variables**:

- `WEBSOCKET_RECONNECTION_ENABLED` - Enable/disable (true/false)
- `WEBSOCKET_RECONNECTION_MAX_ATTEMPTS` - Maximum attempts (number)
- `WEBSOCKET_RECONNECTION_RETRY_DELAY` - Initial retry delay (milliseconds)
- `WEBSOCKET_RECONNECTION_EXPONENTIAL_BACKOFF` - Enable exponential backoff (true/false)
- `WEBSOCKET_RECONNECTION_MAX_RETRY_DELAY` - Maximum retry delay (milliseconds)

**Acceptance Criteria**:

- [ ] `clientConfig.reconnection` section exists with all settings
- [ ] `WebSocketClient` uses `clientConfig.reconnection` for reconnection behavior
- [ ] Exponential backoff is implemented and working
- [ ] Retry delays increase exponentially (capped at maxRetryDelay)
- [ ] Environment variables override config values
- [ ] No dependency on `serverConfig` for reconnection settings

### FR3: Environment Variable Support

**Requirement**: Client must support environment variable overrides via dotenv.

**Details**:

- Use `dotenv` npm module for environment variable support
- Load environment variables at application startup
- Environment variables override config file values
- Support `.env` files for local development
- Document all environment variable options

**Environment Variables**:

- `WEBSOCKET_URL` - WebSocket connection URL
- `WEBSOCKET_RECONNECTION_ENABLED` - Enable/disable reconnection
- `WEBSOCKET_RECONNECTION_MAX_ATTEMPTS` - Maximum reconnection attempts
- `WEBSOCKET_RECONNECTION_RETRY_DELAY` - Initial retry delay (milliseconds)
- `WEBSOCKET_RECONNECTION_EXPONENTIAL_BACKOFF` - Enable exponential backoff
- `WEBSOCKET_RECONNECTION_MAX_RETRY_DELAY` - Maximum retry delay (milliseconds)

**Loading Order**:

1. Load config file with default values
2. Load environment variables (via dotenv)
3. Override config values with environment variables (if present)

**Acceptance Criteria**:

- [ ] `dotenv` package is installed and configured
- [ ] Environment variables are loaded at application startup
- [ ] Environment variables override config file values
- [ ] `.env` files are supported for local development
- [ ] All environment variables are documented

### FR4: WebSocketClient Integration

**Requirement**: `WebSocketClient` must use `clientConfig` instead of `serverConfig`.

**Details**:

- Remove dependency on `serverConfig` (clean break, no backward compatibility)
- Import `clientConfig` instead of `serverConfig`
- Use `clientConfig.websocket.url` for connection URL
- Use `clientConfig.reconnection` for reconnection settings
- Implement exponential backoff algorithm
- Support URL override via constructor parameter (for testing)

**Constructor Behavior**:

```javascript
constructor(url = null) {
  // Priority: constructor param > env var > config file
  this.url = url || process.env.WEBSOCKET_URL || clientConfig.websocket.url;
  // ...
}
```

**Reconnection Behavior**:

- Use `clientConfig.reconnection.enabled` to check if reconnection is enabled
- Use `clientConfig.reconnection.maxAttempts` for attempt limit
- Use exponential backoff if `clientConfig.reconnection.exponentialBackoff` is true
- Calculate delay: `Math.min(retryDelay * Math.pow(2, attemptNumber), maxRetryDelay)`

**Acceptance Criteria**:

- [ ] `WebSocketClient` imports `clientConfig` instead of `serverConfig`
- [ ] No references to `serverConfig` in `WebSocketClient`
- [ ] URL is constructed from `clientConfig.websocket.url`
- [ ] Reconnection uses `clientConfig.reconnection` settings
- [ ] Exponential backoff is implemented correctly
- [ ] Constructor parameter overrides config URL

## Technical Requirements

### TR1: Client Configuration Structure

**Requirement**: Update `clientConfig.js` with WebSocket and reconnection settings.

**Details**:

- Add `websocket` section with `url` property
- Add `reconnection` section with all reconnection settings
- Set appropriate default values
- Follow existing config structure patterns

**Configuration File**:

```javascript
export const clientConfig = {
  logging: {
    level: 'debug',
    transports: ['file'],
    file: {
      enabled: true,
      path: './logs/client.log',
      maxSize: '20m',
      maxFiles: 5,
    },
  },
  prediction: {
    enabled: true,
    reconciliationInterval: 5000,
  },
  websocket: {
    url: 'ws://localhost:3000', // Full WebSocket URL (default: 'ws://localhost:3000')
  },
  reconnection: {
    enabled: true, // Enable reconnection support (default: true)
    maxAttempts: 5, // Maximum reconnection attempts (default: 5)
    retryDelay: 1000, // Initial retry delay in milliseconds (default: 1000ms)
    exponentialBackoff: true, // Use exponential backoff (default: true)
    maxRetryDelay: 30000, // Maximum retry delay when using exponential backoff (default: 30000ms)
  },
};
```

**Acceptance Criteria**:

- [ ] `websocket` section added to `clientConfig.js`
- [ ] `reconnection` section added to `clientConfig.js`
- [ ] Default values are appropriate for development
- [ ] Configuration structure follows existing patterns

### TR2: Environment Variable Integration

**Requirement**: Integrate dotenv for environment variable support.

**Details**:

- Install `dotenv` npm package (if not already installed)
- Load environment variables at application startup
- Override config values with environment variables
- Support `.env` files

**Loading Implementation**:

```javascript
// At application startup (e.g., in index.js or main entry point)
import dotenv from 'dotenv';
dotenv.config(); // Load .env file

// In clientConfig.js or a config loader
export const clientConfig = {
  // ... existing config ...
  websocket: {
    url: process.env.WEBSOCKET_URL || 'ws://localhost:3000',
  },
  reconnection: {
    enabled: process.env.WEBSOCKET_RECONNECTION_ENABLED === 'true' || 
             (process.env.WEBSOCKET_RECONNECTION_ENABLED !== 'false' && true),
    maxAttempts: parseInt(process.env.WEBSOCKET_RECONNECTION_MAX_ATTEMPTS) || 5,
    retryDelay: parseInt(process.env.WEBSOCKET_RECONNECTION_RETRY_DELAY) || 1000,
    exponentialBackoff: process.env.WEBSOCKET_RECONNECTION_EXPONENTIAL_BACKOFF === 'true' || 
                        (process.env.WEBSOCKET_RECONNECTION_EXPONENTIAL_BACKOFF !== 'false' && true),
    maxRetryDelay: parseInt(process.env.WEBSOCKET_RECONNECTION_MAX_RETRY_DELAY) || 30000,
  },
};
```

**Acceptance Criteria**:

- [ ] `dotenv` package is installed
- [ ] Environment variables are loaded at startup
- [ ] Config values are overridden by environment variables
- [ ] `.env` files are supported

### TR3: WebSocketClient Updates

**Requirement**: Update `WebSocketClient` to use `clientConfig` and implement exponential backoff.

**Details**:

- Remove `serverConfig` import
- Import `clientConfig` instead
- Update constructor to use `clientConfig.websocket.url`
- Update reconnection logic to use `clientConfig.reconnection`
- Implement exponential backoff algorithm

**Exponential Backoff Implementation**:

```javascript
calculateRetryDelay(attemptNumber) {
  const { retryDelay, exponentialBackoff, maxRetryDelay } = clientConfig.reconnection;
  
  if (!exponentialBackoff) {
    return retryDelay;
  }
  
  const calculatedDelay = retryDelay * Math.pow(2, attemptNumber);
  return Math.min(calculatedDelay, maxRetryDelay);
}
```

**Reconnection Logic**:

```javascript
async attemptReconnect() {
  if (this.reconnectAttempts >= clientConfig.reconnection.maxAttempts) {
    // Max attempts reached
    return;
  }
  
  const delay = this.calculateRetryDelay(this.reconnectAttempts);
  // Wait for delay, then attempt reconnection
}
```

**Acceptance Criteria**:

- [ ] `serverConfig` import removed from `WebSocketClient`
- [ ] `clientConfig` imported and used
- [ ] URL construction uses `clientConfig.websocket.url`
- [ ] Reconnection uses `clientConfig.reconnection` settings
- [ ] Exponential backoff is implemented correctly
- [ ] Retry delays increase exponentially (capped)

### TR4: Testing Updates

**Requirement**: Update tests to use `clientConfig` instead of `serverConfig`.

**Details**:

- Update existing `WebSocketClient` tests
- Remove `serverConfig` dependencies from tests
- Add tests for URL from config
- Add tests for reconnection settings from config
- Add tests for exponential backoff behavior
- Add tests for environment variable overrides

**Test Cases**:

- URL from config file
- URL from constructor parameter (override)
- URL from environment variable
- Reconnection enabled/disabled from config
- Reconnection max attempts from config
- Exponential backoff calculation
- Exponential backoff capping at maxRetryDelay
- Environment variable overrides

**Acceptance Criteria**:

- [ ] All existing tests updated to use `clientConfig`
- [ ] Tests for URL configuration
- [ ] Tests for reconnection configuration
- [ ] Tests for exponential backoff
- [ ] Tests for environment variable overrides
- [ ] All tests pass

### TR5: Documentation Updates

**Requirement**: Update documentation to reflect new configuration approach.

**Details**:

- Update README.md with client WebSocket configuration
- Document all environment variable options
- Add example `.env` file or `.env.example` template
- Update any relevant documentation about client configuration

**Documentation Sections**:

- Client WebSocket Configuration
- Environment Variables
- Example `.env` file
- Configuration precedence (constructor > env var > config file)

**Acceptance Criteria**:

- [ ] README.md updated with client WebSocket configuration
- [ ] Environment variables documented
- [ ] Example `.env` file or template provided
- [ ] Configuration precedence documented

## Implementation Details

### Configuration File Structure

**clientConfig.js** (enhanced):

```javascript
/**
 * Client configuration for the game client
 * Controls client-side behavior, logging, WebSocket settings, and reconnection
 */

export const clientConfig = {
  logging: {
    level: 'debug',
    transports: ['file'],
    file: {
      enabled: true,
      path: './logs/client.log',
      maxSize: '20m',
      maxFiles: 5,
    },
  },
  prediction: {
    enabled: true,
    reconciliationInterval: 5000,
  },
  websocket: {
    url: process.env.WEBSOCKET_URL || 'ws://localhost:3000',
  },
  reconnection: {
    enabled: process.env.WEBSOCKET_RECONNECTION_ENABLED === 'true' || 
             (process.env.WEBSOCKET_RECONNECTION_ENABLED !== 'false' && true),
    maxAttempts: parseInt(process.env.WEBSOCKET_RECONNECTION_MAX_ATTEMPTS) || 5,
    retryDelay: parseInt(process.env.WEBSOCKET_RECONNECTION_RETRY_DELAY) || 1000,
    exponentialBackoff: process.env.WEBSOCKET_RECONNECTION_EXPONENTIAL_BACKOFF === 'true' || 
                        (process.env.WEBSOCKET_RECONNECTION_EXPONENTIAL_BACKOFF !== 'false' && true),
    maxRetryDelay: parseInt(process.env.WEBSOCKET_RECONNECTION_MAX_RETRY_DELAY) || 30000,
  },
};
```

### WebSocketClient Constructor

**Updated Constructor**:

```javascript
import { clientConfig } from '../config/clientConfig.js';

export class WebSocketClient {
  constructor(url = null) {
    // URL resolution priority: constructor param > env var > config file
    this.url = url || process.env.WEBSOCKET_URL || clientConfig.websocket.url;
    
    this.ws = null;
    this.connected = false;
    this.clientId = null;
    this.playerId = null;
    this.playerName = null;

    // Reconnection state
    this.reconnecting = false;
    this.reconnectAttempts = 0;
    this.reconnectTimer = null;
    this.manualDisconnect = false;

    // Callbacks
    this.callbacks = {
      onConnect: null,
      onDisconnect: null,
      onStateUpdate: null,
      onError: null,
      onPlayerJoined: null,
      onPlayerLeft: null,
      onReconnecting: null,
      onReconnected: null,
      onServerRestart: null,
    };
  }

  /**
   * Calculate retry delay for reconnection attempt
   * Uses exponential backoff if enabled
   * @param {number} attemptNumber - Current reconnection attempt number (0-based)
   * @returns {number} Delay in milliseconds
   */
  calculateRetryDelay(attemptNumber) {
    const { retryDelay, exponentialBackoff, maxRetryDelay } = clientConfig.reconnection;
    
    if (!exponentialBackoff) {
      return retryDelay;
    }
    
    const calculatedDelay = retryDelay * Math.pow(2, attemptNumber);
    return Math.min(calculatedDelay, maxRetryDelay);
  }

  /**
   * Attempt to reconnect to the WebSocket server
   * Uses exponential backoff if enabled
   */
  async attemptReconnect() {
    if (!clientConfig.reconnection.enabled) {
      return;
    }

    if (this.reconnectAttempts >= clientConfig.reconnection.maxAttempts) {
      // Max attempts reached
      if (this.callbacks.onDisconnect) {
        this.callbacks.onDisconnect();
      }
      return;
    }

    this.reconnecting = true;
    const delay = this.calculateRetryDelay(this.reconnectAttempts);
    
    if (this.callbacks.onReconnecting) {
      this.callbacks.onReconnecting({
        attempt: this.reconnectAttempts + 1,
        maxAttempts: clientConfig.reconnection.maxAttempts,
        delay,
      });
    }

    this.reconnectTimer = setTimeout(async () => {
      this.reconnectAttempts++;
      try {
        await this.connect();
        this.reconnecting = false;
        this.reconnectAttempts = 0;
        if (this.callbacks.onReconnected) {
          this.callbacks.onReconnected();
        }
      } catch (error) {
        // Connection failed, will retry again
        await this.attemptReconnect();
      }
    }, delay);
  }
  
  // ... rest of WebSocketClient methods ...
}
```

### Environment Variable Support

**Application Startup** (e.g., in `src/index.js` or main entry point):

```javascript
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

// Rest of application initialization...
```

**Example `.env` file**:

```env
# WebSocket Configuration
WEBSOCKET_URL=ws://localhost:3000

# Reconnection Settings
WEBSOCKET_RECONNECTION_ENABLED=true
WEBSOCKET_RECONNECTION_MAX_ATTEMPTS=5
WEBSOCKET_RECONNECTION_RETRY_DELAY=1000
WEBSOCKET_RECONNECTION_EXPONENTIAL_BACKOFF=true
WEBSOCKET_RECONNECTION_MAX_RETRY_DELAY=30000
```

### Exponential Backoff Examples

**With Exponential Backoff** (retryDelay=1000, maxRetryDelay=30000):

- Attempt 1: 1000ms delay
- Attempt 2: 2000ms delay
- Attempt 3: 4000ms delay
- Attempt 4: 8000ms delay
- Attempt 5: 16000ms delay
- Attempt 6+: 30000ms delay (capped)

**Without Exponential Backoff** (retryDelay=1000):

- All attempts: 1000ms delay

## Testing Requirements

### Unit Tests

- `clientConfig.js`: Configuration structure and default values
- `WebSocketClient`: URL construction from config
- `WebSocketClient`: Reconnection settings from config
- `WebSocketClient`: Exponential backoff calculation
- `WebSocketClient`: Retry delay capping

### Integration Tests

- Environment variable overrides
- Constructor parameter overrides
- Configuration precedence (constructor > env var > config)
- Reconnection behavior with exponential backoff
- Reconnection behavior without exponential backoff

### Test Cases

**URL Configuration**:
- Default URL from config
- URL from constructor parameter
- URL from environment variable
- Constructor parameter overrides environment variable
- Constructor parameter overrides config file

**Reconnection Configuration**:
- Reconnection enabled/disabled from config
- Max attempts from config
- Retry delay from config
- Exponential backoff enabled/disabled
- Max retry delay capping

**Exponential Backoff**:
- First attempt uses initial retry delay
- Subsequent attempts double the delay
- Delay is capped at maxRetryDelay
- Without exponential backoff, all delays are the same

**Environment Variables**:
- All environment variables override config values
- Missing environment variables use config defaults
- Boolean environment variables (true/false strings)
- Numeric environment variables (parseInt)

## Acceptance Criteria

### Overall

- [ ] WebSocket connection configuration moved to `clientConfig.js`
- [ ] `WebSocketClient` uses `clientConfig` instead of `serverConfig`
- [ ] No dependency on `serverConfig` in `WebSocketClient`
- [ ] Environment variable support via dotenv
- [ ] Exponential backoff implemented for reconnection
- [ ] All tests pass
- [ ] Documentation updated

### Configuration

- [ ] `clientConfig.websocket.url` exists with default value
- [ ] `clientConfig.reconnection` section exists with all settings
- [ ] Default values are appropriate for development
- [ ] Environment variables override config values

### Functionality

- [ ] URL is constructed from `clientConfig.websocket.url`
- [ ] Constructor parameter overrides config URL
- [ ] Reconnection uses `clientConfig.reconnection` settings
- [ ] Exponential backoff works correctly
- [ ] Retry delays increase exponentially (capped)

### Testing

- [ ] All existing tests updated
- [ ] New tests for configuration
- [ ] New tests for exponential backoff
- [ ] New tests for environment variables
- [ ] All tests pass

### Documentation

- [ ] README.md updated
- [ ] Environment variables documented
- [ ] Example `.env` file provided
- [ ] Configuration precedence documented

## Dependencies

- `dotenv` npm package - For environment variable support
- `clientConfig.js` - Configuration file
- `WebSocketClient.js` - Client class to update
- Existing configuration system structure

## Related Features

- **FEATURE_websocket_integration** - WebSocket integration feature
- **ENHANCEMENT_centralized_game_config** - Centralized configuration system (if applicable)

## Future Enhancements

- Support for `wss://` protocol (secure WebSocket)
- Connection timeout configuration (if needed)
- Per-environment configuration files (development, production, etc.)
- Configuration validation
- Configuration schema/documentation

