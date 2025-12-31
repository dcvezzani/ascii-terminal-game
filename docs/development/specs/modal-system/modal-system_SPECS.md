# Specification: Modal System

## Overview

This specification details the implementation of a modal system that can display content over the game and allow players to interact with selectable options. The system supports messages, selectable options with actions, modal stacking, animations, and integration with both local and networked game modes.

**Reference Card**: `docs/development/cards/features/FEATURE_modal_system.md`

## Goals

1. Implement a modal system for displaying information and interactive choices
2. Support selectable options with associated actions (callback functions)
3. Enable modal stacking (modals can open other modals with hide/show behavior)
4. Integrate with existing input and rendering systems
5. Support both local mode (pause game) and networked mode (game continues)
6. Provide smooth animations and visual feedback
7. Maintain performance with efficient rendering (only when open)

## Current State

**Current Architecture**:

- `src/input/InputHandler.js` - Handles keyboard input with callback-based actions
  - Maps keys to callbacks (e.g., `onMoveUp`, `onQuit`, `onRestart`)
  - No modal support exists
- `src/render/Renderer.js` - Handles terminal rendering
  - `renderFull()` - Full screen rendering
  - `renderBoard()` - Board rendering
  - No modal rendering exists
- `src/modes/localMode.js` - Local single-player mode
  - Uses `InputHandler` for input
  - Uses `Renderer` for output
  - No modal system
- `src/modes/networkedMode.js` - Networked multiplayer mode
  - Uses `InputHandler` for input
  - Uses `Renderer` for output
  - No modal system

**Current Limitations**:

- No way to display modal dialogs over the game
- No interactive message system
- No selectable options with actions
- Help screen is static (no interactivity)
- Limited user interaction (keyboard commands only, no menu-based interaction)

## Target State

**New Architecture**:

- `src/ui/Modal.js` - Modal class
  - Manages modal content (title, message, options)
  - Handles option selection and scrolling
  - Supports action execution (sync and async)
  - Supports action return values and explicit close
- `src/ui/ModalManager.js` - Modal manager class
  - Manages modal state (open/closed, selected index)
  - Handles modal stacking (hide/show behavior)
  - Coordinates input routing between modal and game
  - Resets modals on game restart
- `src/ui/ModalInputHandler.js` - Modal input handler
  - Separate input handler for modal mode
  - Intercepts input before InputHandler (modal has priority)
  - Handles directional keys, Enter, ESC, optional close key
  - Ignores input during animations
- `src/render/ModalRenderer.js` - Modal renderer helper
  - Renders modal border, background, shadow
  - Renders title, message, options
  - Handles positioning and sizing
  - Used by `Renderer.js` (Renderer is master control)
- `src/render/Renderer.js` - Enhanced with modal support
  - Uses `ModalRenderer` helper for modal rendering
  - Renders modal over game board with dimmed background
- `src/modes/localMode.js` - Enhanced with modal support
  - Pauses game when modal is open
  - Integrates with ModalManager
- `src/modes/networkedMode.js` - Enhanced with modal support
  - Game continues when modal is open (other players see still character)
  - Integrates with ModalManager

**New Game Flow (With Modals)**:

1. Game event occurs (e.g., game over, connection lost, player action)
2. Modal is opened via `ModalManager.openModal(modal)`
3. Modal intercepts input (before InputHandler)
4. Player navigates options with up/down keys
5. Player selects option with Enter key
6. Action is executed (in context of game mode)
7. Modal closes (auto-close by default, or explicit close)
8. Game continues (local: unpaused, networked: already running)

**Benefits**:

- Interactive dialogs for better user experience
- Menu-based interaction alongside keyboard commands
- Modal stacking for complex workflows
- Smooth animations for polish
- Efficient rendering (only when open)
- Works in both local and networked modes

## Functional Requirements

### FR1: Modal Structure

**Requirement**: Modal must support title, message, and selectable options with associated actions.

**Details**:

- Modal is fully configurable (no special modal types)
- Title: string displayed at top of modal
- Message: multi-line text content (supports vertical scrolling)
- Options: array of selectable options, each with:
  - `label`: string displayed to user
  - `action`: callback function to execute when selected
  - Optional: `autoClose`: boolean (default: true, closes modal after action)
- Selected option: tracked by index (0-based)
- Modal can have no options (message-only modal)

**Modal Structure**:

