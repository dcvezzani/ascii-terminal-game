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
export const SMILEY_FACE = 1;      // CP437: 1, ☺
export const FULL_BLOCK = 219;    // CP437: 219, █
export const SPACE = 32;           // CP437: 32, ' '
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
export const SMILEY_FACE = 1;      // CP437: 1, ☺
export const PLAYER_ARROW = 16;    // CP437: 16, ►
export const PLAYER_AT = 64;       // CP437: 64, @

// Walls and blocks
export const FULL_BLOCK = 219;     // CP437: 219, █
export const MEDIUM_SHADE = 178;   // CP437: 178, ▓
export const LIGHT_SHADE = 177;    // CP437: 177, ▒
export const LIGHTEST_SHADE = 176; // CP437: 176, ░

// Empty/space
export const SPACE = 32;           // CP437: 32, ' '
export const DOT = 46;             // CP437: 46, '.'
export const MIDDLE_DOT = 250;     // CP437: 250, ·
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
- JSDoc-style comments for each glyph
- Include CP437 byte value
- Include Unicode character representation (if applicable)
- Include visual description

**Comment Format**:
```javascript
/**
 * Player character: Smiley face
 * CP437: 1
 * Unicode: U+263A (☺)
 * Visual: ☺
 */
export const SMILEY_FACE = 1;
```

**Acceptance Criteria**:
- [ ] Each glyph has documentation comment
- [ ] Comments include CP437 byte value
- [ ] Comments include Unicode reference (if applicable)
- [ ] Comments include visual representation

### FR4: Initial Glyph Set

**Requirement**: Define which glyphs to include in the initial implementation.

**Details**:
- Include glyphs currently used in the game
- Include common ZZT/CP437 glyphs for future use
- Organize by category

**Required Glyphs** (currently used):
- `SMILEY_FACE` - Player character (currently `'☺'`, will be CP437: 1)
- `FULL_BLOCK` - Wall character (currently `'#'`, will be CP437: 219)
- `SPACE` - Empty space (currently `' '`, will be CP437: 32)

**Optional Glyphs** (for future use):
- `PLAYER_ARROW` - Alternative player character (CP437: 16, ►)
- `PLAYER_AT` - Alternative player character (CP437: 64, @)
- `MEDIUM_SHADE` - Alternative wall (CP437: 178, ▓)
- `LIGHT_SHADE` - Alternative wall (CP437: 177, ▒)
- `LIGHTEST_SHADE` - Alternative wall (CP437: 176, ░)
- `DOT` - Alternative empty space (CP437: 46, '.')
- `MIDDLE_DOT` - Alternative empty space (CP437: 250, ·)

**Acceptance Criteria**:
- [ ] Required glyphs defined
- [ ] Optional glyphs documented
- [ ] All glyphs organized by category
- [ ] Clear distinction between required and optional

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

### FR6: Support Current String Values

**Requirement**: Support current string character values during transition.

**Details**:
- Initially, glyph map may use string values
- Should be easy to transition to byte values later
- Code structure should support both

**Transition Strategy**:
- Phase 1: Use string values in glyph map (matches current state)
- Phase 2: Update to CP437 byte values when ready
- No code changes needed beyond glyph map values

**Acceptance Criteria**:
- [ ] Glyph map supports string values
- [ ] Easy to transition to byte values
- [ ] No breaking changes during transition

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

### TR2: Value Type Support

**Requirement**: Support both string and number (byte) values.

**Details**:
- Initially may use strings (current state)
- Will transition to numbers (CP437 bytes)
- Code structure should handle both

**Value Types**:
- **Current**: Strings (`'☺'`, `'#'`, `' '`)
- **Future**: Numbers (`1`, `219`, `32`)

