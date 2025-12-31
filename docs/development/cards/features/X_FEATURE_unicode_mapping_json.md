# Feature: Unicode Mapping JSON File

## Context

The project uses the **PxPlus IBM EGA 8x14** font in iTerm when running the application. This font maps CP437 byte values (0-255) to specific Unicode code points. We have a reference file (`docs/development/data/unicode-mappings.txt`) that contains the mapping of CP437 byte positions to Unicode hex codes and descriptions.

**Current State**:

- `docs/development/data/unicode-mappings.txt` exists with 256 lines (CP437 bytes 0-255)
- Format: `{unicode_hex}\t{description}` (tab-separated)
- Example: `00B0	DEGREE SIGN`
- Line number corresponds to CP437 byte value (line 1 = byte 0, line 2 = byte 1, etc.)

**Location**: Implementation will be in:

- `docs/development/data/unicode-mappings.json` - New JSON file mapping labels to Unicode hex values
- Script or tool to generate the JSON from the text file

## Problem

**Current State**:

- Unicode mappings exist only in text format
- Not easily consumable by JavaScript/Node.js code
- Descriptions need to be converted to consistent label format
- No programmatic access to Unicode mappings

**Desired State**:

- JSON file with label-to-Unicode mappings
- Easy to import and use in JavaScript code
- Consistent label naming (UPPER_SNAKE_CASE)
- Can be used to look up Unicode values by label

## Desired Feature

Create a JSON file that maps human-readable labels to Unicode hex values:

1. **Parse Unicode Mappings File**
   - Read `docs/development/data/unicode-mappings.txt`
   - Parse each line (tab-separated: Unicode hex + description)
   - Handle 256 entries (CP437 bytes 0-255)

2. **Convert Descriptions to Labels**
   - Convert descriptions to UPPER_SNAKE_CASE format
   - Handle special characters and spaces
   - Ensure consistent naming convention
   - Handle duplicate or ambiguous descriptions

3. **Generate JSON File**
   - Create JSON object: `{ "LABEL": "unicode_hex", ... }`
   - Unicode hex values as strings (e.g., "00B0", not 0x00B0)
   - Preserve leading zeros in hex values
   - Valid JSON format

4. **Examples**:
   ```json
   {
     "DEGREE_SIGN": "00B0",
     "WHITE_SMILING_FACE": "263A",
     "FULL_BLOCK_100_FILL": "2588",
     "SPACE": "0020"
   }
   ```

## Requirements

### Functional Requirements

1. **Parse Text File**
   - Read `docs/development/data/unicode-mappings.txt`
   - Handle tab-separated format
   - Process all 256 lines (CP437 bytes 0-255)
   - Handle empty lines or malformed entries gracefully

2. **Label Conversion**
   - Convert descriptions to UPPER_SNAKE_CASE
   - Examples:
     - "DEGREE SIGN" → "DEGREE_SIGN"
     - "WHITE SMILING FACE" → "WHITE_SMILING_FACE"
     - "FULL BLOCK 100 FILL" → "FULL_BLOCK_100_FILL"
     - "BOX DRAWINGS LIGHT VERTICAL" → "BOX_DRAWINGS_LIGHT_VERTICAL"
   - Handle numbers in descriptions (preserve them)
   - Handle special characters appropriately

3. **JSON Generation**
   - Create valid JSON file
   - Format: `{ "LABEL": "unicode_hex", ... }`
   - Unicode hex values as strings with leading zeros
   - Pretty-printed JSON (readable format)
   - All 256 entries included

4. **Output File**
   - Location: `docs/development/data/unicode-mappings.json`
   - Valid JSON format
   - Can be imported/required in JavaScript code

### Technical Requirements

- Use Node.js for parsing/generation
- Handle file I/O operations
- Validate JSON output
- Handle edge cases (empty lines, malformed entries)
- Preserve Unicode hex format (uppercase, leading zeros)

## Implementation Approach

### Option 1: Node.js Script (Recommended)

Create a one-time script to generate the JSON file:

```javascript
// scripts/generate-unicode-mapping.js
import fs from 'fs';
import path from 'path';

// Read text file
const textFile = 'docs/development/data/unicode-mappings.txt';
const jsonFile = 'docs/development/data/unicode-mappings.json';

// Parse and convert
const mappings = {};
const lines = fs.readFileSync(textFile, 'utf-8').split('\n');

lines.forEach((line, index) => {
  if (!line.trim()) return; // Skip empty lines

  const [unicodeHex, ...descriptionParts] = line.split('\t');
  const description = descriptionParts.join(' ').trim();

  if (unicodeHex && description) {
    const label = description
      .toUpperCase()
      .replace(/[^A-Z0-9]+/g, '_')
      .replace(/^_+|_+$/g, ''); // Remove leading/trailing underscores

    mappings[label] = unicodeHex.toUpperCase();
  }
});

// Write JSON file
fs.writeFileSync(jsonFile, JSON.stringify(mappings, null, 2));
```