```javascript
{
  title: string,
  message: string,  // Multi-line supported with \n
  options: [
    {
      label: string,
      action: () => void | Promise<void>,
      autoClose?: boolean  // Default: true
    }
  ],
  selectedIndex: number,  // Managed by ModalManager
  config?: {
    closeKey?: string,  // Optional close key (e.g., 'q')
    useActionReturnValue?: boolean  // Enable action return value support
  }
}
```

**Acceptance Criteria**:

- [ ] Modal can be created with title, message, and options
- [ ] Modal can be created with title and message only (no options)
- [ ] Options can have associated action callbacks
- [ ] Selected option index is tracked (default: 0)
- [ ] Modal structure is fully configurable

### FR2: Modal Display

**Requirement**: Modal must be visually distinct and positioned appropriately.

**Details**:

- Modal is centered on screen (not game board)
- Modal dimensions: fixed size with fixed percentages relative to terminal size
- Border: ASCII box-drawing characters (┌─┐│└─┘)
- Background: dimmed/obscured game board behind modal
- Shadow effect: visual depth indicator
- Modal renders over game board
- Modal is visible and not obscured

**Visual Layout**:

```
┌─────────────────────────────────┐
│  Title                          │
│                                 │
│  Message line 1                 │
│  Message line 2                 │
│  (scrollable if long)           │
│                                 │
│  > Option 1 (selected)         │
│    Option 2                     │
│    Option 3                     │
│                                 │
└─────────────────────────────────┘
```

**Acceptance Criteria**:

- [ ] Modal is centered on screen
- [ ] Modal has ASCII box-drawing border
- [ ] Modal has dimmed/obscured background
- [ ] Modal has shadow effect
- [ ] Modal dimensions are fixed percentages of terminal size
- [ ] Modal renders over game board

### FR3: Option Selection

**Requirement**: Players must be able to navigate and select options.

**Details**:

- Navigation: up/down arrow keys (vertical only, no horizontal)
- Selection: Enter key executes action
- Visual indicator for selected option:
  - `>` prefix
  - Background highlight
  - Different text color
- Selected option wraps (up from first goes to last, down from last goes to first)
- Option count can be 0 (message-only modal)

**Acceptance Criteria**:

- [ ] Up/down keys navigate options
- [ ] Enter key selects current option
- [ ] Selected option has `>` prefix, background highlight, and different text color
- [ ] Navigation wraps at boundaries
- [ ] Works with 0 options (message-only modal)

### FR4: Message Scrolling

**Requirement**: Long messages must be scrollable within modal viewport.

**Details**:

- Vertical scrolling: up/down keys scroll message content
- Horizontal scrolling: NOT supported (content wraps or truncates)
- Scrolling only affects message area (not options)
- Scroll position is tracked and maintained
- Scrolling works when message is longer than viewport

**Acceptance Criteria**:

- [ ] Up/down keys scroll message content when message is longer than viewport
- [ ] Horizontal scrolling is NOT supported
- [ ] Scrolling only affects message area
- [ ] Scroll position is maintained during navigation

### FR5: Action Execution

**Requirement**: Options must execute associated actions when selected.

**Details**:

- Action execution: configurable per action (closes by default)
- Actions can be synchronous or asynchronous
- Async actions: modal shows loading state
- Action return values: optional support (via config flag)
  - `true` or truthy: close modal
  - `false` or falsy: keep modal open
- Explicit close: `modalManager.closeModal()` method
- Actions execute in context of game mode (networked/local)

**Action Types**:

- Synchronous: `() => void`
- Asynchronous: `() => Promise<void>`
- With return value: `() => boolean` (if `useActionReturnValue` enabled)

**Acceptance Criteria**:

- [ ] Enter key executes action for selected option
- [ ] Actions can be synchronous or asynchronous
- [ ] Async actions show loading state
- [ ] Modal closes by default after action (unless `autoClose: false`)
- [ ] Action return values work (if enabled via config)
- [ ] Explicit close method works
- [ ] Actions execute in correct game mode context

### FR6: Modal Dismissal

**Requirement**: Modals must be dismissible via keyboard.

**Details**:

- ESC key: always closes modal
- Configurable close key: optional (e.g., 'q')
- Auto-close after action: optional (via configuration flag, closes by default)
- Closing modal: restores previous modal in stack (if any) or returns to game

**Acceptance Criteria**:

- [ ] ESC key always closes modal
- [ ] Optional configurable close key works (if set)
- [ ] Auto-close after action works (default: true)
- [ ] Closing modal restores previous modal in stack
- [ ] Closing last modal returns to game

### FR7: Modal Stacking

**Requirement**: Modals must support stacking (modals can open other modals).

**Details**:

- Opening modal B from modal A: hides A and shows B
- Closing modal B: shows A (restores previous modal)
- Closing modal A: returns to game
- Stack is managed by ModalManager
- Only top modal receives input
- Only top modal is rendered

**Stack Behavior**:

```
Game → Modal A → Modal B
- Opening B: A hidden, B visible
- Closing B: A visible, B removed
- Closing A: Game visible, A removed
```

**Acceptance Criteria**:

- [ ] Opening modal B from modal A hides A
- [ ] Closing modal B restores A
- [ ] Closing last modal returns to game
- [ ] Only top modal receives input
- [ ] Only top modal is rendered

### FR8: Input Routing

**Requirement**: Input must be routed correctly between modal and game.

**Details**:

- Modal intercepts input before InputHandler (modal has priority)
- Separate modal input handler (complete separation from InputHandler)
- When modal is open: input goes to modal input handler
- When modal is closed: input goes to game InputHandler
- Key presses ignored during opening/closing animations
- Other keys ignored by modal (only directional, Enter, ESC, optional close key)

**Input Flow**:

```
Key Press → Modal Input Handler (if modal open) → Modal
         → Game Input Handler (if modal closed) → Game
```

**Acceptance Criteria**:

- [ ] Modal intercepts input before InputHandler when open
- [ ] Separate modal input handler handles modal input
- [ ] Game input handler handles game input when modal closed
- [ ] Input routing switches correctly when modal opens/closes
- [ ] Key presses ignored during animations
- [ ] Other keys ignored by modal

### FR9: Modal Animation

**Requirement**: Modals must animate when opening.

**Details**:

- Animation: starts as horizontal line in middle of viewport
- Growth: top and bottom grow until modal achieves proper size
- Duration: configurable (default: ~300ms)
- Input: ignored during animation
- Animation is smooth and visually appealing

**Animation Sequence**:

1. Modal starts as horizontal line (1 row height)
2. Top grows upward
3. Bottom grows downward
4. Modal reaches full size
5. Input enabled

**Acceptance Criteria**:

- [ ] Modal animates from horizontal line to full size
- [ ] Animation is smooth
- [ ] Input is ignored during animation
- [ ] Animation completes before input is enabled

### FR10: Game Mode Integration

**Requirement**: Modals must work correctly in both local and networked modes.

**Details**:

- **Local mode**: Game pauses when modal is open
- **Networked mode**: Game continues when modal is open (other players see still character)
- Actions execute in context of game mode (networked/local)
- Modal state is independent of game mode

**Local Mode Behavior**:

- Modal opens → Game pauses
- Modal closes → Game resumes

**Networked Mode Behavior**:

- Modal opens → Game continues, player character appears still to others
- Modal closes → Player can move again

**Acceptance Criteria**:

- [ ] Local mode pauses game when modal opens
- [ ] Local mode resumes game when modal closes
- [ ] Networked mode continues game when modal opens
- [ ] Networked mode: other players see still character
- [ ] Actions execute in correct game mode context

### FR11: Modal Reset

**Requirement**: Modals must reset on game restart.

**Details**:

- Game restart: all modals are closed
- Modal stack is cleared
- Modal state is reset
- No modals remain open after restart

**Acceptance Criteria**:

- [ ] Game restart closes all modals
- [ ] Modal stack is cleared on restart
- [ ] Modal state is reset on restart
- [ ] No modals remain open after restart

## Technical Requirements

### TR1: Modal Class Implementation

**Requirement**: Implement `Modal` class in `src/ui/Modal.js`.

**Details**:

- Class structure:
  ```javascript
  class Modal {
    constructor(config)
    getTitle()
    getMessage()
    getOptions()
    getSelectedIndex()
    setSelectedIndex(index)
    selectNext()
    selectPrevious()
    scrollMessageUp()
    scrollMessageDown()
    getMessageScrollPosition()
    executeAction(index)
    isAnimating()
    getAnimationProgress()
  }
  ```
- Modal state: managed externally by ModalManager
- Option selection: wraps at boundaries
- Message scrolling: tracks scroll position
- Action execution: supports sync and async
- Animation: tracks animation state

