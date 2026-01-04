# Feature: Modal System

## Context

Currently, the game has limited ways to display information to players and no way to present interactive choices. Players can see the game board, status bar, and help screen, but there's no system for displaying modal dialogs with messages and selectable options.

**Location**:
- Input handling: `src/input/InputHandler.js` - Keyboard input handling with callback-based actions
- Rendering: `src/render/Renderer.js` - Terminal rendering system
- Client modes: `src/modes/networkedMode.js` and `src/modes/localMode.js` - Game mode implementations

**Current System**:
- InputHandler uses callback-based action system (callbacks passed to constructor)
- Renderer handles terminal rendering with ANSI escapes
- Help screen exists but is static (no interactivity)
- No modal or dialog system exists

## Problem

**Current Limitations**:

1. **No Modal System**: There's no way to display modal dialogs over the game
2. **No Interactive Messages**: Messages can only be displayed statically (e.g., help screen)
3. **No Selectable Options**: Players cannot make choices from a list of options
4. **No Action Association**: No system to associate UI options with game actions
5. **Limited User Interaction**: Only keyboard commands exist, no menu-based interaction

**Use Cases**:

- Display informational messages to players
- Present choices (e.g., "Restart game?", "Quit?", "Change settings?")
- Show game events (e.g., "Player joined", "Connection lost", "Game over")
- Confirmation dialogs (e.g., "Are you sure you want to quit?")
- Settings menus
- Multiplayer lobby options
- Error messages with action options

## Desired Feature

A modal system that can display content over the game and allow players to interact with selectable options.

### Requirements

1. **Modal Display**
   - Render modal content over the game board
   - Modal should be visually distinct (border, background, etc.)
   - Modal should be centered or positioned appropriately
   - Modal should block game input while active (or capture input for modal)
   - Modal should be dismissible (ESC key or close action)

2. **Message Display**
   - Display informational messages/text content
   - Support multi-line messages
   - Support formatted text (colors, styles)
   - Messages should be clearly readable

3. **Selectable Options**
   - Display a list of selectable options
   - Options should be visually distinct (highlighted when selected)
   - Support navigation between options using directional keys (up/down arrows)
   - Support selection using Enter key
   - Visual indicator for currently selected option (e.g., `>` prefix, highlight, or different color)

4. **Action Association**
   - Each option should be associated with an action (callback function)
   - Actions should be similar to how InputHandler associates keys with callbacks
   - When an option is selected (Enter pressed), its associated action should be executed
   - Actions can be any function (e.g., close modal, restart game, quit, show another modal, etc.)

5. **Modal Management**
   - Support opening/closing modals
   - Support multiple modals (stack-based or single active modal)
   - Modal should capture input while active
   - Game input should be disabled or redirected to modal while modal is open

## Technical Details

### Current Input System

**InputHandler Callback Pattern**:
```javascript
const inputHandler = new InputHandler({
  onMoveUp: () => { /* action */ },
  onMoveDown: () => { /* action */ },
  onQuit: () => { /* action */ },
  // ... other callbacks
});
```

**Key-to-Action Mapping**:
- Keys are mapped to callbacks in `handleKeypress()` method
- Callbacks are stored in `this.callbacks` object
- Actions are executed when keys are pressed

### Proposed Implementation

**Selected Approach**: Modal Manager with Helper Classes
- Create a `ModalManager` class to manage active modals (required for stacking support)
- Create a `Modal` class in `src/ui/Modal.js` (new UI directory)
- Create `ModalInputHandler` helper class used by `InputHandler` (similar to `ModalRenderer`/`Renderer` relationship)
- Create `ModalRenderer` helper class used by `Renderer`
- Modal state managed externally by ModalManager
- InputHandler and Renderer are "controllers" - bulk of logic in helpers
- Supports modal stacking (hide/show behavior)

### Modal Structure

```javascript
{
  title: "Game Over",
  content: [
    {
      type: 'message',
      text: "You have been defeated!"
    },
    {
      type: 'message',
      text: "\nWhat would you like to do?"
    },
    {
      type: 'option',
      label: "Restart Game",
      action: () => { /* restart game */ },
      autoClose: true
    },
    {
      type: 'option',
      label: "Return to Menu",
      action: () => { /* return to menu */ },
      autoClose: true
    },
    {
      type: 'option',
      label: "Quit",
      action: () => { /* quit game */ },
      autoClose: true
    }
  ],
  selectedIndex: 0, // Currently selected option (index of option blocks only)
  scrollPosition: 0, // Scroll position for all content
  config: {
    closeKey: ['x'],  // Optional additional close keys
    useActionReturnValue: false
  }
}
```

