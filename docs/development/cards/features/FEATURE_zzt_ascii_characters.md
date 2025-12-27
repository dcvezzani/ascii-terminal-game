# Feature: ZZT ASCII Character Support

## Context

Currently, the game uses simple ASCII characters:
- Player: `@`
- Walls: `#`
- Empty space: ` ` (space)

The user wants to use the same font characters used by ZZT (Zoo of ZZT), a classic DOS-era text-based game. ZZT uses extended ASCII characters (IBM Code Page 437) including box-drawing characters, special symbols, and graphical elements that give it a distinctive retro aesthetic.

**Reference**: [Museum of ZZT ASCII Character Reference](https://museumofzzt.com/ascii/)

**Location**: Implementation will be in:
- `src/constants/characterSets/zztCharacters.js` - New file for ZZT character mappings
- `src/constants/characterSets/index.js` - Character set selector/loader
- `src/constants/gameConstants.js` - Import and use selected character set
- `src/render/Renderer.js` - Use characters from gameConstants (no changes needed)
- `src/game/Board.js` - Use characters from gameConstants (no changes needed)

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

### Option 1: Character Set System (Recommended)
- Create `src/constants/characterSets/` directory for character set definitions
- Create `src/constants/characterSets/zztCharacters.js` with ZZT character mappings
- Create `src/constants/characterSets/simpleCharacters.js` with current simple ASCII characters
- Create `src/constants/characterSets/index.js` to export selected character set
- Update `gameConstants.js` to import from character set system
- Keep Unicode characters separate from other game constants
- **Pros**: 
  - Clean separation of concerns
  - Easy to add new character sets (roguelike, custom, etc.)
  - Simple to switch between character sets
  - Future-proof architecture
- **Cons**: Slightly more files, but better organization

### Option 2: Character Theme System (More Flexible, Future Enhancement)
- Build on Option 1, add theme switching via configuration
- Allow runtime switching between character sets
- Store selected theme in gameConfig
- **Pros**: Very flexible, allows user customization
- **Cons**: More complex, can be added later if needed

### Recommended ZZT Characters

Based on the [Museum of ZZT ASCII reference](https://museumofzzt.com/ascii/):

**Walls/Borders:**
- `█` (219) - Solid block (good for walls)
- `▓` (178) - Medium shade block
- `▒` (177) - Light shade block
- `░` (176) - Lightest shade block
- Box-drawing: `─` (196), `│` (179), `┌` (218), `┐` (191), `└` (192), `┘` (217)

**Player:**
- `☺` (1) - Smiley face (classic ZZT) ⭐ **SELECTED**
- `@` (64) - Classic roguelike (alternative)
- `►` (16) - Right arrow

**Empty Space:**
- ` ` (32) - Space (current)
- `·` (250) - Middle dot
- `.` (46) - Period

**Selected Default:**
- Player: `☺` (Code Page 437: 1) - Traditional ZZT smiley face
- Walls: `█` (Code Page 437: 219, U+2588) - Solid block
- Empty: ` ` (Code Page 437: 32) - Space

## Technical Details

### Character Encoding

- ZZT uses IBM Code Page 437 (extended ASCII)
- Characters 0-255 are available
- Modern terminals should support these characters
- UTF-8 encoding should handle most characters

### Implementation Steps

1. **Create Character Sets Directory Structure**
   ```
   src/constants/characterSets/
     ├── index.js              # Character set selector
     ├── simpleCharacters.js   # Current simple ASCII characters
     └── zztCharacters.js      # ZZT Unicode characters
   ```

2. **Create Simple Characters Set** (baseline/fallback)
   ```javascript
   // src/constants/characterSets/simpleCharacters.js
   export const simpleCharacters = {
     PLAYER: '@',        // Simple ASCII @
     WALL: '#',          // Simple ASCII #
     EMPTY: ' ',         // Space
   };
   ```

3. **Create ZZT Characters Set**
   ```javascript
   // src/constants/characterSets/zztCharacters.js
   export const zztCharacters = {
     PLAYER: '☺',        // Code Page 437: 1, U+263A - Traditional ZZT smiley face
     WALL: '█',          // Code Page 437: 219, U+2588 - Full block
     WALL_MEDIUM: '▓',   // Code Page 437: 178, U+2593 - Dark shade
     WALL_LIGHT: '▒',    // Code Page 437: 177, U+2592 - Medium shade
     EMPTY: ' ',         // Code Page 437: 32 - Space
     // Future: Add more ZZT characters as needed
   };
   ```

4. **Create Character Set Selector**
   ```javascript
   // src/constants/characterSets/index.js
   import { simpleCharacters } from './simpleCharacters.js';
   import { zztCharacters } from './zztCharacters.js';
   
   // Select character set (can be made configurable later)
   const CHARACTER_SET = 'zzt'; // or 'simple'
   
   export const characterSet = CHARACTER_SET === 'zzt' 
     ? zztCharacters 
     : simpleCharacters;
   
   // Export individual characters for convenience
   export const PLAYER_CHAR = characterSet.PLAYER;
   export const WALL_CHAR = characterSet.WALL;
   export const EMPTY_SPACE_CHAR = characterSet.EMPTY;
   ```

5. **Update gameConstants.js**
   - Import from character set system instead of defining directly
   - Keep structure, but source from character sets
   ```javascript
   // src/constants/gameConstants.js
   import { 
     PLAYER_CHAR, 
     WALL_CHAR, 
     EMPTY_SPACE_CHAR 
   } from './characterSets/index.js';
   
   export const PLAYER_CHAR = PLAYER_CHAR;
   export const WALL_CHAR = WALL_CHAR;
   export const EMPTY_SPACE_CHAR = EMPTY_SPACE_CHAR;
   ```

6. **No Changes Needed to Renderer.js or Board.js**
   - They already import from gameConstants.js
   - Will automatically use new characters

### Future Extensibility

This architecture makes it easy to add new character sets:

**Future Character Sets:**
- `roguelikeCharacters.js` - Traditional roguelike symbols
- `boxDrawingCharacters.js` - Box-drawing characters for borders
- `customCharacters.js` - User-defined character set
- `emojiCharacters.js` - Emoji-based characters

**Future Enhancement:**
- Add character set selection to `gameConfig.js`
- Allow runtime switching
- Support custom character set files

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

- **Architecture Decision**: Keep Unicode characters separate in `characterSets/` directory
- This allows easy addition of future character sets (roguelike, custom, etc.)
- Character sets are isolated and can be swapped easily
- Start with ZZT characters, can add more sets incrementally
- Test in multiple terminals to ensure compatibility
- Future: Can make character set selection configurable via gameConfig

## Open Questions

- [ ] Which specific ZZT characters should we use?
  - **Answer**: `☺` (smiley face) for player, `█` for walls, space for empty
- [ ] Should we support switching between character sets?
  - **Answer**: Architecture supports it, but start with ZZT as default. Can add configurable switching later
- [ ] What about terminals that don't support extended ASCII?
  - **Answer**: Test first, add fallback to simple characters if needed
- [ ] Should we use box-drawing characters or solid blocks for walls?
  - **Answer**: Start with solid blocks (`█`), can add box-drawing character set later
- [ ] How should character sets be organized?
  - **Answer**: Separate directory (`characterSets/`) with individual files per set, selector in index.js