**Acceptance Criteria**:

- [ ] Modal class exists in `src/ui/Modal.js`
- [ ] Modal class has required methods
- [ ] Option selection wraps at boundaries
- [ ] Message scrolling works
- [ ] Action execution supports sync and async
- [ ] Animation state is tracked

### TR2: ModalManager Implementation

**Requirement**: Implement `ModalManager` class in `src/ui/ModalManager.js`.

**Details**:

- Class structure:
  ```javascript
  class ModalManager {
    constructor()
    openModal(modal)
    closeModal()
    closeAllModals()
    getCurrentModal()
    hasOpenModal()
    getModalStack()
    reset()
  }
  ```
- Modal stack: array of modals (most recent at end)
- State management: tracks open/closed, selected index
- Input coordination: coordinates between modal and game input handlers
- Reset: clears stack and resets state

**Acceptance Criteria**:

- [ ] ModalManager class exists in `src/ui/ModalManager.js`
- [ ] ModalManager manages modal stack
- [ ] ModalManager tracks modal state
- [ ] ModalManager coordinates input routing
- [ ] ModalManager resets on game restart

### TR3: ModalInputHandler Implementation

**Requirement**: Implement `ModalInputHandler` class in `src/ui/ModalInputHandler.js`.

**Details**:

- Class structure:
  ```javascript
  class ModalInputHandler {
    constructor(modalManager)
    start()
    stop()
    handleKeypress(str, key)
  }
  ```
- Input interception: intercepts input before InputHandler
- Key handling:
  - Up/down: navigate options or scroll message
  - Enter: select option
  - ESC: close modal
  - Optional close key: close modal (if configured)
- Animation handling: ignores input during animations

**Acceptance Criteria**:

- [ ] ModalInputHandler class exists in `src/ui/ModalInputHandler.js`
- [ ] ModalInputHandler intercepts input before InputHandler
- [ ] ModalInputHandler handles required keys
- [ ] ModalInputHandler ignores input during animations

### TR4: ModalRenderer Implementation

**Requirement**: Implement `ModalRenderer` helper class in `src/render/ModalRenderer.js`.

**Details**:

- Class structure:
  ```javascript
  class ModalRenderer {
    constructor()
    renderModal(modal, terminalSize)
    renderBorder(x, y, width, height)
    renderBackground(x, y, width, height)
    renderShadow(x, y, width, height)
    renderTitle(title, x, y, width)
    renderMessage(message, x, y, width, height, scrollPosition)
    renderOptions(options, selectedIndex, x, y, width)
    calculateModalSize(terminalSize)
    calculateModalPosition(width, height, terminalSize)
  }
  ```
- Rendering: uses ANSI escapes and chalk for colors
- Positioning: centers modal on screen
- Sizing: fixed percentages of terminal size
- Scrolling: renders visible portion of message

**Acceptance Criteria**:

- [ ] ModalRenderer class exists in `src/render/ModalRenderer.js`
- [ ] ModalRenderer renders modal border, background, shadow
- [ ] ModalRenderer renders title, message, options
- [ ] ModalRenderer handles positioning and sizing
- [ ] ModalRenderer supports message scrolling

### TR5: Renderer Integration

**Requirement**: Integrate modal rendering into `Renderer.js`.

**Details**:

- Renderer uses ModalRenderer helper
- Renderer checks if modal is open before rendering game
- Renderer renders modal over game board
- Renderer dims game board when modal is open
- Renderer handles terminal resizing

**Acceptance Criteria**:

- [ ] Renderer uses ModalRenderer helper
- [ ] Renderer checks modal state before rendering
- [ ] Renderer renders modal over game board
- [ ] Renderer dims game board when modal is open

### TR6: Game Mode Integration

**Requirement**: Integrate modal system into local and networked modes.

**Details**:

- Local mode: pause game when modal opens, resume when closes
- Networked mode: continue game when modal opens
- ModalManager: shared between modes
- Actions: execute in context of game mode

**Acceptance Criteria**:

- [ ] Local mode pauses/resumes with modal
- [ ] Networked mode continues with modal
- [ ] ModalManager is integrated into both modes
- [ ] Actions execute in correct context

## Implementation Details

### Modal Structure

**Modal Configuration**:

```javascript
const modal = {
  title: "Game Over",
  message: "You have been defeated!\n\nWhat would you like to do?",
  options: [
    {
      label: "Restart Game",
      action: () => {
        gameServer.resetGame();
        gameServer.startGame();
      },
      autoClose: true
    },
    {
      label: "Quit",
      action: () => {
        process.exit(0);
      },
      autoClose: true
    }
  ],
  config: {
    closeKey: 'q',  // Optional
    useActionReturnValue: false  // Optional
  }
};
```

### ModalManager Usage

```javascript
const modalManager = new ModalManager();
const modalInputHandler = new ModalInputHandler(modalManager);

// Open modal
modalManager.openModal(modal);

// Close modal
modalManager.closeModal();

// Check if modal is open
if (modalManager.hasOpenModal()) {
  // Modal is open
}

// Reset on game restart
modalManager.reset();
```

### Input Handler Integration

```javascript
// In game mode setup
const gameInputHandler = new InputHandler({
  onMoveUp: () => { /* ... */ },
  // ... other callbacks
});

const modalInputHandler = new ModalInputHandler(modalManager);

// Start both handlers
gameInputHandler.start();
modalInputHandler.start();  // Intercepts input when modal open
```

### Renderer Integration

```javascript
// In Renderer.js
import { ModalRenderer } from './ModalRenderer.js';
import { modalManager } from '../ui/ModalManager.js';  // Singleton or passed in

render() {
  // Render game board
  this.renderBoard(...);
  
  // Render modal if open
  if (modalManager.hasOpenModal()) {
    const modal = modalManager.getCurrentModal();
    const modalRenderer = new ModalRenderer();
    modalRenderer.renderModal(modal, this.getTerminalSize());
  }
}
```

## Testing Requirements

### Unit Tests

- Modal class: option selection, message scrolling, action execution
- ModalManager: stack management, state tracking, reset
- ModalInputHandler: key handling, input routing
- ModalRenderer: rendering, positioning, sizing

### Integration Tests

- Modal opening/closing in local mode
- Modal opening/closing in networked mode
- Modal stacking behavior
- Input routing between modal and game
- Action execution in both modes
- Modal reset on game restart

### Manual Testing

- Visual appearance: border, background, shadow, selection indicator
- Animation: smooth opening animation
- Scrolling: message scrolling with long content
- Stacking: multiple modals opening/closing
- Game mode behavior: pause in local, continue in networked

## Acceptance Criteria

### Overall

- [ ] Modal system is fully functional
- [ ] Modals display correctly with all visual elements
- [ ] Options are selectable and actions execute
- [ ] Modal stacking works correctly
- [ ] Input routing works correctly
- [ ] Animations are smooth
- [ ] Works in both local and networked modes
- [ ] Performance is acceptable (efficient rendering)
- [ ] All unit tests pass
- [ ] All integration tests pass
- [ ] Manual testing confirms visual and functional requirements

### Visual

- [ ] Modal is centered on screen
- [ ] Modal has ASCII box-drawing border
- [ ] Modal has dimmed/obscured background
- [ ] Modal has shadow effect
- [ ] Selected option has `>` prefix, background highlight, and different text color
- [ ] Animation is smooth and visually appealing

### Functional

- [ ] Options are navigable with up/down keys
- [ ] Options are selectable with Enter key
- [ ] Actions execute correctly (sync and async)
- [ ] Modal closes with ESC key
- [ ] Optional close key works (if configured)
- [ ] Message scrolling works for long content
- [ ] Modal stacking works (hide/show behavior)
- [ ] Local mode pauses/resumes with modal
- [ ] Networked mode continues with modal
- [ ] Modal reset works on game restart

### Performance

- [ ] Modal only renders when open
- [ ] Rendering is efficient (no unnecessary redraws)
- [ ] Input handling is responsive
- [ ] Animation is smooth (60fps or acceptable frame rate)

## Dependencies

- Input handling system (`InputHandler`)
- Rendering system (`Renderer`)
- Terminal utilities (`ansi-escapes`, `chalk`)
- Game mode implementations (`localMode`, `networkedMode`)
- Action/callback system

## Future Enhancements

- Input fields in modals (text input)
- Modal themes/styles (error = red border, info = blue border)
- Accessibility improvements (screen reader support, high contrast mode)
- Modal templates for common use cases
- Horizontal navigation for multi-column layouts
- Message formatting (colors, bold/italic)

