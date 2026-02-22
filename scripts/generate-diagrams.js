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
  console.log('Usage: node generate-diagrams.js [paths...]');
  console.log('');
  console.log('Generate SVG files from Mermaid (.mmd) files.');
  console.log('');
  console.log('Arguments:');
  console.log('  paths...  One or more directories and/or .mmd files (optional)');
  console.log('           Directories are searched recursively for .mmd files.');
  console.log('           If not provided, searches entire project.');
  console.log('');
  console.log('Examples:');
  console.log('  node generate-diagrams.js');
  console.log('    # Search entire project');
  console.log('');
  console.log('  node generate-diagrams.js docs/development/specs/server-architecture_SPECS');
  console.log('    # Search only in server architecture specs directory');
  console.log('');
  console.log('  node generate-diagrams.js docs/development/specs/client-architecture_SPECS/client-architecture_data-structures.mmd');
  console.log('    # Convert a single .mmd file');
  console.log('');
  console.log('  node generate-diagrams.js docs/specs docs/foo.mmd docs/bar.mmd');
  console.log('    # Search directory plus specific files');
}

/**
 * Parse command-line arguments for individual .mmd files
 * @returns {string[]} Array of resolved .mmd file paths
 */
function parseFiles() {
  const args = process.argv.slice(2);

  if (args.includes('--help') || args.includes('-h') || args.length === 0) {
    return [];
  }

  return args
    .filter(arg => {
      const resolvedPath = resolve(projectRoot, arg);
      if (!existsSync(resolvedPath)) {
        console.error(`❌ Error: Path does not exist: ${arg}`);
        process.exit(1);
      }
      const stat = statSync(resolvedPath);
      if (stat.isFile() && extname(arg) === '.mmd') {
        return true;
      }
      return false;
    })
    .map(arg => resolve(projectRoot, arg));
}

/**
 * Parse command-line arguments for directories to search
 * @returns {string[]} Array of directory paths to search (empty = search all when no args)
 */
function parseDirectories() {
  const args = process.argv.slice(2);

  if (args.includes('--help') || args.includes('-h') || args.length === 0) {
    return [];
  }

  return args
    .filter(arg => {
      const resolvedPath = resolve(projectRoot, arg);
      if (!existsSync(resolvedPath)) {
        console.error(`❌ Error: Path does not exist: ${arg}`);
        process.exit(1);
      }
      const stat = statSync(resolvedPath);
      if (stat.isDirectory()) {
        return true;
      }
      if (stat.isFile() && extname(arg) === '.mmd') {
        return false; // .mmd files are handled by parseFiles
      }
      console.error(`❌ Error: Path is not a directory or .mmd file: ${arg}`);
      process.exit(1);
    })
    .map(arg => resolve(projectRoot, arg));
}

/**
 * Main function
 */
function main() {
  if (process.argv.includes('--help') || process.argv.includes('-h')) {
    showUsage();
    process.exit(0);
  }

  const explicitFiles = parseFiles();
  const searchDirectories = parseDirectories();

  if (searchDirectories.length === 0 && explicitFiles.length === 0) {
    console.log('🔍 Finding all Mermaid (.mmd) files in project...\n');
  } else {
    console.log('🔍 Finding Mermaid (.mmd) files...\n');
    explicitFiles.forEach(file => {
      console.log(`  📄 ${file.replace(projectRoot + '/', '')}`);
    });
    searchDirectories.forEach(dir => {
      console.log(`  📁 ${dir.replace(projectRoot + '/', '')}`);
    });
    console.log();
  }

  // Collect: explicit .mmd files + all .mmd from each search directory (or project root only when no args)
  const searchPaths =
    searchDirectories.length > 0 ? searchDirectories : (explicitFiles.length === 0 ? [projectRoot] : []);
  const seen = new Set(explicitFiles.map(p => resolve(p)));
  const mermaidFiles = [...explicitFiles];
  searchPaths.forEach(searchPath => {
    const found = findMermaidFiles(searchPath);
    found.forEach(path => {
      const resolved = resolve(path);
      if (!seen.has(resolved)) {
        seen.add(resolved);
        mermaidFiles.push(path);
      }
    });
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
