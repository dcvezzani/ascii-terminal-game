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

**Selected Approach**: Modal Manager with Separate Input Handler
- Create a `ModalManager` class to manage active modals (required for stacking support)
- Create a `Modal` class in `src/ui/Modal.js` (new UI directory)
- Create separate modal input handler (complete separation from InputHandler)
- Modal state managed externally by ModalManager
- Renderer is "master control" - may use separate helper renderer for modal rendering
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
- Separate modal input handler (complete separation from InputHandler)
- When modal is open, input is captured by modal input handler
- Directional keys (up/down) navigate options (vertical only, no horizontal navigation)
- Enter key selects current option (executes action)
- ESC key closes modal (if allowed)
- Key presses are ignored while modal is opening/closing
- Other keys are ignored by modal

**Input Routing**:
- Separate modal input handler handles all modal input
- InputHandler remains separate and handles game input
- ModalManager coordinates between modal and game input handlers

### Implementation Steps

1. **Create UI Directory Structure**
   - Create `src/ui/` directory
   - Create `src/ui/Modal.js` - Modal class
   - Create `src/ui/ModalManager.js` - ModalManager class (manages modal state and stacking)

2. **Create Modal Class** (`src/ui/Modal.js`)
   - Define modal structure (title, message, options, actions)
   - Implement option selection logic (up/down navigation, vertical only)
   - Implement scrolling for long content (using movement keys)
   - Support action return values (with config flag) and explicit close method
   - Support async actions with loading state

3. **Create Modal Input Handler**
   - Separate input handler for modal mode (complete separation from InputHandler)
   - Handle directional keys (up/down) for option navigation
   - Handle Enter key for option selection
   - Handle ESC key for modal closing
   - Ignore key presses during opening/closing animations

4. **Create Modal Renderer Helper**
   - Separate helper renderer used by `Renderer.js` (Renderer is master control)
   - Render modal border using ASCII box-drawing characters (┌─┐│└─┘)
   - Render dimmed/obscured game board background
   - Render title and message content (with scrolling support)
   - Render options list with `>` prefix and background highlight for selected option
   - Handle positioning (centered, fixed percentages relative to terminal size)

5. **Create ModalManager** (`src/ui/ModalManager.js`)
   - Manage modal state (open/closed, selected index) externally
   - Support modal stacking (hide/show behavior)
   - Handle modal lifecycle (open, close, reset on game restart)
   - Coordinate between modal and game input handlers

6. **Integrate with Rendering System**
   - Renderer.js uses modal renderer helper to render modals
   - Render modal over game board with dimmed background
   - Ensure modal is visible and not obscured
   - Handle terminal resizing (modal size is percentage-based)

7. **Add Modal Animation**
   - Animation starts as horizontal line in middle of viewport
   - Top and bottom grow until modal achieves proper size
   - Ignore input during animation

8. **Integrate with Game Modes**
   - Local mode: pause game when modal is open
   - Networked mode: game continues, other players see still character
   - Actions execute in context of game mode (networked/local)

9. **Create Example Modals**
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

## Open Questions

1. **Modal Positioning**: Where should modals be positioned?
   - Centered on screen?
   - Centered on game board?
   - Top, bottom, or configurable?

2. **Modal Size**: How should modal size be determined?
   - Fixed size?
   - Dynamic based on content?
   - Maximum size with scrolling?

3. **Modal Stacking**: Should multiple modals be supported?
   - Single active modal only?
   - Stack-based (modals can open other modals)?
   - Queue-based (modals wait for previous to close)?

4. **Input Routing**: How should input be routed to modals?
   - Modal intercepts before InputHandler?
   - InputHandler checks modal state?
   - Separate modal input handler?

5. **Visual Style**: What visual style should modals have?
   - Simple border (ASCII box-drawing)?
   - Background color?
   - Shadow effect?
   - Configurable theme?

6. **Option Selection Indicator**: How should selected option be indicated?
   - `>` prefix?
   - Background highlight?
   - Different text color?
   - Underline or bold?

7. **Modal Dismissal**: How should modals be closed?
   - ESC key always?
   - Configurable close key?
   - Close button/option?
   - Auto-close after action?

8. **Message Formatting**: What formatting should messages support?
   - Plain text only?
   - Colors?
   - Bold/italic?
   - Multi-line with line breaks?

9. **Action Execution**: What should happen after action is executed?
   - Modal closes automatically?
   - Modal stays open?
   - Configurable per action?

10. **Modal Types**: Should there be different modal types?
    - Informational (message only, no options)?
    - Confirmation (yes/no options)?
    - Selection (list of options)?
    - Custom (fully configurable)?

11. **Accessibility**: How to make modals accessible?
    - Keyboard navigation only (already required)?
    - Screen reader support (if applicable)?
    - High contrast mode?

12. **Performance**: How to ensure modals don't impact performance?
    - Efficient rendering (only render when open)?
    - Minimal re-renders?
    - Caching rendered content?

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
- Modal dimensions: fixed percentages relative to terminal size
- Content scrolling: use movement keys to scroll long content within modal viewport

