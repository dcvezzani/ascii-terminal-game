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
  - Provides modal state to InputHandler and Renderer
  - Resets modals on game restart
- `src/ui/ModalInputHandler.js` - Modal input handler helper
  - Helper class for modal input handling
  - Handles directional keys, Enter, ESC, 'q'
  - Ignores input during animations
  - Used by `InputHandler.js` (InputHandler is master control)
- `src/render/ModalRenderer.js` - Modal renderer helper
  - Helper class for modal rendering
  - Renders modal border, background, shadow
  - Renders title, message, options
  - Handles positioning and sizing
  - Used by `Renderer.js` (Renderer is master control)
- `src/input/InputHandler.js` - Enhanced with modal support
  - Uses `ModalInputHandler` helper for modal input
  - Checks if modal is open and delegates to helper if so
  - Handles game input when modal is closed
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
3. InputHandler checks if modal is open and delegates to ModalInputHandler helper
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

**Requirement**: Modal must support flexible content composition with title and customizable content blocks.

**Details**:

- Modal is fully configurable (no special modal types)
- Title: string displayed at top of modal
- Content: array of content blocks that can be mixed (messages and options)
- Content blocks can be:
  - **Message blocks**: text content (multi-line supported)
  - **Option blocks**: selectable options with actions
- Options and messages can be intermixed in any order
- Selected option: tracked by index (0-based, counts only option blocks)
- Modal can have any combination of message and option blocks
- Scrolling affects ALL content (entire content area scrolls as one unit)

**Modal Structure**:

```javascript
{
  title: string,
  content: [
    {
      type: 'message',
      text: string  // Multi-line supported with \n
    },
    {
      type: 'option',
      label: string,
      action: () => void | Promise<void>,
      autoClose?: boolean  // Default: true
    },
    // ... more blocks in any order
  ],
  selectedIndex: number,  // Managed by ModalManager (index of selected option block)
  scrollPosition: number,  // Managed by ModalManager (scroll position for all content)
  config?: {
    closeKey?: string | string[]  // Optional additional close key(s) (ESC and 'q' always work)
    useActionReturnValue?: boolean  // Enable action return value support
  }
}
```

**Acceptance Criteria**:

- [ ] Modal can be created with title and flexible content blocks
- [ ] Content blocks can be messages or options
- [ ] Options and messages can be intermixed in any order
- [ ] Selected option index is tracked (default: 0, counts only option blocks)
- [ ] Modal structure is fully configurable
- [ ] Modal can have any combination of message and option blocks

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
- Navigation skips over message blocks (only navigates between option blocks)
- Selected option may scroll into view if off-screen
- Option count can be 0 (message-only modal)

**Acceptance Criteria**:

- [ ] Up/down keys navigate options (skips message blocks)
- [ ] Enter key selects current option
- [ ] Selected option has `>` prefix, background highlight, and different text color
- [ ] Navigation wraps at boundaries
- [ ] Selected option scrolls into view if off-screen
- [ ] Works with 0 options (message-only modal)
- [ ] Works with intermixed messages and options

### FR4: Content Scrolling

**Requirement**: Long content must be scrollable within modal viewport.

**Details**:

- Vertical scrolling: up/down keys scroll ALL content (messages and options together)
- Horizontal scrolling: NOT supported (content wraps or truncates)
- Scrolling affects entire content area (all blocks scroll together as one unit)
- Scroll position is tracked and maintained
- Scrolling works when total content height exceeds viewport
- Options remain selectable while scrolled (selected option can be off-screen)

**Acceptance Criteria**:

- [ ] Up/down keys scroll all content when total height exceeds viewport
- [ ] Horizontal scrolling is NOT supported
- [ ] Scrolling affects entire content area (all blocks together)
- [ ] Scroll position is maintained during option navigation
- [ ] Options remain selectable even when scrolled off-screen

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
- 'q' key: always closes modal
- Additional close keys: optional (via `config.closeKey` - string or array of strings)
- Auto-close after action: optional (via configuration flag, closes by default)
- Closing modal: restores previous modal in stack (if any) or returns to game

**Acceptance Criteria**:

- [ ] ESC key always closes modal
- [ ] 'q' key always closes modal
- [ ] Optional additional close keys work (if configured via `config.closeKey`)
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

- InputHandler checks if modal is open (via ModalManager)
- When modal is open: InputHandler delegates to ModalInputHandler helper
- When modal is closed: InputHandler handles game input normally
- Key presses ignored during opening/closing animations
- Other keys ignored by modal (only directional, Enter, ESC, 'q', and configured close keys)

**Input Flow**:

```
Key Press → InputHandler
         → Check if modal open (via ModalManager)
         → If open: delegate to ModalInputHandler helper → Modal (game input NOT processed)
         → If closed: handle game input → Game
```

**Important**: When a modal is open, NO game inputs are processed. All input is handled exclusively by ModalInputHandler helper.

**Acceptance Criteria**:

- [ ] InputHandler checks modal state before handling input
- [ ] InputHandler delegates to ModalInputHandler helper when modal is open
- [ ] When modal is open, NO game inputs are processed (all input goes to modal)
- [ ] InputHandler handles game input ONLY when modal is closed
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
    scrollContentUp()
    scrollContentDown()
    getScrollPosition()
    getContent()
    executeAction(index)
    isAnimating()
    getAnimationProgress()
  }
  ```
- Modal state: managed externally by ModalManager
- Option selection: wraps at boundaries
- Content scrolling: tracks scroll position for all content
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

**Requirement**: Implement `ModalInputHandler` helper class in `src/ui/ModalInputHandler.js`.

**Details**:

- Class structure:
  ```javascript
  class ModalInputHandler {
    constructor(modalManager)
    handleKeypress(str, key, modal)
  }
  ```
- Helper class: used by InputHandler, not a standalone input handler
- Key handling:
  - Up/down: navigate options (when not scrolling) or scroll all content
  - Enter: select option
  - ESC: close modal (always available)
  - 'q': close modal (always available)
  - Custom close keys: close modal (if configured via `config.closeKey`)
- Animation handling: ignores input during animations
- Returns boolean: `true` if key was handled, `false` if not
- Handles custom close keys: checks `config.closeKey` (string or array of strings)

**Acceptance Criteria**:

- [ ] ModalInputHandler class exists in `src/ui/ModalInputHandler.js`
- [ ] ModalInputHandler is a helper class (not standalone input handler)
- [ ] ModalInputHandler handles required keys (ESC, 'q', Enter, up/down)
- [ ] ModalInputHandler handles custom close keys (if configured)
- [ ] ModalInputHandler ignores input during animations
- [ ] ModalInputHandler returns boolean indicating if key was handled

### TR4: ModalRenderer Implementation (Helper)

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
    renderContent(content, selectedIndex, scrollPosition, x, y, width, height)
    renderContentBlock(block, isSelected, x, y, width)
    calculateModalSize(terminalSize)
    calculateModalPosition(width, height, terminalSize)
  }
  ```
- Rendering: uses ANSI escapes and chalk for colors
- Positioning: centers modal on screen
- Sizing: fixed percentages of terminal size
- Scrolling: renders visible portion of all content (messages and options together)

**Acceptance Criteria**:

- [ ] ModalRenderer class exists in `src/render/ModalRenderer.js`
- [ ] ModalRenderer renders modal border, background, shadow
- [ ] ModalRenderer renders title, message, options
- [ ] ModalRenderer handles positioning and sizing
- [ ] ModalRenderer supports content scrolling (all content together)
- [ ] ModalRenderer renders flexible content blocks (messages and options intermixed)

### TR4: Renderer Integration

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

### TR5: InputHandler Integration

**Requirement**: Integrate modal input handling into `InputHandler.js`.

**Details**:

- InputHandler checks if modal is open (via ModalManager)
- If modal is open: InputHandler delegates to ModalInputHandler helper and does NOT process game input
- If modal is closed: InputHandler handles game input normally
- When modal is open, all input is handled exclusively by ModalInputHandler helper (no game input processing)
- InputHandler imports ModalInputHandler helper
- InputHandler imports ModalManager (or receives it as dependency)

**Acceptance Criteria**:

- [ ] InputHandler checks modal state before handling input
- [ ] InputHandler delegates to ModalInputHandler helper when modal is open
- [ ] When modal is open, InputHandler does NOT process any game input
- [ ] InputHandler handles game input ONLY when modal is closed
- [ ] InputHandler imports ModalInputHandler helper
- [ ] Input routing works correctly (modal input when open, game input when closed)

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
    closeKey: 'x',  // Optional: single additional close key
    // OR
    // closeKey: ['x', 'c'],  // Optional: multiple additional close keys
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
// In InputHandler.js
import { ModalInputHandler } from '../ui/ModalInputHandler.js';
import { modalManager } from '../ui/ModalManager.js';  // Singleton or passed in

class InputHandler {
  constructor(callbacks = {}) {
    this.callbacks = callbacks;
    this.modalInputHandler = new ModalInputHandler(modalManager);
    // ... other initialization
  }

  handleKeypress(str, key) {
    // Check if modal is open
    if (modalManager.hasOpenModal()) {
      const modal = modalManager.getCurrentModal();
      // Delegate to modal input handler helper
      // When modal is open, NO game inputs are processed
      this.modalInputHandler.handleKeypress(str, key, modal);
      return;  // Modal handles all input, don't process game input
    }

    // Handle game input normally (only when modal is closed)
    // ... existing game input handling
  }
}
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

- Modal class: option selection, content scrolling, action execution, flexible content blocks
- ModalManager: stack management, state tracking, reset
- ModalInputHandler helper: key handling, returns boolean
- ModalRenderer helper: rendering, positioning, sizing
- InputHandler: modal state checking, delegation to helper

### Integration Tests

- Modal opening/closing in local mode
- Modal opening/closing in networked mode
- Modal stacking behavior
- InputHandler delegation to ModalInputHandler helper
- Input routing between modal and game
- Action execution in both modes
- Modal reset on game restart

### Manual Testing

- Visual appearance: border, background, shadow, selection indicator
- Animation: smooth opening animation
- Scrolling: content scrolling with long content (all content scrolls together)
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
- [ ] Modal closes with 'q' key
- [ ] Modal closes with custom close keys (if configured)
- [ ] Content scrolling works for long content (all content scrolls together)
- [ ] Options and messages can be intermixed in any order
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

- Input handling system (`InputHandler` - uses `ModalInputHandler` helper)
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

