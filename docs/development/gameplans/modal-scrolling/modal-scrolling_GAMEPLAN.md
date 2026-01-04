# Gameplan: Modal Content Scrolling

**Reference Card**: `docs/development/cards/enhancements/ENHANCEMENT_modal_scrolling.md`  
**Reference Specs**: `docs/development/specs/modal-scrolling/modal-scrolling_SPECS.md`

## Overview

This gameplan implements scrolling support for the modal system, allowing users to view all content when it exceeds the modal viewport. The implementation includes viewport clipping, line-by-line scrolling, scroll indicators, modal-level actions, option states (active vs selected), and scroll position persistence during modal stacking.

## Progress Summary

- ✅ **Phase 1: Enhance Modal Class** - COMPLETE
- ✅ **Phase 2: Enhance ModalRenderer - Viewport and Height Calculations** - COMPLETE
- ✅ **Phase 3: Enhance ModalRenderer - Viewport Clipping and Rendering** - COMPLETE
- ✅ **Phase 4: Enhance ModalRenderer - Scroll Indicators** - COMPLETE
- ⏳ **Phase 5: Enhance ModalInputHandler - Scrolling and Selection** - NOT STARTED
- ⏳ **Phase 6: Enhance ModalManager - Scroll Position Persistence** - NOT STARTED
- ⏳ **Phase 7: Add Option State Rendering (Active vs Selected)** - NOT STARTED
- ⏳ **Phase 8: Update Tests** - NOT STARTED
- ⏳ **Phase 9: Integration Testing** - NOT STARTED

## Prerequisites

- Modal system must be functional (✅ Complete)
- Text wrapping must be functional (✅ Complete)
- ModalRenderer must support content rendering (✅ Complete)
- ModalInputHandler must support key handling (✅ Complete)
- ModalManager must support modal management (✅ Complete)

## Phase 1: Enhance Modal Class (~20 minutes)

**Goal**: Add scroll position tracking and modal-level action support to Modal class.

**Tasks**:
- [x] Open `src/ui/Modal.js`
- [x] Add `scrollPosition` property to constructor (default: 0)
  ```javascript
  this.scrollPosition = 0;
  ```
- [x] Add `action` property to constructor (optional, from config)
  ```javascript
  this.action = config.action;
  ```
- [x] Add `getScrollPosition()` method
  ```javascript
  getScrollPosition() {
    return this.scrollPosition;
  }
  ```
- [x] Add `setScrollPosition(position)` method (with clamping to 0)
  ```javascript
  setScrollPosition(position) {
    this.scrollPosition = Math.max(0, position);
  }
  ```
- [x] Add `scrollUp()` method (decrements, clamps to 0)
  ```javascript
  scrollUp() {
    if (this.scrollPosition > 0) {
      this.scrollPosition--;
    }
  }
  ```
- [x] Add `scrollDown(maxScroll)` method (increments, clamps to maxScroll)
  ```javascript
  scrollDown(maxScroll) {
    if (this.scrollPosition < maxScroll) {
      this.scrollPosition++;
    }
  }
  ```
- [x] Add `getAction()` method
  ```javascript
  getAction() {
    return this.action;
  }
  ```
- [x] Update `executeSelectedAction()` to pass `options` parameter to option actions
  ```javascript
  executeSelectedAction(modalManager) {
    // ... existing code ...
    if (selectedOption && selectedOption.action) {
      const options = { modal: this }; // Pass modal reference
      selectedOption.action(options);
      // ... rest of method ...
    }
  }
  ```
- [x] Create unit tests for Modal scrolling (`test/ui/Modal.scrolling.test.js`)
  - Test `scrollPosition` initialization (defaults to 0)
  - Test `scrollUp()` method (decrements, clamps to 0)
  - Test `scrollDown()` method (increments, clamps to maxScroll)
  - Test `setScrollPosition()` method (sets and clamps)
  - Test `getScrollPosition()` method
  - Test `action` property storage and retrieval
  - Test scroll position boundaries (top/bottom)
  - Test option actions receive `options` parameter with `modal` reference
