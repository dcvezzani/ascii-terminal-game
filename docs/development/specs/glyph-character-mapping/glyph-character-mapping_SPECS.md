# Specification: Glyph to Character Mapping

## Overview

This specification details the creation of a glyph-to-character mapping system that provides human-readable constant names for font glyphs. This improves code readability by replacing raw character values (strings or byte numbers) with self-documenting constant names.

**Reference Card**: `docs/development/cards/features/FEATURE_glyph_character_mapping.md`

## Goals

1. Create a centralized glyph mapping file with human-readable constant names
2. Improve code readability by replacing raw values with named constants
3. Support both current string characters and future CP437 byte values
4. Provide a single source of truth for all glyph definitions
5. Make it easy to add new glyph mappings in the future

## Current State

**Current Character Definitions** (`src/constants/gameConstants.js`):

```javascript
export const EMPTY_SPACE_CHAR = ' ';
export const WALL_CHAR = '#';
export const PLAYER_CHAR = '☺';
```

**Current Usage**:

- `src/render/Renderer.js` - Uses `PLAYER_CHAR`, `WALL_CHAR`, `EMPTY_SPACE_CHAR`
- `src/game/Board.js` - Uses `WALL_CHAR`, `EMPTY_SPACE_CHAR`
- Characters are currently strings but will transition to CP437 byte values

**Issues**:

- Raw character values (`'☺'`, `'#'`, `' '`) are not self-documenting
- Future CP437 byte values (`1`, `219`, `32`) will be even less readable
- No centralized reference for available glyphs
- Difficult to understand what each character represents

## Target State

**Glyph Mapping File** (`src/constants/glyphMap.js`):

```javascript
// Human-readable glyph names
export const SMILEY_FACE = 1; // CP437: 1, ☺
export const FULL_BLOCK = 219; // CP437: 219, █
export const SPACE = 32; // CP437: 32, ' '
```

**Updated gameConstants.js**:

```javascript
import { SMILEY_FACE, FULL_BLOCK, SPACE } from './glyphMap.js';

export const PLAYER_CHAR = SMILEY_FACE;
export const WALL_CHAR = FULL_BLOCK;
export const EMPTY_SPACE_CHAR = SPACE;
```

**Benefits**:

- Code is self-documenting: `const char = FULL_BLOCK;` vs `const char = 219;`
- Centralized glyph definitions
- Easy to understand and maintain
- Supports future character sets

## Functional Requirements

### FR1: Glyph Mapping File Structure

**Requirement**: Create `src/constants/glyphMap.js` with organized glyph definitions.

**Details**:

- Use ES Module format with named exports
- Organize glyphs by category (player, walls, empty, etc.)
- Each glyph has a human-readable constant name
- Include comprehensive comments for each glyph

**File Structure**:

```javascript
/**
 * Glyph to character mapping
 * Maps human-readable glyph names to character values
 */

// Player characters
export const SMILEY_FACE = 1; // CP437: 1, ☺
export const PLAYER_ARROW = 16; // CP437: 16, ►
export const PLAYER_AT = 64; // CP437: 64, @

// Walls and blocks
export const FULL_BLOCK = 219; // CP437: 219, █
export const MEDIUM_SHADE = 178; // CP437: 178, ▓
export const LIGHT_SHADE = 177; // CP437: 177, ▒
export const LIGHTEST_SHADE = 176; // CP437: 176, ░

// Empty/space
export const SPACE = 32; // CP437: 32, ' '
export const DOT = 46; // CP437: 46, '.'
export const MIDDLE_DOT = 250; // CP437: 250, ·
```

**Acceptance Criteria**:

- [ ] `glyphMap.js` file created
- [ ] Uses ES Module format
- [ ] Exports named constants
- [ ] Organized by category
- [ ] Includes comments for each glyph

### FR2: Glyph Naming Convention

**Requirement**: Establish consistent naming convention for glyph constants.

**Details**:

