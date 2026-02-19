# Spec: Game Title

## Purpose

The **Game Title** is the single line of text displayed at the top of the game block (above the board). It is configurable (e.g. from server or default), has a fixed display width of 60 characters, and is truncated with ellipses when longer.

**Consolidated from:** center-board-in-terminal (title rendering, width, truncation; merged into [Canvas](../canvas/SPEC_Canvas.md)).

---

## 1. Scope

| In scope | Out of scope |
|----------|--------------|
| Title string source (server config or default) | Layout position (Canvas spec) |
| Fixed width: 60 characters | Actual cursor/output (Renderer spec) |
| Truncation: length > 60 → slice(0, 57) + '...' | |
| Blank line(s) after title (layout contract: 1 blank) | |

---

## 2. Data and configuration

### 2.1 Constants

| Name | Value | Description |
|------|--------|-------------|
| TITLE_AND_STATUS_BAR_WIDTH | 60 | Fixed character width for title and status bar. |
| TITLE_MAX_LENGTH | 60 | Title string truncated to this length (with ellipses) when longer. |
| BLANK_LINES_AFTER_TITLE | 1 | Blank lines between title line and board. |

### 2.2 Title source

- **Server:** Title may be provided in server config (e.g. `game.title`) and sent to client (e.g. in CONNECT or state).
- **Default:** When no title is provided, client uses a default (e.g. `"=== Multiplayer Terminal Game ==="`).

### 2.3 Truncation

- If title length > 60: use `title.slice(0, 57) + '...'` so displayed length is 60.
- If title length ≤ 60: display as-is; padding to 60 is optional.

---

## 3. Layout (contract)

- **Position:** Row and column come from **Canvas** (startRow, startColumn). Title is drawn at row `startRow`, column `startColumn`.
- **Height:** Title block height = 1 title line + BLANK_LINES_AFTER_TITLE (e.g. 2 lines total). This is used by Canvas for block height and for placing the board below.

---

## 4. Success criteria

- [ ] Title displays at the position given by layout.
- [ ] Title never exceeds 60 characters; longer titles are truncated with ellipses.
- [ ] One blank line between title and board (layout contract).

---

## 5. Related specs

| Spec | Relation |
|------|----------|
| [Canvas](../canvas/SPEC_Canvas.md) | Provides startRow, startColumn; title height is part of block height. |
| [Renderer](../renderer/SPEC_Renderer.md) | Draws the title at the given position. |
| [Overall](../SPEC_Overall.md) | How Game Title fits in the terminal game stack. |
