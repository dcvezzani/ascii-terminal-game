# Specification: Modal Content Scrolling

## Overview

This specification details the implementation of scrolling support for the modal system, allowing users to view all content when it exceeds the modal viewport. The enhancement includes viewport clipping, line-by-line scrolling, scroll indicators, and support for modal-level actions and option states (active vs selected).

**Reference Card**: `docs/development/cards/enhancements/ENHANCEMENT_modal_scrolling.md`

## Goals

1. Implement viewport clipping to confine content to modal boundaries
2. Add line-by-line scrolling mechanism for vertical content navigation
3. Support scroll indicators (arrows and progress bar) for visual feedback
4. Integrate scrolling with option selection (selected vs active states)
5. Support modal-level actions and option action parameters
6. Preserve scroll position during modal stacking
7. Optimize rendering performance with viewport clipping

## Current State

**Current Architecture**:

- `src/ui/Modal.js` - Modal class
  - Manages modal content (title, messages, options)
  - Tracks selected option index
  - No scroll position tracking
  - No modal-level action support
  - No active/selected state distinction
- `src/render/ModalRenderer.js` - Modal renderer helper
  - Renders all content blocks sequentially
  - No viewport clipping
  - Content renders beyond modal bounds
  - No scroll indicators
- `src/ui/ModalInputHandler.js` - Modal input handler helper
  - Handles up/down navigation for option selection
  - Handles Enter key for option execution
  - No scrolling support
- `src/ui/ModalManager.js` - Modal manager
  - Manages modal state (open/closed)
  - Supports modal stacking (hide/show)
  - Does not preserve scroll position during stacking

**Current Limitations**:

- Content renders beyond modal viewport when it exceeds available space
- No scrolling mechanism to view hidden content
- No visual indicators for scrollable content
- Movement keys only navigate options, don't scroll content
- No support for modal-level actions
- No distinction between active (checked) and selected options
- Option actions don't receive modal reference

**Current Code**:

```javascript
// Modal.js - No scrolling support
constructor(config) {
  this.title = config.title;
  this.content = config.content || [];
  this.selectedIndex = config.selectedIndex ?? 0;
  // No scrollPosition property
  // No action property
}

// ModalRenderer.js - Renders all content
renderContent(startX, startY, width, content, selectedIndex) {
  let currentY = startY + 2;
  content.forEach(block => {
    // Renders all blocks, continues beyond modal bounds
    currentY++; // No viewport clipping
  });
}
```

## Target State

**Enhanced Architecture**:

- `src/ui/Modal.js` - Enhanced Modal class
  - Tracks scroll position (`scrollPosition` property)
  - Supports modal-level action (`action` property)
  - Manages scroll state per modal instance
  - Methods: `getScrollPosition()`, `setScrollPosition()`, `scrollUp()`, `scrollDown()`
- `src/render/ModalRenderer.js` - Enhanced ModalRenderer helper
  - Calculates viewport boundaries
  - Clips content to viewport (only renders visible lines)
  - Renders scroll indicators (`↑`, `↓`, progress bar)
  - Calculates total content height for scrolling
  - Handles wrapped text lines in scroll calculations
- `src/ui/ModalInputHandler.js` - Enhanced ModalInputHandler helper
  - Handles movement keys for scrolling content
  - Handles Enter key (selects option and closes modal)
  - Handles Space key (selects option and leaves modal open)
  - Supports active vs selected option states
  - Passes `options` parameter to option actions with `modal` reference
- `src/ui/ModalManager.js` - Enhanced ModalManager
  - Preserves scroll position when modal is hidden (modal stacking)
  - Restores scroll position when modal is shown again
  - Each modal in stack maintains its own scroll position

**New Features**:

