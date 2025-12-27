# Specification: ZZT ASCII Character Support

## Overview

This specification details the implementation of ZZT-style characters using **actual IBM Code Page 437 byte values** (0-255) to replace the current simple ASCII characters in the terminal game. The implementation will output CP437 bytes directly, requiring the user to configure their terminal (iTerm) with a CP437-compatible font.

**Reference Card**: `docs/development/cards/features/FEATURE_zzt_ascii_characters.md`

**Key Approach**:
- Use CP437 byte values (0-255) directly, not Unicode equivalents
- Output raw bytes using Node.js `Buffer`
- User configures iTerm with a CP437 font (e.g., "Perfect DOS VGA", "IBM VGA")
- Terminal interprets bytes as CP437 when using the correct font

## Goals

1. Replace simple ASCII characters with actual CP437 byte values
2. Create a flexible character set system for future extensibility
3. Maintain backward compatibility with existing game logic
4. Provide authentic ZZT retro aesthetic using original CP437 encoding

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

**Target Characters (CP437 Byte Values):**
- Player: CP437 byte `1` (smiley face ☺) - Traditional ZZT player character
- Walls: CP437 byte `219` (solid block █) - Full block for walls
- Empty: CP437 byte `32` (space) - Empty space

**Target Architecture:**
- Character sets organized in `src/constants/characterSets/` directory
- Separate files for each character set (simple, zzt, future sets)
- Character set selector in `index.js`
- Characters stored as CP437 byte values (0-255)
- Output helper functions to write CP437 bytes to terminal
- `gameConstants.js` imports from character set system
- Renderer updated to output CP437 bytes instead of Unicode strings

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

**Requirement**: Create ZZT-style character set using CP437 byte values.

**Details**:
- Use actual CP437 byte values (0-255) for characters
- Player: CP437 byte 1 (smiley face)
- Walls: CP437 byte 219 (solid block)
- Store as byte values, not Unicode strings
- Include additional ZZT characters for future use

**Character Definitions**:
```javascript
{
  PLAYER: 1,          // CP437 byte 1 - Smiley face ☺
  WALL: 219,          // CP437 byte 219 - Full block █
  WALL_MEDIUM: 178,   // CP437 byte 178 - Medium shade ▓
  WALL_LIGHT: 177,    // CP437 byte 177 - Light shade ▒
  EMPTY: 32,          // CP437 byte 32 - Space
}
```

**Acceptance Criteria**:
- [ ] `zztCharacters.js` file created
- [ ] Exports character object with CP437 byte values
- [ ] Player character is byte value 1
- [ ] Wall character is byte value 219
- [ ] Additional ZZT characters included for future use
- [ ] Values are numbers (0-255), not strings

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

// Export individual characters (as byte values)
export const PLAYER_CHAR = characterSet.PLAYER;
export const WALL_CHAR = characterSet.WALL;
export const EMPTY_SPACE_CHAR = characterSet.EMPTY;
```

**Acceptance Criteria**:
- [ ] `index.js` imports both character sets
- [ ] Selects character set based on constant
- [ ] Exports selected character set object
- [ ] Exports individual character constants (as byte values)
- [ ] Easy to switch between character sets

### FR5: Update Game Constants

**Requirement**: Update `gameConstants.js` to use character set system.

**Details**:
- Import from character set system instead of defining directly
- Maintain same export structure
- Export byte values, not strings
- No breaking changes to existing imports (but values are now bytes)

**Implementation**:
```javascript
import { 
  PLAYER_CHAR, 
  WALL_CHAR, 
  EMPTY_SPACE_CHAR 
} from './characterSets/index.js';

export const PLAYER_CHAR = PLAYER_CHAR;  // CP437 byte value
export const WALL_CHAR = WALL_CHAR;      // CP437 byte value
export const EMPTY_SPACE_CHAR = EMPTY_SPACE_CHAR; // CP437 byte value
```

**Acceptance Criteria**:
- [ ] `gameConstants.js` imports from character set system
- [ ] Exports same constants as before (but as byte values)
- [ ] Characters now use ZZT set by default

### FR6: CP437 Output Helper

**Requirement**: Create helper functions to output CP437 bytes to terminal.

**Details**:
- Create utility function to write CP437 byte to stdout
- Handle conversion from byte value to Buffer for output
- Support both single byte and string of bytes

**Implementation**:
```javascript
// src/utils/cp437.js
/**
 * Write a CP437 byte value to stdout
 * @param {number} byteValue - CP437 byte value (0-255)
 */
