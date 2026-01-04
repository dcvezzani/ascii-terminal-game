# Gameplan: WebSocket Client Configuration

**Reference Card**: `docs/development/cards/enhancements/ENHANCEMENT_websocket_client_config.md`  
**Reference Specs**: `docs/development/specs/websocket-client-config/websocket-client-config_SPECS.md`

## Overview

This gameplan implements WebSocket connection configuration in the client configuration file, allowing the client to configure its own connection settings independently of the server configuration. The implementation includes environment variable support via dotenv and exponential backoff for reconnection retries.

## Progress Summary

- ✅ **Phase 1: Add dotenv Support** - COMPLETE
- ✅ **Phase 2: Update Client Configuration** - COMPLETE
- ✅ **Phase 3: Update WebSocketClient** - COMPLETE
- ✅ **Phase 4: Implement Exponential Backoff** - COMPLETE
- ✅ **Phase 5: Update Tests** - COMPLETE
- ✅ **Phase 6: Update Documentation** - COMPLETE

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
- [x] Open `src/network/WebSocketClient.js`
- [x] Add `calculateRetryDelay(attemptNumber)` method
  ```javascript
  calculateRetryDelay(attemptNumber) {
    const { retryDelay, exponentialBackoff, maxRetryDelay } = clientConfig.reconnection;
    
    if (!exponentialBackoff) {
      return retryDelay;
    }
    
    // Calculate exponential delay: retryDelay * 2^(attemptNumber - 1)
    const calculatedDelay = retryDelay * Math.pow(2, attemptNumber - 1);
    return Math.min(calculatedDelay, maxRetryDelay);
  }
  ```
- [x] Update `attemptReconnect()` method to use `calculateRetryDelay()`
  - Replace fixed `retryDelay` with `this.calculateRetryDelay(this.reconnectAttempts)`
  - Update delay calculation to use exponential backoff
- [x] Test exponential backoff calculation
  - Test with exponential backoff enabled
  - Test with exponential backoff disabled
  - Test capping at maxRetryDelay
- [x] Create unit tests for exponential backoff
  - Test first attempt uses initial retry delay
  - Test subsequent attempts double the delay
  - Test delay is capped at maxRetryDelay
  - Test without exponential backoff (all delays are the same)
- [x] Run tests to verify exponential backoff works
- [x] Commit: "Enhancement: Implement exponential backoff for reconnection retries"

**Verification Checklist**:
- [x] `calculateRetryDelay()` method exists
- [x] Exponential backoff is implemented correctly
- [x] Retry delays increase exponentially (capped)
- [x] Without exponential backoff, all delays are the same
- [x] Unit tests pass

**Acceptance Criteria**:
- [x] Exponential backoff is implemented
- [x] Retry delays increase exponentially: 1000ms → 2000ms → 4000ms → 8000ms → 16000ms → 30000ms (capped)
- [x] Without exponential backoff, all delays are 1000ms
- [x] Delay is capped at maxRetryDelay
- [x] Unit tests pass

## Phase 5: Update Tests (~30 minutes)

**Goal**: Update existing tests and add new tests for configuration and exponential backoff.

**Tasks**:
- [x] Update existing `WebSocketClient` tests
  - Remove `serverConfig` dependencies
  - Update tests to use `clientConfig` instead
  - Mock `clientConfig` in tests if needed
- [x] Add tests for URL configuration
  - Test URL from config file
  - Test URL from constructor parameter (override)
  - Test URL from environment variable
  - Test constructor parameter overrides environment variable
  - Test constructor parameter overrides config file
- [x] Add tests for reconnection configuration
  - Test reconnection enabled/disabled from config
  - Test max attempts from config
  - Test retry delay from config
  - Test exponential backoff enabled/disabled
  - Test max retry delay capping
- [x] Add tests for exponential backoff
  - Test first attempt uses initial retry delay
  - Test subsequent attempts double the delay
  - Test delay is capped at maxRetryDelay
  - Test without exponential backoff (all delays are the same)
- [x] Add tests for environment variable overrides
  - Test all environment variables override config values
  - Test missing environment variables use config defaults
  - Test boolean environment variables (true/false strings)
  - Test numeric environment variables (parseInt)
- [x] Update `clientConfig.test.js` if it exists
  - Add tests for new `websocket` section
  - Add tests for new `reconnection` section
  - Add tests for environment variable overrides
- [x] Run all tests to ensure everything passes
- [x] Commit: "Test: Update tests for WebSocket client configuration"

**Verification Checklist**:
- [x] All existing tests updated
- [x] New tests for URL configuration
- [x] New tests for reconnection configuration
- [x] New tests for exponential backoff
- [x] New tests for environment variables
- [x] All tests pass

**Acceptance Criteria**:
- [x] All existing tests updated to use `clientConfig`
- [x] Tests for URL configuration pass
- [x] Tests for reconnection configuration pass
- [x] Tests for exponential backoff pass
- [x] Tests for environment variables pass
- [x] All tests pass

## Phase 6: Update Documentation (~20 minutes)

**Goal**: Update documentation to reflect new configuration approach.

**Tasks**:
- [x] Open `README.md`
- [x] Find or create "Client Configuration" section
- [x] Add WebSocket configuration documentation
  - Document `clientConfig.websocket.url`
  - Document `clientConfig.reconnection` settings
  - Document default values
- [x] Add "Environment Variables" section
  - Document all WebSocket environment variables
  - Document precedence (constructor > env var > config file)
  - Provide example `.env` file or `.env.example` template
- [x] Update any existing WebSocket documentation
  - Remove references to `serverConfig` for client settings
  - Update examples to use `clientConfig`
- [x] Create `.env.sample` file (optional but recommended)
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
- [x] Update any relevant documentation about client configuration
- [x] Commit: "Docs: Update documentation for WebSocket client configuration"

**Verification Checklist**:
- [x] README.md updated with client WebSocket configuration
- [x] Environment variables documented
- [x] Example `.env` file or template provided
- [x] Configuration precedence documented
- [x] All references to `serverConfig` for client removed

**Acceptance Criteria**:
- [x] README.md updated with client WebSocket configuration
- [x] Environment variables documented
- [x] Example `.env` file or template provided
- [x] Configuration precedence documented

## Completion Checklist

- [x] All phases completed
- [x] All tests pass
- [x] Documentation updated
- [x] No references to `serverConfig` in `WebSocketClient`
- [x] Environment variable support working
- [x] Exponential backoff implemented and tested
- [x] Configuration structure follows existing patterns

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

**Current Phase**: Complete

**Completed Phases**: All 6 phases complete

**Status**: ✅ COMPLETE - All phases implemented, tested, and documented

