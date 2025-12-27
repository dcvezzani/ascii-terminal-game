# Feature: Glyph to Character Mapping

## Context

Currently, the game uses character constants directly in code (e.g., `'☺'`, `'#'`, `' '`). When we move to CP437 byte values, we'll be using raw byte numbers (e.g., `1`, `219`, `32`) which makes the code less readable. We need a mapping file that provides human-readable names for each font glyph/character.

**Location**: Implementation will be in:
- `src/constants/glyphMap.js` - New file mapping glyph names to character values
- `src/constants/gameConstants.js` - Updated to use glyph map
- Other files using characters - Updated to use glyph map constants

## Problem

**Current State**:
- Characters are defined directly as strings or will be byte values
- Code like `PLAYER_CHAR = 1` or `WALL_CHAR = 219` is not self-documenting
- Hard to understand what character a byte value represents
- Difficult to maintain and update character mappings
- No centralized reference for all available glyphs

**Future State (with CP437)**:
- Will use raw byte values like `1`, `219`, `32`
- Code becomes less readable: `const char = 219;` vs `const char = FULL_BLOCK;`
- Developers need to remember or look up CP437 byte values
- No clear mapping between glyph names and byte values

**Desired State**:
- Human-readable constant names for each glyph
- Clear mapping between glyph names and their values
- Easy to understand code: `const char = FULL_BLOCK;`
- Centralized reference for all available glyphs
- Easy to add new glyph mappings

## Desired Feature

Create a glyph-to-character mapping file that:

1. **Maps Glyph Names to Values**
   - Provides human-readable constant names for each glyph
   - Maps names to character values (strings or byte values)
   - Organized by category (player, walls, blocks, etc.)

2. **Improves Code Readability**
   - Code uses named constants instead of raw values
   - Self-documenting code
   - Easy to understand what each character represents

3. **Centralized Reference**
   - Single source of truth for all glyph mappings
   - Easy to add new glyphs
   - Easy to update existing mappings
   - Can be used as documentation

4. **Supports Multiple Character Sets**
   - Can map glyph names to different values based on character set
   - Works with both current string characters and future CP437 bytes
   - Flexible architecture for future character sets

## Requirements

### Functional Requirements

1. **Glyph Mapping File**
   - Create `src/constants/glyphMap.js`
   - Define named constants for each glyph
   - Map glyph names to character values
   - Organize by category (player, walls, blocks, etc.)

2. **Glyph Categories**
   - **Player Characters**: SMILEY_FACE, PLAYER_ARROW, etc.
   - **Walls/Blocks**: FULL_BLOCK, MEDIUM_SHADE, LIGHT_SHADE, etc.
   - **Empty/Space**: SPACE, DOT, etc.
   - **Box Drawing**: (future) HORIZONTAL_LINE, VERTICAL_LINE, etc.

3. **Code Usage**
   - Update `gameConstants.js` to use glyph map
   - Update other files to use glyph map constants
   - Code becomes more readable

### Technical Requirements

- Use ES Module format
- Export named constants
- Support both string and byte value mappings
- Easy to extend with new glyphs
- Type-safe (consistent naming convention)
- Well-documented with comments

## Implementation Approach

### Option 1: Simple Constant Mapping (Recommended)

Create a mapping object with glyph names as keys and values as character/byte:

```javascript
// src/constants/glyphMap.js

/**
 * Glyph to character mapping
 * Maps human-readable glyph names to character values
 */
export const GLYPH_MAP = {
  // Player characters
  SMILEY_FACE: 1,        // CP437: 1, ☺
  PLAYER_ARROW: 16,      // CP437: 16, ►
  PLAYER_AT: 64,         // CP437: 64, @
  
  // Walls and blocks
  FULL_BLOCK: 219,       // CP437: 219, █
  MEDIUM_SHADE: 178,     // CP437: 178, ▓
  LIGHT_SHADE: 177,      // CP437: 177, ▒
  LIGHTEST_SHADE: 176,   // CP437: 176, ░
  
  // Empty/space
  SPACE: 32,             // CP437: 32, ' '
  DOT: 46,               // CP437: 46, '.'
  MIDDLE_DOT: 250,       // CP437: 250, ·
  
  // Box drawing (future)
  // HORIZONTAL_LINE: 196,  // CP437: 196, ─
  // VERTICAL_LINE: 179,     // CP437: 179, │
};

// Export individual constants for convenience
export const SMILEY_FACE = GLYPH_MAP.SMILEY_FACE;
export const FULL_BLOCK = GLYPH_MAP.FULL_BLOCK;
export const SPACE = GLYPH_MAP.SPACE;
// ... etc
```

