/**
 * Check if a spawn point is available: the spawn cell must not be a wall, and
 * every cell within Manhattan distance R of the spawn must be free of other players.
 * Walls elsewhere in the radius are allowed; only the spawn point itself cannot be on a wall.
 * @param {{ x: number, y: number }} spawn - Spawn coordinates
 * @param {{ width: number, height: number, getCell: (x: number, y: number) => string }} board - Board with getCell
 * @param {Array<{ playerId: string, x: number | null, y: number | null }>} players - All players (spawned and waiting)
 * @param {number} clearRadius - Manhattan radius (cells with |dx|+|dy| <= clearRadius must have no other players)
 * @returns {boolean} True if spawn is available
 */
export function isSpawnAvailable(spawn, board, players, clearRadius) {
  const { x: sx, y: sy } = spawn;
  const width = board.width;
  const height = board.height;

  if (sx < 0 || sx >= width || sy < 0 || sy >= height) return false;
  if (board.getCell(sx, sy) === '#') return false;

  for (let y = sy - clearRadius; y <= sy + clearRadius; y++) {
    for (let x = sx - clearRadius; x <= sx + clearRadius; x++) {
      if (Math.abs(x - sx) + Math.abs(y - sy) > clearRadius) continue;
      if (x < 0 || x >= width || y < 0 || y >= height) return false;
      const occupied = players.some(
        (p) => p.x !== null && p.y !== null && p.x === x && p.y === y
      );
      if (occupied) return false;
    }
  }
  return true;
}
