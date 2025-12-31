# Gameplan: Modal System Implementation

**Reference Card**: `docs/development/cards/features/FEATURE_modal_system.md`  
**Reference Specs**: `docs/development/specs/modal-system/modal-system_SPECS.md`

## Overview

This gameplan implements a modal system that can display content over the game and allow players to interact with selectable options. The implementation follows an MVP-first approach, starting with core functionality and gradually adding more advanced features.

## MVP Phase: Core Modal Functionality

**Goal**: Create a working modal system with basic display, selection, and closing capabilities.

### Phase 1: Basic Modal Infrastructure ✅ COMPLETE

**Goal**: Set up the basic structure and infrastructure for modals.

**Tasks**:
- [x] Create `src/ui/` directory
- [x] Create `src/ui/Modal.js` - Basic Modal class
  - Constructor accepts title and content array
  - Basic structure: `{ title: string, content: Array<{type: 'message'|'option', ...}> }`
  - Track selected option index (default: 0)
  - Basic methods: `getTitle()`, `getContent()`, `getSelectedIndex()`, `setSelectedIndex()`
- [x] Create `src/ui/ModalManager.js` - Basic ModalManager class
  - Track current modal (single modal, no stacking yet)
  - Methods: `openModal(modal)`, `closeModal()`, `getCurrentModal()`, `hasOpenModal()`
  - Reset method for game restart
- [x] Create basic unit tests for Modal and ModalManager
- [x] Commit: "Feat: Add basic Modal and ModalManager classes"

**Acceptance Criteria**:
- Modal class can be instantiated with title and content
- ModalManager can open and close modals
- ModalManager tracks current modal state
- Basic unit tests pass

### Phase 2: Basic Modal Rendering ✅ COMPLETE

**Goal**: Render modals on screen with basic visual elements.

**Tasks**:
- [x] Create `src/render/ModalRenderer.js` - Basic ModalRenderer helper class
  - Render modal border using ASCII box-drawing characters (┌─┐│└─┘)
  - Render title at top
  - Render content blocks (messages as plain text, options with labels)
  - Basic positioning (centered on screen)
  - Fixed size (simple dimensions, not percentage-based yet)
- [x] Integrate ModalRenderer into `src/render/Renderer.js`
  - Check if modal is open (via ModalManager)
  - Render modal over game board
  - Basic background (simple dimming, not full shadow effect yet)
- [x] Create basic unit tests for ModalRenderer
- [x] Commit: "Feat: Add basic modal rendering"

**Acceptance Criteria**:
- Modal renders with border and title
- Content blocks (messages and options) render correctly
- Modal appears centered on screen
- Modal renders over game board
- Basic unit tests pass

### Phase 3: Basic Input Handling ✅ COMPLETE

**Goal**: Handle modal input and integrate with InputHandler.

**Tasks**:
- [x] Create `src/ui/ModalInputHandler.js` - Basic ModalInputHandler helper class
  - Handle up/down keys for option navigation (skip message blocks)
  - Handle Enter key for option selection
  - Handle ESC and 'q' keys for closing modal
  - Return boolean indicating if key was handled
- [x] Integrate ModalInputHandler into `src/input/InputHandler.js`
  - Check if modal is open (via ModalManager)
  - If open: delegate to ModalInputHandler helper and return (no game input processing)
  - If closed: handle game input normally
- [x] Create basic unit tests for ModalInputHandler
- [x] Create integration tests for InputHandler with modal
- [x] Commit: "Feat: Add modal input handling and InputHandler integration"

**Acceptance Criteria**:
- Up/down keys navigate options (skip message blocks)
- Enter key selects option
- ESC and 'q' keys close modal
- When modal is open, no game inputs are processed
- When modal is closed, game inputs work normally
- Unit and integration tests pass

### Phase 4: Basic Action Execution ✅ COMPLETE

**Goal**: Execute actions when options are selected.

