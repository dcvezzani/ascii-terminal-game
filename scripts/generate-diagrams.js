#!/usr/bin/env node

/**
 * Script to generate SVG files from all Mermaid (.mmd) files
 * Finds all .mmd files and converts them to .svg files
 */

import { execSync } from 'child_process';
import { readdirSync, statSync, existsSync } from 'fs';
import { join, dirname, extname, resolve } from 'path';
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
 * Show usage information
 */
function showUsage() {
  console.log('Usage: node generate-diagrams.js [directories...]');
  console.log('');
  console.log('Generate SVG files from Mermaid (.mmd) files.');
  console.log('');
  console.log('Arguments:');
  console.log('  directories...  One or more directories to search (optional)');
  console.log('                  If not provided, searches entire project');
  console.log('');
  console.log('Examples:');
  console.log('  node generate-diagrams.js');
  console.log('    # Search entire project');
  console.log('');
  console.log('  node generate-diagrams.js docs/development/specs/server-architecture_SPECS');
  console.log('    # Search only in server architecture specs directory');
  console.log('');
  console.log('  node generate-diagrams.js docs/development/specs/server-architecture_SPECS docs/development/specs/client-architecture_SPECS');
  console.log('    # Search in multiple directories');
}

/**
 * Parse command-line arguments for directories
 * @returns {string[]} Array of directory paths to search (empty = search all)
 */
function parseDirectories() {
  const args = process.argv.slice(2);
  
  // Show help if requested
  if (args.includes('--help') || args.includes('-h')) {
    showUsage();
    process.exit(0);
  }
  
  if (args.length === 0) {
    return []; // Empty array means search entire project
  }
  
  return args.map(arg => {
    // Resolve path relative to project root
    const resolvedPath = resolve(projectRoot, arg);
    
    // Check if directory exists
    if (!existsSync(resolvedPath)) {
      console.error(`❌ Error: Directory does not exist: ${arg}`);
      process.exit(1);
    }
    
    const stat = statSync(resolvedPath);
    if (!stat.isDirectory()) {
      console.error(`❌ Error: Path is not a directory: ${arg}`);
      process.exit(1);
    }
    
    return resolvedPath;
  });
}

/**
 * Main function
 */
function main() {
  const searchDirectories = parseDirectories();
  
  if (searchDirectories.length === 0) {
    console.log('🔍 Finding all Mermaid (.mmd) files in project...\n');
  } else {
    console.log('🔍 Finding Mermaid (.mmd) files in specified directories...\n');
    searchDirectories.forEach(dir => {
      const relativePath = dir.replace(projectRoot + '/', '');
      console.log(`  📁 ${relativePath}`);
    });
    console.log();
  }
  
  // Collect files from all search directories (or project root if none specified)
  const searchPaths = searchDirectories.length > 0 
    ? searchDirectories 
    : [projectRoot];
  
  const mermaidFiles = [];
  searchPaths.forEach(searchPath => {
    const files = findMermaidFiles(searchPath);
    mermaidFiles.push(...files);
  });

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
