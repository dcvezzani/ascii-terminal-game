# Enhancement: Modal Content Scrolling

## Context

The modal system has been implemented and is functional, but it does not currently support scrolling when content exceeds the modal viewport. When modal content (messages and options) is longer than the available space, it renders beyond the modal bounds, making it impossible to view all content.

**Location**:
- Modal class: `src/ui/Modal.js` - Currently has no scrolling support
- Modal renderer: `src/render/ModalRenderer.js` - Renders all content without viewport clipping
- Modal input handler: `src/ui/ModalInputHandler.js` - Handles navigation but not scrolling
- Test modal: `src/modes/testModal.js` - Contains long messages that overflow modal bounds

**Current State**:
- Modal displays all content blocks (messages and options) sequentially
- Content that exceeds modal height renders beyond the visible area
- No scrolling mechanism exists
- No visual indicators for scrollable content
- Movement keys (up/down) are used for option navigation, not content scrolling

**Current Code**:
```javascript
// Modal.js - No scroll position tracking
constructor(config) {
  this.title = config.title;
  this.content = config.content || [];
  this.selectedIndex = config.selectedIndex ?? 0;
  this.action = config.action; // Modal-level action (new in testModal.js)
  // No scrollPosition property
}

// ModalRenderer.js - Renders all content without clipping
renderContent(startX, startY, width, content, selectedIndex) {
  // Renders all content blocks, no viewport clipping
  content.forEach(block => {
    // ... render block ...
    currentY++; // Continues beyond modal bounds
  });
}

// testModal.js - Example showing new features
{
  title: 'Network Test',
  action: () => { /* Modal-level submit action */ },
  content: [
    { type: 'option', label: 'Close', action: (options) => {
      const { modal } = options;
      if (modal?.action) modal.action(); // Option can call modal action
    }}
  ]
}
```

## Problem

**Current Limitations**:

1. **No Viewport Clipping**: Content renders beyond modal bounds when it exceeds available space
2. **No Scrolling Support**: Users cannot scroll to view content that doesn't fit in the viewport
3. **Content Overflow**: Long messages or many options become inaccessible
4. **No Scroll Indicators**: No visual feedback indicating that more content is available
5. **Navigation vs Scrolling**: Movement keys (up/down) are used for option selection, not content scrolling

**Impact**:
- Long modal content is inaccessible
- Poor user experience when modals contain extensive information
- Test modal with multiple long messages demonstrates the issue
- Limits the usefulness of modals for displaying detailed information

**Example**:
The test modal in `src/modes/testModal.js` includes several long Lorem ipsum messages that extend beyond the modal viewport, making them impossible to read.

**New Features Discovered in testModal.js**:
The test modal implementation reveals additional modal features that should be incorporated:
- **Modal-level action**: Modal can have an `action` property for form submission
- **Option action parameters**: Option actions receive an `options` parameter: `action: (options) => { ... }`
- **Modal reference in options**: Options can access modal via `options.modal`
- **Form action integration**: Option actions can call modal's form action: `if (modal?.action) modal.action();`

## Desired Enhancement

Add scrolling support to the modal system so that content is confined to the modal viewport and users can scroll to view all content using movement buttons.

### Requirements

1. **Viewport Clipping**
   - Content should be clipped to modal viewport boundaries
   - Only visible content within viewport should be rendered
   - Content outside viewport should not be displayed

2. **Scrolling Mechanism**
   - Users should be able to scroll content vertically (up/down)
   - Scrolling should reveal hidden content above or below viewport
   - Scrolling should work for all content (messages and options)
   - Line-by-line scrolling (one line per keypress)

3. **Scroll Controls**
   - Movement keys (up/down arrows, WASD) navigate within modal
   - Scrolling content is confined to modal viewport
   - **Enter key**: Selects option and closes modal
   - **Space key**: Selects option and leaves modal open
   - Selected options identified with appropriate glyph

4. **Option States** (New Feature)
   - **Selected**: Only one option can be selected at a time (indicated by glyph)
   - **Active**: Multiple options can be active/checked simultaneously
   - Options have property to mark them as active when modal opens
   - Active state is different from selected state
   - Active options are like checkboxes (multiple can be checked)
   - Selected option is like radio button (only one selected)

5. **Modal-Level Actions** (New Feature)
   - Modal can have a modal-level "submit" action (`action` property)
   - Option actions receive `options` parameter: `action: (options) => { ... }`
   - Options can access modal via `options.modal`
   - Option actions can optionally call modal's form action handler
   - Example: `action: (options) => { const { modal } = options; if (modal?.action) modal.action(); }`

