# Feature: ZZT ASCII Character Support

## Context

Currently, the game uses simple ASCII characters:
- Player: `@`
- Walls: `#`
- Empty space: ` ` (space)

The user wants to use the same font characters used by ZZT (Zoo of ZZT), a classic DOS-era text-based game. ZZT uses extended ASCII characters (IBM Code Page 437) including box-drawing characters, special symbols, and graphical elements that give it a distinctive retro aesthetic.

**Reference**: [Museum of ZZT ASCII Character Reference](https://museumofzzt.com/ascii/)

**Location**: Implementation will be in:
- `src/constants/gameConstants.js` - Add ZZT character constants
- `src/constants/zztCharacters.js` - New file for ZZT character mappings
- `src/render/Renderer.js` - Use ZZT characters for rendering
- `src/game/Board.js` - Use ZZT characters for board initialization

## Problem

**Current State**:
- Simple ASCII characters (limited visual appeal)
- No retro aesthetic
- Characters don't match classic ZZT style

**Desired State**:
- Use ZZT-style extended ASCII characters
- Retro aesthetic matching classic ZZT games
- Box-drawing characters for walls
- Special characters for player and other elements

## Desired Feature

Incorporate ZZT ASCII characters into the game to give it a classic retro aesthetic. The easiest approach would be to:

1. **Create ZZT Character Constants**
   - Map common ZZT characters to game elements
   - Use box-drawing characters for walls
   - Use appropriate characters for player and empty spaces

2. **Update Game Constants**
   - Replace simple characters with ZZT equivalents
   - Ensure terminal compatibility

3. **Verify Display**
   - Test that extended ASCII characters display correctly
   - Handle terminals that don't support extended ASCII gracefully

## Requirements

### Functional Requirements

1. **Character Mapping**
   - Player character: ZZT-style character (currently `@`, could use `☺` or keep `@`)
   - Walls: Box-drawing characters (e.g., `█`, `▓`, `▒`, `░`, or box-drawing like `─`, `│`, `┌`, `┐`, `└`, `┘`)
   - Empty space: Appropriate ZZT character (could use `·` or keep space)

2. **Character Selection**
   - Use characters from ZZT's extended ASCII set (Code Page 437)
   - Choose characters that are visually distinct
   - Ensure characters work in modern terminals

3. **Terminal Compatibility**
   - Test in common terminals (macOS Terminal, iTerm2, Windows Terminal, etc.)
   - Provide fallback for terminals that don't support extended ASCII
   - Document terminal requirements

### Technical Requirements

- Use extended ASCII characters (Code Page 437)
- Store character mappings in constants file
- Easy to swap between simple ASCII and ZZT characters
- No breaking changes to game logic

## Implementation Approach

### Option 1: Simple Character Replacement (Easiest)
- Create `src/constants/zztCharacters.js` with ZZT character mappings
- Update `gameConstants.js` to import and use ZZT characters
- Replace current characters with ZZT equivalents
- **Pros**: Simple, quick to implement
- **Cons**: Limited customization

### Option 2: Character Theme System (More Flexible)
- Create character theme system (simple, zzt, custom)
- Allow switching between themes
- Store themes in configuration
- **Pros**: Flexible, allows easy switching
- **Cons**: More complex, may be overkill

### Recommended ZZT Characters

Based on the [Museum of ZZT ASCII reference](https://museumofzzt.com/ascii/):

**Walls/Borders:**
- `█` (219) - Solid block (good for walls)
- `▓` (178) - Medium shade block
- `▒` (177) - Light shade block
- `░` (176) - Lightest shade block
- Box-drawing: `─` (196), `│` (179), `┌` (218), `┐` (191), `└` (192), `┘` (217)

**Player:**
- `@` (64) - Keep current (classic roguelike)
- `☺` (1) - Smiley face (classic ZZT)
- `►` (16) - Right arrow

**Empty Space:**
- ` ` (32) - Space (current)
- `·` (250) - Middle dot
- `.` (46) - Period

**Recommended Default:**
- Player: `@` (keep current - classic and recognizable)
- Walls: `█` (solid block - clear and visible)
- Empty: ` ` (space - clean)

## Technical Details

### Character Encoding

- ZZT uses IBM Code Page 437 (extended ASCII)
- Characters 0-255 are available
- Modern terminals should support these characters
- UTF-8 encoding should handle most characters

### Implementation Steps

1. **Create ZZT Characters File**
   ```javascript
   // src/constants/zztCharacters.js
   export const ZZT_CHARACTERS = {
     PLAYER: '@',        // or '☺'
     WALL_SOLID: '█',    // 219
     WALL_MEDIUM: '▓',   // 178
     WALL_LIGHT: '▒',    // 177
     EMPTY: ' ',         // or '·'
   };
   ```

2. **Update gameConstants.js**
   - Import ZZT characters
   - Use ZZT characters instead of simple ASCII
   - Keep simple ASCII as fallback option

3. **Update Renderer.js**
   - Use ZZT characters from constants
   - No logic changes needed

4. **Update Board.js**
   - Use ZZT wall character for initialization

### Terminal Compatibility

- Most modern terminals support extended ASCII
- Test in: Terminal.app, iTerm2, Windows Terminal, Linux terminals
- If issues occur, provide fallback to simple ASCII

## Benefits

- ✅ Classic retro aesthetic
- ✅ More visually appealing
- ✅ Authentic ZZT-style appearance
- ✅ Easy to implement (character replacement)
- ✅ Can be extended with more ZZT characters later

## Related Features

- **FEATURE_terminal_game_mvp** - Main game feature
- Game constants system (already exists)

## Dependencies

- Terminal support for extended ASCII (Code Page 437)
- UTF-8 encoding support
- `src/constants/gameConstants.js` - must exist

## Status

**Status**: 📋 NOT STARTED

## Priority

**Priority**: LOW

- Visual enhancement, not functional requirement
- Easy to implement
- Can be done incrementally
- Nice-to-have feature

## Notes

- Easiest approach: Simple character replacement (Option 1)
- Start with basic characters, can expand later
- Test in multiple terminals to ensure compatibility
- Consider making it configurable (simple vs ZZT characters)

## Open Questions

- [ ] Which specific ZZT characters should we use?
  - **Answer**: Start with `█` for walls, keep `@` for player, space for empty
- [ ] Should we support switching between simple and ZZT characters?
  - **Answer**: Start with ZZT, can add switching later if needed
- [ ] What about terminals that don't support extended ASCII?
  - **Answer**: Test first, add fallback if needed
- [ ] Should we use box-drawing characters or solid blocks for walls?
  - **Answer**: Start with solid blocks (`█`), can add box-drawing later

