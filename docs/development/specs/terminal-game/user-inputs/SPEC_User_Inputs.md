# Spec: User Inputs

## Purpose

**User Inputs** defines how the application captures and interprets keyboard (and optionally line-based) input: TTY raw mode, readline fallback when keys are not delivered, parsing of key sequences into application-defined actions, and stream error handling. The spec does **not** prescribe specific key bindings; the application defines which keys map to which actions (e.g. move, quit, restart, help).

**Consolidated from:** terminal-rendering_SPECS.md (§5 Input), Client spec (input handling patterns), mvp-multiplayer-game (input handling).

---

## 1. Scope

| In scope | Out of scope |
|----------|--------------|
| TTY raw mode + readline fallback | Specific key bindings (application-defined) |
| Parsing Buffer/string into key codes or line commands | What actions do (e.g. send MOVE — application) |
| Stream error handling (stdin, readline) | Game logic (movement validation, prediction) |
| Quit/exit: restore TTY, clear timers, exit | |

---

## 2. TTY vs non-TTY

- **stdin is a TTY:** Use **raw mode** (`process.stdin.setRawMode(true)`), resume stdin, set encoding to `null` (for Buffers), and listen for `'data'` to get keypresses. Parse chunks into **application-defined actions** (e.g. quit, move, pause). Application decides which keys map to which actions.
- **stdin is not a TTY** (e.g. run via `npm run` or in an IDE): Do not set raw mode. Use **line-based** input (e.g. Node `readline`): read lines and interpret them (e.g. "q" + Enter for quit). Application defines which line commands are supported.

---

## 3. Fallback when TTY does not deliver keypresses

- In some environments, stdin may be a TTY but keypresses are not delivered. **Recommendation:** When stdin is a TTY, attach **both** (1) a raw `'data'` listener and (2) a readline interface. Handle both: instant keys from `'data'` and line-based commands from readline.

---

## 4. Key/input parsing

- Parser should accept **Buffer or string** (stdin may emit either when readline is attached). Use a single “byte at index” helper (e.g. `buffer[i]` for Buffer, `buffer.charCodeAt(i)` for string) so comparisons to byte values work for both.
- **Application-defined:** Which key codes or line strings map to which actions (quit, move up/down/left/right, pause, confirm, restart, help). This spec does not prescribe bindings.

---

## 5. Stream error handling

- Attach `'error'` listeners to the readline interface and to `process.stdin`. In the handler, log or ignore; do **not** rethrow. Avoids unhandled EIO when the process is killed or stdin is closed and the user later presses a key.

---

## 6. Quit (or other exit action)

- When the application’s “quit” (or exit) action is triggered: clear any timers (e.g. game loop, debounce), restore stdin (e.g. `setRawMode(false)` if it was set), then `process.exit(0)` (or the app’s exit path). Optionally clear the screen before exit.

---

## 7. Typical bindings (application-defined; for reference)

- **Movement:** Arrow keys ↑↓←→; WASD (W=up, S=down, A=left, D=right).
- **Quit/Exit:** Q or ESC.
- **Restart:** R. **Help:** H or ?.

---

## 8. Success criteria

- [ ] Keys work when stdin is a real TTY; when not, or when TTY does not deliver keys, line-based input works.
- [ ] No unhandled stdin/readline errors after process kill.
- [ ] Application actions and key bindings are defined and implemented by the application.
- [ ] On quit: TTY restored, timers cleared, clean exit.

---

## 9. Related specs

| Spec | Relation |
|------|----------|
| [Canvas](../canvas/SPEC_Canvas.md) | Resize handler and debounce timer (cleared on quit). |
| [Overall](../SPEC_Overall.md) | How User Inputs fits in the terminal game stack; application wires input to actions. |
