# Specification: Prevent Scroll Boundary Flickering

## Overview

This specification details the implementation of a fix to prevent unnecessary re-rendering when scroll boundaries are reached in the modal scrolling system. When users attempt to scroll beyond the top or bottom boundaries, the system currently triggers a re-render even though the scroll position hasn't changed, causing visual flickering.

**Reference Card**: `docs/development/cards/enhancements/ENHANCEMENT_prevent_scroll_boundary_flickering.md`

## Goals

1. Prevent unnecessary re-rendering when scroll boundaries are reached
2. Eliminate visual flickering when users press movement keys at boundaries
3. Improve performance by avoiding redundant rendering operations
4. Maintain all existing scrolling functionality

## Current State

**Current Architecture**:

- `src/ui/Modal.js` - Modal class
  - `scrollUp()` method: Decrements scroll position if > 0, otherwise does nothing
  - `scrollDown(maxScroll)` method: Clamps scroll position to maxScroll
  - Methods don't return any indication of whether position changed
- `src/ui/ModalInputHandler.js` - Modal input handler helper
  - `handleKeypress()` calls scroll methods and always triggers re-render
  - Always calls `this.modalManager.triggerStateChange()` after scroll operations
  - No check to see if scroll position actually changed
- `src/ui/ModalManager.js` - Modal manager
  - `triggerStateChange()` triggers callback for re-rendering
  - Called unconditionally after scroll operations

**Current Limitations**:

- Re-rendering occurs even when scroll position hasn't changed (at boundaries)
- Visual flickering when users press movement keys at top/bottom boundaries
- Unnecessary CPU usage from redundant rendering
- No way to detect if scroll operation actually changed position

**Current Code**:

```javascript
// Modal.js - scrollUp() method
scrollUp() {
  if (this.scrollPosition > 0) {
    this.scrollPosition--;
  }
  // No return value indicating if position changed
}

// Modal.js - scrollDown() method
scrollDown(maxScroll) {
  this.scrollPosition = Math.min(this.scrollPosition + 1, maxScroll);
  // No return value indicating if position changed
}

// ModalInputHandler.js - handleKeypress() method
if (keyString === 'up' || keyString === 'w') {
  modal.scrollUp();
  this.modalManager.triggerStateChange(); // Always called, even if scroll didn't change
  return true;
}

if (keyString === 'down' || keyString === 's') {
  const maxScroll = this.calculateMaxScroll(modal);
  modal.scrollDown(maxScroll);
  this.modalManager.triggerStateChange(); // Always called, even if scroll didn't change
  return true;
}
```

**Problem Scenario**:

1. User has scrolled to top of modal (scrollPosition = 0)
2. User presses up arrow key
3. `modal.scrollUp()` is called, but does nothing (already at top)
4. `triggerStateChange()` is called unconditionally
5. Modal is re-rendered even though nothing changed
6. User sees flickering/redraw animation

## Target State

**Enhanced Architecture**:

- `src/ui/Modal.js` - Enhanced Modal class
  - `scrollUp()` method: Returns `true` if position changed, `false` if at boundary
  - `scrollDown(maxScroll)` method: Returns `true` if position changed, `false` if at boundary
  - Methods provide feedback about whether scroll operation was successful
- `src/ui/ModalInputHandler.js` - Enhanced ModalInputHandler helper
  - `handleKeypress()` checks return value from scroll methods
  - Only calls `triggerStateChange()` if scroll position actually changed
  - Prevents unnecessary re-rendering at boundaries
- `src/ui/ModalManager.js` - ModalManager (unchanged)
  - `triggerStateChange()` remains unchanged
  - Only called when scroll position actually changes

**New Behavior**:

1. User has scrolled to top of modal (scrollPosition = 0)
2. User presses up arrow key
3. `modal.scrollUp()` is called, returns `false` (position didn't change)
4. `triggerStateChange()` is NOT called (because scroll didn't change)
5. No re-rendering occurs
6. No flickering observed

**Benefits**:

- Eliminates visual flickering at scroll boundaries
- Reduces unnecessary CPU usage
- Improves user experience
- Maintains all existing functionality
- Simple, clean implementation

## Functional Requirements

### FR1: Scroll Method Return Values

**Requirement**: `scrollUp()` and `scrollDown()` methods must return a boolean indicating whether the scroll position actually changed.

**Details**:

- `scrollUp()` returns `true` if scroll position was decremented, `false` if already at top (scrollPosition = 0)
- `scrollDown(maxScroll)` returns `true` if scroll position was incremented, `false` if already at bottom (scrollPosition = maxScroll)
- Return value must accurately reflect whether position changed
- Methods must maintain backward compatibility (existing code that doesn't check return value should still work)

**Implementation**:

```javascript
// Modal.js
scrollUp() {
  if (this.scrollPosition > 0) {
    this.scrollPosition--;
    return true; // Position changed
  }
  return false; // Position unchanged (at boundary)
}

scrollDown(maxScroll) {
  const previousPosition = this.scrollPosition;
  this.scrollPosition = Math.min(this.scrollPosition + 1, maxScroll);
  return this.scrollPosition !== previousPosition; // Return true if changed
}
```

### FR2: Conditional Re-rendering

**Requirement**: `ModalInputHandler.handleKeypress()` must only trigger re-rendering if the scroll position actually changed.

**Details**:

- Check return value from `scrollUp()` or `scrollDown()` methods
- Only call `this.modalManager.triggerStateChange()` if method returned `true`
- Skip re-rendering if method returned `false` (at boundary)
- Must handle both up/down and w/s key combinations
- Must maintain all existing functionality

**Implementation**:

```javascript
// ModalInputHandler.js
if (keyString === 'up' || keyString === 'w') {
  const changed = modal.scrollUp();
  if (changed) {
    this.modalManager.triggerStateChange();
  }
  return true;
}

if (keyString === 'down' || keyString === 's') {
  const maxScroll = this.calculateMaxScroll(modal);
  const changed = modal.scrollDown(maxScroll);
  if (changed) {
    this.modalManager.triggerStateChange();
  }
  return true;
}
```

### FR3: Edge Case Handling

**Requirement**: System must handle edge cases correctly without flickering.

**Details**:

- Handle rapid keypresses at boundaries (multiple presses should not cause flickering)
- Handle case where maxScroll = 0 (no scrolling needed, all content fits in viewport)
- Handle case where scrollPosition = 0 and user presses up (already at top)
- Handle case where scrollPosition = maxScroll and user presses down (already at bottom)
- All edge cases must prevent unnecessary re-rendering

**Edge Cases**:

1. **Rapid keypresses at top boundary**:
   - User rapidly presses up arrow multiple times
   - Each call to `scrollUp()` returns `false`
   - No re-rendering occurs for any of the calls
   - No flickering observed

2. **Rapid keypresses at bottom boundary**:
   - User rapidly presses down arrow multiple times
   - Each call to `scrollDown()` returns `false`
   - No re-rendering occurs for any of the calls
   - No flickering observed

3. **No scrolling needed (maxScroll = 0)**:
   - Modal content fits entirely in viewport
   - `scrollDown(0)` always returns `false` (position clamped to 0)
   - No re-rendering occurs when user presses down
   - No flickering observed

## Technical Requirements

### TR1: Modal Class Changes

**File**: `src/ui/Modal.js`

**Changes Required**:

1. Modify `scrollUp()` method signature:
   - Add return type: `boolean`
   - Return `true` if position changed, `false` if at boundary
   - Maintain existing behavior (decrement if > 0)

2. Modify `scrollDown(maxScroll)` method signature:
   - Add return type: `boolean`
   - Return `true` if position changed, `false` if at boundary
   - Maintain existing behavior (clamp to maxScroll)

**Method Signatures**:

```javascript
/**
 * Scroll up by one line (decrements scroll position)
 * Scroll position is clamped to 0 at the top boundary
 * @returns {boolean} True if scroll position changed, false if already at top
 */
scrollUp() {
  if (this.scrollPosition > 0) {
    this.scrollPosition--;
    return true;
  }
  return false;
}

/**
 * Scroll down by one line (increments scroll position)
 * Scroll position is clamped to maxScroll at the bottom boundary
 * @param {number} maxScroll - Maximum scroll position (total content lines - viewport height)
 * @returns {boolean} True if scroll position changed, false if already at bottom
 */
scrollDown(maxScroll) {
  const previousPosition = this.scrollPosition;
  this.scrollPosition = Math.min(this.scrollPosition + 1, maxScroll);
  return this.scrollPosition !== previousPosition;
}
```

### TR2: ModalInputHandler Changes

**File**: `src/ui/ModalInputHandler.js`

**Changes Required**:

1. Modify `handleKeypress()` method:
   - Capture return value from `scrollUp()` and `scrollDown()` calls
   - Only call `triggerStateChange()` if return value is `true`
   - Maintain existing behavior for all other keys

**Implementation**:

```javascript
// Scrolling (movement keys)
if (keyString === 'up' || keyString === 'w') {
  const changed = modal.scrollUp();
  if (changed) {
    this.modalManager.triggerStateChange(); // Only re-render if changed
  }
  return true;
}

if (keyString === 'down' || keyString === 's') {
  const maxScroll = this.calculateMaxScroll(modal);
  const changed = modal.scrollDown(maxScroll);
  if (changed) {
    this.modalManager.triggerStateChange(); // Only re-render if changed
  }
  return true;
}
```

### TR3: Backward Compatibility

**Requirement**: Changes must maintain backward compatibility.

**Details**:

- Existing code that calls `scrollUp()` or `scrollDown()` without checking return value must continue to work
- Return values are optional to use (code can ignore them)
- No breaking changes to method signatures (only adding return values)
- All existing functionality must be preserved

## Testing Requirements

### Unit Tests

**File**: `test/ui/Modal.test.js` (update existing tests)

**Test Cases**:

1. **scrollUp() returns true when position changes**:
   - Set scrollPosition to 5
   - Call `scrollUp()`
   - Assert return value is `true`
   - Assert scrollPosition is 4

2. **scrollUp() returns false when at top boundary**:
   - Set scrollPosition to 0
   - Call `scrollUp()`
   - Assert return value is `false`
   - Assert scrollPosition is still 0

3. **scrollDown() returns true when position changes**:
   - Set scrollPosition to 0, maxScroll to 10
   - Call `scrollDown(10)`
   - Assert return value is `true`
   - Assert scrollPosition is 1

4. **scrollDown() returns false when at bottom boundary**:
   - Set scrollPosition to 10, maxScroll to 10
   - Call `scrollDown(10)`
   - Assert return value is `false`
   - Assert scrollPosition is still 10

5. **scrollDown() returns false when maxScroll is 0**:
   - Set scrollPosition to 0, maxScroll to 0
   - Call `scrollDown(0)`
   - Assert return value is `false`
   - Assert scrollPosition is still 0

**File**: `test/ui/ModalInputHandler.scrolling.test.js` (update existing tests)

**Test Cases**:

1. **triggerStateChange() called when scrollUp() changes position**:
   - Create modal with scrollable content
   - Set scrollPosition to 5
   - Mock `modalManager.triggerStateChange()`
   - Call `handleKeypress('', { name: 'up' }, modal)`
   - Assert `triggerStateChange()` was called

2. **triggerStateChange() NOT called when scrollUp() at boundary**:
   - Create modal with scrollable content
   - Set scrollPosition to 0
   - Mock `modalManager.triggerStateChange()`
   - Call `handleKeypress('', { name: 'up' }, modal)`
   - Assert `triggerStateChange()` was NOT called

3. **triggerStateChange() called when scrollDown() changes position**:
   - Create modal with scrollable content
   - Set scrollPosition to 0, maxScroll to 10
   - Mock `modalManager.triggerStateChange()`
   - Call `handleKeypress('', { name: 'down' }, modal)`
   - Assert `triggerStateChange()` was called

4. **triggerStateChange() NOT called when scrollDown() at boundary**:
   - Create modal with scrollable content
   - Set scrollPosition to 10, maxScroll to 10
   - Mock `modalManager.triggerStateChange()`
   - Call `handleKeypress('', { name: 'down' }, modal)`
   - Assert `triggerStateChange()` was NOT called

5. **Rapid keypresses at boundary don't trigger re-rendering**:
   - Create modal at top boundary (scrollPosition = 0)
   - Mock `modalManager.triggerStateChange()`
   - Call `handleKeypress('', { name: 'up' }, modal)` multiple times rapidly
   - Assert `triggerStateChange()` was never called

### Integration Tests

**File**: `test/integration/modal-scrolling.test.js` (add new tests)

**Test Cases**:

1. **No flickering when scrolling at top boundary**:
   - Open modal with scrollable content
   - Scroll to top (scrollPosition = 0)
   - Press up arrow key multiple times
   - Verify no re-rendering occurs (check render call count)
   - Verify scroll position remains 0

2. **No flickering when scrolling at bottom boundary**:
   - Open modal with scrollable content
   - Scroll to bottom (scrollPosition = maxScroll)
   - Press down arrow key multiple times
   - Verify no re-rendering occurs (check render call count)
   - Verify scroll position remains at maxScroll

3. **Re-rendering occurs when scroll position changes**:
   - Open modal with scrollable content
   - Set scrollPosition to 5
   - Press up arrow key
   - Verify re-rendering occurs (check render call count)
   - Verify scroll position is 4

## Implementation Notes

- This is a small, focused enhancement
- Changes are minimal and localized to two files
- No breaking changes to existing API
- Return values are optional (backward compatible)
- Should be quick to implement (likely 1-2 phases)
- Improves user experience with minimal code changes

## Dependencies

- Modal scrolling must be functional (✅ Complete)
- ModalInputHandler must support scroll key handling (✅ Complete)
- ModalManager must support state change callbacks (✅ Complete)

## Related Features

- **X_ENHANCEMENT_modal_scrolling** - Base modal scrolling feature that this enhancement improves

