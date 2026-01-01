# Gameplan: WebSocket Client Configuration

**Reference Card**: `docs/development/cards/enhancements/ENHANCEMENT_websocket_client_config.md`  
**Reference Specs**: `docs/development/specs/websocket-client-config/websocket-client-config_SPECS.md`

## Overview

This gameplan implements WebSocket connection configuration in the client configuration file, allowing the client to configure its own connection settings independently of the server configuration. The implementation includes environment variable support via dotenv and exponential backoff for reconnection retries.

## Progress Summary

- ✅ **Phase 1: Add dotenv Support** - COMPLETE
- ✅ **Phase 2: Update Client Configuration** - COMPLETE
- ✅ **Phase 3: Update WebSocketClient** - COMPLETE
- ⏳ **Phase 3: Update WebSocketClient** - NOT STARTED
- ⏳ **Phase 4: Implement Exponential Backoff** - NOT STARTED
- ⏳ **Phase 5: Update Tests** - NOT STARTED
- ⏳ **Phase 6: Update Documentation** - NOT STARTED

## Prerequisites

- Node.js project with ES Modules
- Existing `clientConfig.js` file
- Existing `WebSocketClient.js` class
- Understanding of dotenv package

## Phase 1: Add dotenv Support (~15 minutes)

**Goal**: Set up dotenv for environment variable support.

**Tasks**:
- [x] Check if `dotenv` is already installed in `package.json`
- [x] If not installed, install `dotenv` package: `npm install dotenv`
- [x] Identify application entry point (e.g., `src/index.js`, `src/modes/networkedMode.js`)
- [x] Add dotenv import and config call at application startup
  ```javascript
  import dotenv from 'dotenv';
  dotenv.config(); // Load .env file
  ```
- [x] Verify dotenv is loaded before any config files are imported
- [x] Test that environment variables can be accessed via `process.env`
- [x] Commit: "Enhancement: Add dotenv support for environment variables"

**Verification Checklist**:
- [x] `dotenv` package is installed
- [x] `dotenv.config()` is called at application startup
- [x] Environment variables are accessible via `process.env`
- [x] `.env` files are supported

**Acceptance Criteria**:
- [ ] dotenv package is installed
- [ ] Environment variables are loaded at application startup
- [ ] Environment variables can be accessed in code

## Phase 2: Update Client Configuration (~20 minutes)

**Goal**: Add WebSocket and reconnection configuration to `clientConfig.js`.

**Tasks**:
- [x] Open `src/config/clientConfig.js`
- [x] Add `websocket` section with `url` property
  - Default: `'ws://localhost:3000'`
  - Support environment variable override: `process.env.WEBSOCKET_URL || 'ws://localhost:3000'`
- [x] Add `reconnection` section with all settings
  - `enabled`: `process.env.WEBSOCKET_RECONNECTION_ENABLED === 'true' || (process.env.WEBSOCKET_RECONNECTION_ENABLED !== 'false' && true)`
  - `maxAttempts`: `parseInt(process.env.WEBSOCKET_RECONNECTION_MAX_ATTEMPTS) || 5`
  - `retryDelay`: `parseInt(process.env.WEBSOCKET_RECONNECTION_RETRY_DELAY) || 1000`
  - `exponentialBackoff`: `process.env.WEBSOCKET_RECONNECTION_EXPONENTIAL_BACKOFF === 'true' || (process.env.WEBSOCKET_RECONNECTION_EXPONENTIAL_BACKOFF !== 'false' && true)`
  - `maxRetryDelay`: `parseInt(process.env.WEBSOCKET_RECONNECTION_MAX_RETRY_DELAY) || 30000`
- [x] Update file header comment to mention WebSocket settings
- [x] Create unit tests for `clientConfig.js`
  - Test default values
  - Test environment variable overrides (mock `process.env`)
- [x] Run tests to verify configuration structure
- [x] Commit: "Enhancement: Add WebSocket and reconnection configuration to clientConfig"

**Verification Checklist**:
- [x] `websocket.url` exists with default value
- [x] `reconnection` section exists with all settings
- [x] Environment variables override config values
- [x] Default values are appropriate
- [x] Unit tests pass

