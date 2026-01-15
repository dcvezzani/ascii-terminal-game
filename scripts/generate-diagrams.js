#!/usr/bin/env node

/**
 * Script to generate SVG files from all Mermaid (.mmd) files
 * Finds all .mmd files and converts them to .svg files
 */

import { execSync } from 'child_process';
import { readdirSync, statSync } from 'fs';
import { join, dirname, extname, basename } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

/**
 * Recursively find all .mmd files in a directory
 * @param {string} dir - Directory to search
 * @param {string[]} fileList - Accumulator for file paths
 * @returns {string[]} Array of .mmd file paths
 */
function findMermaidFiles(dir, fileList = []) {
  const files = readdirSync(dir);

  files.forEach(file => {
    const filePath = join(dir, file);
    const stat = statSync(filePath);

    if (stat.isDirectory()) {
      // Skip node_modules and other common directories
      if (!['node_modules', '.git', 'logs', 'data'].includes(file)) {
        findMermaidFiles(filePath, fileList);
      }
    } else if (extname(file) === '.mmd') {
      fileList.push(filePath);
    }
  });

  return fileList;
}

/**
 * Convert a single .mmd file to .svg
 * @param {string} mmdPath - Path to .mmd file
 */
function convertToSvg(mmdPath) {
  const svgPath = mmdPath.replace(/\.mmd$/, '.svg');
  const relativeMmdPath = mmdPath.replace(projectRoot + '/', '');
  const relativeSvgPath = svgPath.replace(projectRoot + '/', '');

  try {
    console.log(`Converting: ${relativeMmdPath} → ${relativeSvgPath}`);
    execSync(
      `npx mmdc -i "${mmdPath}" -o "${svgPath}" -b white`,
      { stdio: 'inherit', cwd: projectRoot }
    );
    console.log(`✅ Generated: ${relativeSvgPath}\n`);
  } catch (error) {
    console.error(`❌ Error converting ${relativeMmdPath}:`, error.message);
    process.exit(1);
  }
}

/**
 * Main function
 */
function main() {
  console.log('🔍 Finding all Mermaid (.mmd) files...\n');
  
  const mermaidFiles = findMermaidFiles(projectRoot);

  if (mermaidFiles.length === 0) {
    console.log('No .mmd files found.');
    return;
  }

  console.log(`Found ${mermaidFiles.length} Mermaid file(s):\n`);
  mermaidFiles.forEach(file => {
    console.log(`  - ${file.replace(projectRoot + '/', '')}`);
  });
  console.log('\n📊 Generating SVG files...\n');

  mermaidFiles.forEach(convertToSvg);

  console.log(`✨ Successfully converted ${mermaidFiles.length} file(s) to SVG!`);
}

main();