- Use UPPER_SNAKE_CASE for constant names
- Names should be descriptive and self-documenting
- Follow logical grouping (e.g., `PLAYER_*`, `WALL_*`, `BLOCK_*`)

**Naming Examples**:

- `SMILEY_FACE` - Clear and descriptive
- `FULL_BLOCK` - Indicates solid block
- `MEDIUM_SHADE` - Indicates shading level
- `SPACE` - Simple and clear

**Acceptance Criteria**:

- [ ] Consistent naming convention established
- [ ] All glyph names follow UPPER_SNAKE_CASE
- [ ] Names are descriptive and self-documenting
- [ ] Names are logically grouped by category

### FR3: Glyph Documentation

**Requirement**: Each glyph should include comprehensive documentation.

**Details**:

- Comprehensive JSDoc-style comments for each glyph
- Include CP437 byte value
- Include Unicode character representation
- Include visual representation
- Include description of the glyph
- Include usage notes (when applicable)

**Comment Format**:

```javascript
/**
 * Player character: Smiley face
 * CP437: 1
 * Unicode: U+263A (☺)
 * Visual: ☺
 * Description: Traditional ZZT player character, classic smiley face
 * Usage: Default player character in ZZT-style games
 */
export const SMILEY_FACE = 1;
```

**Acceptance Criteria**:

- [ ] Each glyph has comprehensive documentation comment
- [ ] Comments include CP437 byte value
- [ ] Comments include Unicode reference
- [ ] Comments include visual representation
- [ ] Comments include description
- [ ] Comments include usage notes (when applicable)

### FR4: Initial Glyph Set

**Requirement**: Define which glyphs to include in the initial implementation.

**Details**:

- **Comprehensive CP437 glyph set** - Include all commonly used CP437 glyphs
- Organize by category (player, walls, blocks, box-drawing, etc.)
- Use CP437 byte values immediately (not strings)

**Glyph Categories**:

**Player Characters**:

- `SMILEY_FACE` - CP437: 1, ☺ (currently used)
- `PLAYER_ARROW` - CP437: 16, ►
- `PLAYER_AT` - CP437: 64, @

**Walls and Blocks**:

- `FULL_BLOCK` - CP437: 219, █ (currently used)
- `MEDIUM_SHADE` - CP437: 178, ▓
- `LIGHT_SHADE` - CP437: 177, ▒
- `LIGHTEST_SHADE` - CP437: 176, ░

**Empty/Space**:

- `SPACE` - CP437: 32, ' ' (currently used)
- `DOT` - CP437: 46, '.'
- `MIDDLE_DOT` - CP437: 250, ·

**Box Drawing Characters**:

- `HORIZONTAL_LINE` - CP437: 196, ─
- `VERTICAL_LINE` - CP437: 179, │
- `TOP_LEFT_CORNER` - CP437: 218, ┌
- `TOP_RIGHT_CORNER` - CP437: 191, ┐
- `BOTTOM_LEFT_CORNER` - CP437: 192, └
- `BOTTOM_RIGHT_CORNER` - CP437: 217, ┘
- Additional box-drawing characters as needed

**Additional Common CP437 Glyphs**:

- Include other commonly used CP437 characters (arrows, symbols, etc.)

**Acceptance Criteria**:

- [ ] Comprehensive glyph set defined
- [ ] All glyphs use CP437 byte values
- [ ] All glyphs organized by category
- [ ] Box-drawing characters included

### FR5: Update gameConstants.js

**Requirement**: Update `gameConstants.js` to use glyph map constants.

**Details**:

- Import glyph constants from `glyphMap.js`
- Map glyph constants to game constant names
- Maintain same export interface
- No breaking changes to existing imports

**Implementation**:

```javascript
import { SMILEY_FACE, FULL_BLOCK, SPACE } from './glyphMap.js';

export const PLAYER_CHAR = SMILEY_FACE;
export const WALL_CHAR = FULL_BLOCK;
export const EMPTY_SPACE_CHAR = SPACE;
```