**Acceptance Criteria**:
- [ ] `clientConfig.websocket.url` exists with default `'ws://localhost:3000'`
- [ ] `clientConfig.reconnection` section exists with all settings
- [ ] Environment variables override config values
- [ ] Unit tests pass

## Phase 3: Update WebSocketClient (~30 minutes)

**Goal**: Update `WebSocketClient` to use `clientConfig` instead of `serverConfig`.

**Tasks**:
- [x] Open `src/network/WebSocketClient.js`
- [x] Remove `serverConfig` import
- [x] Add `clientConfig` import: `import { clientConfig } from '../config/clientConfig.js';`
- [x] Update constructor to use `clientConfig.websocket.url`
  - Priority: constructor param > env var > config file
  - `this.url = url || process.env.WEBSOCKET_URL || clientConfig.websocket.url;`
- [x] Update reconnection logic to use `clientConfig.reconnection`
  - Replace `serverConfig.reconnection.enabled` with `clientConfig.reconnection.enabled`
  - Replace `serverConfig.reconnection.maxAttempts` with `clientConfig.reconnection.maxAttempts`
  - Replace `serverConfig.reconnection.retryDelay` with `clientConfig.reconnection.retryDelay`
- [x] Remove hardcoded `0.0.0.0` → `localhost` conversion logic (no longer needed)
- [x] Verify all references to `serverConfig` are removed
- [x] Run existing tests to ensure nothing broke
- [x] Commit: "Enhancement: Update WebSocketClient to use clientConfig instead of serverConfig"

**Verification Checklist**:
- [x] `serverConfig` import removed
- [x] `clientConfig` imported
- [x] URL construction uses `clientConfig.websocket.url`
- [x] Reconnection uses `clientConfig.reconnection` settings
- [x] No references to `serverConfig` remain
- [x] Existing tests pass

**Acceptance Criteria**:
- [x] `WebSocketClient` imports `clientConfig` instead of `serverConfig`
- [x] No references to `serverConfig` in `WebSocketClient`
- [x] URL is constructed from `clientConfig.websocket.url`
- [x] Reconnection uses `clientConfig.reconnection` settings
- [x] Existing tests pass

## Phase 4: Implement Exponential Backoff (~25 minutes)

**Goal**: Implement exponential backoff algorithm for reconnection retries.

**Tasks**:
- [ ] Open `src/network/WebSocketClient.js`
- [ ] Add `calculateRetryDelay(attemptNumber)` method
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
- [ ] Update `attemptReconnect()` method to use `calculateRetryDelay()`
  - Replace fixed `retryDelay` with `this.calculateRetryDelay(this.reconnectAttempts)`
  - Update delay calculation to use exponential backoff
- [ ] Test exponential backoff calculation
  - Test with exponential backoff enabled
  - Test with exponential backoff disabled
  - Test capping at maxRetryDelay
- [ ] Create unit tests for exponential backoff
  - Test first attempt uses initial retry delay
  - Test subsequent attempts double the delay
  - Test delay is capped at maxRetryDelay
  - Test without exponential backoff (all delays are the same)
- [ ] Run tests to verify exponential backoff works
- [ ] Commit: "Enhancement: Implement exponential backoff for reconnection retries"

**Verification Checklist**:
- [ ] `calculateRetryDelay()` method exists
- [ ] Exponential backoff is implemented correctly
- [ ] Retry delays increase exponentially (capped)
- [ ] Without exponential backoff, all delays are the same
- [ ] Unit tests pass

**Acceptance Criteria**:
- [ ] Exponential backoff is implemented
- [ ] Retry delays increase exponentially: 1000ms → 2000ms → 4000ms → 8000ms → 16000ms → 30000ms (capped)
- [ ] Without exponential backoff, all delays are 1000ms
- [ ] Delay is capped at maxRetryDelay
- [ ] Unit tests pass

## Phase 5: Update Tests (~30 minutes)

**Goal**: Update existing tests and add new tests for configuration and exponential backoff.

**Tasks**:
- [ ] Update existing `WebSocketClient` tests
  - Remove `serverConfig` dependencies
  - Update tests to use `clientConfig` instead
  - Mock `clientConfig` in tests if needed
