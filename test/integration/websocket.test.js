/**
 * WebSocket Integration Tests
 * Tests for server startup/shutdown, multiple clients, state synchronization, and reconnection
 */

import { describe, test, expect, beforeAll, afterAll } from 'vitest';
import { ensureServerRunning, ensureServerStopped } from '../helpers/server.js';
import { gameConfig } from '../../src/config/gameConfig.js';
import WebSocket from 'ws';

describe('WebSocket Integration', () => {
  // beforeAll(async () => {
  //   await ensureServerRunning();
  // });

  // afterAll(async () => {
  //   await ensureServerStopped();
  // });

  describe('Server Startup/Shutdown', () => {
    test('should start server and accept connections', async () => {
      return new Promise((resolve, reject) => {
        const ws = new WebSocket('ws://localhost:3000');
        let timeoutId;

        ws.on('open', () => {
          clearTimeout(timeoutId);
          ws.close();
          resolve();
        });

        ws.on('error', error => {
          clearTimeout(timeoutId);
          reject(error);
        });

        timeoutId = setTimeout(() => {
          ws.close();
          reject(new Error('Server not accepting connections'));
        }, 5000);
      });
    });

    test('should send initial CONNECT message on connection', async () => {
      return new Promise((resolve, reject) => {
        const ws = new WebSocket('ws://localhost:3000');
        let timeoutId;

        ws.on('message', data => {
          const message = JSON.parse(data.toString());
          if (message.type === 'CONNECT') {
            expect(message.payload).toBeDefined();
            expect(message.payload.clientId).toBeDefined();
            expect(message.payload.gameState).toBeDefined();
            clearTimeout(timeoutId);
            ws.close();
            resolve();
          }
        });

        ws.on('error', error => {
          clearTimeout(timeoutId);
          reject(error);
        });

        timeoutId = setTimeout(() => {
          ws.close();
          reject(new Error('CONNECT message not received'));
        }, 5000);
      });
    });
  });

  describe('Multiple Client Connections', () => {
    test('should handle multiple simultaneous connections', async () => {
      return new Promise((resolve, reject) => {
        const clients = [];
        const connectedClients = [];
        let timeoutId;

        // Create 3 clients
        for (let i = 0; i < 3; i++) {
          const ws = new WebSocket('ws://localhost:3000');
          clients.push(ws);

          ws.on('open', () => {
            connectedClients.push(ws);
            if (connectedClients.length === 3) {
              // All clients connected
              clearTimeout(timeoutId);
              clients.forEach(client => client.close());
              resolve();
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
          reject(new Error('Not all clients connected'));
        }, 5000);
      });
    });

    test('should assign unique client IDs to multiple clients', async () => {
      return new Promise((resolve, reject) => {
        const clients = [];
        const clientIds = new Set();
        let timeoutId;

        // Create 3 clients
        for (let i = 0; i < 3; i++) {
          const ws = new WebSocket('ws://localhost:3000');
          clients.push(ws);

          ws.on('message', data => {
            const message = JSON.parse(data.toString());
            if (message.type === 'CONNECT') {
              const clientId = message.payload.clientId;
              expect(clientId).toBeDefined();
              clientIds.add(clientId);

              if (clientIds.size === 3) {
                // All clients have unique IDs
                expect(clientIds.size).toBe(3);
                clearTimeout(timeoutId);
                clients.forEach(client => client.close());
                resolve();
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
          reject(new Error('Not all clients received CONNECT messages'));
        }, 5000);
      });
    });
  });

  describe('State Synchronization', () => {
    test('should broadcast state updates to all connected clients', async () => {
      return new Promise((resolve, reject) => {
        const clients = [];
        const stateUpdates = new Map();
        let timeoutId;

        // Create 2 clients and join them as players
        for (let i = 0; i < 2; i++) {
          const ws = new WebSocket('ws://localhost:3000');
          clients.push(ws);
          stateUpdates.set(ws, []);

          ws.on('message', data => {
            const message = JSON.parse(data.toString());
            if (message.type === 'CONNECT') {
              // Join as player
              ws.send(
                JSON.stringify({
                  type: 'CONNECT',
                  payload: { playerName: `Player${i + 1}` },
                })
              );
            } else if (message.type === 'STATE_UPDATE') {
              const updates = stateUpdates.get(ws);
              updates.push(message.payload.gameState);

              // Wait for at least 2 state updates per client
              if (updates.length >= 2) {
                // Check if all clients received state updates
                const allReceived = Array.from(stateUpdates.values()).every(
                  updates => updates.length >= 2
                );

                if (allReceived) {
                  // Verify all clients received the same state
                  const firstState = stateUpdates.get(clients[0])[1];
                  const secondState = stateUpdates.get(clients[1])[1];

                  expect(firstState.players.length).toBe(secondState.players.length);
                  expect(firstState.board.width).toBe(secondState.board.width);
                  expect(firstState.board.height).toBe(secondState.board.height);

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
          reject(new Error('State synchronization timeout'));
        }, 10000);
      });
    });

    test('should synchronize player movements across all clients', async () => {
      return new Promise((resolve, reject) => {
        const clients = [];
        const playerPositions = new Map();
        const playerIds = new Set(); // Track player IDs from this test
        let timeoutId;
        let moveSent = false;
        let playersJoined = 0;
        let updatesAfterMove = new Map(); // Track state updates received after move

        // Create 2 clients
        for (let i = 0; i < 2; i++) {
          const ws = new WebSocket('ws://localhost:3000');
          clients.push(ws);
          playerPositions.set(ws, null);
          updatesAfterMove.set(ws, 0);

          ws.on('message', data => {
            const message = JSON.parse(data.toString());
            if (message.type === 'CONNECT' && !message.payload.playerId) {
              // Initial CONNECT message, join as player
              ws.send(
                JSON.stringify({
                  type: 'CONNECT',
                  payload: { playerName: `Player${i + 1}` },
                })
              );
            } else if (message.type === 'CONNECT' && message.payload.playerId) {
              // Response to CONNECT with playerId
              playerIds.add(message.payload.playerId);
              playersJoined++;

              // After both players have joined, send a move
              if (!moveSent && playersJoined === 2) {
                moveSent = true;
                // Send move from first client
                clients[0].send(
                  JSON.stringify({
                    type: 'MOVE',
                    payload: { dx: 1, dy: 0 },
                  })
                );
              }
            } else if (message.type === 'STATE_UPDATE') {
              const state = message.payload.gameState;
              playerPositions.set(ws, state.players);

              // Track updates received after move was sent
              if (moveSent) {
                const currentCount = updatesAfterMove.get(ws) || 0;
                updatesAfterMove.set(ws, currentCount + 1);
              }

              // Wait for both clients to receive at least one state update AFTER the move was sent
              // This ensures they're comparing the same state snapshot
              const allPositions = Array.from(playerPositions.values());
              const allUpdateCounts = Array.from(updatesAfterMove.values());
              const minUpdateCount = Math.min(...allUpdateCounts);

              if (
                moveSent &&
                allPositions.every(positions => positions !== null) &&
                minUpdateCount >= 1 // Both clients have received at least one update after move
              ) {
                // Verify positions are synchronized
                const firstPositions = playerPositions.get(clients[0]);
                const secondPositions = playerPositions.get(clients[1]);

                // Both clients should see the same player positions
                if (firstPositions && secondPositions) {
                  // Filter to only players from this test
                  const firstTestPlayers = firstPositions.filter(p => playerIds.has(p.playerId));
                  const secondTestPlayers = secondPositions.filter(p => playerIds.has(p.playerId));

                  // Verify they see the same number of test players
                  expect(firstTestPlayers.length).toBe(2);
                  expect(secondTestPlayers.length).toBe(2);
                  expect(firstTestPlayers.length).toBe(secondTestPlayers.length);

                  // Find the player that moved (from first client) - should be at (21, 10)
                  const movedPlayer = firstTestPlayers.find(p => p.x === 21 && p.y === 10);

                  if (movedPlayer) {
                    // Verify second client sees the same position for this player
                    const secondPlayer = secondTestPlayers.find(
                      p => p.playerId === movedPlayer.playerId
                    );
                    expect(secondPlayer).toBeDefined();
                    expect(secondPlayer.x).toBe(movedPlayer.x);
                    expect(secondPlayer.y).toBe(movedPlayer.y);
                  } else {
                    // If no player at (21, 10), check if positions match for all test players
                    firstTestPlayers.forEach(firstPlayer => {
                      const secondPlayer = secondTestPlayers.find(
                        p => p.playerId === firstPlayer.playerId
                      );
                      expect(secondPlayer).toBeDefined();
                      expect(secondPlayer.x).toBe(firstPlayer.x);
                      expect(secondPlayer.y).toBe(firstPlayer.y);
                    });
                  }
                }

                clearTimeout(timeoutId);
                clients.forEach(client => client.close());
                resolve();
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
          reject(new Error('Movement synchronization timeout'));
        }, 10000);
      });
    });
  });

  describe('Reconnection', () => {
    test('should allow client to reconnect with same playerId', async () => {
      return new Promise((resolve, reject) => {
        let firstClient = null;
        let playerId = null;
        let timeoutId;
        let step = 1;

        // First connection
        firstClient = new WebSocket('ws://localhost:3000');

        firstClient.on('open', () => {
          console.log('Step 1: First client connected');
        });

        firstClient.on('message', data => {
          try {
            const message = JSON.parse(data.toString());
            console.log(`Step ${step}: First client received:`, message.type, {
              clientId: message.payload?.clientId,
              playerId: message.payload?.playerId,
              isReconnection: message.payload?.isReconnection,
            });

            // Step 1: Receive initial CONNECT message from server
            if (
              step === 1 &&
              message.type === 'CONNECT' &&
              message.payload.clientId &&
              !message.payload.playerId
            ) {
              console.log(
                'Step 1 complete: Received initial CONNECT with clientId:',
                message.payload.clientId
              );

              // Verify we got a clientId
              expect(message.payload.clientId).toBeDefined();
              expect(typeof message.payload.clientId).toBe('string');

              // Step 2: Join as player
              step = 2;
              console.log('Step 2: Sending CONNECT to join as player');
              firstClient.send(
                JSON.stringify({
                  type: 'CONNECT',
                  payload: { playerName: 'ReconnectTestPlayer' },
                })
              );
            }
            // Step 2: Receive response with playerId
            else if (
              step === 2 &&
              message.type === 'CONNECT' &&
              message.payload.playerId &&
              !message.payload.isReconnection
            ) {
              playerId = message.payload.playerId;
              console.log('Step 2 complete: Received playerId:', playerId);

              // Verify we got a playerId
              expect(playerId).toBeDefined();
              expect(typeof playerId).toBe('string');

              // Step 3: Disconnect first client
              step = 3;
              console.log('Step 3: Disconnecting first client');

              // Wait for disconnect to complete before reconnecting
              firstClient.on('close', () => {
                console.log('Step 3: First client connection closed');
              });

              // Close the connection and wait for server to process disconnect
              firstClient.close();
              // resolve();

              // Wait longer for server to process disconnect and mark player as disconnected
              // The disconnect handler should move the player to disconnectedPlayers
              // Give the server time to process the close event and mark the player as disconnected
              setTimeout(() => {
                console.log('Step 4: Creating second client for reconnection');
                const secondClient = new WebSocket('ws://localhost:3000');
                let reconnectStep = 1;

                secondClient.on('open', () => {
                  console.log('Step 4: Second client connected');
                });

                secondClient.on('message', reconnectData => {
                  try {
                    const reconnectMessage = JSON.parse(reconnectData.toString());

                    // Ignore STATE_UPDATE and PLAYER_JOINED messages - they're broadcast periodically
                    if (
                      reconnectMessage.type === 'STATE_UPDATE' ||
                      reconnectMessage.type === 'PLAYER_JOINED'
                    ) {
                      return; // Skip processing these messages
                    }

                    console.log(
                      `Step 4.${reconnectStep}: Second client received:`,
                      reconnectMessage.type,
                      {
                        clientId: reconnectMessage.payload?.clientId,
                        playerId: reconnectMessage.payload?.playerId,
                        isReconnection: reconnectMessage.payload?.isReconnection,
                      }
                    );

                    // Step 4.1: Receive initial CONNECT message (server greeting)
                    if (
                      reconnectStep === 1 &&
                      reconnectMessage.type === 'CONNECT' &&
                      reconnectMessage.payload.clientId &&
                      !reconnectMessage.payload.playerId
                    ) {
                      console.log(
                        'Step 4.1 complete: Received initial CONNECT, sending reconnect request with playerId:',
                        playerId
                      );
                      reconnectStep = 2;
                      // Send CONNECT with playerId to reconnect
                      secondClient.send(
                        JSON.stringify({
                          type: 'CONNECT',
                          payload: { playerId, playerName: 'ReconnectTestPlayer' },
                        })
                      );
                    }
                    // Step 4.2: Receive reconnection response (CONNECT with isReconnection: true)
                    else if (reconnectStep === 2 && reconnectMessage.type === 'CONNECT') {
                      console.log('Step 4.2: Received CONNECT message', {
                        hasPlayerId: !!reconnectMessage.payload?.playerId,
                        receivedPlayerId: reconnectMessage.payload?.playerId,
                        expectedPlayerId: playerId,
                        playerIdMatch: reconnectMessage.payload?.playerId === playerId,
                        isReconnection: reconnectMessage.payload?.isReconnection,
                      });
                      // secondClient.close();
                      // console.log("reconnectMessage.payload", JSON.stringify(reconnectMessage.payload.isReconnection));
                      // return resolve();

                      // Verify reconnection with same playerId
                      if (
                        reconnectMessage.payload.isReconnection === true &&
                        reconnectMessage.payload.playerId === playerId
                      ) {
                        console.log(
                          'Step 4.2 complete: Successfully reconnected with same playerId'
                        );

                        // Verify reconnection
                        expect(reconnectMessage.payload.isReconnection).toBe(true);
                        expect(reconnectMessage.payload.playerId).toBe(playerId);

                        clearTimeout(timeoutId);
                        secondClient.close();
                        resolve();
                      }
                    }
                  } catch (error) {
                    console.error('Error in reconnect message handler:', error);
                    clearTimeout(timeoutId);
                    secondClient.close();
                    reject(error);
                  }
                });

                secondClient.on('error', error => {
                  console.error('Second client error:', error);
                  clearTimeout(timeoutId);
                  secondClient.close();
                  reject(error);
                });
              }, 500);
            }
          } catch (error) {
            console.error('Error in message handler:', error);
            clearTimeout(timeoutId);
            if (firstClient) firstClient.close();
            reject(error);
          }
        });

        firstClient.on('error', error => {
          console.error('First client error:', error);
          clearTimeout(timeoutId);
          if (firstClient) firstClient.close();
          reject(error);
        });

        timeoutId = setTimeout(() => {
          console.error(`Test timeout at step ${step}`);
          if (firstClient) firstClient.close();
          reject(new Error(`Test timeout at step ${step}`));
        }, 15000);
      });
    });

    test('should restore player state after reconnection', async () => {
      return new Promise((resolve, reject) => {
        let firstClient = null;
        let playerId = null;
        let playerPosition = null;
        let timeoutId;
        let restoreResolved = false;
        let moveSent = false;

        // First connection
        firstClient = new WebSocket('ws://localhost:3000');

        firstClient.on('message', data => {
          try {
            const message = JSON.parse(data.toString());
            if (message.type === 'CONNECT' && !message.payload.playerId) {
              // Initial CONNECT message, join as player
              firstClient.send(
                JSON.stringify({
                  type: 'CONNECT',
                  payload: { playerName: 'StateRestorePlayer' },
                })
              );
            } else if (message.type === 'CONNECT' && message.payload.playerId && !playerId) {
              // Response to CONNECT
              playerId = message.payload.playerId;

              // Move player
              if (!moveSent) {
                moveSent = true;
                firstClient.send(
                  JSON.stringify({
                    type: 'MOVE',
                    payload: { dx: 1, dy: 0 },
                  })
                );
              }
            } else if (message.type === 'STATE_UPDATE' && playerId && !playerPosition) {
              const state = message.payload.gameState;
              const player = state.players.find(p => p.playerId === playerId);
              if (player && player.x !== gameConfig.player.initialX) {
                // Player has moved, save position
                playerPosition = { x: player.x, y: player.y };

                // Disconnect
                firstClient.close();

                // Wait a bit, then reconnect
                setTimeout(() => {
                  const secondClient = new WebSocket('ws://localhost:3000');

                  secondClient.on('message', reconnectData => {
                    try {
                      if (restoreResolved) return;
                      const reconnectMessage = JSON.parse(reconnectData.toString());
                      if (
                        reconnectMessage.type === 'CONNECT' &&
                        !reconnectMessage.payload.playerId
                      ) {
                        // Initial CONNECT message, reconnect with same playerId
                        secondClient.send(
                          JSON.stringify({
                            type: 'CONNECT',
                            payload: { playerId, playerName: 'StateRestorePlayer' },
                          })
                        );
                      } else if (reconnectMessage.type === 'STATE_UPDATE' && playerPosition) {
                        const reconnectState = reconnectMessage.payload.gameState;
                        const reconnectedPlayer = reconnectState.players.find(
                          p => p.playerId === playerId
                        );

                        if (reconnectedPlayer) {
                          // Verify player position was restored
                          restoreResolved = true;
                          expect(reconnectedPlayer.x).toBe(playerPosition.x);
                          expect(reconnectedPlayer.y).toBe(playerPosition.y);
                          clearTimeout(timeoutId);
                          secondClient.close();
                          resolve();
                        }
                      }
                    } catch (error) {
                      if (!restoreResolved) {
                        clearTimeout(timeoutId);
                        secondClient.close();
                        reject(error);
                      }
                    }
                  });

                  secondClient.on('error', error => {
                    if (!restoreResolved) {
                      clearTimeout(timeoutId);
                      secondClient.close();
                      reject(error);
                    }
                  });
                }, 500);
              }
            }
          } catch (error) {
            if (!restoreResolved) {
              clearTimeout(timeoutId);
              if (firstClient) firstClient.close();
              reject(error);
            }
          }
        });

        firstClient.on('error', error => {
          if (!restoreResolved) {
            clearTimeout(timeoutId);
            if (firstClient) firstClient.close();
            reject(error);
          }
        });

        timeoutId = setTimeout(() => {
          if (!restoreResolved) {
            if (firstClient) firstClient.close();
            reject(new Error('State restoration timeout'));
          }
        }, 20000);
      });
    });
  });
});