**Pros**:
- Simple and straightforward
- Easy to understand
- Easy to extend
- Clear mapping

**Cons**:
- Need to export individual constants if desired

### Option 2: Individual Named Exports

Export each glyph as a named constant:

```javascript
// src/constants/glyphMap.js

/**
 * Player character: Smiley face (CP437: 1, ☺)
 */
export const SMILEY_FACE = 1;

/**
 * Wall character: Full block (CP437: 219, █)
 */
export const FULL_BLOCK = 219;

/**
 * Empty space: Space (CP437: 32, ' ')
 */
export const SPACE = 32;

// ... etc
```

**Pros**:
- Direct imports: `import { SMILEY_FACE } from './glyphMap.js'`
- No need for object lookup
- Very clear and explicit
- Good for tree-shaking

**Cons**:
- More verbose file
- Need to maintain individual exports

### Option 3: Hybrid Approach

Provide both object map and individual exports:

```javascript
// src/constants/glyphMap.js

// Object map for programmatic access
export const GLYPH_MAP = {
  SMILEY_FACE: 1,
  FULL_BLOCK: 219,
  SPACE: 32,
  // ... etc
};

// Individual exports for direct imports
export const SMILEY_FACE = GLYPH_MAP.SMILEY_FACE;
export const FULL_BLOCK = GLYPH_MAP.FULL_BLOCK;
export const SPACE = GLYPH_MAP.SPACE;
// ... etc
```

**Pros**:
- Best of both worlds
- Flexible usage
- Can use object or individual imports

**Cons**:
- Slight duplication
- More code to maintain

**Recommended**: Option 2 (Individual Named Exports) - Cleanest and most direct

## Technical Details

### Glyph Mapping Structure

Each glyph mapping should include:
- **Constant Name**: Human-readable name (e.g., `SMILEY_FACE`)
- **Value**: Character value (string or byte)
- **Comment**: CP437 code point and visual representation

### Example Glyph Mappings

```javascript
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

### Usage in Code

**Before**:
```javascript
const PLAYER_CHAR = 1;      // What is 1?
const WALL_CHAR = 219;      // What is 219?
```

**After**:
```javascript
import { SMILEY_FACE, FULL_BLOCK } from './glyphMap.js';

const PLAYER_CHAR = SMILEY_FACE;  // Clear: smiley face
const WALL_CHAR = FULL_BLOCK;     // Clear: full block
```

### Integration with gameConstants.js

Update `gameConstants.js` to use glyph map:

```javascript
import { SMILEY_FACE, FULL_BLOCK, SPACE } from './glyphMap.js';

export const PLAYER_CHAR = SMILEY_FACE;
export const WALL_CHAR = FULL_BLOCK;
export const EMPTY_SPACE_CHAR = SPACE;
```

## Benefits

- ✅ **Improved Readability**: Code is self-documenting
- ✅ **Easier Maintenance**: Centralized glyph definitions
- ✅ **Better Developer Experience**: No need to remember byte values
- ✅ **Type Safety**: Consistent naming convention
- ✅ **Extensibility**: Easy to add new glyphs
- ✅ **Documentation**: Serves as reference for available glyphs
- ✅ **Future-Proof**: Works with both strings and byte values

## Related Features

- **FEATURE_terminal_game_mvp** - Main game feature
- Game constants system (already exists)
- Future: CP437 character support

## Dependencies

- `src/constants/gameConstants.js` - Will use glyph map
- `src/render/Renderer.js` - May use glyph map directly
- `src/game/Board.js` - May use glyph map directly

## Status

**Status**: 📋 NOT STARTED

## Priority

**Priority**: MEDIUM

- Improves code readability and maintainability
- Not critical for functionality
- Should be done before implementing CP437 support
- Makes future CP437 implementation easier
- Quick to implement

## Notes

- This is a code quality improvement
- Will make CP437 implementation much cleaner
- Can be implemented incrementally
- Should include comprehensive comments
- Consider adding JSDoc comments for each glyph

## Open Questions

- [ ] Should we include both CP437 byte values and Unicode equivalents in comments?
  - **Answer**: Yes, include both for reference
- [ ] Should we organize glyphs by category in separate files?
  - **Answer**: Start with single file, can split later if needed
- [ ] Should we include visual representation in comments?
  - **Answer**: Yes, include Unicode character in comment for reference
- [ ] Should we create a lookup function for reverse mapping (value → name)?
  - **Answer**: Not needed for initial implementation, can add later if needed

