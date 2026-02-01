/**
 * Site Framework - Database Module
 * ============================================
 *
 * USAGE:
 *   const db = require('./site-framework/database');
 *
 *   // Database auto-initializes on first require
 *   // Tables are created if they don't exist
 *
 * CUSTOMIZATION:
 * - Add new tables in initSchema()
 * - Modify DB_PATH for different location
 *
 * NOTE: db/ folder is gitignored - databases are created per-deployment
 */

const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcrypt');

// ============================================
// Configuration
// ============================================

const DB_DIR = path.join(__dirname, '../../db');
const DB_PATH = path.join(DB_DIR, 'app.db');
const SALT_ROUNDS = 12;

// ============================================
// Database Initialization
// ============================================

/**
 * Ensure database directory exists
 */
function ensureDbDirectory() {
  if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true });
    console.log('[DB] Created database directory:', DB_DIR);
  }
}

/**
 * Initialize database connection
 */
function initDatabase() {
  ensureDbDirectory();

  const isNew = !fs.existsSync(DB_PATH);
  const db = new Database(DB_PATH);

  // Enable foreign keys
  db.pragma('foreign_keys = ON');

  if (isNew) {
    console.log('[DB] Creating new database at:', DB_PATH);
    initSchema(db);
    seedDefaultData(db);
  } else {
    console.log('[DB] Connected to existing database:', DB_PATH);
  }

  return db;
}

/**
 * Initialize database schema
 */
function initSchema(db) {
  // Users table
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      api_key TEXT UNIQUE,
      is_admin INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      last_login TEXT
    )
  `);

  // Sessions table (for JWT blacklist/tracking)
  db.exec(`
    CREATE TABLE IF NOT EXISTS sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      token_id TEXT UNIQUE NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      expires_at TEXT NOT NULL,
      revoked INTEGER DEFAULT 0,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // Logs table
  db.exec(`
    CREATE TABLE IF NOT EXISTS logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      timestamp TEXT DEFAULT CURRENT_TIMESTAMP,
      level TEXT DEFAULT 'info',
      message TEXT,
      user_id INTEGER,
      metadata TEXT
    )
  `);

  // Settings table (key-value store)
  db.exec(`
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  console.log('[DB] Schema initialized');
}

/**
 * Seed default data
 */
function seedDefaultData(db) {
  // Create default admin user
  const adminPassword = 'admin'; // Change in production!
  const hash = bcrypt.hashSync(adminPassword, SALT_ROUNDS);

  try {
    db.prepare(`
      INSERT INTO users (username, password_hash, is_admin)
      VALUES (?, ?, 1)
    `).run('admin', hash);

    console.log('[DB] Created default admin user (username: admin, password: admin)');
    console.log('[DB] WARNING: Change the default admin password!');
  } catch (err) {
    // User might already exist
  }
}

// ============================================
// Database Instance (Singleton)
// ============================================

let dbInstance = null;

function getDatabase() {
  if (!dbInstance) {
    dbInstance = initDatabase();
  }
  return dbInstance;
}

// ============================================
// User Functions
// ============================================

const users = {
  /**
   * Get all users (without password hashes)
   */
  getAll() {
    const db = getDatabase();
    return db.prepare(`
      SELECT id, username, is_admin, created_at, last_login
      FROM users
      ORDER BY username
    `).all();
  },

  /**
   * Get user by ID
   */
  getById(id) {
    const db = getDatabase();
    return db.prepare(`
      SELECT id, username, is_admin, api_key, created_at, last_login
      FROM users WHERE id = ?
    `).get(id);
  },

  /**
   * Get user by username (includes password hash for auth)
   */
  getByUsername(username) {
    const db = getDatabase();
    return db.prepare(`
      SELECT * FROM users WHERE username = ?
    `).get(username);
  },

  /**
   * Get user by API key
   */
  getByApiKey(apiKey) {
    const db = getDatabase();
    return db.prepare(`
      SELECT id, username, is_admin FROM users WHERE api_key = ?
    `).get(apiKey);
  },

  /**
   * Create a new user
   */
  create(username, password, isAdmin = false) {
    const db = getDatabase();
    const hash = bcrypt.hashSync(password, SALT_ROUNDS);

    const result = db.prepare(`
      INSERT INTO users (username, password_hash, is_admin)
      VALUES (?, ?, ?)
    `).run(username, hash, isAdmin ? 1 : 0);

    return { id: result.lastInsertRowid, username, isAdmin };
  },

  /**
   * Update user
   */
  update(id, updates) {
    const db = getDatabase();
    const fields = [];
    const values = [];

    if (updates.username !== undefined) {
      fields.push('username = ?');
      values.push(updates.username);
    }
    if (updates.password !== undefined) {
      fields.push('password_hash = ?');
      values.push(bcrypt.hashSync(updates.password, SALT_ROUNDS));
    }
    if (updates.isAdmin !== undefined) {
      fields.push('is_admin = ?');
      values.push(updates.isAdmin ? 1 : 0);
    }
    if (updates.apiKey !== undefined) {
      fields.push('api_key = ?');
      values.push(updates.apiKey);
    }

    if (fields.length === 0) return false;

    values.push(id);
    db.prepare(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`).run(...values);
    return true;
  },

  /**
   * Delete user
   */
  delete(id) {
    const db = getDatabase();
    db.prepare('DELETE FROM users WHERE id = ?').run(id);
  },

  /**
   * Verify password
   */
  verifyPassword(user, password) {
    return bcrypt.compareSync(password, user.password_hash);
  },

  /**
   * Update last login timestamp
   */
  updateLastLogin(id) {
    const db = getDatabase();
    db.prepare(`
      UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?
    `).run(id);
  },

  /**
   * Generate API key
   */
  generateApiKey(id) {
    const db = getDatabase();
    const crypto = require('crypto');
    const apiKey = crypto.randomBytes(32).toString('hex');

    db.prepare('UPDATE users SET api_key = ? WHERE id = ?').run(apiKey, id);
    return apiKey;
  }
};

