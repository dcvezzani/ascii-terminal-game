/**
 * Game constants - centralized character and symbol definitions
 * 
 * Uses Unicode hex values that map to PxPlus IBM EGA 8x14 font glyphs.
 * See src/config/unicode-mappings.json for the full mapping.
 */

import unicodeMappings from '../config/unicode-mappings.json' with { type: 'json' };
import { Glyph } from '../game/Glyph.js';

/**
 * Font set mapping labels to Unicode hex values
 * Loaded from unicode-mappings.json
 */
export const fontSet = unicodeMappings;

/**
 * Converts a Unicode hex string to its corresponding Glyph instance
 * @param {string} hexString - Unicode hex value (e.g., "263A" for ☺)
 * @param {string|null} color - Optional color for the glyph
 * @returns {Glyph} A Glyph instance with the Unicode character
 */
export function toGlyph(hexString, color = null) {
  // Remove any leading "U+" or "0x" prefix if present
  const cleanHex = hexString.replace(/^[Uu]\+?|^0[xX]/, '');
  
  // Parse hex string to code point
  const codePoint = parseInt(cleanHex, 16);
  
  // Convert code point to Unicode character
  const char = String.fromCodePoint(codePoint);
  
  // Return Glyph instance
  return new Glyph(char, color);
}

/**
 * Character representing empty space on the board
 * Unicode: U+0020 (SPACE)
 */
export const EMPTY_SPACE_CHAR = toGlyph(fontSet.SPACE);

/**
 * Character representing a wall on the board
 * Unicode: U+0023 (NUMBER SIGN / HASH)
 */
export const WALL_CHAR = toGlyph(fontSet.NUMBER_SIGN);

/**
 * Character representing the player
 * Unicode: U+263A (WHITE SMILING FACE)
 */
export const PLAYER_CHAR = toGlyph(fontSet.INVERTED_SMILING_FACE);