6. **Visual Indicators**
   - Scrollbar-like indicators: `↑` at top when scrollable above, `↓` at bottom when scrollable below
   - Progress indicator on the right side showing scroll progress
   - Progress bar at very top when at top boundary
   - Progress bar at very bottom when at bottom boundary
   - Visual feedback for scrollable state and current position

7. **Scroll Behavior**
   - Line-by-line scrolling (one line per keypress)
   - Each wrapped line scrolls independently (consistent with line-by-line scrolling)
   - Selected options can only be selected when visible in viewport
   - Active/checked options can exist in both visible and hidden content
   - Scrolling stops at boundaries (top/bottom) with progress bar feedback
   - Initial scroll position: Always start at top (scroll position = 0) when modal opens
   - Modal stacking: If modal A opens modal B, modal A's scroll position is preserved and restored when modal B closes

8. **Scroll State Management**
   - Scroll position stored in Modal class as `scrollPosition` property
   - Each modal instance manages its own scroll position
   - Supports modal stacking (each modal maintains its own scroll state)

9. **Performance Optimization**
   - Re-render only visible content (viewport clipping)
   - Content outside viewport is not rendered
 - Efficient rendering for long content

## Open Questions & Answers

### 1. Scroll Control Method ✅ ANSWERED

**Question**: How should users control scrolling?

**Answer**: **Option A** - Movement keys (up/down) scroll content, separate keys for option selection

**Details**:
- When modal is open, movement keys (up/down arrows, WASD) navigate within the modal
- Scrolling content is confined to the modal viewport
- **Enter key**: Selects option and closes modal
- **Space key**: Selects option and leaves modal open
- Selected options are identified with an appropriate glyph
- Options can have an `active` property to mark them as active/checked when modal opens
- **Active vs Selected**: Only one option can be "selected" at a time, but multiple options can be "active" (checked) simultaneously
- Modal can have a modal-level "submit" action (`action` property)
- Option actions receive `options` parameter: `action: (options) => { const { modal } = options; ... }`
- Option actions can optionally call modal's form action handler: `if (modal?.action) modal.action();`

**Implementation Notes**:
- See `src/modes/testModal.js` for example implementation showing modal-level `action` and option actions with `options` parameter

### 2. Scrolling Granularity ✅ ANSWERED

**Question**: How should content scroll?

**Answer**: **Option A** - Line-by-line scrolling (one line per keypress)

**Details**:
- Each movement keypress scrolls content by one line
- Simple, predictable scrolling behavior
- Works well with wrapped text (each wrapped line scrolls independently)

### 3. Option Selection During Scrolling ✅ ANSWERED

**Question**: How should option selection work when content is scrollable?

**Answer**: **Option A** - Options are selectable only when visible in viewport (scroll to see more options)

**Details**:
- Movement keys scroll content, and options are selected only when visible
- **Selected options**: Can only be selected if they are visible in the viewport
- **Active/checked options**: Can exist both in visible and hidden content (active state persists regardless of scroll position)
- Users must scroll to see options before they can be selected
- Selected option must be within visible viewport to be selectable

### 4. Scroll Indicators ✅ ANSWERED

**Question**: How should scrollable state be indicated to users?

**Answer**: **Option A** - Scrollbar-like indicators (e.g., `↑` at top, `↓` at bottom when scrollable)

**Details**:
- Show `↑` indicator at top when content is scrollable above
- Show `↓` indicator at bottom when content is scrollable below
- **Progress indicator on the right**: Show scroll progress (scrollbar-like indicator on right side)
- Visual feedback indicates scrollable state and current position

### 5. Scroll Position Persistence ✅ ANSWERED

**Question**: Should scroll position be preserved?

**Answer**: **Option A** - Scroll position resets when modal opens (always start at top)

**Details**:
- Scroll position resets to top (scroll position = 0) when modal opens
- **Modal Stacking Exception**: If modal A opens modal B, the scroll position of modal A should be preserved
- When modal B closes and modal A is shown again, modal A's scroll position is restored
- This allows users to return to their previous scroll position when navigating between modals

### 6. Wrapped Text Scrolling ✅ ANSWERED

**Question**: How should wrapped text lines be handled in scrolling?

**Answer**: **Option A** - Each wrapped line scrolls independently (fine-grained scrolling)

**Details**:
- Each wrapped line scrolls independently (consistent with line-by-line scrolling from Question 2)
- Fine-grained scrolling provides precise control
- Works seamlessly with existing text wrapping functionality

### 7. Scroll Boundaries ✅ ANSWERED

**Question**: What happens at scroll boundaries (top/bottom)?

**Answer**: **Option A** - Scrolling stops at boundaries (with progress bar feedback)

**Details**:
- Scrolling stops at top boundary (cannot scroll above first line)
- Scrolling stops at bottom boundary (cannot scroll below last line)
- **Progress bar feedback**: When at top, progress bar should be at the very top
- **Progress bar feedback**: When at bottom, progress bar should be at the very bottom
- Progress bar provides visual feedback for boundary state