- [x] Run tests to verify Modal class enhancements
- [x] Commit: "Enhancement: Add scroll position and modal-level action to Modal class"

**Verification Checklist**:
- [x] `scrollPosition` property exists (defaults to 0)
- [x] `action` property exists (optional)
- [x] Scroll methods implemented (`scrollUp`, `scrollDown`, `setScrollPosition`, `getScrollPosition`)
- [x] Scroll position clamps to boundaries
- [x] Modal-level action accessible via `getAction()`
- [x] Option actions receive `options` parameter with `modal` reference
- [x] Unit tests pass

**Acceptance Criteria**:
- [x] Modal class has `scrollPosition` property
- [x] Modal class has `action` property
- [x] Scroll methods implemented and working
- [x] Scroll position clamps to boundaries correctly
- [x] Option actions receive modal reference
- [x] Unit tests pass

## Phase 2: Enhance ModalRenderer - Viewport and Height Calculations (~30 minutes)

**Goal**: Add viewport calculation and total content height calculation methods to ModalRenderer.

**Tasks**:
- [x] Open `src/render/ModalRenderer.js`
- [x] Add `calculateViewport(startY, modalHeight)` method
  ```javascript
  calculateViewport(startY, modalHeight) {
    const viewportStartY = startY + 2; // After title line
    const viewportEndY = startY + modalHeight - 1; // Before bottom border
    const viewportHeight = viewportEndY - viewportStartY + 1;
    return { viewportStartY, viewportEndY, viewportHeight };
  }
  ```
- [x] Add `calculateTotalContentHeight(content, width)` method
  ```javascript
  calculateTotalContentHeight(content, width) {
    let totalLines = 0;
    const lineWidth = width - (this.padding * 2);
    
    content.forEach(block => {
      if (block.type === 'message') {
        const wrapped = this.wrapTextWithNewlines(block.text, lineWidth);
        totalLines += wrapped.length;
      } else if (block.type === 'option') {
        const wrapped = this.wrapTextWithNewlines(block.label, lineWidth - 2);
        totalLines += wrapped.length;
      }
    });
    
    return totalLines;
  }
  ```
- [x] Add `calculateMaxScroll(totalHeight, viewportHeight)` helper method
  ```javascript
  calculateMaxScroll(totalHeight, viewportHeight) {
    return Math.max(0, totalHeight - viewportHeight);
  }
  ```
- [x] Create unit tests for viewport and height calculations (`test/render/ModalRenderer.viewport.test.js`)
  - Test viewport calculation (startY, endY, height)
  - Test total content height calculation (with wrapped text)
  - Test max scroll calculation
  - Test wrapped text in height calculations
- [x] Run tests to verify calculations
- [x] Commit: "Enhancement: Add viewport and content height calculations to ModalRenderer"

**Verification Checklist**:
- [x] `calculateViewport()` method exists and returns correct values
- [x] `calculateTotalContentHeight()` method exists and counts wrapped lines
- [x] `calculateMaxScroll()` method exists and calculates correctly
- [x] Wrapped text lines are counted correctly
- [x] Unit tests pass

**Acceptance Criteria**:
- [x] Viewport boundaries calculated correctly
- [x] Total content height calculated (including wrapped lines)
- [x] Max scroll calculated correctly
- [x] Wrapped text handled in calculations
- [x] Unit tests pass

## Phase 3: Enhance ModalRenderer - Viewport Clipping and Rendering (~45 minutes)

**Goal**: Update ModalRenderer to clip content to viewport and render only visible lines.

**Tasks**:
- [x] Open `src/render/ModalRenderer.js`
- [x] Update `renderContent()` method to accept `scrollPosition` parameter
  ```javascript
  renderContent(startX, startY, width, content, selectedIndex, scrollPosition = 0)
  ```
