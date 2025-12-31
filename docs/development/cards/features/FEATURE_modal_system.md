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
  message: "You have been defeated!\n\nWhat would you like to do?",
  options: [
    {
      label: "Restart Game",
      action: () => { /* restart game */ },
      selected: false
    },
    {
      label: "Return to Menu",
      action: () => { /* return to menu */ },
      selected: false
    },
    {
      label: "Quit",
      action: () => { /* quit game */ },
      selected: false
    }
  ],
  selectedIndex: 0, // Currently selected option
  onClose: () => { /* close modal */ }
}
```

### Rendering Approach

**Modal Layout**:
```
┌─────────────────────────────────┐
│  Title                          │
│                                 │
│  Message line 1                 │
│  Message line 2                 │
│                                 │
│  > Option 1                     │
│    Option 2                     │
│    Option 3                     │
│                                 │
└─────────────────────────────────┘
```

**Visual Elements**:
- Border around modal using ASCII box-drawing characters (┌─┐│└─┘)
- Background with dimmed/obscured game board behind modal
- Title at top
- Message content in middle (supports scrolling if content is longer than viewport)
- Options list at bottom
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
- Auto-close after action is optional (via configuration flag, closes by default)
- Key presses are ignored while modal is opening/closing
- Other keys are ignored by modal (only directional, Enter, ESC, 'q' are handled)

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
   - Define modal structure (title, message, options, actions) - fully configurable, no special types
   - Implement option selection logic (up/down navigation, vertical only)
   - Implement vertical scrolling for long content (using movement keys, no horizontal scrolling)
   - Support action return values (with config flag) and explicit close method
   - Support async actions with loading state
   - Action execution: configurable per action (closes by default)
   - Modal dismissal: ESC always, optional configurable close key (e.g., 'q'), optional auto-close after action (via config flag)

3. **Create Modal Input Handler Helper** (`src/ui/ModalInputHandler.js`)
   - Helper class used by InputHandler (similar to ModalRenderer/Renderer relationship)
   - Handle directional keys (up/down) for option navigation
   - Handle Enter key for option selection
   - Handle ESC key for modal closing (always closes)
   - Handle 'q' key for modal closing (always closes)
   - Ignore key presses during opening/closing animations
   - Return boolean indicating if key was handled

4. **Create Modal Renderer Helper**
   - Separate helper renderer used by `Renderer.js` (Renderer is master control)
   - Render modal border using ASCII box-drawing characters (┌─┐│└─┘)
   - Render background color with dimmed/obscured game board
   - Render shadow effect for visual depth
   - Render title and message content (with vertical scrolling support, no horizontal scrolling)
   - Render options list with `>` prefix, background highlight, AND different text color for selected option
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
   - Top and bottom grow until modal achieves proper size
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

**Status**: 📋 NOT STARTED

**Priority**: MEDIUM

- Improves user experience with interactive dialogs
- Enables better game flow with choices and confirmations
- Not critical for MVP but valuable for polish
- Relatively straightforward implementation
- Can be added incrementally

## Notes

- This is a UI/UX enhancement
- Should not impact game performance significantly
- Modal rendering should be efficient (only render when open)
- Use existing terminal utilities (ansi-escapes, chalk) for rendering
- Action system supports both return values and explicit close methods (configurable)
- Modal system supports stacking with hide/show behavior
- All modals use same structure - no special modal types needed
- Modal animations: horizontal line grows top/bottom to full size
- Future enhancements: input fields, modal themes/styles
- Help screen should eventually be refactored to use modal component
- Error handling: report errors in logs, no fallback error modal
- Modal dimensions: fixed size (fixed percentages relative to terminal size) with scrolling support
- Modal positioning: centered on screen
- Content scrolling: use movement keys to scroll vertically (up/down) within modal viewport, no horizontal scrolling
- Visual effects: background color, shadow effect
- Selection indicator: `>` prefix + background highlight + different text color
- Modal dismissal: ESC always, optional configurable close key (e.g., 'q'), optional auto-close after action (via config flag)
- Action execution: configurable per action (closes by default)
- Accessibility: consider in future efforts (keyboard navigation only for now)