**Pros**:

- Simple one-time generation
- Can be run manually or as part of build
- Easy to understand and modify

**Cons**:

- Requires manual execution
- Not automatically updated if source changes

### Option 2: Build Script Integration

Add to `package.json` scripts:

```json
{
  "scripts": {
    "generate:unicode-mapping": "node scripts/generate-unicode-mapping.js"
  }
}
```

**Pros**:

- Easy to run: `npm run generate:unicode-mapping`
- Can be integrated into build process
- Standardized approach

**Cons**:

- Still requires manual execution

### Option 3: Runtime Generation

Generate JSON on-the-fly when needed (not recommended for this use case).

## Technical Details

### Label Conversion Rules

1. **Convert to Uppercase**: All letters to uppercase
2. **Replace Spaces/Special Chars**: Replace with underscores
3. **Preserve Numbers**: Keep numbers as-is
4. **Remove Leading/Trailing Underscores**: Clean up edges
5. **Handle Multiple Underscores**: Collapse to single underscore

**Examples**:

- "DEGREE SIGN" → "DEGREE_SIGN"
- "WHITE SMILING FACE" → "WHITE_SMILING_FACE"
- "FULL BLOCK 100 FILL" → "FULL_BLOCK_100_FILL"
- "BOX DRAWINGS LIGHT VERTICAL" → "BOX_DRAWINGS_LIGHT_VERTICAL"
- "LATIN CAPITAL LETTER A" → "LATIN_CAPITAL_LETTER_A"

### Unicode Hex Format

- **Format**: Uppercase hex string
- **Leading Zeros**: Preserved (e.g., "00B0", not "B0")
- **No Prefix**: No "U+" or "0x" prefix
- **Length**: 2-4 characters (most are 4)

### JSON Structure

```json
{
  "BLANK": "2007",
  "WHITE_SMILING_FACE": "263A",
  "BLACK_SMILING_FACE": "263B",
  "BLACK_HEART_SUIT": "2665",
  "SPACE": "0020",
  "DEGREE_SIGN": "00B0",
  "FULL_BLOCK_100_FILL": "2588",
  ...
}
```

### Handling Edge Cases

1. **Empty Lines**: Skip empty lines
2. **Malformed Entries**: Log warning, skip entry
3. **Duplicate Labels**: Use first occurrence, log warning
4. **Missing Unicode Hex**: Skip entry, log warning
5. **Missing Description**: Generate label from CP437 byte index

## Benefits

- ✅ **Programmatic Access**: Easy to import and use in JavaScript
- ✅ **Type Safety**: JSON structure is validated
- ✅ **Readability**: Pretty-printed JSON is human-readable
- ✅ **Consistency**: Standardized label format
- ✅ **Maintainability**: Single source of truth (text file) generates JSON
- ✅ **Integration**: Can be used in glyph mapping system

## Related Features

- **FEATURE_glyph_character_mapping** - Will use this JSON for Unicode lookups
- PxPlus IBM EGA 8x14 font requirement (documented in README)

## Dependencies

- `docs/development/data/unicode-mappings.txt` - Must exist
- Node.js - For script execution
- File system access - To read/write files

## Status

**Status**: 📋 NOT STARTED

## Priority

**Priority**: MEDIUM

- Supports glyph mapping feature
- Not critical for core functionality
- Can be done before or after glyph mapping implementation
- Quick to implement

## Notes

- This is a data transformation task
- One-time generation (unless source file changes)
- Can be regenerated if source file is updated
- Consider adding to `.gitignore` if generated, or commit if static

## Open Questions

- [ ] Should the JSON file be committed to git or generated on build?
  - **Answer**: _[To be answered by user]_
- [ ] Should we include CP437 byte index in the JSON for reference?
  - **Answer**: _[To be answered by user]_
- [ ] How should we handle duplicate labels (if any)?
  - **Answer**: _[To be answered by user]_
- [ ] Should the script validate the generated JSON?
  - **Answer**: _[To be answered by user]_
- [ ] Should we create a reverse mapping (Unicode hex → label)?
  - **Answer**: _[To be answered by user]_
