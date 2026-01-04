# Gameplan: Prevent Scroll Boundary Flickering

**Reference Card**: `docs/development/cards/enhancements/ENHANCEMENT_prevent_scroll_boundary_flickering.md`  
**Reference Specs**: `docs/development/specs/prevent-scroll-boundary-flickering/prevent-scroll-boundary-flickering_SPECS.md`

## Overview

This gameplan implements a fix to prevent unnecessary re-rendering when scroll boundaries are reached in the modal scrolling system. When users attempt to scroll beyond the top or bottom boundaries, the system will only trigger re-rendering if the scroll position actually changed, eliminating visual flickering.

## Progress Summary

- ✅ **Phase 1: Update Modal Class - Return Values** - COMPLETE
- ⏳ **Phase 2: Update ModalInputHandler - Conditional Re-rendering** - NOT STARTED
- ⏳ **Phase 3: Update Tests** - NOT STARTED

## Prerequisites

- Modal scrolling must be functional (✅ Complete)
- ModalInputHandler must support scroll key handling (✅ Complete)
- ModalManager must support state change callbacks (✅ Complete)

## Phase 1: Update Modal Class - Return Values (~15 minutes)

**Goal**: Modify `scrollUp()` and `scrollDown()` methods to return boolean values indicating whether the scroll position changed.

**Tasks**:
- [x] Open `src/ui/Modal.js`
- [x] Update `scrollUp()` method to return boolean
  ```javascript
  /**
   * Scroll up by one line (decrements scroll position)
   * Scroll position is clamped to 0 at the top boundary
   * @returns {boolean} True if scroll position changed, false if already at top
   */
  scrollUp() {
    if (this.scrollPosition > 0) {
      this.scrollPosition--;
      return true; // Position changed
    }
    return false; // Position unchanged (at boundary)
  }
  ```
- [x] Update `scrollDown(maxScroll)` method to return boolean
  ```javascript
  /**
   * Scroll down by one line (increments scroll position)
   * Scroll position is clamped to maxScroll at the bottom boundary
   * @param {number} maxScroll - Maximum scroll position (total content lines - viewport height)
   * @returns {boolean} True if scroll position changed, false if already at bottom
   */
  scrollDown(maxScroll) {
    const previousPosition = this.scrollPosition;
    this.scrollPosition = Math.min(this.scrollPosition + 1, maxScroll);
    return this.scrollPosition !== previousPosition; // Return true if changed
  }
  ```
- [x] Update JSDoc comments to document return values
- [x] Run existing tests to ensure backward compatibility (✅ All tests pass)
- [x] Commit: "Enhancement: Add return values to Modal scroll methods" (✅ Committed)

**Verification Checklist**:
- [x] `scrollUp()` returns `true` when position changes (✅ Verified)
- [x] `scrollUp()` returns `false` when at top boundary (scrollPosition = 0) (✅ Verified)
- [x] `scrollDown()` returns `true` when position changes (✅ Verified)
- [x] `scrollDown()` returns `false` when at bottom boundary (✅ Verified)
- [x] `scrollDown()` returns `false` when maxScroll = 0 (✅ Verified)
- [x] All existing tests still pass (backward compatibility) (✅ 23 Modal.scrolling tests + 10 Modal tests pass)

**Acceptance Criteria**:
- [x] `scrollUp()` returns boolean indicating if position changed (✅ Complete)
- [x] `scrollDown()` returns boolean indicating if position changed (✅ Complete)
- [x] Methods maintain all existing behavior (✅ Verified)
- [x] No breaking changes to existing code (✅ All tests pass)
- [x] All existing tests pass (✅ 33 tests passing)

## Phase 2: Update ModalInputHandler - Conditional Re-rendering (~15 minutes)

**Goal**: Modify `handleKeypress()` to only trigger re-rendering when scroll position actually changes.

**Tasks**:
- [ ] Open `src/ui/ModalInputHandler.js`
- [ ] Update up/w key handling to check return value
  ```javascript
  if (keyString === 'up' || keyString === 'w') {
    const changed = modal.scrollUp();
    if (changed) {
      this.modalManager.triggerStateChange(); // Only re-render if changed
    }
    return true;
  }
  ```
