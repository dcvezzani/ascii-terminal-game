# Specification: ZZT ASCII Character Support

## Overview

This specification details the implementation of ZZT-style extended ASCII characters (IBM Code Page 437) to replace the current simple ASCII characters in the terminal game. The implementation will use a flexible character set system that allows for easy customization and future expansion with additional character sets.

**Reference Card**: `docs/development/cards/features/FEATURE_zzt_ascii_characters.md`

## Goals

1. Replace simple ASCII characters with ZZT-style Unicode characters
2. Create a flexible character set system for future extensibility
3. Maintain backward compatibility with existing game logic
4. Provide authentic ZZT retro aesthetic

## Current State

**Current Characters:**
- Player: `@` (ASCII 64)
- Walls: `#` (ASCII 35)
- Empty: ` ` (ASCII 32, space)

**Current Implementation:**
- Characters defined in `src/constants/gameConstants.js`
- Used directly in `src/render/Renderer.js` and `src/game/Board.js`
- Simple, flat structure

## Target State

**Target Characters:**
- Player: `☺` (Code Page 437: 1, Unicode: U+263A) - Traditional ZZT smiley face
- Walls: `█` (Code Page 437: 219, Unicode: U+2588) - Full block
- Empty: ` ` (Code Page 437: 32) - Space

**Target Architecture:**
- Character sets organized in `src/constants/characterSets/` directory
- Separate files for each character set (simple, zzt, future sets)
- Character set selector in `index.js`
- `gameConstants.js` imports from character set system
- No changes needed to Renderer or Board classes

## Functional Requirements

### FR1: Character Set Directory Structure

**Requirement**: Create organized directory structure for character sets.

**Details**:
- Create `src/constants/characterSets/` directory
- Each character set in its own file
- Central selector/loader in `index.js`

**Files to Create**:
- `src/constants/characterSets/index.js` - Character set selector
- `src/constants/characterSets/simpleCharacters.js` - Simple ASCII (baseline)
- `src/constants/characterSets/zztCharacters.js` - ZZT Unicode characters

**Acceptance Criteria**:
- [ ] Directory structure created
- [ ] All character set files exist
- [ ] Files follow ES Module format

### FR2: Simple Characters Set

**Requirement**: Create baseline simple ASCII character set.

**Details**:
- Maintain current simple ASCII characters as fallback
- Use for terminals that don't support extended ASCII
- Structure matches ZZT character set format

**Character Definitions**:
```javascript
{
  PLAYER: '@',    // ASCII 64
  WALL: '#',      // ASCII 35
  EMPTY: ' ',     // ASCII 32
}
```

**Acceptance Criteria**:
- [ ] `simpleCharacters.js` file created
- [ ] Exports character object with PLAYER, WALL, EMPTY
- [ ] Characters match current gameConstants values

### FR3: ZZT Characters Set

**Requirement**: Create ZZT-style extended ASCII character set.

**Details**:
- Use traditional ZZT characters from Code Page 437
- Player: smiley face (☺)
- Walls: solid block (█)
- Include additional ZZT characters for future use

**Character Definitions**:
```javascript
{
  PLAYER: '☺',        // CP437: 1 → Unicode: U+263A (White Smiling Face)
  WALL: '█',          // CP437: 219 → Unicode: U+2588 (Full Block)
  WALL_MEDIUM: '▓',   // CP437: 178 → Unicode: U+2593 (Dark Shade)
  WALL_LIGHT: '▒',    // CP437: 177 → Unicode: U+2592 (Medium Shade)
  EMPTY: ' ',         // CP437: 32 → ASCII: 32 (Space)
}
```

**Note**: We use Unicode characters that visually match Code Page 437 characters. Modern terminals use UTF-8, so we can't directly use CP437 code points. The Unicode equivalents should render the same as CP437 characters when displayed in a terminal with appropriate font support.

**Acceptance Criteria**:
- [ ] `zztCharacters.js` file created
- [ ] Exports character object with required characters
- [ ] Player character is ☺ (traditional ZZT smiley)
- [ ] Wall character is █ (solid block)
- [ ] Additional ZZT characters included for future use

### FR4: Character Set Selector

**Requirement**: Create selector system to choose active character set.

