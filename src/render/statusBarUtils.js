/**
 * Wrap a string at space boundaries so no line exceeds maxWidth.
 * @param {string} str - String to wrap
 * @param {number} maxWidth - Maximum characters per line
 * @returns {string[]} Array of lines, each ≤ maxWidth (except a single overlong token)
 */
export function wrapAtSpaces(str, maxWidth) {
  if (str === '') {
    return [''];
  }
  const tokens = str.split(/\s+/);
  const lines = [];
  let current = '';
  for (const token of tokens) {
    const withSpace = current ? current + ' ' + token : token;
    if (withSpace.length <= maxWidth) {
      current = withSpace;
    } else {
      if (current) {
        lines.push(current);
      }
      if (token.length > maxWidth) {
        lines.push(token);
        current = '';
      } else {
        current = token;
      }
    }
  }
  if (current) {
    lines.push(current);
  }
  return lines;
}

/**
 * Build line 1 content (score + position) for full status bar format.
 * @param {number} score - Current score
 * @param {{ x: number, y: number } | null | undefined} position - Player position
 * @returns {string}
 */
export function buildLine1(score, position) {
  const posStr =
    position != null
      ? `Position: (${position.x}, ${position.y})`
      : 'Position: (?, ?)';
  return `Score: ${score} | ${posStr}`;
}

/**
 * Build line 2 content (instructions) for full status bar format. Static for MVP.
 * @returns {string}
 */
export function buildLine2() {
  return 'Arrow keys/WASD to move, Q/ESC to quit';
}

/**
 * Build simplified single-line content (narrow board).
 * @param {number} score - Current score
 * @param {{ x: number, y: number } | null | undefined} position - Player position
 * @returns {string}
 */
export function buildSimplifiedLine(score, position) {
  const posStr =
    position != null ? `P: (${position.x}, ${position.y})` : 'P: (?, ?)';
  return `S: ${score} | ${posStr}`;
}