**Acceptance Criteria**:

- [ ] `gameConstants.js` imports from `glyphMap.js`
- [ ] Game constants use glyph map constants
- [ ] Same export interface maintained
- [ ] No breaking changes to existing code

### FR6: Reverse Lookup Map

**Requirement**: Create a reverse lookup map to find glyph name from byte value.

**Details**:

- Create object map: `{ byteValue: 'GLYPH_NAME' }`
- Export as `GLYPH_REVERSE_MAP`
- Useful for debugging and value-to-name lookups

**Implementation**:

```javascript
// Reverse lookup: byte value → glyph name
export const GLYPH_REVERSE_MAP = {
  1: 'SMILEY_FACE',
  16: 'PLAYER_ARROW',
  32: 'SPACE',
  64: 'PLAYER_AT',
  219: 'FULL_BLOCK',
  // ... etc
};
```

**Acceptance Criteria**:

- [ ] Reverse lookup map created
- [ ] Maps all glyph byte values to names
- [ ] Exported for use in other modules

## Technical Requirements

### TR1: Export Format

**Requirement**: Use individual named exports for each glyph.

**Details**:

- Export each glyph as a named constant
- No object map needed (simpler, more direct)
- Enables tree-shaking
- Direct imports: `import { SMILEY_FACE } from './glyphMap.js'`

**Implementation**:

```javascript
export const SMILEY_FACE = 1;
export const FULL_BLOCK = 219;
export const SPACE = 32;
```

**Acceptance Criteria**:

- [ ] Each glyph exported as named constant
- [ ] Can import individual glyphs
- [ ] No object map required

### TR2: CP437 Byte Values

**Requirement**: Use CP437 byte values (numbers) for all glyphs.

**Details**:

- All glyph values are numbers (0-255)
- No string values used
- Direct CP437 byte encoding

**Value Types**:

- All values are numbers: `1`, `219`, `32`, etc.
- No string values

**Acceptance Criteria**:

- [ ] All glyph values are numbers (CP437 bytes)
- [ ] No string values in glyph map
- [ ] Values are in valid CP437 range (0-255)

### TR3: Module Structure

**Requirement**: Follow ES Module format consistently.

**Details**:

- Use `export const` for each glyph
- Use named exports (no default export)
- Follow existing project patterns

**Acceptance Criteria**:

- [ ] Uses ES Module format
- [ ] Named exports only
- [ ] Follows project conventions

### TR4: Backward Compatibility

**Requirement**: No breaking changes to existing code.

**Details**:

- `gameConstants.js` maintains same export interface
- Files importing from `gameConstants.js` don't need changes
- Internal implementation changes only

**Acceptance Criteria**:

- [ ] No changes needed to `Renderer.js`
- [ ] No changes needed to `Board.js`
- [ ] All existing tests pass
- [ ] Game runs correctly

## Data Structures

### Glyph Constant

Each glyph is a named constant with:

- **Name**: Human-readable constant name (UPPER_SNAKE_CASE)
- **Value**: Character value (string or number)
- **Documentation**: Comment with CP437 byte, Unicode, and visual representation

**Example**:

```javascript
/**
 * Player character: Smiley face
 * CP437: 1
 * Unicode: U+263A (☺)
 * Visual: ☺
 */
export const SMILEY_FACE = 1;
```

## File Structure

```
src/constants/
├── gameConstants.js    # Updated to use glyphMap
└── glyphMap.js         # New file with glyph mappings
```

## Implementation Notes

### Glyph Categories

**Player Characters**:

- `SMILEY_FACE` - Traditional ZZT player (CP437: 1)
- `PLAYER_ARROW` - Arrow player (CP437: 16)
- `PLAYER_AT` - At symbol player (CP437: 64)

**Walls and Blocks**:

- `FULL_BLOCK` - Solid block (CP437: 219)
- `MEDIUM_SHADE` - Medium shade block (CP437: 178)
- `LIGHT_SHADE` - Light shade block (CP437: 177)
- `LIGHTEST_SHADE` - Lightest shade block (CP437: 176)

**Empty/Space**:

- `SPACE` - Space character (CP437: 32)
- `DOT` - Period/dot (CP437: 46)
- `MIDDLE_DOT` - Middle dot (CP437: 250)

### Value Transition Strategy

**Phase 1 (Current)**:

```javascript
export const SMILEY_FACE = '☺'; // String value
export const FULL_BLOCK = '#'; // String value
export const SPACE = ' '; // String value
```

**Phase 2 (Future - CP437)**:

```javascript
export const SMILEY_FACE = 1; // CP437 byte value
export const FULL_BLOCK = 219; // CP437 byte value
export const SPACE = 32; // CP437 byte value
```

No code changes needed beyond updating glyph map values.

## Success Criteria

- [ ] `glyphMap.js` file created with comprehensive CP437 glyph definitions
- [ ] All glyphs use CP437 byte values (numbers, not strings)
- [ ] Glyphs organized by category with clear comments
- [ ] Each glyph has comprehensive documentation (CP437, Unicode, visual, description, usage)
- [ ] Reverse lookup map (`GLYPH_REVERSE_MAP`) created and exported
- [ ] Box-drawing characters included
- [ ] `gameConstants.js` updated to use glyph map
- [ ] All existing tests pass
- [ ] Basic tests created for glyph map (verify exports, values)
- [ ] Game runs correctly with glyph map
- [ ] Code is more readable with named constants
- [ ] Easy to add new glyphs in the future

## Dependencies

- `src/constants/gameConstants.js` - Will use glyph map
- `src/render/Renderer.js` - Uses gameConstants (no changes needed)
- `src/game/Board.js` - Uses gameConstants (no changes needed)

## Related Documents

