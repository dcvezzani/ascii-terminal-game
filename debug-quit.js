#!/usr/bin/env node

/**
 * Debug script to investigate 'q' character echo issue
 * Run this to see what happens when 'q' is pressed
 */

import readline from 'readline';

let keypressCount = 0;
let quitCalled = false;

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

// Enable raw mode
readline.emitKeypressEvents(process.stdin);

if (process.stdin.isTTY) {
  process.stdin.setRawMode(true);
}

process.stdin.resume();
process.stdin.setEncoding('utf8');

console.log('Debug mode: Press "q" to quit. Watch for character echo.\n');
console.log('Press "q" now...\n');

process.stdin.on('keypress', (str, key) => {
  keypressCount++;
  const timestamp = new Date().toISOString();

  console.log(`[${timestamp}] Keypress #${keypressCount}:`);
  console.log(`  str: ${JSON.stringify(str)}`);
  console.log(`  key.name: ${key?.name || 'undefined'}`);
  console.log(`  key.ctrl: ${key?.ctrl || false}`);
  console.log(`  quitCalled: ${quitCalled}`);
  console.log(`  rawMode: ${process.stdin.isRaw || false}`);
  console.log('');

  // Handle 'q'
  if (str && typeof str === 'string' && str.toLowerCase() === 'q') {
    console.log('>>> "q" detected - calling quit handler');
    quitCalled = true;

    // Stop input handler
    console.log('>>> Removing keypress listeners...');
    process.stdin.removeAllListeners('keypress');

    console.log('>>> Closing readline interface...');
    rl.close();

    console.log('>>> Disabling raw mode...');
    if (process.stdin.isTTY) {
      process.stdin.setRawMode(false);
    }

    console.log('>>> Pausing stdin...');
    process.stdin.pause();

    console.log('>>> Cleanup complete. Check if "q" characters appear now.\n');
    console.log('Total keypress events received:', keypressCount);

    setTimeout(() => {
      console.log('\nExiting in 2 seconds...');
      process.exit(0);
    }, 2000);
  }

  // Handle Ctrl+C
  if (key && key.ctrl && key.name === 'c') {
    console.log('>>> Ctrl+C detected');
    process.exit(0);
  }
});