- [ ] Update down/s key handling to check return value
  ```javascript
  if (keyString === 'down' || keyString === 's') {
    const maxScroll = this.calculateMaxScroll(modal);
    const changed = modal.scrollDown(maxScroll);
    if (changed) {
      this.modalManager.triggerStateChange(); // Only re-render if changed
    }
    return true;
  }
  ```
- [ ] Run existing tests to ensure functionality is preserved
- [ ] Commit: "Enhancement: Conditionally trigger re-rendering based on scroll changes"

**Verification Checklist**:
- [ ] `triggerStateChange()` is called when `scrollUp()` returns `true`
- [ ] `triggerStateChange()` is NOT called when `scrollUp()` returns `false`
- [ ] `triggerStateChange()` is called when `scrollDown()` returns `true`
- [ ] `triggerStateChange()` is NOT called when `scrollDown()` returns `false`
- [ ] All existing functionality preserved
- [ ] No flickering when at boundaries

**Acceptance Criteria**:
- [ ] Re-rendering only occurs when scroll position changes
- [ ] No re-rendering when at scroll boundaries
- [ ] All existing functionality preserved
- [ ] No visual flickering at boundaries

## Phase 3: Update Tests (~20 minutes)

**Goal**: Add comprehensive tests to verify the new behavior and ensure no regressions.

**Tasks**:
- [ ] Update `test/ui/Modal.scrolling.test.js` (or create new test file if needed)
  - Test `scrollUp()` returns `true` when position changes
  - Test `scrollUp()` returns `false` when at top boundary
  - Test `scrollDown()` returns `true` when position changes
  - Test `scrollDown()` returns `false` when at bottom boundary
  - Test `scrollDown()` returns `false` when maxScroll = 0
- [ ] Update `test/ui/ModalInputHandler.scrolling.test.js`
  - Test `triggerStateChange()` called when `scrollUp()` changes position
  - Test `triggerStateChange()` NOT called when `scrollUp()` at boundary
  - Test `triggerStateChange()` called when `scrollDown()` changes position
  - Test `triggerStateChange()` NOT called when `scrollDown()` at boundary
  - Test rapid keypresses at boundary don't trigger re-rendering
- [ ] Add integration tests to `test/integration/modal-scrolling.test.js`
  - Test no flickering when scrolling at top boundary
  - Test no flickering when scrolling at bottom boundary
  - Test re-rendering occurs when scroll position changes
- [ ] Run all tests to ensure everything passes
- [ ] Fix any failing tests
- [ ] Commit: "Test: Add tests for scroll boundary flickering prevention"

**Verification Checklist**:
- [ ] All unit tests for Modal scroll methods pass
- [ ] All unit tests for ModalInputHandler conditional re-rendering pass
- [ ] All integration tests pass
- [ ] No regressions in existing tests
- [ ] Test coverage is comprehensive

**Acceptance Criteria**:
- [ ] All new tests created and passing
- [ ] All existing tests still pass
- [ ] Test coverage is comprehensive
- [ ] No regressions introduced

## Completion Checklist

- [ ] All phases completed
- [ ] All tests pass
- [ ] No flickering at scroll boundaries
- [ ] Re-rendering only occurs when scroll position changes
- [ ] Backward compatibility maintained
- [ ] Performance improvement verified

## Testing Strategy

### Unit Tests
- **Modal Class**: Test return values from `scrollUp()` and `scrollDown()` methods
- **ModalInputHandler**: Test conditional `triggerStateChange()` calls based on scroll return values

### Integration Tests
- Test no flickering at top boundary
- Test no flickering at bottom boundary
- Test re-rendering occurs when scroll position changes
- Test rapid keypresses at boundaries

### Manual Testing
- Test scrolling at top boundary (no flickering)
- Test scrolling at bottom boundary (no flickering)
- Test normal scrolling (re-rendering occurs)
- Test rapid keypresses at boundaries

## Dependencies

- Modal scrolling (✅ Complete)
- ModalInputHandler (✅ Complete)
- ModalManager (✅ Complete)

## Notes

- This is a small, focused enhancement
- Changes are minimal and localized to two files
- No breaking changes to existing API
- Return values are optional (backward compatible)
- Should be quick to implement (3 phases, ~50 minutes total)
- Improves user experience with minimal code changes
- Eliminates visual flickering at scroll boundaries

## Status

**Current Phase**: Not Started

**Completed Phases**: None

**Status**: ⏳ NOT STARTED - Ready for implementation