**Acceptance Criteria**:
- [ ] Glyph map supports string values
- [ ] Glyph map supports number values
- [ ] Easy to change value types

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
export const SMILEY_FACE = '☺';    // String value
export const FULL_BLOCK = '#';     // String value
export const SPACE = ' ';           // String value
```

**Phase 2 (Future - CP437)**:
```javascript
export const SMILEY_FACE = 1;      // CP437 byte value
export const FULL_BLOCK = 219;      // CP437 byte value
export const SPACE = 32;            // CP437 byte value
```

No code changes needed beyond updating glyph map values.

## Success Criteria

- [ ] `glyphMap.js` file created with glyph definitions
- [ ] Glyphs organized by category
- [ ] Each glyph has comprehensive documentation
- [ ] `gameConstants.js` updated to use glyph map
- [ ] All existing tests pass
- [ ] Game runs correctly with glyph map
- [ ] Code is more readable with named constants
- [ ] Easy to add new glyphs in the future
- [ ] Supports both string and number values

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

**Answer**: _[To be answered by user]_

### Q2: Value Type for Initial Implementation

**Question**: Should the initial implementation use string values or CP437 byte values?

**Options**:
- **Option A**: Use string values initially (`'☺'`, `'#'`, `' '`) - matches current state
- **Option B**: Use CP437 byte values immediately (`1`, `219`, `32`) - future-ready
- **Option C**: Support both via configuration

**Recommendation**: Option A - Use string values initially to match current state, easy to transition to bytes later.

**Answer**: _[To be answered by user]_

### Q3: Glyph Documentation Format

**Question**: What level of documentation should each glyph include?

**Options**:
- **Option A**: Minimal (just CP437 byte value)
- **Option B**: Standard (CP437 byte + Unicode + visual)
- **Option C**: Comprehensive (CP437 byte + Unicode + visual + description + usage notes)

**Recommendation**: Option B - Standard documentation with CP437 byte, Unicode reference, and visual representation.

**Answer**: _[To be answered by user]_

### Q4: Naming Convention for Similar Glyphs

**Question**: How should we name glyphs that are variations of the same concept?

**Example**: For different wall/block shades:
- `FULL_BLOCK`, `MEDIUM_SHADE`, `LIGHT_SHADE`, `LIGHTEST_SHADE`
- vs `WALL_FULL`, `WALL_MEDIUM`, `WALL_LIGHT`, `WALL_LIGHTEST`
- vs `BLOCK_FULL`, `BLOCK_MEDIUM`, `BLOCK_LIGHT`, `BLOCK_LIGHTEST`

**Recommendation**: Use descriptive names that indicate the visual appearance (FULL_BLOCK, MEDIUM_SHADE) rather than category prefixes.

**Answer**: _[To be answered by user]_

### Q5: Box Drawing Characters

**Question**: Should we include box-drawing characters in the initial implementation?

**Options**:
- **Option A**: Include common box-drawing characters (HORIZONTAL_LINE, VERTICAL_LINE, CORNERS, etc.)
- **Option B**: Skip box-drawing for now, add later if needed
- **Option C**: Include but comment them out for future use

**Recommendation**: Option C - Include box-drawing characters but comment them out, ready for future use.

**Answer**: _[To be answered by user]_

### Q6: Reverse Lookup Function

**Question**: Should we provide a function to look up glyph name from value?

**Use Case**: Given byte value `219`, find glyph name `FULL_BLOCK`

**Options**:
- **Option A**: No reverse lookup (not needed for initial implementation)
- **Option B**: Simple object map for reverse lookup
- **Option C**: Function that searches glyph constants

**Recommendation**: Option A - Not needed for initial implementation, can add later if needed.

**Answer**: _[To be answered by user]_

### Q7: Glyph Categories Organization

**Question**: Should glyphs be organized in separate files by category or all in one file?

**Options**:
- **Option A**: Single file (`glyphMap.js`) with comments organizing by category
- **Option B**: Separate files (`playerGlyphs.js`, `wallGlyphs.js`, etc.) with index file
- **Option C**: Single file with object groups (`PLAYER_GLYPHS`, `WALL_GLYPHS`, etc.)

**Recommendation**: Option A - Single file with clear comment sections, simpler for initial implementation.

**Answer**: _[To be answered by user]_

### Q8: Testing Requirements

**Question**: What level of testing is needed for the glyph map?

**Options**:
- **Option A**: No tests needed (simple constant definitions)
- **Option B**: Basic tests (verify exports exist, values are correct)
- **Option C**: Comprehensive tests (verify all glyphs, documentation, etc.)

**Recommendation**: Option B - Basic tests to verify glyphs are exported correctly and have expected values.

**Answer**: _[To be answered by user]_

## Status

**Status**: 📋 READY FOR ANSWERS

**Next Step**: Answer open questions, then create gameplan document for implementation

