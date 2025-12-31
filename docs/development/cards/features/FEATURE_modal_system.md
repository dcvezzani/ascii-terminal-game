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

**Option 1: Modal Class with Action Callbacks** (Recommended)
- Create a `Modal` class similar to `InputHandler` pattern
- Modal accepts options with associated action callbacks
- Modal handles its own input (directional keys, Enter, ESC)
- Modal renders itself using Renderer or separate modal renderer

**Option 2: Modal Manager**
- Create a `ModalManager` class to manage active modals
- Modals are objects with content, options, and actions
- Manager handles input routing and rendering
- Supports modal stack for nested modals

**Option 3: Integrated with InputHandler**
- Extend `InputHandler` to support modal mode
- When modal is active, input is routed to modal instead of game
- Modal options use same callback pattern as key bindings

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
- Border around modal (using box-drawing characters or simple characters)
- Background (optional - could use ANSI background colors)
- Title at top
- Message content in middle
- Options list at bottom
- Selected option highlighted (e.g., `>` prefix, different color, or background highlight)

### Input Handling

**Modal Input Mode**:
- When modal is open, input should be captured by modal
- Directional keys (up/down) navigate options
- Enter key selects current option (executes action)
- ESC key closes modal (if allowed)
- Other keys may be ignored or handled by modal

**Input Routing**:
- Need to determine how to route input to modal vs game
- Options:
  1. Modal intercepts input before InputHandler
  2. InputHandler checks if modal is active and routes accordingly
  3. Separate input handler for modal mode

### Implementation Steps

1. **Create Modal Class**
   - Define modal structure (title, message, options, actions)
   - Implement option selection logic (up/down navigation)
   - Implement action execution (Enter key)
   - Implement modal closing (ESC key)

2. **Create Modal Renderer**
   - Render modal border and background
   - Render title and message content
   - Render options list with selection indicator
   - Handle positioning (centered, etc.)

3. **Integrate with Input System**
   - Modify InputHandler or create modal input handler
   - Route input to modal when modal is active
   - Disable game input when modal is open

4. **Integrate with Rendering System**
   - Render modal over game board
   - Ensure modal is visible and not obscured
   - Handle terminal resizing (if needed)

5. **Add Modal Management**
   - Support opening/closing modals
   - Support modal stack (if multiple modals needed)
   - Handle modal lifecycle (open, update, close)

6. **Create Example Modals**
   - Game over modal
   - Confirmation dialogs
   - Informational messages
   - Settings menu

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
- Modal rendering should be efficient (only when open)
- Consider using existing terminal utilities (ansi-escapes, chalk) for rendering
- Action system should be flexible to support various use cases
- Modal system should be extensible for future features
- Consider modal animations/transitions (optional, low priority)
- May want to support modal templates for common use cases (confirmation, info, etc.)
- Could be extended to support input fields in modals (future enhancement)

