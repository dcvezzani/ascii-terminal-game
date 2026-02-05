import fs from 'fs/promises';

// Configuration constants
export const DEFAULT_WIDTH = 60;
export const DEFAULT_HEIGHT = 25;

// Character mapping constants
export const CHARACTER_MAPPING = {
  '#': 1, // block
  '@': 2, // spawn
  ' ': 0  // empty space
};

export async function readMapFile(filePath) {
  try {
    const content = await fs.readFile(filePath, 'utf8');
    
    if (!content || content.trim().length === 0) {
      throw new Error('File is empty or contains only whitespace');
    }
    
    return content;
  } catch (error) {
    if (error.code === 'ENOENT') {
      throw new Error(`File not found: ${filePath}`);
    }
    throw error;
  }
}

export function validateDimensions(content, width = DEFAULT_WIDTH, height = DEFAULT_HEIGHT) {
  const lines = content.split('\n').filter(line => line.length > 0);
  const rowCount = lines.length;
  const colCount = lines[0]?.length || 0;
  
  if (rowCount !== height) {
    throw new Error(`Expected ${height} rows, got ${rowCount}`);
  }
  
  if (colCount !== width) {
    throw new Error(`Expected ${width} columns, got ${colCount}`);
  }
  
  // Validate all rows have consistent column count
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].length !== colCount) {
      throw new Error(`Row ${i + 1} has ${lines[i].length} columns, expected ${colCount}`);
    }
  }
}

export function mapCharacters(content) {
  const result = [];
  
  for (let i = 0; i < content.length; i++) {
    const char = content[i];
    
    if (char === '\n') {
      continue; // Skip newlines
    }
    
    if (!(char in CHARACTER_MAPPING)) {
      throw new Error(`Invalid character: ${char}`);
    }
    
    result.push(CHARACTER_MAPPING[char]);
  }
  
  return result;
}

export function runLengthEncode(glyphs) {
  const result = [];
  
  if (glyphs.length === 0) {
    return result;
  }
  
  let currentGlyph = glyphs[0];
  let count = 1;
  
  for (let i = 1; i < glyphs.length; i++) {
    if (glyphs[i] === currentGlyph) {
      count++;
    } else {
      const cell = { entity: currentGlyph };
      if (count > 1) {
        cell.repeat = count;
      }
      result.push(cell);
      
      currentGlyph = glyphs[i];
      count = 1;
    }
  }
  
  // Add the last sequence
  const lastCell = { entity: currentGlyph };
  if (count > 1) {
    lastCell.repeat = count;
  }
  result.push(lastCell);
  
  return result;
}

export async function writeJsonMap(mapData, outputPath) {
  try {
    const jsonString = JSON.stringify(mapData, null, 2);
    await fs.writeFile(outputPath, jsonString, 'utf8');
  } catch (error) {
    throw error;
  }
}