// CC Office Server - Configuration

// Load environment variables from config.env file
require('dotenv').config({ path: require('path').join(__dirname, '../config.env') });

const path = require('path');
const os = require('os');

// Get local IP address (skip VPN/WSL adapters)
function getLocalIP() {
  const interfaces = os.networkInterfaces();
  const skipPatterns = [
    /nordlynx/i,
    /nordvpn/i,
    /openvpn/i,
    /vpn/i,
    /wsl/i,
    /hyper-v/i,
    /vethernet/i,
    /docker/i
  ];

  let fallback = null;

  for (const name of Object.keys(interfaces)) {
    // Skip VPN and virtual adapters
    if (skipPatterns.some(pattern => pattern.test(name))) {
      continue;
    }

    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        // Prefer 192.168.x.x (typical home network)
        if (iface.address.startsWith('192.168.')) {
          return iface.address;
        }
        // Keep first non-VPN as fallback
        if (!fallback) {
          fallback = iface.address;
        }
      }
    }
  }

  return fallback || '127.0.0.1';
}

module.exports = {
  // Server host - bind to all interfaces by default
  HOST: process.env.HOST || '0.0.0.0',

  // Server port
  PORT: process.env.PORT || 4000,

  // Local IP for display purposes
  LOCAL_IP: getLocalIP(),

  // Path to static files (public folder)
  PUBLIC_PATH: path.join(__dirname, '../public'),

  // Valid entity states
  VALID_STATES: ['THINKING', 'PLANNING', 'CODING', 'IDLE'],

  // Idle timeout (ms) - auto-despawn after no activity
  IDLE_TIMEOUT_MS: 5 * 60 * 1000, // 5 minutes
};