export function writeCP437Byte(byteValue) {
  const buffer = Buffer.from([byteValue]);
  process.stdout.write(buffer);
}

/**
 * Write a string of CP437 byte values to stdout
 * @param {number[]} byteValues - Array of CP437 byte values
 */
export function writeCP437Bytes(byteValues) {
  const buffer = Buffer.from(byteValues);
  process.stdout.write(buffer);
}
```

**Acceptance Criteria**:
- [ ] `cp437.js` utility file created
- [ ] `writeCP437Byte()` function implemented
- [ ] `writeCP437Bytes()` function implemented
- [ ] Functions output raw bytes correctly

### FR7: Update Renderer for CP437

**Requirement**: Update Renderer to output CP437 bytes instead of Unicode strings.

**Details**:
- Replace string output with CP437 byte output
- Use `writeCP437Byte()` helper for single characters
- Update all character rendering methods
- Maintain same API, change internal implementation

**Acceptance Criteria**:
- [ ] Renderer uses CP437 byte output
- [ ] All character rendering methods updated
- [ ] Game displays CP437 characters correctly
- [ ] No breaking changes to Renderer API

### FR8: Terminal Font Configuration

**Requirement**: Document CP437 font setup for iTerm.

**Details**:
- Provide instructions for downloading CP437 font
- Document iTerm font configuration steps
- List recommended CP437 fonts
- Create setup documentation

**Recommended CP437 Fonts**:
- **Perfect DOS VGA** - Popular CP437 font
- **IBM VGA** - Original IBM font
- **Terminus** - Modern CP437-compatible font
- **Unifont** - Unicode font with CP437 support

**iTerm Configuration Steps**:
1. Download CP437 font (TTF/WOFF)
2. Install font on macOS
3. Open iTerm Preferences → Profiles → Text
4. Select CP437 font from font dropdown
5. Set font size appropriately
6. Test game display

**Acceptance Criteria**:
- [ ] Documentation created for font setup
- [ ] Font download sources listed
- [ ] iTerm configuration steps documented
- [ ] Testing instructions provided

## Technical Requirements

### TR1: CP437 Byte Encoding

**Requirement**: Use actual CP437 byte values (0-255) for characters.

**Details**:
- Store characters as numeric byte values (0-255)
- Output raw bytes using Node.js `Buffer`
- Terminal interprets bytes as CP437 when using CP437 font
- No Unicode conversion needed

**CP437 Byte Values**:
- Player: `1` (smiley face ☺)
- Wall: `219` (full block █)
- Wall Medium: `178` (medium shade ▓)
- Wall Light: `177` (light shade ▒)
- Empty: `32` (space)

**Output Method**:
```javascript
// Convert byte value to Buffer and write
const byte = 219; // CP437 wall character
const buffer = Buffer.from([byte]);
process.stdout.write(buffer);
```

**Acceptance Criteria**:
- [ ] Characters stored as numeric byte values (0-255)
- [ ] Output uses Buffer.from() to create byte buffers
- [ ] No Unicode string conversion
- [ ] Raw bytes written to stdout

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

**Requirement**: Minimize breaking changes to existing code.

**Details**:
- gameConstants.js maintains same export names (but values are now bytes)
- Renderer.js needs updates to output bytes instead of strings
- Board.js may need minor updates if it uses character constants directly
- All existing imports continue to work (but may need updates for byte handling)

**Acceptance Criteria**:
- [ ] All existing tests updated for byte values
- [ ] Renderer.js updated to use CP437 byte output
- [ ] Board.js works with byte values
- [ ] Game runs correctly with CP437 characters

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
  PLAYER: number,      // CP437 byte value for player (0-255)
  WALL: number,       // CP437 byte value for wall (0-255)
  WALL_MEDIUM?: number, // Optional: Medium shade wall byte value
  WALL_LIGHT?: number,  // Optional: Light shade wall byte value
  EMPTY: number,       // CP437 byte value for empty space (0-255)
}
```

**Required Properties**:
- `PLAYER`: CP437 byte value (0-255) for player character
- `WALL`: CP437 byte value (0-255) for wall character
- `EMPTY`: CP437 byte value (0-255) for empty space

