/**
 * Game constants - centralized character and symbol definitions
 * 
 * Uses Unicode hex values that map to PxPlus IBM EGA 8x14 font glyphs.
 * See src/config/unicode-mappings.json for the full mapping.
 */

import unicodeMappings from '../config/unicode-mappings.json' with { type: 'json' };
import fontColorMappings from '../config/font-color.json' with { type: 'json' };

import { Glyph } from '../game/Glyph.js';

/**
 * Font set mapping labels to Unicode hex values
 * Loaded from unicode-mappings.json
 */
export const fontSet = unicodeMappings;

/**
 * Cache for Glyph instances to avoid creating duplicates
 * Key format: "unicode|color" (e.g., "263A|null" or "0020|green")
 */
const glyphCache = new Map();

/**
 * Converts a Unicode hex string to its corresponding Glyph instance
 * Uses caching to avoid creating duplicate Glyph instances
 * @param {string} hexString - Unicode hex value (e.g., "263A" for ☺)
 * @param {string|null} color - Optional color for the glyph
 * @returns {Glyph} A Glyph instance with the Unicode character
 */
export function toGlyph(hexString, color = null) {
  // Remove any leading "U+" or "0x" prefix if present
  const cleanHex = hexString.replace(/^[Uu]\+?|^0[xX]/, '');
  
  // Create cache key from unicode hex and color
  const cacheKey = `${cleanHex}|${color}`;
  
  // Check cache first
  if (glyphCache.has(cacheKey)) {
    return glyphCache.get(cacheKey);
  }
  
  // Parse hex string to code point
  const codePoint = parseInt(cleanHex, 16);
  
  // Convert code point to Unicode character
  const char = String.fromCodePoint(codePoint);
  
  // Create new Glyph instance
  const glyph = new Glyph(char, cleanHex, color);
  
  // Cache it for future use
  glyphCache.set(cacheKey, glyph);
  
  // Return Glyph instance
  return glyph;
}

/**
 * Converts a color name to its hex string value
 * Uses font-color.json mappings for color lookups
 * @param {string} color - Color name (e.g., "red", "GREEN", "dark_gray")
 * @returns {string} Hex string value (e.g., "FF0000"), defaults to white ("FFFFFF") if not found
 */
export function toColorHexValue(color) {
  if (!color || typeof color !== 'string') {
    return fontColorMappings.WHITE;
  }
  
  // Transform to uppercase for lookup
  const upperColor = color.toUpperCase();
  
  // Look up in font color mappings, default to white if not found
  return fontColorMappings[upperColor] || fontColorMappings.WHITE;
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
export const PLAYER_CHAR = toGlyph(fontSet.INVERTED_SMILING_FACE, toColorHexValue('white'));