### Rendering Approach

**Modal Layout**:
```
┌─────────────────────────────────┐
│  Title                          │
│                                 │
│  Message block 1                │
│  (can be anywhere)              │
│                                 │
│  > Option 1 (selected)           │
│    Option 2                     │
│                                 │
│  Message block 2                │
│  (intermixed with options)      │
│                                 │
│    Option 3                     │
│  (all content scrolls together) │
│                                 │
└─────────────────────────────────┘
```

**Visual Elements**:
- Border around modal using ASCII box-drawing characters (┌─┐│└─┘)
- Background with dimmed/obscured game board behind modal
- Title at top
- Content area: flexible composition of message and option blocks
- All content scrolls together (entire content area, not just messages)
- Selected option highlighted with `>` prefix AND background highlight
- Modal dimensions: fixed percentages relative to terminal size

### Input Handling

**Modal Input Mode**:
- InputHandler checks if modal is open (via ModalManager)
- When modal is open: InputHandler delegates to ModalInputHandler helper
- **When modal is open, NO game inputs are processed** - all input handled exclusively by ModalInputHandler helper
- When modal is closed: InputHandler handles game input normally
- Directional keys (up/down) navigate options (vertical only, no horizontal navigation)
- Enter key selects current option (executes action)
- ESC key always closes modal
- 'q' key always closes modal
- Additional close keys: optional (via `config.closeKey` - string or array of strings)
- Auto-close after action is optional (via configuration flag, closes by default)
- Key presses are ignored while modal is opening/closing
- Other keys are ignored by modal (only directional, Enter, ESC, 'q', and configured close keys are handled)

**Input Routing**:
- InputHandler checks modal state before handling input
- InputHandler delegates to ModalInputHandler helper when modal is open
- **When modal is open, InputHandler does NOT process any game input** - all input goes to modal
- InputHandler handles game input ONLY when modal is closed
- ModalInputHandler is a helper class (not a standalone input handler)
- Bulk of modal input logic in helper, InputHandler is controller

### Implementation Steps

1. **Create UI Directory Structure**
   - Create `src/ui/` directory
   - Create `src/ui/Modal.js` - Modal class
   - Create `src/ui/ModalManager.js` - ModalManager class (manages modal state and stacking)

2. **Create Modal Class** (`src/ui/Modal.js`)
   - Define modal structure (title, flexible content blocks) - fully configurable, no special types
   - Content blocks can be messages or options, intermixed in any order
   - Implement option selection logic (up/down navigation, vertical only, skips message blocks)
   - Implement vertical scrolling for all content (entire content area scrolls together, no horizontal scrolling)
   - Support action return values (with config flag) and explicit close method
   - Support async actions with loading state
   - Action execution: configurable per action (closes by default)
   - Modal dismissal: ESC and 'q' always close modal, optional additional close keys (via `config.closeKey`), optional auto-close after action (via config flag)

3. **Create Modal Input Handler Helper** (`src/ui/ModalInputHandler.js`)
   - Helper class used by InputHandler (similar to ModalRenderer/Renderer relationship)
   - Handle directional keys (up/down) for option navigation
   - Handle Enter key for option selection
   - Handle ESC key for modal closing (always closes)
   - Handle 'q' key for modal closing (always closes)
   - Handle custom close keys (if configured via `config.closeKey` - string or array of strings)
   - Ignore key presses during opening/closing animations
   - Return boolean indicating if key was handled

4. **Create Modal Renderer Helper**
   - Separate helper renderer used by `Renderer.js` (Renderer is master control)
   - Render modal border using ASCII box-drawing characters (┌─┐│└─┘)
   - Render background color with dimmed/obscured game board
   - Render shadow effect for visual depth
   - Render title and flexible content blocks (messages and options intermixed)
   - Render all content with vertical scrolling support (entire content area scrolls together, no horizontal scrolling)
   - Render options with `>` prefix, background highlight, AND different text color for selected option
   - Render messages as plain text blocks
   - Handle positioning (centered on screen, fixed size with fixed percentages relative to terminal size)

5. **Create ModalManager** (`src/ui/ModalManager.js`)
   - Manage modal state (open/closed, selected index) externally
   - Support modal stacking (hide/show behavior)
   - Handle modal lifecycle (open, close, reset on game restart)
   - Provide modal state to InputHandler and Renderer