**Optional Properties**:
- `WALL_MEDIUM`: Alternative wall character byte value
- `WALL_LIGHT`: Alternative wall character byte value

**Note**: All values are numbers (0-255), not strings.

## File Structure

```
src/constants/
├── gameConstants.js                    # Updated to import from characterSets
└── characterSets/                      # New directory
    ├── index.js                        # Character set selector
    ├── simpleCharacters.js            # Simple ASCII characters (as bytes)
    └── zztCharacters.js               # ZZT CP437 characters (as bytes)

src/utils/
└── cp437.js                           # CP437 output helper functions
```

## Implementation Notes

### Character Selection

**Default**: ZZT characters (`zzt`) using CP437 byte values
- Can be changed by updating `CHARACTER_SET` constant in `index.js`
- Future: Can be made configurable via `gameConfig.js`

### CP437 Font Setup

**Required**: User must configure terminal with CP437-compatible font

**Recommended Fonts**:
1. **Perfect DOS VGA** - Most popular CP437 font
   - Download: Search for "Perfect DOS VGA" font
   - Format: TTF
   - Best match for ZZT aesthetic

2. **IBM VGA** - Original IBM font
   - Download: Search for "IBM VGA" or "IBM PC" font
   - Format: TTF
   - Authentic CP437 appearance

3. **Terminus** - Modern CP437-compatible
   - Download: Available on most package managers
   - Format: TTF/OTF
   - Good Unicode + CP437 support

**iTerm Configuration**:
1. Download CP437 font (TTF file)
2. Double-click TTF file to install on macOS
3. Open iTerm → Preferences (⌘,)
4. Go to Profiles → Text tab
5. Click "Change Font" button
6. Select CP437 font from list
7. Set appropriate font size (e.g., 14-16pt)
8. Click "OK"

**Testing**:
- Run game and verify characters display correctly
- Player should show as smiley face (☺)
- Walls should show as solid blocks (█)
- If characters don't display correctly, verify font is selected in iTerm

### Terminal Compatibility

**Supported Terminals** (with CP437 font):
- iTerm2 (recommended) - Full CP437 support
- macOS Terminal.app - Should work with CP437 font
- Windows Terminal - Should work with CP437 font
- Linux terminals - May need font configuration

**Fallback**:
- If CP437 characters don't display correctly, switch to `simple` character set
- Update `CHARACTER_SET` in `index.js` to `'simple'`
- Simple characters use standard ASCII (bytes 32-126) that work everywhere

### Testing Strategy

1. **Unit Tests**: Test character set exports
2. **Visual Testing**: Run game and verify characters display correctly
3. **Terminal Testing**: Test in multiple terminal applications
4. **Regression Testing**: Ensure all existing tests still pass

## Success Criteria

- [ ] Character set directory structure created
- [ ] Simple and ZZT character sets implemented (as byte values)
- [ ] Character set selector working
- [ ] CP437 output helper functions created
- [ ] gameConstants.js updated to use character sets
- [ ] Renderer updated to output CP437 bytes
- [ ] Game displays CP437 characters correctly (with CP437 font)
- [ ] Player character is CP437 byte 1 (smiley face ☺)
- [ ] Wall character is CP437 byte 219 (solid block █)
- [ ] All existing tests updated and passing
- [ ] Documentation created for CP437 font setup
- [ ] Architecture supports future character sets

## Dependencies

- `src/constants/gameConstants.js` - Must exist
- `src/render/Renderer.js` - Uses characters from gameConstants (needs updates)
- `src/game/Board.js` - Uses characters from gameConstants
- Node.js `Buffer` API - For CP437 byte output
- CP437-compatible font - User must install and configure in iTerm

## Related Documents

- **Feature Card**: `docs/development/cards/features/FEATURE_zzt_ascii_characters.md`
- **Reference**: [Museum of ZZT ASCII Character Reference](https://museumofzzt.com/ascii/)

## Open Questions

All questions from the feature card have been answered:
- ✅ Character selection: CP437 byte 1 for player, byte 219 for walls
- ✅ Architecture: Character set system with separate directory
- ✅ Extensibility: Designed for future character sets
- ✅ Encoding: Using actual CP437 byte values, not Unicode
- ✅ Font: User will configure iTerm with CP437 font

## Status

**Status**: 📋 READY FOR GAMEPLAN

**Next Step**: Create gameplan document for implementation