**Details**:
- Central selector in `index.js`
- Exports selected character set
- Exports individual characters for convenience
- Easy to change which set is active

**Implementation**:
```javascript
// Select character set (can be made configurable later)
const CHARACTER_SET = 'zzt'; // or 'simple'

// Export selected set
export const characterSet = CHARACTER_SET === 'zzt' 
  ? zztCharacters 
  : simpleCharacters;

// Export individual characters
export const PLAYER_CHAR = characterSet.PLAYER;
export const WALL_CHAR = characterSet.WALL;
export const EMPTY_SPACE_CHAR = characterSet.EMPTY;
```

**Acceptance Criteria**:
- [ ] `index.js` imports both character sets
- [ ] Selects character set based on constant
- [ ] Exports selected character set object
- [ ] Exports individual character constants
- [ ] Easy to switch between character sets

### FR5: Update Game Constants

**Requirement**: Update `gameConstants.js` to use character set system.

**Details**:
- Import from character set system instead of defining directly
- Maintain same export structure
- No breaking changes to existing imports

**Implementation**:
```javascript
import { 
  PLAYER_CHAR, 
  WALL_CHAR, 
  EMPTY_SPACE_CHAR 
} from './characterSets/index.js';

export const PLAYER_CHAR = PLAYER_CHAR;
export const WALL_CHAR = WALL_CHAR;
export const EMPTY_SPACE_CHAR = EMPTY_SPACE_CHAR;
```

**Acceptance Criteria**:
- [ ] `gameConstants.js` imports from character set system
- [ ] Exports same constants as before
- [ ] No changes needed to files that import from gameConstants
- [ ] Characters now use ZZT set by default

### FR6: Verify Character Display

**Requirement**: Ensure ZZT characters display correctly in terminals.

**Details**:
- Test in common terminals (Terminal.app, iTerm2, Windows Terminal)
- Verify Unicode characters render correctly
- Document any terminal compatibility issues

**Acceptance Criteria**:
- [ ] Characters display correctly in macOS Terminal
- [ ] Characters display correctly in iTerm2
- [ ] Characters display correctly in Windows Terminal (if available)
- [ ] Fallback to simple characters works if needed

## Technical Requirements

### TR1: Character Encoding

**Requirement**: Use proper character encoding for Code Page 437 characters.

**Details**:
- ZZT uses IBM Code Page 437 (legacy DOS encoding)
- Modern terminals use UTF-8 Unicode
- Need to map CP437 characters to Unicode equivalents
- Store as Unicode characters (UTF-8) in source code
- Ensure file encoding is UTF-8

**Code Page 437 to Unicode Mapping**:
- CP437 char 1 (smiley) → Unicode U+263A `☺` (White Smiling Face)
- CP437 char 219 (solid block) → Unicode U+2588 `█` (Full Block)
- CP437 char 178 (medium shade) → Unicode U+2593 `▓` (Dark Shade)
- CP437 char 177 (light shade) → Unicode U+2592 `▒` (Medium Shade)

**Important Note**: 
- Code Page 437 is a legacy encoding from DOS era
- Modern terminals use UTF-8, so we use Unicode equivalents
- The Unicode characters should visually match CP437 characters
- Terminal font must support these Unicode characters

**Acceptance Criteria**:
- [ ] All character files use UTF-8 encoding
- [ ] Characters defined as Unicode strings (not CP437 code points)
- [ ] Unicode characters visually match CP437 characters
- [ ] No encoding issues in source files
- [ ] Characters display correctly in modern terminals

### TR2: Module Structure

**Requirement**: Follow ES Module format consistently.

**Details**:
- All files use `export` statements
- Use named exports
- Follow existing project patterns

**Acceptance Criteria**:
- [ ] All character set files use ES Modules
- [ ] Exports follow consistent naming
- [ ] No CommonJS syntax

### TR3: Backward Compatibility

**Requirement**: No breaking changes to existing code.

**Details**:
- Renderer.js and Board.js continue to work without changes
- gameConstants.js maintains same export interface
- All existing imports continue to work

**Acceptance Criteria**:
- [ ] All existing tests pass
- [ ] No changes needed to Renderer.js
- [ ] No changes needed to Board.js
- [ ] Game runs correctly with new characters

### TR4: Extensibility

**Requirement**: Architecture supports future character sets.