- [ ] Add tests for URL configuration
  - Test URL from config file
  - Test URL from constructor parameter (override)
  - Test URL from environment variable
  - Test constructor parameter overrides environment variable
  - Test constructor parameter overrides config file
- [ ] Add tests for reconnection configuration
  - Test reconnection enabled/disabled from config
  - Test max attempts from config
  - Test retry delay from config
  - Test exponential backoff enabled/disabled
  - Test max retry delay capping
- [ ] Add tests for exponential backoff
  - Test first attempt uses initial retry delay
  - Test subsequent attempts double the delay
  - Test delay is capped at maxRetryDelay
  - Test without exponential backoff (all delays are the same)
- [ ] Add tests for environment variable overrides
  - Test all environment variables override config values
  - Test missing environment variables use config defaults
  - Test boolean environment variables (true/false strings)
  - Test numeric environment variables (parseInt)
- [ ] Update `clientConfig.test.js` if it exists
  - Add tests for new `websocket` section
  - Add tests for new `reconnection` section
  - Add tests for environment variable overrides
- [ ] Run all tests to ensure everything passes
- [ ] Commit: "Test: Update tests for WebSocket client configuration"

**Verification Checklist**:
- [ ] All existing tests updated
- [ ] New tests for URL configuration
- [ ] New tests for reconnection configuration
- [ ] New tests for exponential backoff
- [ ] New tests for environment variables
- [ ] All tests pass

**Acceptance Criteria**:
- [ ] All existing tests updated to use `clientConfig`
- [ ] Tests for URL configuration pass
- [ ] Tests for reconnection configuration pass
- [ ] Tests for exponential backoff pass
- [ ] Tests for environment variables pass
- [ ] All tests pass

## Phase 6: Update Documentation (~20 minutes)

**Goal**: Update documentation to reflect new configuration approach.

**Tasks**:
- [ ] Open `README.md`
- [ ] Find or create "Client Configuration" section
- [ ] Add WebSocket configuration documentation
  - Document `clientConfig.websocket.url`
  - Document `clientConfig.reconnection` settings
  - Document default values
- [ ] Add "Environment Variables" section
  - Document all WebSocket environment variables
  - Document precedence (constructor > env var > config file)
  - Provide example `.env` file or `.env.example` template
- [ ] Update any existing WebSocket documentation
  - Remove references to `serverConfig` for client settings
  - Update examples to use `clientConfig`
- [ ] Create `.env.example` file (optional but recommended)
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
- [ ] Update any relevant documentation about client configuration
- [ ] Commit: "Docs: Update documentation for WebSocket client configuration"

**Verification Checklist**:
- [ ] README.md updated with client WebSocket configuration
- [ ] Environment variables documented
- [ ] Example `.env` file or template provided
- [ ] Configuration precedence documented
- [ ] All references to `serverConfig` for client removed

**Acceptance Criteria**:
- [ ] README.md updated with client WebSocket configuration
- [ ] Environment variables documented
- [ ] Example `.env` file or template provided
- [ ] Configuration precedence documented

## Completion Checklist

- [ ] All phases completed
- [ ] All tests pass
- [ ] Documentation updated
- [ ] No references to `serverConfig` in `WebSocketClient`
- [ ] Environment variable support working
- [ ] Exponential backoff implemented and tested
- [ ] Configuration structure follows existing patterns

## Testing Strategy

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

### Manual Testing
- Test with default configuration
- Test with environment variables
- Test with constructor parameter override
- Test reconnection with exponential backoff
- Test reconnection without exponential backoff

## Dependencies

- `dotenv` npm package - For environment variable support
- `clientConfig.js` - Configuration file
- `WebSocketClient.js` - Client class to update
- Existing configuration system structure

## Notes

- Clean break from `serverConfig` - no backward compatibility needed
- Simple URL-only approach keeps configuration straightforward
- Exponential backoff improves reconnection behavior under network issues
- Environment variables via `dotenv` allow per-environment configuration
- Consider adding validation for configuration values in the future
- May want to add `.env.example` template for developers

## Status

**Current Phase**: Not Started

**Completed Phases**: None

**Next Steps**: Begin Phase 1 - Add dotenv Support