- [x] Update `renderContent()` to calculate viewport and total height
  ```javascript
  const viewport = this.calculateViewport(startY, modalHeight);
  const totalHeight = this.calculateTotalContentHeight(content, width);
  const maxScroll = this.calculateMaxScroll(totalHeight, viewport.viewportHeight);
  const clampedScroll = Math.max(0, Math.min(scrollPosition, maxScroll));
  ```
- [x] Create `buildContentLines(content, width)` method to build all content lines (with wrapping)
  ```javascript
  buildContentLines(content, width) {
    const allLines = [];
    const lineWidth = width - (this.padding * 2);
    
    content.forEach(block => {
      if (block.type === 'message') {
        const wrapped = this.wrapTextWithNewlines(block.text, lineWidth);
        wrapped.forEach(line => {
          allLines.push({ type: 'message', text: line });
        });
      } else if (block.type === 'option') {
        const wrapped = this.wrapTextWithNewlines(block.label, lineWidth - 2);
        wrapped.forEach((line, index) => {
          allLines.push({ 
            type: 'option', 
            label: line, 
            isFirstLine: index === 0,
            optionIndex: /* track option index */
          });
        });
      }
    });
    
    return allLines;
  }
  ```
- [x] Update `renderContent()` to only render visible lines (viewport clipping)
  ```javascript
  const allLines = this.buildContentLines(content, width);
  const visibleStart = clampedScroll;
  const visibleEnd = clampedScroll + viewport.viewportHeight - 1;
  
  let currentY = viewport.viewportStartY;
  for (let i = visibleStart; i <= visibleEnd && i < allLines.length; i++) {
    const line = allLines[i];
    // Render line at currentY
    currentY++;
  }
  ```
- [x] Update `renderModal()` to pass `scrollPosition` to `renderContent()`
  ```javascript
  this.renderContent(startX, startY, modalWidth, content, modal.getSelectedIndex(), modal.getScrollPosition());
  ```
- [x] Update `buildOptionLinesMap()` to account for scroll position (for incremental updates)
  - Need to track which option lines are visible
  - Update Y positions based on scroll position
- [x] Update `updateSelectionOnly()` to work with scrolled content
  - Check if selected option is visible in viewport
  - Only update if visible
- [x] Create unit tests for viewport clipping (`test/render/ModalRenderer.clipping.test.js`)
  - Test content is clipped to viewport
  - Test only visible lines are rendered
  - Test content outside viewport is not rendered
  - Test wrapped text in clipping
- [x] Run tests to verify viewport clipping
- [x] Commit: "Enhancement: Implement viewport clipping in ModalRenderer"

**Verification Checklist**:
- [x] `renderContent()` accepts `scrollPosition` parameter
- [x] Viewport clipping implemented (only visible lines rendered)
- [x] Content outside viewport is not rendered
- [x] Wrapped text handled correctly in clipping
- [x] `buildOptionLinesMap()` accounts for scroll position
- [x] `updateSelectionOnly()` works with scrolled content
- [x] Unit tests pass

**Acceptance Criteria**:
- [x] Content is clipped to viewport boundaries
- [x] Only visible lines are rendered
- [x] Content outside viewport is not rendered
- [x] Wrapped text lines handled correctly
- [x] Incremental updates work with scrolling
- [x] Unit tests pass

## Phase 4: Enhance ModalRenderer - Scroll Indicators (~30 minutes)

**Goal**: Add scroll indicators (arrows and progress bar) to ModalRenderer.