### 8. Initial Scroll Position ✅ ANSWERED

**Question**: Where should scrolling start when modal opens?

**Answer**: **Option A** - Always start at top (scroll position = 0)

**Details**:
- Modal always starts at top (scroll position = 0) when first opened
- **Exception**: See Question 5 (Scroll Position Persistence) - if modal was previously open and closed (e.g., modal A opens modal B, then modal B closes), restore previous scroll position
- Consistent starting point provides predictable user experience

### 9. Scroll State Management ✅ ANSWERED

**Question**: Where should scroll position be stored?

**Answer**: **Option A** - In Modal class (as `scrollPosition` property)

**Details**:
- Scroll position stored as `scrollPosition` property in Modal class
- Each modal instance manages its own scroll position
- Supports modal stacking (each modal maintains its own scroll state)
- Simple and straightforward architecture

### 10. Performance Considerations ✅ ANSWERED

**Question**: How should scrolling performance be optimized?

**Answer**: **Option A** - Re-render only visible content (viewport clipping)

**Details**:
- Only render content that is visible within the viewport
- Content outside viewport is not rendered (improves performance)
- Viewport clipping ensures efficient rendering for long content
- Matches existing incremental rendering approach used elsewhere in the system

## Related Features

- **X_FEATURE_modal_system** - Base modal system that this enhancement extends
- **X_BUG_modal_overwritten_by_player_movement** - Related to modal rendering (already fixed)

## Dependencies

- Modal system must be functional (✅ Complete)
- ModalRenderer must support viewport calculations
- ModalInputHandler must support scroll key handling
- Text wrapping must be functional (✅ Complete)

## Documentation

- **SPECS**: `docs/development/specs/modal-scrolling/modal-scrolling_SPECS.md` ✅ Created
- **GAMEPLAN**: `docs/development/gameplans/modal-scrolling/modal-scrolling_GAMEPLAN.md` ✅ Created

## Status

**Status**: ✅ COMPLETE

**Priority**: MEDIUM

- Improves usability of modals with long content
- Not critical for basic modal functionality
- Enhances user experience for information-heavy modals
- All questions answered, specification and gameplan created, implementation complete

**Implementation Status**:
- ✅ All 9 phases completed
- ✅ All 133 new tests created and passing (112 unit tests + 21 integration tests)
- ✅ Viewport clipping implemented
- ✅ Scrolling mechanism implemented (line-by-line)
- ✅ Scroll indicators implemented (↑/↓ arrows and progress bar)
- ✅ Option selection with scrolling (Enter/Space keys)
- ✅ Active vs selected option states implemented
- ✅ Modal-level actions implemented
- ✅ Scroll position persistence during modal stacking implemented
- ✅ All features tested and verified

**Questions Answered**:
- ✅ Question 1: Scroll Control Method - Movement keys navigate, Enter/Space select options
- ✅ Question 2: Scrolling Granularity - Line-by-line scrolling
- ✅ Question 3: Option Selection During Scrolling - Options selectable only when visible
- ✅ Question 4: Scroll Indicators - Scrollbar-like indicators with progress bar
- ✅ Question 5: Scroll Position Persistence - Resets on open, preserved during modal stacking
- ✅ Question 6: Wrapped Text Scrolling - Each wrapped line scrolls independently
- ✅ Question 7: Scroll Boundaries - Stops at boundaries with progress bar feedback
- ✅ Question 8: Initial Scroll Position - Always start at top (except modal stacking)
- ✅ Question 9: Scroll State Management - Stored in Modal class as scrollPosition property
- ✅ Question 10: Performance Considerations - Re-render only visible content (viewport clipping)

**Completion Date**: 2026-01-04

**Test Results**:
- 112 new unit tests across 7 test files
- 21 integration tests covering end-to-end scenarios
- All 133 new tests passing
- Full test suite: 855 total tests (826 passing; 29 WebSocket tests require running server)

## Notes

- Test modal (`src/modes/testModal.js`) demonstrates the need with long Lorem ipsum messages
- Test modal also demonstrates new features:
  - Modal-level `action` property for form submission
  - Option actions receiving `options` parameter with `modal` reference
  - Option actions calling modal's form action handler
- Scrolling should work seamlessly with existing text wrapping functionality
- Consider accessibility implications of scrolling mechanism
- May want to support both keyboard and mouse scrolling in future (keyboard-only for now)
- Scrolling should maintain modal visual design (borders, shadows, etc.)
- Active vs Selected distinction: Active options are like checkboxes (multiple can be checked), Selected option is like radio button (only one selected)
- Selected option glyph should be visually distinct from active/checked state