- **Feature Card**: `docs/development/cards/features/FEATURE_glyph_character_mapping.md`
- **CP437 Reference**: [Museum of ZZT ASCII Character Reference](https://museumofzzt.com/ascii/)

## Open Questions

### Q1: Initial Glyph Set Scope

**Question**: Which glyphs should be included in the initial implementation?

**Options**:

- **Option A**: Only currently used glyphs (SMILEY_FACE, FULL_BLOCK, SPACE)
- **Option B**: Currently used + common ZZT glyphs (add PLAYER_ARROW, MEDIUM_SHADE, etc.)
- **Option C**: Comprehensive CP437 glyph set (all commonly used glyphs)

**Recommendation**: Option B - Include currently used glyphs plus common ZZT alternatives for future use.

**Answer**: **Option C** - Comprehensive CP437 glyph set (all commonly used glyphs)

### Q2: Value Type for Initial Implementation

**Question**: Should the initial implementation use string values or CP437 byte values?

**Options**:

- **Option A**: Use string values initially (`'☺'`, `'#'`, `' '`) - matches current state
- **Option B**: Use CP437 byte values immediately (`1`, `219`, `32`) - future-ready
- **Option C**: Support both via configuration

**Recommendation**: Option A - Use string values initially to match current state, easy to transition to bytes later.

**Answer**: **Option B** - Use CP437 byte values immediately (`1`, `219`, `32`) - future-ready

### Q3: Glyph Documentation Format

**Question**: What level of documentation should each glyph include?

**Options**:

- **Option A**: Minimal (just CP437 byte value)
- **Option B**: Standard (CP437 byte + Unicode + visual)
- **Option C**: Comprehensive (CP437 byte + Unicode + visual + description + usage notes)

**Recommendation**: Option B - Standard documentation with CP437 byte, Unicode reference, and visual representation.

**Answer**: **Option C** - Comprehensive (CP437 byte + Unicode + visual + description + usage notes)

### Q4: Naming Convention for Similar Glyphs

**Question**: How should we name glyphs that are variations of the same concept?

**Example**: For different wall/block shades:

- `FULL_BLOCK`, `MEDIUM_SHADE`, `LIGHT_SHADE`, `LIGHTEST_SHADE`
- vs `WALL_FULL`, `WALL_MEDIUM`, `WALL_LIGHT`, `WALL_LIGHTEST`
- vs `BLOCK_FULL`, `BLOCK_MEDIUM`, `BLOCK_LIGHT`, `BLOCK_LIGHTEST`

**Recommendation**: Use descriptive names that indicate the visual appearance (FULL_BLOCK, MEDIUM_SHADE) rather than category prefixes.

**Answer**: **FULL_BLOCK, MEDIUM_SHADE, LIGHT_SHADE, LIGHTEST_SHADE** - Use descriptive names that indicate visual appearance

### Q5: Box Drawing Characters

**Question**: Should we include box-drawing characters in the initial implementation?

**Options**:

- **Option A**: Include common box-drawing characters (HORIZONTAL_LINE, VERTICAL_LINE, CORNERS, etc.)
- **Option B**: Skip box-drawing for now, add later if needed
- **Option C**: Include but comment them out for future use

**Recommendation**: Option C - Include box-drawing characters but comment them out, ready for future use.

**Answer**: **Option A** - Include common box-drawing characters (HORIZONTAL_LINE, VERTICAL_LINE, CORNERS, etc.)

### Q6: Reverse Lookup Function

**Question**: Should we provide a function to look up glyph name from value?

**Use Case**: Given byte value `219`, find glyph name `FULL_BLOCK`

**Options**:

- **Option A**: No reverse lookup (not needed for initial implementation)
- **Option B**: Simple object map for reverse lookup
- **Option C**: Function that searches glyph constants

**Recommendation**: Option A - Not needed for initial implementation, can add later if needed.

**Answer**: **Option B** - Simple object map for reverse lookup

### Q7: Glyph Categories Organization

**Question**: Should glyphs be organized in separate files by category or all in one file?

**Options**:

- **Option A**: Single file (`glyphMap.js`) with comments organizing by category
- **Option B**: Separate files (`playerGlyphs.js`, `wallGlyphs.js`, etc.) with index file
- **Option C**: Single file with object groups (`PLAYER_GLYPHS`, `WALL_GLYPHS`, etc.)

**Recommendation**: Option A - Single file with clear comment sections, simpler for initial implementation.

**Answer**: **Option A** - Single file (`glyphMap.js`) with comments organizing by category

### Q8: Testing Requirements

**Question**: What level of testing is needed for the glyph map?

**Options**:

- **Option A**: No tests needed (simple constant definitions)
- **Option B**: Basic tests (verify exports exist, values are correct)
- **Option C**: Comprehensive tests (verify all glyphs, documentation, etc.)

**Recommendation**: Option B - Basic tests to verify glyphs are exported correctly and have expected values.

**Answer**: **Option B** - Basic tests (verify exports exist, values are correct)

## Status

**Status**: 📋 READY FOR GAMEPLAN

**Next Step**: Create gameplan document for implementation

## Answers Summary

All open questions have been answered:

- **Q1**: Option C - Comprehensive CP437 glyph set (all commonly used glyphs)
- **Q2**: Option B - Use CP437 byte values immediately (`1`, `219`, `32`) - future-ready
- **Q3**: Option C - Comprehensive documentation (CP437 byte + Unicode + visual + description + usage notes)
- **Q4**: FULL_BLOCK, MEDIUM_SHADE, etc. - Use descriptive names that indicate visual appearance
- **Q5**: Option A - Include common box-drawing characters (HORIZONTAL_LINE, VERTICAL_LINE, CORNERS, etc.)
- **Q6**: Option B - Simple object map for reverse lookup
- **Q7**: Option A - Single file (`glyphMap.js`) with comments organizing by category
- **Q8**: Option B - Basic tests (verify exports exist, values are correct)