**Tasks**:
- [x] Open `src/render/ModalRenderer.js`
- [x] Add `renderScrollIndicators()` method
  ```javascript
  renderScrollIndicators(startX, startY, modalWidth, modalHeight, scrollPosition, maxScroll, viewportHeight) {
    const viewport = this.calculateViewport(startY, modalHeight);
    const indicatorX = startX + modalWidth - 1; // Right edge
    
    // Top indicator (↑)
    if (scrollPosition > 0) {
      process.stdout.write(ansiEscapes.cursorTo(indicatorX, viewport.viewportStartY));
      process.stdout.write(chalk.dim('↑'));
    }
    
    // Bottom indicator (↓)
    if (scrollPosition < maxScroll) {
      process.stdout.write(ansiEscapes.cursorTo(indicatorX, viewport.viewportEndY));
      process.stdout.write(chalk.dim('↓'));
    }
    
    // Progress bar (right side)
    if (maxScroll > 0) {
      const progressRatio = scrollPosition / maxScroll;
      const progressBarY = viewport.viewportStartY + Math.floor(progressRatio * viewportHeight);
      process.stdout.write(ansiEscapes.cursorTo(indicatorX, progressBarY));
      process.stdout.write(chalk.dim('█')); // Solid block for progress
    }
  }
  ```
- [x] Update `renderContent()` to call `renderScrollIndicators()` after rendering content
  ```javascript
  // Render scroll indicators
  this.renderScrollIndicators(startX, startY, width, modalHeight, clampedScroll, maxScroll, viewport.viewportHeight);
  ```
- [x] Update `renderModal()` to pass `modalHeight` to `renderContent()` (or calculate it)
  - Need modalHeight for viewport calculation
- [x] Update `updateSelectionOnly()` to also update scroll indicators if needed
  - Re-render indicators when scroll position changes (handled by full render when scroll position changes)
- [x] Create unit tests for scroll indicators (`test/render/ModalRenderer.indicators.test.js`)
  - Test `↑` indicator shown when scrollable above
  - Test `↓` indicator shown when scrollable below
  - Test progress bar rendered on right side
  - Test progress bar position reflects scroll position
  - Test progress bar at top when at top boundary
  - Test progress bar at bottom when at bottom boundary
- [x] Run tests to verify scroll indicators
- [x] Commit: "Enhancement: Add scroll indicators to ModalRenderer"

**Verification Checklist**:
- [x] `renderScrollIndicators()` method exists
- [x] Top indicator (`↑`) shown when scrollable above
- [x] Bottom indicator (`↓`) shown when scrollable below
- [x] Progress bar rendered on right side
- [x] Progress bar position reflects scroll position
- [x] Progress bar at boundaries (top/bottom)
- [x] Unit tests pass

**Acceptance Criteria**:
- [x] Scroll indicators rendered correctly
- [x] Indicators update dynamically as user scrolls
- [x] Progress bar position accurate
- [x] Indicators show correct state at boundaries
- [x] Unit tests pass

## Phase 5: Enhance ModalInputHandler - Scrolling and Selection (~40 minutes)

**Goal**: Update ModalInputHandler to handle scrolling with movement keys and new selection behavior.

**Tasks**:
- [ ] Open `src/ui/ModalInputHandler.js`
- [ ] Add `calculateMaxScroll(modal)` helper method
  ```javascript
  calculateMaxScroll(modal) {
    // Need access to renderer or calculate here
    // This might need to be passed from ModalRenderer or calculated differently
    // For now, we'll need to get viewport and total height
    // This is a placeholder - actual implementation depends on architecture
  }
  ```
- [ ] Update `handleKeypress()` to handle scrolling with movement keys
  ```javascript
  // Scrolling (movement keys)
  if (keyString === 'up' || keyString === 'w') {
    modal.scrollUp();
    this.modalManager.triggerStateChange(); // Re-render
    return true;
  }
  
  if (keyString === 'down' || keyString === 's') {
    const maxScroll = this.calculateMaxScroll(modal);
    modal.scrollDown(maxScroll);
    this.modalManager.triggerStateChange(); // Re-render
    return true;
  }
  ```
- [ ] Update Enter key handling to select option and close modal
  ```javascript
  if (keyString === 'return' || keyString === 'enter') {
    this.selectOptionAndClose(modal);
    return true;
  }
  ```
- [ ] Add Space key handling to select option and keep modal open
  ```javascript
  if (keyString === 'space') {
    this.selectOptionAndKeepOpen(modal);
    return true;
  }
  ```
