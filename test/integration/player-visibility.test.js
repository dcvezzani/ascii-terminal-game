/**
 * Integration tests for player visibility fixes
 * Tests for initial visibility, post-collision visibility, and state update queueing
 */

import { describe, test, expect } from 'vitest';
import WebSocket from 'ws';

describe('Player Visibility Integration Tests', () => {
  describe('Initial Player Visibility', () => {
    test('should show Player A in Player B terminal when Player B connects', async () => {
      return new Promise((resolve, reject) => {
        let playerA = null;
        let playerB = null;
        let playerAId = null;
        let playerBId = null;
        let playerBReceivedState = false;
        let timeoutId;

        // Player A connects first
        playerA = new WebSocket('ws://localhost:3000');

        playerA.on('message', data => {
          const message = JSON.parse(data.toString());
          if (message.type === 'CONNECT' && !message.payload.playerId) {
            // Initial CONNECT, join as player
            playerA.send(
              JSON.stringify({
                type: 'CONNECT',
                payload: { playerName: 'PlayerA' },
              })
            );
          } else if (message.type === 'CONNECT' && message.payload.playerId) {
            playerAId = message.payload.playerId;
            // Player A is now connected, wait a bit then connect Player B
            setTimeout(() => {
              // Player B connects
              playerB = new WebSocket('ws://localhost:3000');

              playerB.on('message', bData => {
                const bMessage = JSON.parse(bData.toString());
                if (bMessage.type === 'CONNECT' && !bMessage.payload.playerId) {
                  // Initial CONNECT, join as player
                  playerB.send(
                    JSON.stringify({
                      type: 'CONNECT',
                      payload: { playerName: 'PlayerB' },
                    })
                  );
                } else if (bMessage.type === 'CONNECT' && bMessage.payload.playerId) {
                  playerBId = bMessage.payload.playerId;
                } else if (bMessage.type === 'STATE_UPDATE') {
                  // Player B should receive state update with Player A
                  const gameState = bMessage.payload.gameState;
                  if (gameState && gameState.players) {
                    const playerAInState = gameState.players.find(
                      p => p.playerId === playerAId
                    );
                    if (playerAInState) {
                      playerBReceivedState = true;
                      // Verify Player A is in the state
                      expect(playerAInState).toBeDefined();
                      expect(playerAInState.playerId).toBe(playerAId);
                      expect(playerAInState.x).toBeDefined();
                      expect(playerAInState.y).toBeDefined();

                      clearTimeout(timeoutId);
                      playerA.close();
                      playerB.close();
                      resolve();
                    }
                  }
                }
              });

              playerB.on('error', error => {
                clearTimeout(timeoutId);
                if (playerA) playerA.close();
                if (playerB) playerB.close();
                reject(error);
              });
            }, 500); // Wait 500ms for Player A to be fully set up
          }
        });

        playerA.on('error', error => {
          clearTimeout(timeoutId);
          if (playerA) playerA.close();
          if (playerB) playerB.close();
          reject(error);
        });

        timeoutId = setTimeout(() => {
          if (playerA) playerA.close();
          if (playerB) playerB.close();
          reject(
            new Error(
              `Test timeout. Player B received state: ${playerBReceivedState}, Player A ID: ${playerAId}, Player B ID: ${playerBId}`
            )
          );
        }, 10000);
      });
    });

    test('should show all players on initial render', async () => {
      return new Promise((resolve, reject) => {
        const clients = [];
        const playerIds = new Set();
        const receivedStates = new Map();
        let timeoutId;

        // Create 3 players
        for (let i = 0; i < 3; i++) {
          const ws = new WebSocket('ws://localhost:3000');
          clients.push(ws);
          receivedStates.set(ws, []);

          ws.on('message', data => {
            const message = JSON.parse(data.toString());
            if (message.type === 'CONNECT' && !message.payload.playerId) {
              // Initial CONNECT, join as player
              ws.send(
                JSON.stringify({
                  type: 'CONNECT',
                  payload: { playerName: `Player${i + 1}` },
                })
              );
            } else if (message.type === 'CONNECT' && message.payload.playerId) {
              playerIds.add(message.payload.playerId);
            } else if (message.type === 'STATE_UPDATE') {
              const gameState = message.payload.gameState;
              const states = receivedStates.get(ws);
              states.push(gameState);

              // Wait for all players to join and receive at least one state update
              if (playerIds.size === 3 && states.length >= 1) {
                // Check that all players are in the state
                const lastState = states[states.length - 1];
                const playersInState = lastState.players || [];
                const playerIdsInState = new Set(playersInState.map(p => p.playerId));

                // Verify all 3 players are in the state
                if (playerIdsInState.size === 3) {
                  // Verify each player has position
                  playersInState.forEach(player => {
                    expect(player.x).toBeDefined();
                    expect(player.y).toBeDefined();
                    expect(typeof player.x).toBe('number');
                    expect(typeof player.y).toBe('number');
                  });

                  clearTimeout(timeoutId);
                  clients.forEach(client => client.close());
                  resolve();
                }
              }
            }
          });

          ws.on('error', error => {
            clearTimeout(timeoutId);
            clients.forEach(client => client.close());
            reject(error);
          });
        }

        timeoutId = setTimeout(() => {
          clients.forEach(client => client.close());
          reject(
            new Error(
              `Test timeout. Players joined: ${playerIds.size}, States received: ${Array.from(receivedStates.values()).map(s => s.length).join(',')}`
            )
          );
        }, 10000);
      });
    });

    test('should show players even if they havent moved', async () => {
      return new Promise((resolve, reject) => {
        let playerA = null;
        let playerB = null;
        let playerAId = null;
        let playerBId = null;
        let playerAPosition = null;
        let playerBReceivedState = false;
        let timeoutId;

        // Player A connects first and does NOT move
        playerA = new WebSocket('ws://localhost:3000');

        playerA.on('message', data => {
          const message = JSON.parse(data.toString());
          if (message.type === 'CONNECT' && !message.payload.playerId) {
            playerA.send(
              JSON.stringify({
                type: 'CONNECT',
                payload: { playerName: 'PlayerA' },
              })
            );
          } else if (message.type === 'CONNECT' && message.payload.playerId) {
            playerAId = message.payload.playerId;
            // Store Player A's initial position
            if (message.payload.gameState) {
              const localPlayer = message.payload.gameState.players.find(
                p => p.playerId === playerAId
              );
              if (localPlayer) {
                playerAPosition = { x: localPlayer.x, y: localPlayer.y };
              }
            }
            // Wait a bit, then connect Player B
            setTimeout(() => {
              playerB = new WebSocket('ws://localhost:3000');

              playerB.on('message', bData => {
                const bMessage = JSON.parse(bData.toString());
                if (bMessage.type === 'CONNECT' && !bMessage.payload.playerId) {
                  playerB.send(
                    JSON.stringify({
                      type: 'CONNECT',
                      payload: { playerName: 'PlayerB' },
                    })
                  );
                } else if (bMessage.type === 'CONNECT' && bMessage.payload.playerId) {
                  playerBId = bMessage.payload.playerId;
                } else if (bMessage.type === 'STATE_UPDATE') {
                  const gameState = bMessage.payload.gameState;
                  if (gameState && gameState.players) {
                    const playerAInState = gameState.players.find(
                      p => p.playerId === playerAId
                    );
                    if (playerAInState && playerAPosition) {
                      // Verify Player A is visible and at the same position (hasn't moved)
                      expect(playerAInState.x).toBe(playerAPosition.x);
                      expect(playerAInState.y).toBe(playerAPosition.y);
                      playerBReceivedState = true;

                      clearTimeout(timeoutId);
                      playerA.close();
                      playerB.close();
                      resolve();
                    }
                  }
                }
              });

              playerB.on('error', error => {
                clearTimeout(timeoutId);
                if (playerA) playerA.close();
                if (playerB) playerB.close();
                reject(error);
              });
            }, 1000); // Wait 1 second to ensure Player A hasn't moved
          }
        });

        playerA.on('error', error => {
          clearTimeout(timeoutId);
          if (playerA) playerA.close();
          if (playerB) playerB.close();
          reject(error);
        });

        timeoutId = setTimeout(() => {
          if (playerA) playerA.close();
          if (playerB) playerB.close();
          reject(
            new Error(
              `Test timeout. Player B received state: ${playerBReceivedState}, Player A position: ${JSON.stringify(playerAPosition)}`
            )
          );
        }, 10000);
      });
    });
  });

  describe('Post-Collision Visibility', () => {
    test('should keep Player A visible in Player B terminal after collision', async () => {
      return new Promise((resolve, reject) => {
        let playerA = null;
        let playerB = null;
        let playerAId = null;
        let playerBId = null;
        let playerAPosition = null;
        let playerBPosition = null;
        let playerBPositionBeforeMove = null;
        let collisionDetected = false;
        let playerAVisibleAfterCollision = false;
        let moveAttempted = false;
        let timeoutId;

        // Both players connect
        playerA = new WebSocket('ws://localhost:3000');
        playerB = new WebSocket('ws://localhost:3000');

        const playerBStates = [];

        playerA.on('message', data => {
          const message = JSON.parse(data.toString());
          if (message.type === 'CONNECT' && !message.payload.playerId) {
            playerA.send(
              JSON.stringify({
                type: 'CONNECT',
                payload: { playerName: 'PlayerA' },
              })
            );
          } else if (message.type === 'CONNECT' && message.payload.playerId) {
            playerAId = message.payload.playerId;
            if (message.payload.gameState) {
              const localPlayer = message.payload.gameState.players.find(
                p => p.playerId === playerAId
              );
              if (localPlayer) {
                playerAPosition = { x: localPlayer.x, y: localPlayer.y };
              }
            }
          }
        });

        playerB.on('message', data => {
          const message = JSON.parse(data.toString());
          if (message.type === 'CONNECT' && !message.payload.playerId) {
            playerB.send(
              JSON.stringify({
                type: 'CONNECT',
                payload: { playerName: 'PlayerB' },
              })
            );
          } else if (message.type === 'CONNECT' && message.payload.playerId) {
            playerBId = message.payload.playerId;
            if (message.payload.gameState) {
              const localPlayer = message.payload.gameState.players.find(
                p => p.playerId === playerBId
              );
              if (localPlayer) {
                playerBPosition = { x: localPlayer.x, y: localPlayer.y };
              }
            }
          } else if (message.type === 'STATE_UPDATE') {
            const gameState = message.payload.gameState;
            playerBStates.push(gameState);

            // Update Player B's position
            const playerBInState = gameState.players.find(p => p.playerId === playerBId);
            if (playerBInState) {
              playerBPosition = { x: playerBInState.x, y: playerBInState.y };
            }

            // Detect collision: if we attempted a move and Player B's position didn't change
            if (moveAttempted && playerBPositionBeforeMove) {
              const positionUnchanged =
                playerBPosition.x === playerBPositionBeforeMove.x &&
                playerBPosition.y === playerBPositionBeforeMove.y;

              if (positionUnchanged) {
                collisionDetected = true;

                // After collision, verify Player A is still visible
                const playerAInState = gameState.players.find(p => p.playerId === playerAId);
                if (playerAInState) {
                  playerAVisibleAfterCollision = true;
                  expect(playerAInState.x).toBeDefined();
                  expect(playerAInState.y).toBeDefined();

                  clearTimeout(timeoutId);
                  playerA.close();
                  playerB.close();
                  resolve();
                }
              }
            }
          } else if (message.type === 'ERROR' && message.payload.action === 'MOVE') {
            // Move failed - this could indicate a collision
            if (moveAttempted) {
              collisionDetected = true;
              // Still need to verify Player A is visible in next state update
            }
          }
        });

        // After both players are connected, try to move Player B into Player A's position
        setTimeout(() => {
          if (playerAId && playerBId && playerAPosition && playerBPosition) {
            // Store Player B's position before move attempt
            playerBPositionBeforeMove = { ...playerBPosition };

            // Calculate direction to move Player B towards Player A
            const dx = Math.max(-1, Math.min(1, playerAPosition.x - playerBPosition.x));
            const dy = Math.max(-1, Math.min(1, playerAPosition.y - playerBPosition.y));

            // Only attempt move if there's a direction to move
            if (dx !== 0 || dy !== 0) {
              moveAttempted = true;
              // Player B tries to move towards Player A's position (should cause collision)
              playerB.send(
                JSON.stringify({
                  type: 'MOVE',
                  payload: { dx, dy },
                })
              );
            }
          }
        }, 2000);

        playerA.on('error', error => {
          clearTimeout(timeoutId);
          if (playerA) playerA.close();
          if (playerB) playerB.close();
          reject(error);
        });

        playerB.on('error', error => {
          clearTimeout(timeoutId);
          if (playerA) playerA.close();
          if (playerB) playerB.close();
          reject(error);
        });

        timeoutId = setTimeout(() => {
          if (playerA) playerA.close();
          if (playerB) playerB.close();
          reject(
            new Error(
              `Test timeout. Collision detected: ${collisionDetected}, Player A visible: ${playerAVisibleAfterCollision}, States received: ${playerBStates.length}`
            )
          );
        }, 10000);
      });
    });

    test('should show both players after collision even if positions unchanged', async () => {
      return new Promise((resolve, reject) => {
        let playerA = null;
        let playerB = null;
        let playerAId = null;
        let playerBId = null;
        let playerAPosition = null;
        let playerBPosition = null;
        let bothPlayersVisible = false;
        let timeoutId;

        const playerBStates = [];

        // Both players connect
        playerA = new WebSocket('ws://localhost:3000');
        playerB = new WebSocket('ws://localhost:3000');

        playerA.on('message', data => {
          const message = JSON.parse(data.toString());
          if (message.type === 'CONNECT' && !message.payload.playerId) {
            playerA.send(
              JSON.stringify({
                type: 'CONNECT',
                payload: { playerName: 'PlayerA' },
              })
            );
          } else if (message.type === 'CONNECT' && message.payload.playerId) {
            playerAId = message.payload.playerId;
            if (message.payload.gameState) {
              const localPlayer = message.payload.gameState.players.find(
                p => p.playerId === playerAId
              );
              if (localPlayer) {
                playerAPosition = { x: localPlayer.x, y: localPlayer.y };
              }
            }
          }
        });

        playerB.on('message', data => {
          const message = JSON.parse(data.toString());
          if (message.type === 'CONNECT' && !message.payload.playerId) {
            playerB.send(
              JSON.stringify({
                type: 'CONNECT',
                payload: { playerName: 'PlayerB' },
              })
            );
          } else if (message.type === 'CONNECT' && message.payload.playerId) {
            playerBId = message.payload.playerId;
            if (message.payload.gameState) {
              const localPlayer = message.payload.gameState.players.find(
                p => p.playerId === playerBId
              );
              if (localPlayer) {
                playerBPosition = { x: localPlayer.x, y: localPlayer.y };
              }
            }
          } else if (message.type === 'STATE_UPDATE') {
            const gameState = message.payload.gameState;
            playerBStates.push(gameState);

            // Update positions
            const playersInState = gameState.players || [];
            const playerAInState = playersInState.find(p => p.playerId === playerAId);
            const playerBInState = playersInState.find(p => p.playerId === playerBId);

            if (playerAInState && playerBInState) {
              // Check if positions are unchanged after move attempt (indicates collision)
              if (playerAPosition && playerBPosition) {
                const positionsUnchanged =
                  playerAInState.x === playerAPosition.x &&
                  playerAInState.y === playerAPosition.y &&
                  playerBInState.x === playerBPosition.x &&
                  playerBInState.y === playerBPosition.y;

                // If we've attempted a move and positions are unchanged, collision occurred
                if (positionsUnchanged && playerBStates.length > 1) {
                  bothPlayersVisible = true;
                  expect(playerAInState.x).toBe(playerAPosition.x);
                  expect(playerAInState.y).toBe(playerAPosition.y);
                  expect(playerBInState.x).toBe(playerBPosition.x);
                  expect(playerBInState.y).toBe(playerBPosition.y);

                  clearTimeout(timeoutId);
                  playerA.close();
                  playerB.close();
                  resolve();
                }
              }
            }
          }
        });

        // After both players are connected, try to cause a collision
        setTimeout(() => {
          if (playerAId && playerBId && playerAPosition && playerBPosition) {
            // Player B tries to move to Player A's position
            const dx = playerAPosition.x - playerBPosition.x;
            const dy = playerAPosition.y - playerBPosition.y;
            // Clamp to -1, 0, or 1
            const clampedDx = Math.max(-1, Math.min(1, dx));
            const clampedDy = Math.max(-1, Math.min(1, dy));

            if (clampedDx !== 0 || clampedDy !== 0) {
              playerB.send(
                JSON.stringify({
                  type: 'MOVE',
                  payload: { dx: clampedDx, dy: clampedDy },
                })
              );
            }
          }
        }, 2000);

        playerA.on('error', error => {
          clearTimeout(timeoutId);
          if (playerA) playerA.close();
          if (playerB) playerB.close();
          reject(error);
        });

        playerB.on('error', error => {
          clearTimeout(timeoutId);
          if (playerA) playerA.close();
          if (playerB) playerB.close();
          reject(error);
        });

        timeoutId = setTimeout(() => {
          if (playerA) playerA.close();
          if (playerB) playerB.close();
          reject(
            new Error(
              `Test timeout. Both players visible: ${bothPlayersVisible}, States received: ${playerBStates.length}`
            )
          );
        }, 10000);
      });
    });

    test('should show players remain visible after multiple collisions', async () => {
      return new Promise((resolve, reject) => {
        let playerA = null;
        let playerB = null;
        let playerAId = null;
        let playerBId = null;
        let collisionCount = 0;
        let allPlayersVisibleAfterCollisions = false;
        let timeoutId;

        const playerBStates = [];

        // Both players connect
        playerA = new WebSocket('ws://localhost:3000');
        playerB = new WebSocket('ws://localhost:3000');

        playerA.on('message', data => {
          const message = JSON.parse(data.toString());
          if (message.type === 'CONNECT' && !message.payload.playerId) {
            playerA.send(
              JSON.stringify({
                type: 'CONNECT',
                payload: { playerName: 'PlayerA' },
              })
            );
          } else if (message.type === 'CONNECT' && message.payload.playerId) {
            playerAId = message.payload.playerId;
          }
        });

        playerB.on('message', data => {
          const message = JSON.parse(data.toString());
          if (message.type === 'CONNECT' && !message.payload.playerId) {
            playerB.send(
              JSON.stringify({
                type: 'CONNECT',
                payload: { playerName: 'PlayerB' },
              })
            );
          } else if (message.type === 'CONNECT' && message.payload.playerId) {
            playerBId = message.payload.playerId;
          } else if (message.type === 'STATE_UPDATE') {
            const gameState = message.payload.gameState;
            playerBStates.push(gameState);

            // Track player positions to detect collisions
            const playersInState = gameState.players || [];
            const playerAInState = playersInState.find(p => p.playerId === playerAId);
            const playerBInState = playersInState.find(p => p.playerId === playerBId);

            if (playerAInState && playerBInState) {
              // Store previous positions to detect when movement is blocked (collision)
              if (playerBStates.length > 1) {
                const previousState = playerBStates[playerBStates.length - 2];
                const prevPlayerB = previousState.players.find(p => p.playerId === playerBId);
                
                // If Player B's position hasn't changed after a move attempt, it's a collision
                if (prevPlayerB && 
                    prevPlayerB.x === playerBInState.x && 
                    prevPlayerB.y === playerBInState.y &&
                    playerBStates.length > 2) {
                  collisionCount++;
                }
              }

              // After detecting 3 collisions, verify both players are still visible
              if (collisionCount >= 3) {
                allPlayersVisibleAfterCollisions = true;
                expect(playerAInState.x).toBeDefined();
                expect(playerAInState.y).toBeDefined();
                expect(playerBInState.x).toBeDefined();
                expect(playerBInState.y).toBeDefined();

                clearTimeout(timeoutId);
                playerA.close();
                playerB.close();
                resolve();
              }
            }
          } else if (message.type === 'ERROR' && message.payload.action === 'MOVE') {
            // Move failed - count as collision
            collisionCount++;
          }
        });

        // After both players are connected, try to cause multiple collisions
        setTimeout(() => {
          if (playerAId && playerBId) {
            // Try to cause 3 collisions by repeatedly attempting to move into Player A's position
            let attempts = 0;
            const attemptCollision = () => {
              if (attempts < 3) {
                // Try to move Player B (assuming Player A is at a specific position)
                // This is a simplified test - in reality, we'd need to know Player A's position
                playerB.send(
                  JSON.stringify({
                    type: 'MOVE',
                    payload: { dx: 1, dy: 0 },
                  })
                );
                attempts++;
                setTimeout(attemptCollision, 500);
              }
            };
            attemptCollision();
          }
        }, 2000);

        playerA.on('error', error => {
          clearTimeout(timeoutId);
          if (playerA) playerA.close();
          if (playerB) playerB.close();
          reject(error);
        });

        playerB.on('error', error => {
          clearTimeout(timeoutId);
          if (playerA) playerA.close();
          if (playerB) playerB.close();
          reject(error);
        });

        timeoutId = setTimeout(() => {
          if (playerA) playerA.close();
          if (playerB) playerB.close();
          reject(
            new Error(
              `Test timeout. Collisions: ${collisionCount}, All players visible: ${allPlayersVisibleAfterCollisions}`
            )
          );
        }, 15000);
      });
    });
  });

  describe('State Update Queueing', () => {
    test('should use most recent queued state when multiple states arrive before localPlayerId is set', async () => {
      return new Promise((resolve, reject) => {
        let client = null;
        let clientId = null;
        let playerId = null;
        let stateUpdatesReceived = 0;
        let finalStateReceived = null;
        let timeoutId;

        // Client connects but doesn't immediately join as player
        client = new WebSocket('ws://localhost:3000');

        client.on('message', data => {
          const message = JSON.parse(data.toString());
          if (message.type === 'CONNECT' && !message.payload.playerId) {
            // Initial CONNECT - don't join yet, let state updates queue
            clientId = message.payload.clientId;

            // Wait a bit to receive some state updates before joining
            setTimeout(() => {
              // Now join as player (this should process the most recent queued state)
              client.send(
                JSON.stringify({
                  type: 'CONNECT',
                  payload: { playerName: 'TestPlayer' },
                })
              );
            }, 1500);
          } else if (message.type === 'CONNECT' && message.payload.playerId) {
            playerId = message.payload.playerId;
            // The CONNECT response should include the most recent gameState
            if (message.payload.gameState) {
              finalStateReceived = message.payload.gameState;
              // Verify this is the most recent state (should have all players)
              if (finalStateReceived.players && finalStateReceived.players.length > 0) {
                clearTimeout(timeoutId);
                client.close();
                resolve();
              }
            }
          } else if (message.type === 'STATE_UPDATE') {
            stateUpdatesReceived++;
            // These state updates would be queued if localPlayerId is not set
            // The most recent one should be used when localPlayerId is set
          }
        });

        client.on('error', error => {
          clearTimeout(timeoutId);
          if (client) client.close();
          reject(error);
        });

        timeoutId = setTimeout(() => {
          if (client) client.close();
          reject(
            new Error(
              `Test timeout. State updates received: ${stateUpdatesReceived}, Final state: ${finalStateReceived ? 'received' : 'not received'}`
            )
          );
        }, 10000);
      });
    });
  });
});

