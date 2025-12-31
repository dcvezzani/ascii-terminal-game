# Modal Testing Instructions

## Testing Modals in Local Mode

### Prerequisites

1. **Ensure WebSocket mode is disabled** (for local mode):
   - Open `src/config/serverConfig.js`
   - Verify that `websocket.enabled` is set to `false`:
     ```javascript
     websocket: {
       enabled: false,  // Must be false for local mode
       // ... other settings
     }
     ```

### Step 1: Enable the Example Modal

1. Open `src/modes/localMode.js`
2. Find the example modal code (around lines 161-192)
3. Uncomment the last two lines to enable the modal:

   **Find this (currently commented out):**
   ```javascript
   // Example: Open modal (uncomment to test)
   // modalManager.openModal(gameOverModal);
   // renderer.renderFull(game);
   ```

   **Change it to:**
   ```javascript
   // Example: Open modal (uncomment to test)
   modalManager.openModal(gameOverModal);
   renderer.renderFull(game);
   ```

### Step 2: Start the Game

Run the game in local mode:

```bash
npm start
```

Or directly:

```bash
node src/index.js
```

### Step 3: Interact with the Modal

When the game starts, you should see a "Game Over" modal displayed over the game board.

**Modal Controls:**

- **Navigate Options**:
  - **Up Arrow** or **W** - Move to previous option
  - **Down Arrow** or **S** - Move to next option

- **Select Option**:
  - **Enter** - Execute the selected option's action

- **Close Modal**:
  - **ESC** - Close the modal without executing any action
  - **Q** - Close the modal without executing any action

**Example Modal Options:**

- **Restart** (first option):
  - Navigate to it with Up/Down arrows
  - Press Enter to restart the game
  - Modal will close automatically after action executes

- **Quit** (second option):
  - Navigate to it with Down arrow
  - Press Enter to quit the game
  - Modal will close automatically after action executes

### Step 4: Test Modal Behavior

**Test Navigation:**
1. Modal opens with first option ("Restart") selected
2. Press **Down Arrow** or **S** - selection moves to "Quit"
3. Press **Up Arrow** or **W** - selection moves back to "Restart"

**Test Selection:**
1. Navigate to "Restart" option
2. Press **Enter** - game should restart and modal should close
3. Modal should reappear (since it's opened on game start)

**Test Closing:**
1. Press **ESC** or **Q** - modal should close without executing any action
2. Game should continue normally
3. You can move the player with arrow keys

**Test Input Blocking:**
1. When modal is open, try pressing movement keys (Arrow keys, WASD)
2. Player should NOT move - modal input takes priority
3. Close modal with ESC or Q
4. Now movement keys should work normally

### Step 5: Disable Modal for Normal Play

After testing, comment out the modal opening lines again:

```javascript
// Example: Open modal (uncomment to test)
// modalManager.openModal(gameOverModal);
// renderer.renderFull(game);
```

## Creating Your Own Test Modal

You can create custom modals for testing. Here's an example:

```javascript
// Create a custom test modal
const testModal = new Modal({
  title: 'Test Modal',
  content: [
    { type: 'message', text: 'This is a test message' },
    { type: 'message', text: 'You can have multiple messages' },
    {
      type: 'option',
      label: 'Option 1',
      action: () => {
        console.log('Option 1 selected!');
        // Add your custom action here
      },
    },
    {
      type: 'option',
      label: 'Option 2',
      action: () => {
        console.log('Option 2 selected!');
      },
    },
  ],
});

// Open the modal
modalManager.openModal(testModal);
renderer.renderFull(game);
```

## Troubleshooting

**Modal doesn't appear:**
- Verify `serverConfig.websocket.enabled` is `false`
- Check that you uncommented both lines (openModal and renderFull)
- Ensure terminal is large enough (minimum 25 rows, 30 columns)

**Modal appears but input doesn't work:**
- Verify ModalManager was passed to InputHandler constructor
- Check that modal is actually open: `modalManager.hasOpenModal()` should return `true`

**Game input still works when modal is open:**
- This indicates ModalManager wasn't passed to InputHandler
- Check `src/modes/localMode.js` line 41: `new InputHandler(callbacks, modalManager)`

**Modal doesn't close:**
- ESC and Q should always close the modal
- If action doesn't close modal, check if `autoClose: false` is set on the option