1. **Viewport Clipping**: Content is clipped to modal viewport, only visible lines are rendered
2. **Line-by-Line Scrolling**: Movement keys scroll content one line at a time
3. **Scroll Indicators**: `↑`/`↓` arrows and progress bar on right side
4. **Modal-Level Actions**: Modal can have form submission action
5. **Option States**: Active (multiple can be checked) vs Selected (only one)
6. **Option Action Parameters**: Actions receive `options` parameter with `modal` reference
7. **Scroll Position Persistence**: Preserved during modal stacking

**New Game Flow (With Scrolling)**:

1. Modal opens with long content
2. Content is clipped to viewport (only visible lines rendered)
3. User presses up/down to scroll content line-by-line
4. Scroll indicators show scrollable state and progress
5. User scrolls to see options, then selects with Enter/Space
6. If modal A opens modal B, modal A's scroll position is preserved
7. When modal B closes, modal A's scroll position is restored

**Benefits**:

- All modal content is accessible regardless of length
- Better user experience for information-heavy modals
- Visual feedback for scrollable state
- Efficient rendering (only visible content)
- Support for form-like modals with submission actions
- Flexible option states (active vs selected)

## Functional Requirements

### FR1: Viewport Clipping

**Requirement**: Content must be clipped to modal viewport boundaries. Only visible content within the viewport should be rendered.

**Details**:

- Calculate viewport boundaries based on modal dimensions
- Viewport = content area (modal height - title - padding - borders)
- Only render content lines that fall within viewport
- Content outside viewport is not rendered (performance optimization)
- Wrapped text lines are counted individually for clipping

**Viewport Calculation**:

```javascript
// Viewport boundaries
const viewportStartY = startY + 2; // After title line
const viewportEndY = startY + modalHeight - 1; // Before bottom border
const viewportHeight = viewportEndY - viewportStartY + 1;
```

**Acceptance Criteria**:

- [ ] Content is clipped to viewport boundaries
- [ ] Only visible lines are rendered
- [ ] Content outside viewport is not rendered
- [ ] Wrapped text lines are handled correctly in clipping

### FR2: Line-by-Line Scrolling

**Requirement**: Users must be able to scroll content vertically one line at a time using movement keys.

**Details**:

- Movement keys (up/down arrows, WASD) scroll content
- Each keypress scrolls content by exactly one line
- Scrolling reveals hidden content above or below viewport
- Scrolling works for all content (messages and options)
- Each wrapped text line scrolls independently
- Scroll position is stored in Modal class as `scrollPosition` property

**Scrolling Behavior**:

- `scrollPosition = 0`: Content starts at top (first line visible)
- `scrollPosition = N`: Content scrolled down by N lines
- Maximum scroll position = total content lines - viewport height
- Scrolling stops at boundaries (top/bottom)

**Acceptance Criteria**:

- [ ] Movement keys scroll content one line at a time
- [ ] Scrolling reveals hidden content above/below
- [ ] Each wrapped line scrolls independently
- [ ] Scroll position is tracked in Modal class
- [ ] Scrolling stops at top/bottom boundaries

### FR3: Scroll Controls

**Requirement**: Movement keys scroll content, Enter/Space keys select options with different behaviors.

**Details**:

- **Movement keys (up/down, WASD)**: Scroll content line-by-line
- **Enter key**: Selects currently selected option and closes modal
- **Space key**: Selects currently selected option and leaves modal open
- Selected option must be visible in viewport to be selectable
- Active/checked options can exist in both visible and hidden content

**Key Mapping**:

```javascript
// Movement keys → scroll content
'up' / 'w' → scrollUp()
'down' / 's' → scrollDown()

// Selection keys
'return' / 'enter' → selectOption() && closeModal()
'space' → selectOption() && keepModalOpen()
```

**Acceptance Criteria**:

- [ ] Movement keys scroll content
- [ ] Enter key selects option and closes modal
- [ ] Space key selects option and leaves modal open
- [ ] Selected option must be visible to be selectable
- [ ] Active options persist regardless of scroll position

### FR4: Scroll Indicators

