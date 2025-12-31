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

---

## Testing Modals in Networked Mode

### Prerequisites

1. **Ensure WebSocket mode is enabled**:
   - Open `src/config/serverConfig.js`
   - Verify that `websocket.enabled` is set to `true`:
     ```javascript
     websocket: {
       enabled: true,  // Must be true for networked mode
       // ... other settings
     }
     ```

2. **Start the WebSocket server** (in one terminal):
   ```bash
   npm run server
   ```
   
   Or directly:
   ```bash
   node src/server/server.js
   ```
   
   The server will start on port 3000 by default and display:
   ```
   WebSocket game server is running. Press Ctrl+C to stop.
   ```

### Step 1: Enable the Example Modal

1. Open `src/modes/networkedMode.js`
2. Find a good location to add a test modal (e.g., after the WebSocket client connects, around line 60-65)
3. Add the following code to create and open a test modal:

   ```javascript
   // Example: Create a test modal (add this after wsClient.connect() or in onConnect callback)
   const testModal = new Modal({
     title: 'Network Test',
     content: [
       { type: 'message', text: 'Connected to server!' },
       { type: 'message', text: 'This is a test modal in networked mode.' },
       {
         type: 'option',
         label: 'Close',
         action: () => {
           clientLogger.info('Close option selected');
           // Modal will close automatically after action
         },
       },
       {
         type: 'option',
         label: 'Quit',
         action: () => {
           if (inputHandler) {
             inputHandler.stop();
           }
           if (wsClient) {
             wsClient.sendDisconnect();
             wsClient.disconnect();
           }
           running = false;
           if (game) {
             game.stop();
           }
         },
       },
     ],
   });

   // Open the modal after connection is established
   modalManager.openModal(testModal);
   if (renderer && currentState) {
     renderer.renderFull(game, currentState, localPlayerId);
   }
   ```

   **Note**: You may want to add this in the `wsClient.onConnect()` callback or after the initial state update is received, so the modal appears after the game state is available.

### Step 2: Start the Client

In a **separate terminal** (with the server still running), start the client:

```bash
npm start
```

Or directly:

```bash
node src/index.js
```

The client will automatically connect to the server if `serverConfig.websocket.enabled` is set to `true`.

### Step 3: Interact with the Modal

When the client connects and the modal appears, you can interact with it using the same controls as local mode:

**Modal Controls:**

- **Navigate Options**:
  - **Up Arrow** or **W** - Move to previous option
  - **Down Arrow** or **S** - Move to next option

- **Select Option**:
  - **Enter** - Execute the selected option's action

- **Close Modal**:
  - **ESC** - Close the modal without executing any action
  - **Q** - Close the modal without executing any action

### Step 4: Test Modal Behavior in Networked Mode

**Test Navigation:**
1. Modal opens with first option selected
2. Press **Down Arrow** or **S** - selection moves to next option
3. Press **Up Arrow** or **W** - selection moves back to previous option

**Test Selection:**
1. Navigate to an option
2. Press **Enter** - action should execute and modal should close
3. Game should continue normally

**Test Closing:**
1. Press **ESC** or **Q** - modal should close without executing any action
2. Game should continue normally
3. You can move the player with arrow keys

**Test Input Blocking:**
1. When modal is open, try pressing movement keys (Arrow keys, WASD)
2. Player should NOT move - modal input takes priority
3. Close modal with ESC or Q
4. Now movement keys should work normally

**Test with Multiple Clients:**
1. Start multiple clients (in separate terminals)
2. Open a modal on one client
3. Verify that:
   - The modal only appears on the client that opened it
   - Other clients continue to see the game normally
   - Other players can still move (game continues on server)
   - The modal doesn't affect other clients' gameplay

### Step 5: Differences from Local Mode

**Key Differences:**

- **Game continues**: In networked mode, the game continues on the server even when a modal is open. Other players can still move and interact with the game.
- **Server state**: The modal is client-side only. It doesn't affect server state or other clients.
- **Reconnection**: If you disconnect and reconnect, the modal state is not preserved (it's reset).
- **Server restart**: If the server restarts, the modal is automatically closed (via `onServerRestart` callback).

### Step 6: Clean Up

After testing, remove or comment out the test modal code:

```javascript
// Example: Test modal (remove or comment out after testing)
// const testModal = new Modal({ ... });
// modalManager.openModal(testModal);
```

## Troubleshooting (Networked Mode)

**Modal doesn't appear:**
- Verify `serverConfig.websocket.enabled` is `true`
- Ensure the WebSocket server is running
- Check that the client successfully connected to the server
- Verify the modal is opened after `currentState` is available
- Ensure terminal is large enough (minimum 25 rows, 30 columns)

**Modal appears but input doesn't work:**
- Verify ModalManager was passed to InputHandler constructor
- Check that modal is actually open: `modalManager.hasOpenModal()` should return `true`
- Check client logs for any errors

**Game input still works when modal is open:**
- This indicates ModalManager wasn't passed to InputHandler
- Check `src/modes/networkedMode.js`: `new InputHandler(callbacks, modalManager, callback)`

**Modal doesn't close:**
- ESC and Q should always close the modal
- If action doesn't close modal, check if `autoClose: false` is set on the option

**Server connection issues:**
- Verify server is running on the correct port (default: 3000)
- Check server logs for connection errors
- Ensure firewall isn't blocking the connection

**Modal disappears on server restart:**
- This is expected behavior - modals are reset when the server restarts
- The `onServerRestart` callback automatically closes the modal

