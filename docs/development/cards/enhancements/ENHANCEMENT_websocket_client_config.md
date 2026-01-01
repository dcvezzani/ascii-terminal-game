# Enhancement: WebSocket Client Configuration

## Context

Currently, the WebSocket client (`WebSocketClient`) uses `serverConfig` to determine the connection URL and settings. This creates a dependency where the client needs to import server configuration, which is not ideal for separation of concerns.

**Location**:
- WebSocket client: `src/network/WebSocketClient.js` - constructor (line 16-19)
- Client config: `src/config/clientConfig.js` - currently has comment mentioning "WebSocket settings" but no actual configuration
- Server config: `src/config/serverConfig.js` - contains WebSocket server settings

**Current State**:
- `WebSocketClient` constructor uses `serverConfig.websocket.host` and `serverConfig.websocket.port` to build connection URL
- `WebSocketClient` uses `serverConfig.reconnection` settings for reconnection behavior
- `clientConfig.js` has a comment mentioning "WebSocket settings" but no actual WebSocket configuration section
- Client is tightly coupled to server configuration

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

## Problem

**Current Limitations**:

1. **Tight Coupling**: Client depends on server configuration, violating separation of concerns
2. **No Client-Side Control**: Client cannot configure its own connection settings independently
3. **Hardcoded Logic**: URL construction logic is embedded in WebSocketClient (e.g., `0.0.0.0` → `localhost` conversion)
4. **Inconsistent Configuration**: Client config file mentions WebSocket settings but doesn't provide them
5. **Testing Limitations**: Harder to test client with different server configurations
6. **Deployment Flexibility**: Cannot easily point client to different server instances without code changes

**Impact**:
- Client and server configurations are unnecessarily coupled
- Cannot configure client to connect to different servers without modifying code
- Makes testing and deployment more difficult
- Violates separation of concerns principle

## Desired Enhancement

Add WebSocket connection configuration to `clientConfig.js` so the client can configure its own connection settings independently of the server configuration.

### Requirements

1. **WebSocket Connection Settings**
   - Full URL configuration (e.g., `'ws://localhost:3000'`)
   - Simple approach: single URL property (no separate host/port/protocol)
   - Default: `'ws://localhost:3000'` for development
   - Support `ws://` protocol only (no `wss://` for now)

2. **Reconnection Settings**
   - Enable/disable reconnection
   - Maximum reconnection attempts
   - Initial retry delay between attempts
   - Exponential backoff implementation
   - Maximum retry delay cap for exponential backoff

3. **Environment Variable Support**
   - Use `dotenv` npm module for environment variable support
   - Environment variables override config file values
   - Support for `.env` files
   - Document all environment variable options

4. **Integration with WebSocketClient**
   - Update `WebSocketClient` to use `clientConfig` instead of `serverConfig`
   - **No backward compatibility** - clean break from `serverConfig`
   - Support URL override via constructor parameter (for testing)
   - Implement exponential backoff for reconnection retries

5. **Configuration Structure**
   - Add `websocket` section to `clientConfig.js` with URL property
   - Add `reconnection` section with all reconnection settings
   - Keep it simple and focused on client needs

## Technical Details

### Current Configuration Structure

**serverConfig.js**:
```javascript
export const serverConfig = {
  websocket: {
    enabled: true,
    port: 3000,
    host: '0.0.0.0',
    broadcastIntervals: { ... }
  },
  reconnection: {
    enabled: true,
    maxAttempts: 5,
    retryDelay: 1000
  }
};
```

**clientConfig.js** (current):
```javascript
export const clientConfig = {
  logging: { ... },
  prediction: { ... }
  // WebSocket settings mentioned in comment but not implemented
};
```

### Proposed Configuration Structure

**clientConfig.js** (enhanced):
```javascript
export const clientConfig = {
  logging: { ... },
  prediction: { ... },
  websocket: {
    url: 'ws://localhost:3000', // Full WebSocket URL (default: 'ws://localhost:3000')
    // Simple approach: only URL, no separate host/port/protocol
  },
  reconnection: {
    enabled: true, // Enable reconnection support
    maxAttempts: 5, // Maximum reconnection attempts
    retryDelay: 1000, // Initial retry delay in milliseconds (default: 1000ms)
    exponentialBackoff: true, // Use exponential backoff (default: true)
    maxRetryDelay: 30000, // Maximum retry delay when using exponential backoff (default: 30000ms)
  },
  // Note: Connection timeout handled by WebSocket library, no config needed
};
```

### URL Construction Logic

1. If `url` is provided to constructor → use it (overrides config, useful for testing)
2. Otherwise → use `clientConfig.websocket.url` from config
3. Environment variables (via dotenv) can override config values

### Environment Variable Support

