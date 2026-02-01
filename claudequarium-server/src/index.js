// CC Office Server - Main Entry Point

const express = require('express');
const cors = require('cors');
const http = require('http');

const config = require('./config');
const api = require('./api');
const websocket = require('./websocket');
const entities = require('./entities');

// Create Express app
const app = express();
app.use(cors());
app.use(express.json());

// API routes
app.use('/api', api);

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    entities: entities.getAllEntities().length,
    clients: websocket.getClientCount()
  });
});

// Serve static client files
app.use(express.static(config.PUBLIC_PATH));

// Serve images folder
app.use('/imgs', express.static(require('path').join(__dirname, '../imgs')));

// Fallback to index.html for SPA routing
app.get('*', (req, res) => {
  res.sendFile('index.html', { root: config.PUBLIC_PATH });
});

// Create HTTP server
const server = http.createServer(app);

// Initialize WebSocket
websocket.init(server);

// Start server
server.listen(config.PORT, config.HOST, () => {
  console.log(`Claudequarium Server running on:`);
  console.log(`  Local:   http://localhost:${config.PORT}`);
  console.log(`  Network: http://${config.LOCAL_IP}:${config.PORT}`);
  console.log(`WebSocket: ws://${config.LOCAL_IP}:${config.PORT}`);
});