**Requirement**: Visual indicators must show scrollable state and scroll progress.

**Details**:

- **Top indicator**: Show `↑` when content is scrollable above (scrollPosition > 0)
- **Bottom indicator**: Show `↓` when content is scrollable below (scrollPosition < maxScroll)
- **Progress bar**: Show on right side of modal, indicates scroll position
  - Progress bar position = (scrollPosition / maxScroll) * viewportHeight
  - At top boundary: Progress bar at very top
  - At bottom boundary: Progress bar at very bottom
- Indicators update dynamically as user scrolls

**Progress Bar Calculation**:

```javascript
const maxScroll = totalContentLines - viewportHeight;
const progressRatio = scrollPosition / maxScroll;
const progressBarY = viewportStartY + (progressRatio * viewportHeight);
```

**Acceptance Criteria**:

- [ ] `↑` indicator shown when scrollable above
- [ ] `↓` indicator shown when scrollable below
- [ ] Progress bar shown on right side
- [ ] Progress bar position reflects scroll position
- [ ] Progress bar at top when at top boundary
- [ ] Progress bar at bottom when at bottom boundary

### FR5: Option States (Active vs Selected)

**Requirement**: Options must support both active (checked) and selected states.

**Details**:

- **Selected**: Only one option can be selected at a time (indicated by glyph like `>`)
- **Active**: Multiple options can be active/checked simultaneously (indicated by different glyph)
- Options have `active` property to mark them as active when modal opens
- Selected option must be visible in viewport to be selectable
- Active options can exist in both visible and hidden content
- Active state persists regardless of scroll position

**Option Structure**:

```javascript
{
  type: 'option',
  label: 'Option Label',
  active: true, // Optional: mark as active/checked
  action: (options) => { /* action */ }
}
```

**Acceptance Criteria**:

- [ ] Only one option can be selected at a time
- [ ] Multiple options can be active simultaneously
- [ ] Selected option indicated with glyph (e.g., `>`)
- [ ] Active options indicated with different glyph (e.g., `✓`)
- [ ] Selected option must be visible to be selectable
- [ ] Active options persist in hidden content

### FR6: Modal-Level Actions

**Requirement**: Modal must support modal-level action for form submission, and option actions must receive modal reference.

**Details**:

- Modal can have `action` property (modal-level submit action)
- Option actions receive `options` parameter: `action: (options) => { ... }`
- Options can access modal via `options.modal`
- Option actions can optionally call modal's form action: `if (modal?.action) modal.action();`
- Modal-level action is called when form is submitted (via option action)

**Modal Structure**:

```javascript
{
  title: 'Form Modal',
  action: () => { /* Modal-level submit action */ },
  content: [
    {
      type: 'option',
      label: 'Submit',
      action: (options) => {
        const { modal } = options;
        if (modal?.action) modal.action(); // Call modal action
      }
    }
  ]
}
```

**Acceptance Criteria**:

- [ ] Modal can have `action` property
- [ ] Option actions receive `options` parameter
- [ ] Options can access modal via `options.modal`
- [ ] Option actions can call modal's action handler
- [ ] Modal action is executed when called from option

### FR7: Scroll Position Persistence

**Requirement**: Scroll position must reset when modal opens, but be preserved during modal stacking.

**Details**:

- **Initial state**: Scroll position resets to 0 (top) when modal first opens
- **Modal stacking**: If modal A opens modal B, modal A's scroll position is preserved
- **Restoration**: When modal B closes and modal A is shown again, modal A's scroll position is restored
- Each modal in stack maintains its own scroll position independently
- Scroll position stored in Modal class as `scrollPosition` property

**Stacking Behavior**:

```javascript
// Modal A opens (scrollPosition = 0)
modalA.scrollPosition = 5; // User scrolls
// Modal A opens Modal B (modalA hidden)
// modalA.scrollPosition = 5 (preserved)
// Modal B closes, Modal A shown again
// modalA.scrollPosition = 5 (restored)
```