**Details**:
- Easy to add new character set files
- Simple to switch between character sets
- Clear pattern for future additions

**Future Character Sets** (not in scope, but architecture should support):
- `roguelikeCharacters.js`
- `boxDrawingCharacters.js`
- `customCharacters.js`
- `emojiCharacters.js`

**Acceptance Criteria**:
- [ ] Adding new character set requires only:
  - Creating new file in characterSets/
  - Updating index.js selector
- [ ] No changes needed to gameConstants.js for new sets
- [ ] Pattern is clear and documented

## Data Structures

### Character Set Object

```javascript
{
  PLAYER: string,      // Player character
  WALL: string,        // Wall character
  WALL_MEDIUM?: string, // Optional: Medium shade wall
  WALL_LIGHT?: string,  // Optional: Light shade wall
  EMPTY: string,       // Empty space character
}
```

**Required Properties**:
- `PLAYER`: Character for player
- `WALL`: Character for walls
- `EMPTY`: Character for empty spaces

**Optional Properties**:
- `WALL_MEDIUM`: Alternative wall character
- `WALL_LIGHT`: Alternative wall character

## File Structure

```
src/constants/
├── gameConstants.js                    # Updated to import from characterSets
└── characterSets/                      # New directory
    ├── index.js                        # Character set selector
    ├── simpleCharacters.js            # Simple ASCII characters
    └── zztCharacters.js               # ZZT Unicode characters
```

## Implementation Notes

### Character Selection

**Default**: ZZT characters (`zzt`)
- Can be changed by updating `CHARACTER_SET` constant in `index.js`
- Future: Can be made configurable via `gameConfig.js`

### Terminal Compatibility

**How Code Page 437 Works in Modern Terminals**:
- Code Page 437 is a legacy DOS encoding (IBM PC character set)
- Modern terminals use UTF-8 Unicode encoding
- We use Unicode characters that visually match CP437 characters
- Terminal font must support these Unicode characters

**Supported Terminals**:
- macOS Terminal.app (should work with Unicode characters)
- iTerm2 (should work with Unicode characters)
- Windows Terminal (should work with Unicode characters)
- Most modern Linux terminals (should work with Unicode characters)

**Font Requirements**:
- Terminal font must include Unicode block characters (U+2588, U+2592, U+2593)
- Terminal font must include Unicode smiley face (U+263A)
- Most modern monospace fonts support these characters
- If characters don't display, user may need to change terminal font

**Fallback**:
- If ZZT characters don't display correctly, switch to `simple` character set
- Update `CHARACTER_SET` in `index.js` to `'simple'`
- Simple characters use basic ASCII that works everywhere

**Alternative Approach** (if Unicode doesn't match):
- Could use a CP437-to-Unicode mapping library
- Or manually verify each character displays correctly
- Test actual character appearance, not just code points

### Testing Strategy

1. **Unit Tests**: Test character set exports
2. **Visual Testing**: Run game and verify characters display correctly
3. **Terminal Testing**: Test in multiple terminal applications
4. **Regression Testing**: Ensure all existing tests still pass

## Success Criteria

- [ ] Character set directory structure created
- [ ] Simple and ZZT character sets implemented
- [ ] Character set selector working
- [ ] gameConstants.js updated to use character sets
- [ ] Game displays ZZT characters correctly
- [ ] Player character is ☺ (smiley face)
- [ ] Wall character is █ (solid block)
- [ ] All existing tests pass
- [ ] No breaking changes to existing code
- [ ] Architecture supports future character sets

## Dependencies

- `src/constants/gameConstants.js` - Must exist
- `src/render/Renderer.js` - Uses characters from gameConstants
- `src/game/Board.js` - Uses characters from gameConstants

## Related Documents

- **Feature Card**: `docs/development/cards/features/FEATURE_zzt_ascii_characters.md`
- **Reference**: [Museum of ZZT ASCII Character Reference](https://museumofzzt.com/ascii/)

## Open Questions

All questions from the feature card have been answered:
- ✅ Character selection: ☺ for player, █ for walls
- ✅ Architecture: Character set system with separate directory
- ✅ Extensibility: Designed for future character sets

## Status

**Status**: 📋 READY FOR GAMEPLAN

**Next Step**: Create gameplan document for implementation