- [ ] Add `selectOptionAndClose(modal)` method
  ```javascript
  selectOptionAndClose(modal) {
    if (this.isSelectedOptionVisible(modal)) {
      this.executeOptionAction(modal, true); // close = true
    }
  }
  ```
- [ ] Add `selectOptionAndKeepOpen(modal)` method
  ```javascript
  selectOptionAndKeepOpen(modal) {
    if (this.isSelectedOptionVisible(modal)) {
      this.executeOptionAction(modal, false); // close = false
    }
  }
  ```
- [ ] Update `executeOptionAction(modal, shouldClose)` method
  ```javascript
  executeOptionAction(modal, shouldClose) {
    const content = modal.getContent();
    const options = content.filter(block => block.type === 'option');
    const selectedOption = options[modal.getSelectedIndex()];
    
    if (selectedOption && selectedOption.action) {
      const optionsParam = { modal }; // Pass modal reference
      selectedOption.action(optionsParam);
      
      if (shouldClose) {
        this.modalManager.closeModal();
      }
    }
  }
  ```
- [ ] Add `isSelectedOptionVisible(modal)` method
  ```javascript
  isSelectedOptionVisible(modal) {
    // Check if selected option is within visible viewport
    // This needs to check scroll position and viewport boundaries
    // Implementation depends on how we track option positions
    return true; // Placeholder
  }
  ```
- [ ] Remove old `navigateUp()` and `navigateDown()` methods (movement keys now scroll)
- [ ] Update `ModalManager` to add `triggerStateChange()` method if needed (for re-rendering)
- [ ] Create unit tests for scrolling and selection (`test/ui/ModalInputHandler.scrolling.test.js`)
  - Test movement keys scroll content
  - Test Enter key selects and closes modal
  - Test Space key selects and keeps modal open
  - Test option actions receive `options` parameter
  - Test modal reference in `options.modal`
  - Test selected option visibility check
- [ ] Run tests to verify scrolling and selection
- [ ] Commit: "Enhancement: Update ModalInputHandler for scrolling and new selection behavior"

**Verification Checklist**:
- [ ] Movement keys scroll content (not navigate options)
- [ ] Enter key selects option and closes modal
- [ ] Space key selects option and keeps modal open
- [ ] Option actions receive `options` parameter with `modal` reference
- [ ] Selected option visibility check works
- [ ] Old navigation methods removed
- [ ] Unit tests pass

**Acceptance Criteria**:
- [ ] Movement keys scroll content
- [ ] Enter key selects and closes modal
- [ ] Space key selects and keeps modal open
- [ ] Option actions receive modal reference
- [ ] Only visible options can be selected
- [ ] Unit tests pass

## Phase 6: Enhance ModalManager - Scroll Position Persistence (~20 minutes)

**Goal**: Add modal stacking support and preserve scroll position during stacking.

**Tasks**:
- [ ] Open `src/ui/ModalManager.js`
- [ ] Add `modalStack` property to track stacked modals
  ```javascript
  constructor() {
    this.currentModal = null;
    this.modalStack = []; // NEW: Stack for modal stacking
  }
  ```
- [ ] Update `openModal()` to push current modal to stack if one exists
  ```javascript
  openModal(modal) {
    // If there's already a modal open, preserve it in stack
    if (this.currentModal) {
      this.modalStack.push(this.currentModal);
    }
    this.currentModal = modal;
    // New modal starts with scrollPosition = 0 (handled in Modal constructor)
  }
  ```
- [ ] Update `closeModal()` to restore modal from stack if one exists
  ```javascript
  closeModal() {
    this.currentModal = null;
    // If there's a modal in stack, restore it
    if (this.modalStack.length > 0) {
      this.currentModal = this.modalStack.pop();
      // Scroll position automatically restored (it's in modal instance)
    }
  }
  ```
- [ ] Update `reset()` to clear stack
  ```javascript
  reset() {
    this.currentModal = null;
    this.modalStack = [];
  }
  ```