**Acceptance Criteria**:

- [ ] Scroll position resets to 0 when modal first opens
- [ ] Scroll position preserved when modal is hidden (stacking)
- [ ] Scroll position restored when modal is shown again
- [ ] Each modal maintains its own scroll position
- [ ] Scroll position stored in Modal class

### FR8: Scroll Boundaries

**Requirement**: Scrolling must stop at top/bottom boundaries with visual feedback.

**Details**:

- Scrolling stops at top boundary (cannot scroll above first line)
- Scrolling stops at bottom boundary (cannot scroll below last line)
- Progress bar provides visual feedback:
  - At top: Progress bar at very top of viewport
  - At bottom: Progress bar at very bottom of viewport
- No scrolling occurs when at boundaries (movement keys do nothing)

**Boundary Detection**:

```javascript
// Top boundary
if (scrollPosition <= 0) {
  scrollPosition = 0; // Stop at top
  // Progress bar at very top
}

// Bottom boundary
if (scrollPosition >= maxScroll) {
  scrollPosition = maxScroll; // Stop at bottom
  // Progress bar at very bottom
}
```

**Acceptance Criteria**:

- [ ] Scrolling stops at top boundary
- [ ] Scrolling stops at bottom boundary
- [ ] Progress bar at top when at top boundary
- [ ] Progress bar at bottom when at bottom boundary
- [ ] No scrolling when at boundaries

### FR9: Wrapped Text Scrolling

**Requirement**: Each wrapped text line must scroll independently.

**Details**:

- Text wrapping creates multiple lines from single content block
- Each wrapped line is treated as separate line for scrolling
- Scrolling one line moves one wrapped line (fine-grained)
- Consistent with line-by-line scrolling behavior
- Wrapped lines are counted in total content height calculation

**Wrapping Example**:

```javascript
// Original text: "Long text that wraps"
// Wrapped to 3 lines:
// Line 1: "Long text that"
// Line 2: "wraps"
// Line 3: "" (empty line)
// Each line scrolls independently
```

**Acceptance Criteria**:

- [ ] Each wrapped line scrolls independently
- [ ] Wrapped lines counted in total content height
- [ ] Scrolling moves one wrapped line at a time
- [ ] Consistent with line-by-line scrolling

### FR10: Performance Optimization

**Requirement**: Only visible content within viewport must be rendered.

**Details**:

- Re-render only visible content (viewport clipping)
- Content outside viewport is not rendered (improves performance)
- Viewport clipping ensures efficient rendering for long content
- Matches existing incremental rendering approach
- No performance degradation with long content

**Rendering Optimization**:

```javascript
// Only render lines within viewport
const visibleStartLine = scrollPosition;
const visibleEndLine = scrollPosition + viewportHeight - 1;

contentLines.forEach((line, index) => {
  if (index >= visibleStartLine && index <= visibleEndLine) {
    // Render line (within viewport)
  }
  // Skip lines outside viewport (not rendered)
});
```

**Acceptance Criteria**:

- [ ] Only visible content is rendered
- [ ] Content outside viewport is not rendered
- [ ] Performance remains good with long content
- [ ] Viewport clipping implemented correctly

## Technical Requirements

### TR1: Modal Class Enhancement

**Requirement**: Enhance Modal class to support scrolling and modal-level actions.

**Details**:

- Add `scrollPosition` property (number, default: 0)
- Add `action` property (function, optional)
- Add methods: `getScrollPosition()`, `setScrollPosition(position)`, `scrollUp()`, `scrollDown()`
- Add method: `getAction()` to retrieve modal-level action
- Scroll position is per-modal instance (supports stacking)

**Class Structure**:

```javascript
class Modal {
  constructor(config) {
    this.title = config.title;
    this.content = config.content || [];
    this.selectedIndex = config.selectedIndex ?? 0;
    this.scrollPosition = 0; // NEW: Scroll position
    this.action = config.action; // NEW: Modal-level action
  }
  
  getScrollPosition() { return this.scrollPosition; }
  setScrollPosition(position) { this.scrollPosition = position; }
  scrollUp() { /* Decrement scrollPosition, clamp to 0 */ }
  scrollDown(maxScroll) { /* Increment scrollPosition, clamp to maxScroll */ }
  getAction() { return this.action; }
}
```

**Acceptance Criteria**:

- [ ] Modal class has `scrollPosition` property
- [ ] Modal class has `action` property
- [ ] Scroll methods implemented (scrollUp, scrollDown)
- [ ] Scroll position clamps to boundaries
- [ ] Modal-level action accessible via `getAction()`

### TR2: ModalRenderer Enhancement

**Requirement**: Enhance ModalRenderer to support viewport clipping and scroll indicators.

**Details**:

- Calculate viewport boundaries (startY, endY, height)
- Calculate total content height (all wrapped lines)
- Clip content rendering to viewport (only render visible lines)
- Render scroll indicators (`↑`, `↓`, progress bar)
- Calculate scroll position for progress bar
- Handle wrapped text in height calculations

**Viewport Calculation**:

```javascript
calculateViewport(startY, modalHeight) {
  const viewportStartY = startY + 2; // After title
  const viewportEndY = startY + modalHeight - 1; // Before bottom border
  const viewportHeight = viewportEndY - viewportStartY + 1;
  return { viewportStartY, viewportEndY, viewportHeight };
}
```

**Content Height Calculation**:

```javascript
calculateTotalContentHeight(content, width) {
  let totalLines = 0;
  content.forEach(block => {
    if (block.type === 'message') {
      const wrapped = this.wrapTextWithNewlines(block.text, width);
      totalLines += wrapped.length;
    } else if (block.type === 'option') {
      const wrapped = this.wrapTextWithNewlines(block.label, width - 2);
      totalLines += wrapped.length;
    }
  });
  return totalLines;
}
```

**Acceptance Criteria**:

- [ ] Viewport boundaries calculated correctly
- [ ] Total content height calculated (including wrapped lines)
- [ ] Content clipped to viewport
- [ ] Scroll indicators rendered (`↑`, `↓`, progress bar)
- [ ] Progress bar position calculated correctly

### TR3: ModalInputHandler Enhancement

**Requirement**: Enhance ModalInputHandler to support scrolling and new key behaviors.

**Details**:

- Movement keys (up/down, WASD) scroll content instead of navigating options
- Enter key selects option and closes modal
- Space key selects option and leaves modal open
- Pass `options` parameter to option actions: `{ modal }`
- Support active vs selected option states
- Only select options that are visible in viewport

**Key Handling**:

```javascript
handleKeypress(str, key, modal) {
  const keyString = String(key.name || key.sequence).toLowerCase();
  
  // Scrolling
  if (keyString === 'up' || keyString === 'w') {
    modal.scrollUp();
    return true;
  }
  if (keyString === 'down' || keyString === 's') {
    const maxScroll = this.calculateMaxScroll(modal);
    modal.scrollDown(maxScroll);
    return true;
  }
  
  // Selection
  if (keyString === 'return' || keyString === 'enter') {
    this.selectOptionAndClose(modal);
    return true;
  }
  if (keyString === 'space') {
    this.selectOptionAndKeepOpen(modal);
    return true;
  }
}
```

**Option Action Execution**:

```javascript
executeOptionAction(option, modal) {
  if (option.action) {
    const options = { modal }; // Pass modal reference
    option.action(options);
  }
}
```

**Acceptance Criteria**:

- [ ] Movement keys scroll content
- [ ] Enter key selects and closes modal
- [ ] Space key selects and keeps modal open
- [ ] Option actions receive `options` parameter
- [ ] Only visible options can be selected

