/**
 * Game constants - centralized character and symbol definitions
 * 
 * Uses Unicode hex values that map to PxPlus IBM EGA 8x14 font glyphs.
 * See src/config/unicode-mappings.json for the full mapping.
 */

/**
 * Converts a Unicode hex string to its corresponding glyph character
 * @param {string} hexString - Unicode hex value (e.g., "263A" for ☺)
 * @returns {string} The Unicode character corresponding to the hex value
 */
export function toGlyph(hexString) {
  // Remove any leading "U+" or "0x" prefix if present
  const cleanHex = hexString.replace(/^[Uu]\+?|^0[xX]/, '');
  
  // Parse hex string to code point
  const codePoint = parseInt(cleanHex, 16);
  
  // Convert code point to Unicode character
  return String.fromCodePoint(codePoint);
}

/**
 * Character representing empty space on the board
 * Unicode: U+0020 (SPACE)
 */
export const EMPTY_SPACE_CHAR = toGlyph("0020");

/**
 * Character representing a wall on the board
 * Unicode: U+0023 (NUMBER SIGN / HASH)
 */
export const WALL_CHAR = toGlyph("0023");

/**
 * Character representing the player
 * Unicode: U+263A (WHITE SMILING FACE)
 */
export const PLAYER_CHAR = toGlyph("263A");