6. **Integrate with Input System**
   - InputHandler.js checks if modal is open (via ModalManager)
   - If modal is open: InputHandler delegates to ModalInputHandler helper and does NOT process game input
   - If modal is closed: InputHandler handles game input normally
   - When modal is open, all input is handled exclusively by ModalInputHandler helper (no game input processing)
   - InputHandler imports ModalInputHandler helper and ModalManager

7. **Integrate with Rendering System**
   - Renderer.js uses modal renderer helper to render modals
   - Render modal over game board with dimmed background
   - Ensure modal is visible and not obscured
   - Handle terminal resizing (modal size is percentage-based)

8. **Add Modal Animation**
   - Animation starts as horizontal line in middle of viewport
   - Top and bottom grow simultaneously (top grows upward, bottom grows downward at the same time)
   - Modal reaches full size
   - Ignore input during animation

9. **Integrate with Game Modes**
   - Local mode: pause game when modal is open
   - Networked mode: game continues, other players see still character
   - Actions execute in context of game mode (networked/local)

10. **Create Example Modals**
   - All modals use same structure (no special types)
   - Examples: game over modal, quit confirmation, connection status notification
   - Help screen should eventually be refactored to use modal

## Related Features

- **FEATURE_admin_raw_board_view** - Could use modals for admin options
- **FEATURE_websocket_integration** - Could use modals for connection status, player join/leave notifications
- **FEATURE_player_reconnection** - Could use modals for reconnection options

## Dependencies

- Input handling system (InputHandler or similar)
- Rendering system (Renderer or terminal utilities)
- Terminal utilities (cursor positioning, colors, etc.)
- Action/callback system for option execution

## Status

**Status**: ✅ COMPLETE

**Priority**: MEDIUM

- Improves user experience with interactive dialogs
- Enables better game flow with choices and confirmations
- Not critical for MVP but valuable for polish
- Relatively straightforward implementation
- Can be added incrementally

**Implementation Status**:
- ✅ Phase 1: Basic Modal Infrastructure - COMPLETE
- ✅ Phase 2: Basic Modal Rendering - COMPLETE
- ✅ Phase 3: Basic Input Handling - COMPLETE
- ✅ Phase 4: Basic Action Execution - COMPLETE
- ✅ Phase 5: Integrate ModalManager into Local Mode - COMPLETE
- ✅ Phase 6: Integrate ModalManager into Networked Mode - COMPLETE
- ✅ Phase 7: MVP Testing and Refinement - COMPLETE
- ✅ Phase 8: Enhanced Visual Design - COMPLETE
- ✅ Phase 9: Percentage-Based Sizing - COMPLETE
- ✅ Phase 9.5: Text Wrapping - COMPLETE

**Completed**: 2026-01-04
- All MVP phases complete and tested
- All tests passing (27/27 modal system tests)
- Modal system fully functional in both local and networked modes
- Text wrapping implemented with lazy wrapping and memoization
- Bug fix completed: Modal overwritten by player movement (X_BUG_modal_overwritten_by_player_movement)

## Notes

- This is a UI/UX enhancement
- Should not impact game performance significantly
- Modal rendering should be efficient (only render when open)
- Use existing terminal utilities (ansi-escapes, chalk) for rendering
- Action system supports both return values and explicit close methods (configurable)
- Modal system supports stacking with hide/show behavior
- All modals use same structure - no special modal types needed
- Modal animations: horizontal line grows top/bottom simultaneously to full size
- Future enhancements: input fields, modal themes/styles
- Help screen should eventually be refactored to use modal component
- Error handling: report errors in logs, no fallback error modal
- Modal dimensions: fixed size (fixed percentages relative to terminal size) with scrolling support
- Modal positioning: centered on screen
- Content scrolling: use movement keys to scroll vertically (up/down) within modal viewport - ALL content scrolls together (messages and options), no horizontal scrolling
- Content composition: options and messages can be intermixed in any order, completely customizable
- Visual effects: background color, shadow effect
- Selection indicator: `>` prefix + background highlight + different text color
- Modal dismissal: ESC and 'q' always close modal, optional additional close keys (via `config.closeKey` - string or array), optional auto-close after action (via config flag)
- Action execution: configurable per action (closes by default)
- Accessibility: consider in future efforts (keyboard navigation only for now)