### TR4: ModalManager Enhancement

**Requirement**: Enhance ModalManager to preserve scroll position during modal stacking.

**Details**:

- When modal is hidden (another modal opens), preserve its scroll position
- When modal is shown again (other modal closes), restore its scroll position
- Each modal in stack maintains its own scroll position
- Scroll position is stored in Modal instance (not in ModalManager)

**Stacking Behavior**:

```javascript
// Modal A is open, scrollPosition = 5
openModal(modalB) {
  // modalA.scrollPosition = 5 (preserved in modalA instance)
  this.currentModal = modalB; // Hide modalA, show modalB
}

closeModal() {
  // If modalA was hidden, restore it
  // modalA.scrollPosition = 5 (restored from modalA instance)
}
```

**Acceptance Criteria**:

- [ ] Scroll position preserved when modal is hidden
- [ ] Scroll position restored when modal is shown again
- [ ] Each modal maintains its own scroll position
- [ ] Modal stacking works correctly with scrolling

### TR5: Option State Rendering

**Requirement**: Render options with appropriate glyphs for selected and active states.

**Details**:

- **Selected option**: Render with `>` prefix and highlight (only one can be selected)
- **Active option**: Render with checkmark glyph (e.g., `✓`) (multiple can be active)
- Selected option must be visible in viewport
- Active options can be in hidden content (state persists)
- Both states can exist simultaneously (option can be both active and selected)

**Rendering Logic**:

```javascript
renderOption(option, isSelected, isActive) {
  let prefix = '';
  if (isSelected) {
    prefix = '> '; // Selected indicator
  } else if (isActive) {
    prefix = '✓ '; // Active indicator
  } else {
    prefix = '  '; // No indicator
  }
  // Render option with prefix
}
```

**Acceptance Criteria**:

- [ ] Selected option rendered with `>` prefix
- [ ] Active option rendered with checkmark glyph
- [ ] Both states can exist simultaneously
- [ ] Selected option must be visible
- [ ] Active state persists in hidden content

## Implementation Details

### Modal Class Changes

**File**: `src/ui/Modal.js`

**Changes**:

1. Add `scrollPosition` property to constructor
2. Add `action` property to constructor
3. Add scroll methods: `getScrollPosition()`, `setScrollPosition()`, `scrollUp()`, `scrollDown()`
4. Add `getAction()` method

**Code**:

```javascript
export class Modal {
  constructor(config) {
    this.title = config.title;
    this.content = config.content || [];
    this.selectedIndex = config.selectedIndex ?? 0;
    this.scrollPosition = 0; // NEW
    this.action = config.action; // NEW
  }
  
  getScrollPosition() {
    return this.scrollPosition;
  }
  
  setScrollPosition(position) {
    this.scrollPosition = Math.max(0, position);
  }
  
  scrollUp() {
    if (this.scrollPosition > 0) {
      this.scrollPosition--;
    }
  }
  
  scrollDown(maxScroll) {
    if (this.scrollPosition < maxScroll) {
      this.scrollPosition++;
    }
  }
  
  getAction() {
    return this.action;
  }
}
```

### ModalRenderer Changes

**File**: `src/render/ModalRenderer.js`

**Changes**:

1. Add viewport calculation methods
2. Add content height calculation (including wrapped lines)
3. Update `renderContent()` to clip to viewport
4. Add scroll indicator rendering methods
5. Update `buildOptionLinesMap()` to account for scroll position

**Key Methods**:

```javascript
calculateViewport(startY, modalHeight) {
  const viewportStartY = startY + 2; // After title
  const viewportEndY = startY + modalHeight - 1;
  const viewportHeight = viewportEndY - viewportStartY + 1;
  return { viewportStartY, viewportEndY, viewportHeight };
}

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

renderScrollIndicators(startX, startY, modalWidth, modalHeight, scrollPosition, maxScroll, viewportHeight) {
  const viewportStartY = startY + 2;
  const viewportEndY = startY + modalHeight - 1;
  
  // Top indicator (↑)
  if (scrollPosition > 0) {
    const indicatorX = startX + modalWidth - 1;
    process.stdout.write(ansiEscapes.cursorTo(indicatorX, viewportStartY));
    process.stdout.write(chalk.dim('↑'));
  }
  
  // Bottom indicator (↓)
  if (scrollPosition < maxScroll) {
    const indicatorX = startX + modalWidth - 1;
    process.stdout.write(ansiEscapes.cursorTo(indicatorX, viewportEndY));
    process.stdout.write(chalk.dim('↓'));
  }
  
  // Progress bar (right side)
  if (maxScroll > 0) {
    const progressRatio = scrollPosition / maxScroll;
    const progressBarY = viewportStartY + Math.floor(progressRatio * viewportHeight);
    const progressBarX = startX + modalWidth - 1;
    process.stdout.write(ansiEscapes.cursorTo(progressBarX, progressBarY));
    process.stdout.write(chalk.dim('█')); // Solid block for progress
  }
}

renderContent(startX, startY, width, content, selectedIndex, scrollPosition) {
  const viewport = this.calculateViewport(startY, /* modalHeight */);
  const totalHeight = this.calculateTotalContentHeight(content, width);
  const maxScroll = Math.max(0, totalHeight - viewport.viewportHeight);
  
  // Clamp scroll position
  const clampedScroll = Math.max(0, Math.min(scrollPosition, maxScroll));
  
  // Build all content lines (with wrapping)
  const allLines = this.buildContentLines(content, width);
  
  // Render only visible lines
  const visibleStart = clampedScroll;
  const visibleEnd = clampedScroll + viewport.viewportHeight - 1;
  
  let currentY = viewport.viewportStartY;
  for (let i = visibleStart; i <= visibleEnd && i < allLines.length; i++) {
    const line = allLines[i];
    // Render line at currentY
    currentY++;
  }
  
  // Render scroll indicators
  this.renderScrollIndicators(startX, startY, width, /* modalHeight */, clampedScroll, maxScroll, viewport.viewportHeight);
}
```

### ModalInputHandler Changes

**File**: `src/ui/ModalInputHandler.js`

**Changes**:

1. Update movement key handling to scroll content
2. Add Enter key handling (select and close)
3. Add Space key handling (select and keep open)
4. Update option action execution to pass `options` parameter
5. Check if selected option is visible before allowing selection

**Key Handling**:

```javascript
handleKeypress(str, key, modal) {
  const keyString = String(key.name || key.sequence).toLowerCase();
  
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
  
  // Selection
  if (keyString === 'return' || keyString === 'enter') {
    this.selectOptionAndClose(modal);
    return true;
  }
  
  if (keyString === 'space') {
    this.selectOptionAndKeepOpen(modal);
    return true;
  }
  
  // ESC and 'q' still close modal
  if (keyString === 'escape' || keyString === 'q') {
    this.modalManager.closeModal();
    return true;
  }
  
  return false;
}

selectOptionAndClose(modal) {
  if (this.isSelectedOptionVisible(modal)) {
    this.executeOptionAction(modal, true); // close = true
  }
}

selectOptionAndKeepOpen(modal) {
  if (this.isSelectedOptionVisible(modal)) {
    this.executeOptionAction(modal, false); // close = false
  }
}

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

isSelectedOptionVisible(modal) {
  // Check if selected option is within visible viewport
  // Implementation depends on viewport and scroll position
  return true; // Placeholder
}
```

### ModalManager Changes

**File**: `src/ui/ModalManager.js`

**Changes**:

1. Preserve scroll position when modal is hidden (stacking)
2. Restore scroll position when modal is shown again
3. Each modal maintains its own scroll position (stored in Modal instance)

**Stacking Support**:

```javascript
openModal(modal) {
  // If there's already a modal open, preserve its scroll position
  // (scroll position is already stored in modal instance)
  this.modalStack.push(this.currentModal);
  this.currentModal = modal;
  // New modal starts with scrollPosition = 0
}

closeModal() {
  this.currentModal = null;
  // If there's a modal in stack, restore it
  // (scroll position is already in modal instance, no action needed)
  if (this.modalStack.length > 0) {
    this.currentModal = this.modalStack.pop();
    // Scroll position automatically restored (it's in modal instance)
  }
}
```

## Testing Requirements

### Unit Tests

**Modal Class Tests** (`test/ui/Modal.scrolling.test.js`):

- [ ] Test `scrollPosition` property initialization (defaults to 0)
- [ ] Test `scrollUp()` method (decrements, clamps to 0)
- [ ] Test `scrollDown()` method (increments, clamps to maxScroll)
- [ ] Test `setScrollPosition()` method (sets and clamps)
- [ ] Test `getScrollPosition()` method
- [ ] Test `action` property storage and retrieval
- [ ] Test scroll position boundaries (top/bottom)

**ModalRenderer Tests** (`test/render/ModalRenderer.scrolling.test.js`):

- [ ] Test viewport calculation
- [ ] Test total content height calculation (with wrapped text)
- [ ] Test content clipping to viewport
- [ ] Test scroll indicator rendering (`↑`, `↓`)
- [ ] Test progress bar rendering and position
- [ ] Test wrapped text in height calculations

**ModalInputHandler Tests** (`test/ui/ModalInputHandler.scrolling.test.js`):

- [ ] Test movement keys scroll content
- [ ] Test Enter key selects and closes modal
- [ ] Test Space key selects and keeps modal open
- [ ] Test option actions receive `options` parameter
- [ ] Test modal reference in `options.modal`
- [ ] Test selected option visibility check

**ModalManager Tests** (`test/ui/ModalManager.scrolling.test.js`):

- [ ] Test scroll position preserved during modal stacking
- [ ] Test scroll position restored when modal shown again
- [ ] Test each modal maintains its own scroll position

### Integration Tests

**Modal Scrolling Integration** (`test/integration/modal-scrolling.test.js`):

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

## Success Criteria

1. **Viewport Clipping**: Content is confined to modal viewport, no overflow
2. **Scrolling Works**: Users can scroll to view all content using movement keys
3. **Scroll Indicators**: Visual indicators show scrollable state and progress
4. **Option Selection**: Enter/Space keys select options with correct behavior
5. **Option States**: Active and selected states work correctly
6. **Modal Actions**: Modal-level actions and option action parameters work
7. **Scroll Persistence**: Scroll position preserved during modal stacking
8. **Performance**: Rendering remains efficient with long content
9. **Wrapped Text**: Wrapped text scrolls correctly (line-by-line)
10. **Boundaries**: Scrolling stops at boundaries with visual feedback

## Related Features

- **X_FEATURE_modal_system** - Base modal system that this enhancement extends
- **X_BUG_modal_overwritten_by_player_movement** - Related to modal rendering (already fixed)

## Dependencies

- Modal system must be functional (✅ Complete)
- Text wrapping must be functional (✅ Complete)
- ModalRenderer must support viewport calculations
- ModalInputHandler must support scroll key handling
- ModalManager must support modal stacking (✅ Complete)

## Notes

- Test modal (`src/modes/testModal.js`) demonstrates the need with long Lorem ipsum messages
- Test modal also demonstrates new features (modal-level action, option parameters)
- Scrolling should work seamlessly with existing text wrapping functionality
- Consider accessibility implications of scrolling mechanism
- Keyboard-only scrolling for now (mouse scrolling can be added later)
- Scrolling should maintain modal visual design (borders, shadows, etc.)
- Active vs Selected distinction: Active = checkboxes (multiple), Selected = radio button (one)
- Selected option glyph should be visually distinct from active/checked state

