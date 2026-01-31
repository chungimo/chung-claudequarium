// CC Office Server - WebSocket Handler

const WebSocket = require('ws');
const entities = require('./entities');

let wss = null;
const clients = new Set();

// Initialize WebSocket server
function init(server) {
  wss = new WebSocket.Server({ server });

  wss.on('connection', (ws) => {
    console.log('Client connected');
    clients.add(ws);

    // Send full state on connect
    const fullState = {
      type: 'FULL_STATE',
      entities: entities.getAllEntities()
    };
    ws.send(JSON.stringify(fullState));

    ws.on('close', () => {
      console.log('Client disconnected');
      clients.delete(ws);
    });

    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
      clients.delete(ws);
    });
  });

  return wss;
}

// Broadcast message to all connected clients
function broadcast(message) {
  const data = JSON.stringify(message);
  clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(data);
    }
  });
}

// Get connected client count
function getClientCount() {
  return clients.size;
}

module.exports = {
  init,
  broadcast,
  getClientCount
};