**Tasks**:
- [x] Implement action execution in Modal class
  - Execute action when option is selected
  - Support synchronous actions
  - Auto-close modal after action (default behavior)
- [x] Update ModalManager to handle action execution
  - Execute action from selected option
  - Close modal after action (default)
- [ ] Create example modal in local mode
  - Simple "Game Over" modal with "Restart" and "Quit" options
  - **Note**: Deferred until ModalManager is integrated into game modes (Phase 5 or later)
- [x] Create integration tests for action execution
- [x] Commit: "Feat: Add action execution for modal options"

**Acceptance Criteria**:
- Options can have associated actions
- Actions execute when option is selected
- Modal closes after action by default
- Example modal works in local mode
- Integration tests pass

### Phase 5: Integrate ModalManager into Local Mode ✅ COMPLETE

**Goal**: Make modals functional in local mode.

**Tasks**:
- [x] Create ModalManager instance in `src/modes/localMode.js`
- [x] Pass ModalManager to Renderer constructor
- [x] Pass ModalManager to InputHandler constructor
- [x] Create example "Game Over" modal with "Restart" and "Quit" options
- [x] Test modal can be opened and interacted with
- [x] Commit: "Feat: Integrate ModalManager into local mode"

**Acceptance Criteria**:
- ModalManager is instantiated in local mode
- Renderer receives ModalManager and can render modals
- InputHandler receives ModalManager and can handle modal input
- Example modal can be opened and closed
- Modal input works correctly
- Game input is blocked when modal is open

### Phase 6: Integrate ModalManager into Networked Mode ✅ COMPLETE

**Goal**: Make modals functional in networked mode.

**Tasks**:
- [x] Create ModalManager instance in `src/modes/networkedMode.js`
- [x] Pass ModalManager to Renderer constructor
- [x] Pass ModalManager to InputHandler constructor
- [x] Add modal reset on server restart and game restart
- [x] Add modal state change callback for re-rendering
- [x] Test modal can be opened and interacted with in networked mode
- [x] Commit: "Feat: Integrate ModalManager into networked mode"

**Acceptance Criteria**:
- ModalManager is instantiated in networked mode
- Renderer receives ModalManager and can render modals
- InputHandler receives ModalManager and can handle modal input
- Example modal can be opened and closed
- Modal input works correctly
- Game input is blocked when modal is open

### Phase 7: MVP Testing and Refinement ✅ COMPLETE

**Goal**: Ensure MVP is fully functional and tested.

**Tasks**:
- [x] Create comprehensive integration tests
  - Modal opening/closing in both modes
  - Option navigation and selection
  - Action execution
  - Input routing (modal vs game)
  - Modal state change callbacks
  - Rendering integration
  - End-to-end flows
- [x] Manual testing
  - Test in local mode
  - Test in networked mode
  - Test modal display and interaction
  - Test that game input is blocked when modal is open
- [x] Fix any bugs or issues found
- [x] Update documentation if needed
- [x] Commit: "Test: Add comprehensive modal system integration tests"

**Acceptance Criteria**:
- All MVP functionality works correctly in both modes
- All tests pass (unit and integration)
- Manual testing confirms expected behavior
- No critical bugs
- MVP is ready for use

## Enhancement Phase Group: Visual Polish

**Goal**: Improve visual appearance and user experience.

### Phase 8: Enhanced Visual Design

**Tasks**:
- [x] Add background dimming/obscuring for game board
- [x] Add shadow effect for modal
- [x] Improve selection indicator (add background highlight and different text color)
- [x] Update ModalRenderer to support enhanced visuals
- [x] Add modal configuration to gameConfig.js for customization
  - Selection colors: backgroundColor, textColor, bold
  - Shadow: enabled, character, offsetX, offsetY
  - Background dimming: enabled, character