// ============================================
// Session Functions
// ============================================

const sessions = {
  /**
   * Create a new session
   */
  create(userId, tokenId, expiresAt) {
    const db = getDatabase();
    db.prepare(`
      INSERT INTO sessions (user_id, token_id, expires_at)
      VALUES (?, ?, ?)
    `).run(userId, tokenId, expiresAt);
  },

  /**
   * Check if token is valid (not revoked)
   */
  isValid(tokenId) {
    const db = getDatabase();
    const session = db.prepare(`
      SELECT * FROM sessions
      WHERE token_id = ? AND revoked = 0 AND expires_at > datetime('now')
    `).get(tokenId);
    return !!session;
  },

  /**
   * Revoke a session
   */
  revoke(tokenId) {
    const db = getDatabase();
    db.prepare('UPDATE sessions SET revoked = 1 WHERE token_id = ?').run(tokenId);
  },

  /**
   * Revoke all sessions for a user
   */
  revokeAllForUser(userId) {
    const db = getDatabase();
    db.prepare('UPDATE sessions SET revoked = 1 WHERE user_id = ?').run(userId);
  },

  /**
   * Clean up expired sessions
   */
  cleanup() {
    const db = getDatabase();
    db.prepare(`DELETE FROM sessions WHERE expires_at < datetime('now')`).run();
  }
};

// ============================================
// Logs Functions
// ============================================

const logs = {
  /**
   * Add a log entry
   */
  add(level, message, userId = null, metadata = null) {
    const db = getDatabase();
    db.prepare(`
      INSERT INTO logs (level, message, user_id, metadata)
      VALUES (?, ?, ?, ?)
    `).run(level, message, userId, metadata ? JSON.stringify(metadata) : null);
  },

  /**
   * Get recent logs
   */
  getRecent(limit = 100, level = null) {
    const db = getDatabase();
    let query = 'SELECT * FROM logs';
    const params = [];

    if (level) {
      query += ' WHERE level = ?';
      params.push(level);
    }

    query += ' ORDER BY timestamp DESC LIMIT ?';
    params.push(limit);

    return db.prepare(query).all(...params);
  },

  /**
   * Clear old logs
   */
  clearOld(days = 30) {
    const db = getDatabase();
    db.prepare(`
      DELETE FROM logs WHERE timestamp < datetime('now', '-' || ? || ' days')
    `).run(days);
  }
};

// ============================================
// Settings Functions
// ============================================

const settings = {
  /**
   * Get a setting value
   */
  get(key, defaultValue = null) {
    const db = getDatabase();
    const row = db.prepare('SELECT value FROM settings WHERE key = ?').get(key);
    if (!row) return defaultValue;

    try {
      return JSON.parse(row.value);
    } catch {
      return row.value;
    }
  },

  /**
   * Set a setting value
   */
  set(key, value) {
    const db = getDatabase();
    const valueStr = typeof value === 'string' ? value : JSON.stringify(value);

    db.prepare(`
      INSERT INTO settings (key, value, updated_at)
      VALUES (?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(key) DO UPDATE SET value = ?, updated_at = CURRENT_TIMESTAMP
    `).run(key, valueStr, valueStr);
  },

  /**
   * Get all settings
   */
  getAll() {
    const db = getDatabase();
    const rows = db.prepare('SELECT key, value FROM settings').all();
    const result = {};

    rows.forEach(row => {
      try {
        result[row.key] = JSON.parse(row.value);
      } catch {
        result[row.key] = row.value;
      }
    });

    return result;
  }
};

// ============================================
// Exports
// ============================================

module.exports = {
  getDatabase,
  users,
  sessions,
  logs,
  settings,
  DB_PATH
};