- [ ] Create unit tests for scroll position persistence (`test/ui/ModalManager.scrolling.test.js`)
  - Test scroll position preserved during modal stacking
  - Test scroll position restored when modal shown again
  - Test each modal maintains its own scroll position
  - Test modal stacking works correctly
- [ ] Run tests to verify scroll position persistence
- [ ] Commit: "Enhancement: Add modal stacking and scroll position persistence to ModalManager"

**Verification Checklist**:
- [ ] `modalStack` property exists
- [ ] Scroll position preserved when modal is hidden (stacking)
- [ ] Scroll position restored when modal is shown again
- [ ] Each modal maintains its own scroll position
- [ ] Modal stacking works correctly
- [ ] Unit tests pass

**Acceptance Criteria**:
- [ ] Scroll position preserved during modal stacking
- [ ] Scroll position restored when modal shown again
- [ ] Each modal maintains its own scroll position
- [ ] Modal stacking works correctly
- [ ] Unit tests pass

## Phase 7: Add Option State Rendering (Active vs Selected) (~30 minutes)

**Goal**: Render options with appropriate glyphs for selected and active states.

**Tasks**:
- [ ] Open `src/render/ModalRenderer.js`
- [ ] Update `renderContent()` to check for active state on options
  ```javascript
  // In option rendering:
  const isSelected = optionIndex === selectedIndex && lineIndex === 0;
  const isActive = block.active === true; // Check active property
  ```
- [ ] Update option rendering logic to show different glyphs
  ```javascript
  let prefix = '';
  if (isSelected) {
    prefix = '> '; // Selected indicator
  } else if (isActive) {
    prefix = '✓ '; // Active indicator (checkmark)
  } else {
    prefix = '  '; // No indicator (two spaces for alignment)
  }
  ```
- [ ] Update `updateSelectionOnly()` to handle active state rendering
  - Render active options with checkmark even when not selected
  - Render selected option with `>` prefix
- [ ] Update `buildOptionLinesMap()` to track active state if needed
- [ ] Create unit tests for option state rendering (`test/render/ModalRenderer.optionStates.test.js`)
  - Test selected option rendered with `>` prefix
  - Test active option rendered with checkmark glyph
  - Test both states can exist simultaneously
  - Test selected option must be visible
  - Test active state persists in hidden content
- [ ] Run tests to verify option state rendering
- [ ] Commit: "Enhancement: Add option state rendering (active vs selected) to ModalRenderer"

**Verification Checklist**:
- [ ] Selected option rendered with `>` prefix
- [ ] Active option rendered with checkmark glyph
- [ ] Both states can exist simultaneously
- [ ] Selected option must be visible
- [ ] Active state persists in hidden content
- [ ] Unit tests pass

**Acceptance Criteria**:
- [ ] Selected option rendered with `>` prefix
- [ ] Active option rendered with checkmark glyph
- [ ] Both states can exist simultaneously
- [ ] Selected option must be visible
- [ ] Active state persists in hidden content
- [ ] Unit tests pass

## Phase 8: Update Tests (~30 minutes)

**Goal**: Update existing tests and add comprehensive test coverage for scrolling functionality.

**Tasks**:
- [ ] Review existing modal tests
- [ ] Update existing tests to account for scrolling changes
  - Update `test/render/Renderer.modal.test.js` if needed
  - Update `test/ui/Modal.test.js` if needed
  - Update `test/ui/ModalInputHandler.test.js` if needed
  - Update `test/ui/ModalManager.test.js` if needed
- [ ] Ensure all new test files are created and passing
  - `test/ui/Modal.scrolling.test.js`
  - `test/render/ModalRenderer.viewport.test.js`
  - `test/render/ModalRenderer.clipping.test.js`
  - `test/render/ModalRenderer.indicators.test.js`
  - `test/ui/ModalInputHandler.scrolling.test.js`
  - `test/ui/ModalManager.scrolling.test.js`
  - `test/render/ModalRenderer.optionStates.test.js`