- [x] Update ModalRenderer to use config values
- [x] Test visual appearance
- [x] Commit: "Feat: Enhance modal visual design"
- [x] Commit: "Feat: Add modal configuration for customization"

**Acceptance Criteria**:
- Modal has dimmed/obscured background
- Modal has shadow effect
- Selected option has `>` prefix, background highlight, and different text color
- Modal visual aspects are configurable via gameConfig.modal
- Visual appearance is polished

### Phase 9: Percentage-Based Sizing

**Tasks**:
- [x] Add dimensions configuration to gameConfig.modal
  - Structure: `dimensions: { enabled, width, height }`
  - Defaults if config is missing or disabled
  - If height is missing but width is present, height uses width value
- [x] Update ModalRenderer to use percentage-based sizing
- [x] Modal dimensions: configurable percentages relative to terminal size
- [x] Handle terminal resizing (if needed)
- [x] Test with different terminal sizes
- [x] Test with configuration enabled/disabled
- [x] Commit: "Feat: Add percentage-based modal sizing with configuration"

**Acceptance Criteria**:
- Modal dimensions configuration exists in gameConfig.modal
- Modal size is percentage-based relative to terminal when enabled
- Modal scales appropriately with terminal size
- Configuration defaults work when missing or disabled
- Height uses width value if height is missing but width is present
- Works with different terminal dimensions

### Phase 9.5: Text Wrapping

**Goal**: Implement text wrapping for modal content to prevent overflow.

