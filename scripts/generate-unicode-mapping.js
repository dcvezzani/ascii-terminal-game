#!/usr/bin/env node

/**
 * Script to generate unicode-mappings.json from unicode-mappings.txt
 * 
 * Reads the tab-separated text file and converts it to JSON format:
 * { "LABEL": "unicode_hex", ... }
 * 
 * Labels are converted to UPPER_SNAKE_CASE from descriptions.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

// File paths
const textFile = path.join(projectRoot, 'docs/development/data/unicode-mappings.txt');
const jsonFile = path.join(projectRoot, 'src/config/unicode-mappings.json');

/**
 * Convert description to UPPER_SNAKE_CASE label
 * @param {string} description - Description text
 * @returns {string} UPPER_SNAKE_CASE label
 */
function descriptionToLabel(description) {
  return description
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '_')  // Replace non-alphanumeric with underscore
    .replace(/^_+|_+$/g, '')        // Remove leading/trailing underscores
    .replace(/_+/g, '_');           // Collapse multiple underscores
}

/**
 * Parse text file and generate JSON
 */
function generateJson() {
  console.log('Reading unicode-mappings.txt...');
  
  if (!fs.existsSync(textFile)) {
    console.error(`Error: File not found: ${textFile}`);
    process.exit(1);
  }

  const content = fs.readFileSync(textFile, 'utf-8');
  // Split by newline, handling different line ending formats
  // Keep all lines including empty ones for line number tracking
  const allLines = content.split(/\r?\n/);
  const lines = allLines;
  
  const mappings = {};
  const duplicateLabels = new Map();
  let lineNumber = 0;
  let skipped = 0;

  for (const line of lines) {
    lineNumber++;
    const trimmed = line.trim();
    
    // Skip empty lines
    if (!trimmed) {
      continue;
    }

    // Parse tab-separated values
    const parts = trimmed.split('\t');
    
    if (parts.length < 2) {
      console.warn(`Warning: Line ${lineNumber} has invalid format, skipping`);
      skipped++;
      continue;
    }

    const unicodeHex = parts[0].trim().toUpperCase();
    const description = parts.slice(1).join(' ').trim();

    if (!unicodeHex || !description) {
      console.warn(`Warning: Line ${lineNumber} missing unicode hex or description, skipping`);
      skipped++;
      continue;
    }

    // Convert description to label
    const label = descriptionToLabel(description);

    // Handle duplicate labels
    if (mappings[label]) {
      if (!duplicateLabels.has(label)) {
        duplicateLabels.set(label, [mappings[label]]);
      }
      duplicateLabels.get(label).push(unicodeHex);
      console.warn(`Warning: Duplicate label "${label}" at line ${lineNumber}. Using first occurrence.`);
    } else {
      mappings[label] = unicodeHex;
    }
  }

  // Report results
  console.log(`\nProcessed ${lineNumber} lines`);
  console.log(`Generated ${Object.keys(mappings).length} mappings`);
  if (skipped > 0) {
    console.log(`Skipped ${skipped} invalid lines`);
  }
  if (duplicateLabels.size > 0) {
    console.log(`\nWarning: Found ${duplicateLabels.size} duplicate labels:`);
    for (const [label, values] of duplicateLabels.entries()) {
      console.log(`  ${label}: ${values.join(', ')}`);
    }
  }

  // Ensure output directory exists
  const outputDir = path.dirname(jsonFile);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Write JSON file
  const jsonContent = JSON.stringify(mappings, null, 2);
  fs.writeFileSync(jsonFile, jsonContent, 'utf-8');
  
  console.log(`\n✓ Generated: ${jsonFile}`);
  console.log(`  File size: ${jsonContent.length} bytes`);
}

// Run the script
try {
  generateJson();
  console.log('\n✓ Success!');
} catch (error) {
  console.error('\n✗ Error:', error.message);
  process.exit(1);
}