Using `dotenv` npm module, support environment variables:
- `WEBSOCKET_URL` - Override WebSocket URL (e.g., `ws://example.com:3000`)
- `WEBSOCKET_RECONNECTION_ENABLED` - Enable/disable reconnection (true/false)
- `WEBSOCKET_RECONNECTION_MAX_ATTEMPTS` - Maximum reconnection attempts
- `WEBSOCKET_RECONNECTION_RETRY_DELAY` - Initial retry delay (milliseconds)
- `WEBSOCKET_RECONNECTION_EXPONENTIAL_BACKOFF` - Enable exponential backoff (true/false)
- `WEBSOCKET_RECONNECTION_MAX_RETRY_DELAY` - Maximum retry delay (milliseconds)

### Implementation Steps

1. **Update clientConfig.js**
   - Add `websocket` section with host, port, protocol, and optional URL
   - Add `reconnection` section with enabled, maxAttempts, retryDelay, etc.
   - Add `connection` section with timeout settings

2. **Update WebSocketClient.js**
   - Remove dependency on `serverConfig` (clean break, no backward compatibility)
   - Import `clientConfig` instead of `serverConfig`
   - Update constructor to use `clientConfig.websocket.url` for connection URL
   - Update reconnection logic to use `clientConfig.reconnection`
   - Implement exponential backoff for reconnection retries
   - Support URL override via constructor parameter (for testing)

3. **Add dotenv Support**
   - Install `dotenv` npm package (if not already installed)
   - Load environment variables at application startup
   - Environment variables override config values
   - Document environment variable options

4. **Update Tests**
   - Update existing tests to use `clientConfig` (remove `serverConfig` dependencies)
   - Add tests for URL from config
   - Add tests for reconnection settings from config
   - Add tests for exponential backoff behavior
   - Add tests for environment variable overrides

5. **Update Documentation**
   - Update README.md to document client WebSocket configuration
   - Document environment variable options
   - Update any relevant documentation about client configuration
   - Add example `.env` file or documentation

## Related Features

- **FEATURE_websocket_integration** - WebSocket integration feature that would benefit from client-side configuration
- **ENHANCEMENT_centralized_game_config** - Centralized configuration system (if applicable)

## Dependencies

- `clientConfig.js` - Configuration file that needs to be updated
- `WebSocketClient.js` - Client class that needs to use new configuration
- `dotenv` npm package - For environment variable support
- Existing configuration system structure

## Decisions Made

1. **Backward Compatibility**: ✅ **No backward compatibility** - Make clean break from `serverConfig`
   - Remove dependency on `serverConfig` in `WebSocketClient`
   - Simpler implementation without fallback logic
   - Cleaner separation of concerns

2. **URL Construction**: ✅ **Only URL method (simpler)**
   - Single `url` property in config (e.g., `'ws://localhost:3000'`)
   - No separate host/port/protocol properties
   - Simpler configuration and implementation

3. **Default Values**: ✅ **`localhost:3000` for development**
   - Default URL: `'ws://localhost:3000'`
   - Appropriate for local development
   - Can be overridden via environment variables for other environments

4. **Protocol Selection**: ✅ **Only `ws://` for now**
   - Keep it simple, no `wss://` support initially
   - Can be added later if needed
   - URL can be manually set to `wss://` if required

5. **Exponential Backoff**: ✅ **Yes, implement exponential backoff**
   - Better reconnection behavior under network issues
   - Prevents overwhelming server with rapid reconnection attempts
   - Configurable `maxRetryDelay` to cap exponential growth

6. **Connection Timeout**: ✅ **No, let WebSocket library handle it**
   - WebSocket library has built-in timeout handling
   - Avoids duplicating functionality
   - Simpler implementation

7. **Environment-Specific Config**: ✅ **Via environment variables using dotenv**
   - Use `dotenv` npm module for environment variable support
   - Allows different configs per environment without code changes
   - Environment variables override config file values
   - Supports `.env` files for local development

## Documentation

- **SPECS**: `docs/development/specs/websocket-client-config/websocket-client-config_SPECS.md` ✅ Created
- **GAMEPLAN**: `docs/development/gameplans/websocket-client-config/websocket-client-config_GAMEPLAN.md` ✅ Created

## Status

**Status**: 📋 READY FOR IMPLEMENTATION

**Priority**: MEDIUM

- Improves separation of concerns (client/server config independence)
- Makes testing and deployment more flexible
- Better aligns with configuration best practices
- Relatively straightforward implementation
- Low risk (can maintain backward compatibility)

## Notes

- This is a configuration and architecture improvement
- Clean break from `serverConfig` - no backward compatibility needed
- Makes client more flexible and easier to configure
- Environment variables via `dotenv` allow per-environment configuration
- Exponential backoff improves reconnection behavior under network issues
- Simple URL-only approach keeps configuration straightforward
- Consider adding validation for configuration values
- Document environment variable options in README
- May want to add example `.env` file or `.env.example` template