**Tasks**:
- [ ] Evaluate text wrapping implementation approach (see alternatives below)
- [ ] Implement text wrapping for message blocks (`text` property)
- [ ] Implement text wrapping for option blocks (`label` property)
- [ ] Handle wrapping with respect to modal width (accounting for padding)
- [ ] Preserve existing newlines (don't re-wrap already wrapped content)
- [ ] Create tests for text wrapping functionality
- [ ] Test with various content lengths and modal widths
- [ ] Commit: "Feat: Add text wrapping for modal content"

**Acceptance Criteria**:
- Long text in message blocks wraps to fit modal width
- Long labels in option blocks wrap to fit modal width
- Wrapping respects modal padding
- Existing newlines are preserved
- Wrapped content renders correctly
- Tests pass

**Implementation Alternatives**:

1. **Pre-processor Approach** (User's suggestion)
   - Transform `text` and `label` values in Modal constructor or a preprocessing step
   - Add `\n` characters to achieve wrapping
   - **Pros**: Simple, content is pre-processed once
   - **Cons**: Modifies original content, needs re-processing if modal width changes

2. **Render-time Wrapping**
   - Wrap text during rendering in ModalRenderer
   - Compute wrapped lines on-the-fly
   - **Pros**: Doesn't modify original content, always uses current modal width
   - **Cons**: Recomputes on every render, more complex render logic

3. **Cached Wrapped Content**
   - Pre-compute wrapped lines when modal is created or dimensions change
   - Store wrapped content separately from original
   - **Pros**: Efficient rendering, preserves original content
   - **Cons**: Requires tracking wrapped state, needs invalidation on dimension changes

4. **Lazy Wrapping with Memoization**
   - Wrap on-demand when rendering, but cache the result
   - Invalidate cache when modal dimensions change
   - **Pros**: Best of both worlds (efficient + current)
   - **Cons**: More complex state management
   - **Newline Handling**: 
     - Split text by existing `\n` characters first (preserves intentional line breaks)
     - Wrap each resulting segment independently
     - Original newlines create hard breaks (new wrapping context starts)
     - Result is a flat array of lines where original newlines are honored
     - Example: `"Line 1\nLong line that wraps"` → Split: `["Line 1", "Long line that wraps"]` → Wrap each → `["Line 1", "Long line", "that wraps"]`

5. **Wrapper Method in Modal**
   - Add method like `getWrappedContent(width)` that returns wrapped content blocks
   - Original content remains unchanged
   - **Pros**: Clean API, preserves original content
   - **Cons**: Requires width parameter, may need caching for efficiency

6. **Separate Wrapped Content Storage**
   - Store both original and wrapped versions in Modal
   - Update wrapped version when dimensions change
   - **Pros**: Efficient, preserves original
   - **Cons**: More memory, needs update mechanism

**Recommendation**: Consider **Option 3 (Cached Wrapped Content)** or **Option 4 (Lazy Wrapping with Memoization)** for best balance of efficiency and correctness, especially when combined with percentage-based sizing (Phase 9) where modal width can change.

## Enhancement Phase Group: Content Scrolling

**Goal**: Support long content with scrolling.

### Phase 10: Content Scrolling

**Tasks**:
- [ ] Add scroll position tracking to Modal class
  - Methods: `scrollContentUp()`, `scrollContentDown()`, `getScrollPosition()`
- [ ] Update ModalInputHandler to handle scrolling
  - Up/down keys scroll content when content exceeds viewport
  - Distinguish between scrolling and option navigation (when to scroll vs navigate)
- [ ] Update ModalRenderer to render visible portion of content
  - Render only content visible in viewport
  - Handle scroll position
- [ ] Create tests for scrolling functionality
- [ ] Commit: "Feat: Add content scrolling for long modals"

**Acceptance Criteria**:
- Long content can be scrolled vertically
- Up/down keys scroll content when it exceeds viewport
- Only visible content is rendered
- Scrolling works correctly with intermixed messages and options
- Tests pass

### Phase 11: Selected Option Auto-Scroll

**Tasks**:
- [ ] Implement auto-scroll to selected option
  - When option is selected via navigation, scroll it into view if off-screen
- [ ] Update ModalRenderer to handle auto-scroll
- [ ] Test auto-scroll behavior
- [ ] Commit: "Feat: Add auto-scroll to selected option"

**Acceptance Criteria**:
- Selected option automatically scrolls into view if off-screen
- Navigation maintains visibility of selected option
- Works correctly with long content

## Enhancement Phase Group: Advanced Features

**Goal**: Add advanced functionality for complex use cases.

### Phase 12: Modal Stacking

**Tasks**:
- [ ] Update ModalManager to support modal stack
  - Stack-based storage (array of modals)
  - Opening modal B from modal A: hide A, show B
  - Closing modal B: show A
  - Closing last modal: return to game
- [ ] Update rendering to show only top modal
- [ ] Update input handling for stacked modals
- [ ] Create tests for modal stacking
- [ ] Commit: "Feat: Add modal stacking support"

**Acceptance Criteria**:
- Multiple modals can be stacked
- Opening new modal hides previous
- Closing modal restores previous
- Only top modal receives input
- Only top modal is rendered
- Tests pass

### Phase 13: Async Actions and Loading State

**Tasks**:
- [ ] Add support for async actions (Promise-returning actions)
- [ ] Add loading state indicator for async actions
- [ ] Update ModalRenderer to show loading state
- [ ] Prevent input during async action execution
- [ ] Create tests for async actions
- [ ] Commit: "Feat: Add async action support with loading state"

**Acceptance Criteria**:
- Async actions are supported
- Loading state is displayed during async action
- Input is blocked during async action
- Modal closes after async action completes
- Tests pass

### Phase 14: Action Return Values and Custom Close Keys

**Tasks**:
- [ ] Add support for action return values (configurable)
  - `true` or truthy: close modal
  - `false` or falsy: keep modal open
- [ ] Add `useActionReturnValue` config option
- [ ] Add `closeKey` config option (string or array of strings)
- [ ] Update ModalInputHandler to handle custom close keys
- [ ] Add `autoClose` option per action (default: true)
- [ ] Create tests for action return values and custom close keys
- [ ] Commit: "Feat: Add action return values and custom close keys"

**Acceptance Criteria**:
- Action return values work (if enabled)
- Custom close keys work (if configured)
- Per-action `autoClose` option works
- Tests pass

## Enhancement Phase Group: Animation and Game Mode Integration

**Goal**: Add animations and integrate with game modes.

### Phase 15: Modal Animation

**Tasks**:
- [ ] Add animation state tracking to Modal class
  - Methods: `isAnimating()`, `getAnimationProgress()`
- [ ] Implement opening animation
  - Start as horizontal line in middle of viewport
  - Top and bottom grow simultaneously (top upward, bottom downward)
  - Reach full size
- [ ] Update ModalRenderer to render animation frames
- [ ] Ignore input during animation
- [ ] Create tests for animation
- [ ] Commit: "Feat: Add modal opening animation"

**Acceptance Criteria**:
- Modal animates when opening
- Animation is smooth and visually appealing
- Top and bottom grow simultaneously
- Input is ignored during animation
- Tests pass

### Phase 16: Game Mode Integration

**Tasks**:
- [ ] Integrate ModalManager into local mode
  - Pause game when modal opens
  - Resume game when modal closes
- [ ] Integrate ModalManager into networked mode
  - Game continues when modal opens
  - Other players see still character
- [ ] Ensure actions execute in correct game mode context
- [ ] Create integration tests for both modes
- [ ] Commit: "Feat: Integrate modal system with game modes"

**Acceptance Criteria**:
- Local mode pauses when modal opens
- Local mode resumes when modal closes
- Networked mode continues when modal opens
- Actions execute in correct game mode context
- Integration tests pass

## Enhancement Phase Group: Polish and Edge Cases

**Goal**: Handle edge cases and polish the system.

### Phase 17: Edge Cases and Error Handling

**Tasks**:
- [ ] Handle edge cases:
  - Modal with no options (message-only)
  - Modal with no content (title only)
  - Very long content
  - Terminal resizing during modal display
  - Rapid modal open/close
- [ ] Add error handling:
  - Action throws exception (log error, close modal or keep open)
  - Rendering errors (log error, fallback display)
- [ ] Create tests for edge cases
- [ ] Commit: "Feat: Add edge case handling and error handling"

**Acceptance Criteria**:
- Edge cases are handled gracefully
- Errors are logged appropriately
- System doesn't crash on edge cases
- Tests pass

### Phase 18: Performance Optimization

**Tasks**:
- [ ] Optimize rendering (only render when modal is open)
- [ ] Minimize re-renders (only render on state changes)
- [ ] Consider caching rendered content (if needed)
- [ ] Performance testing
- [ ] Commit: "Perf: Optimize modal rendering performance"

**Acceptance Criteria**:
- Modal rendering is efficient
- No unnecessary re-renders
- Performance is acceptable
- No performance regressions

## Testing Strategy

### Unit Tests
- Modal class: content structure, option selection, scrolling
- ModalManager: stack management, state tracking, reset
- ModalInputHandler: key handling, returns boolean
- ModalRenderer: rendering, positioning, sizing

### Integration Tests
- Modal opening/closing in local mode
- Modal opening/closing in networked mode
- Input routing (modal vs game)
- Action execution
- Modal stacking
- Content scrolling
- Animation

### Manual Testing
- Visual appearance
- User interaction
- Game mode behavior
- Edge cases

## Dependencies

- Input handling system (`InputHandler`)
- Rendering system (`Renderer`)
- Terminal utilities (`ansi-escapes`, `chalk`)
- Game mode implementations (`localMode`, `networkedMode`)

## Notes

- MVP focuses on core functionality: display, selection, closing, basic actions
- Enhancements are added incrementally in phases
- Each phase builds on previous phases
- Testing is integrated throughout
- Performance considerations are addressed in later phases
- Animation and advanced features come after core functionality is solid

## Status

**Current Phase**: Not Started

**Completed Phases**: None

**Next Steps**: Begin Phase 1 - Basic Modal Infrastructure