- [ ] Run all tests to ensure everything passes
- [ ] Fix any failing tests
- [ ] Commit: "Test: Update and add tests for modal scrolling functionality"

**Verification Checklist**:
- [ ] All existing tests updated
- [ ] All new test files created
- [ ] All tests pass
- [ ] Test coverage is comprehensive

**Acceptance Criteria**:
- [ ] All existing tests updated
- [ ] All new tests created and passing
- [ ] Test coverage comprehensive
- [ ] All tests pass

## Phase 9: Integration Testing (~30 minutes)

**Goal**: Create integration tests to verify scrolling works end-to-end.

**Tasks**:
- [ ] Create integration test file (`test/integration/modal-scrolling.test.js`)
- [ ] Test scrolling with long content (multiple messages)
- [ ] Test scrolling with wrapped text
- [ ] Test scroll indicators appear/disappear correctly
- [ ] Test progress bar updates during scrolling
- [ ] Test option selection with scrolling
- [ ] Test active vs selected option states
- [ ] Test modal-level action execution
- [ ] Test option actions calling modal action
- [ ] Test scroll position persistence during stacking
- [ ] Test viewport clipping (content doesn't render beyond bounds)
- [ ] Test scrolling boundaries (top/bottom)
- [ ] Run integration tests
- [ ] Fix any issues found
- [ ] Commit: "Test: Add integration tests for modal scrolling"

**Verification Checklist**:
- [ ] Integration tests created
- [ ] All integration tests pass
- [ ] Scrolling works end-to-end
- [ ] All features work together correctly

**Acceptance Criteria**:
- [ ] Integration tests created
- [ ] All integration tests pass
- [ ] Scrolling works end-to-end
- [ ] All features work together correctly

## Completion Checklist

- [ ] All phases completed
- [ ] All tests pass
- [ ] Viewport clipping implemented
- [ ] Scrolling works correctly
- [ ] Scroll indicators work
- [ ] Option selection works (Enter/Space)
- [ ] Option states work (active vs selected)
- [ ] Modal actions work
- [ ] Scroll position persistence works
- [ ] Performance is acceptable

## Testing Strategy

### Unit Tests
- **Modal Class**: Scroll position tracking, scroll methods, action property
- **ModalRenderer**: Viewport calculation, content height, clipping, indicators
- **ModalInputHandler**: Scrolling keys, selection keys, option actions
- **ModalManager**: Scroll position persistence, modal stacking

### Integration Tests
- Scrolling with long content
- Scrolling with wrapped text
- Scroll indicators
- Option selection with scrolling
- Active vs selected states
- Modal actions
- Scroll position persistence
- Viewport clipping

### Manual Testing
- Test scrolling with test modal (`src/modes/testModal.js`)
- Test scrolling with various content lengths
- Test scroll indicators
- Test option selection
- Test modal stacking
- Test performance with very long content

## Dependencies

- Modal system (✅ Complete)
- Text wrapping (✅ Complete)
- ModalRenderer (✅ Complete)
- ModalInputHandler (✅ Complete)
- ModalManager (✅ Complete)

## Notes

- Test modal (`src/modes/testModal.js`) demonstrates the need with long Lorem ipsum messages
- Test modal also demonstrates new features (modal-level action, option parameters)
- Scrolling should work seamlessly with existing text wrapping functionality
- Consider accessibility implications of scrolling mechanism
- Keyboard-only scrolling for now (mouse scrolling can be added later)
- Scrolling should maintain modal visual design (borders, shadows, etc.)
- Active vs Selected distinction: Active = checkboxes (multiple), Selected = radio button (one)
- Selected option glyph should be visually distinct from active/checked state
- Need to handle `triggerStateChange()` in ModalManager or Renderer for re-rendering after scroll

## Status

**Current Phase**: Not Started

**Completed Phases**: None

**Status**: ⏳ NOT STARTED - Ready for implementation

