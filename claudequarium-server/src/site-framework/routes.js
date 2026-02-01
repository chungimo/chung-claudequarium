/**
 * Site Framework - API Routes
 * ============================================
 *
 * USAGE:
 *   const frameworkRoutes = require('./site-framework/routes');
 *   app.use('/api', frameworkRoutes);
 *
 * ENDPOINTS:
 *
 * Authentication:
 *   POST /api/auth/login     - Login with username/password
 *   POST /api/auth/logout    - Logout (revoke token)
 *   POST /api/auth/refresh   - Refresh JWT token
 *   GET  /api/auth/me        - Get current user info
 *
 * Users (Admin only):
 *   GET    /api/users        - List all users
 *   POST   /api/users        - Create user
 *   GET    /api/users/:id    - Get user by ID
 *   PUT    /api/users/:id    - Update user
 *   DELETE /api/users/:id    - Delete user
 *   POST   /api/users/:id/api-key - Generate API key
 *
 * Logs (Admin only):
 *   GET    /api/logs         - Get recent logs
 *   DELETE /api/logs         - Clear old logs
 *
 * Settings (Admin only):
 *   GET    /api/settings     - Get all settings
 *   PUT    /api/settings     - Update settings
 */

const express = require('express');
const router = express.Router();
const auth = require('./auth');
const { users, logs, settings } = require('./database');

// ============================================
// Authentication Routes
// ============================================

router.post('/auth/login', auth.login);
router.post('/auth/logout', auth.authenticate, auth.logout);
router.post('/auth/refresh', auth.requireAuth, auth.refreshToken);
router.get('/auth/me', auth.requireAuth, auth.getCurrentUser);

// ============================================
// User Management Routes (Admin only)
// ============================================

/**
 * List all users
 */
router.get('/users', auth.requireAdmin, (req, res) => {
  try {
    const allUsers = users.getAll();
    res.json(allUsers);
  } catch (err) {
    console.error('Error getting users:', err);
    res.status(500).json({ error: 'Failed to get users' });
  }
});

/**
 * Create a new user
 */
router.post('/users', auth.requireAdmin, (req, res) => {
  const { username, password, isAdmin } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password required' });
  }

  if (username.length < 3) {
    return res.status(400).json({ error: 'Username must be at least 3 characters' });
  }

  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' });
  }

  try {
    // Check if username exists
    const existing = users.getByUsername(username);
    if (existing) {
      return res.status(409).json({ error: 'Username already exists' });
    }

    const user = users.create(username, password, isAdmin);
    logs.add('info', `User created: ${username}`, req.user.id);

    res.status(201).json(user);
  } catch (err) {
    console.error('Error creating user:', err);
    res.status(500).json({ error: 'Failed to create user' });
  }
});

/**
 * Get user by ID
 */
router.get('/users/:id', auth.requireAdmin, (req, res) => {
  const user = users.getById(req.params.id);

  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  res.json(user);
});

/**
 * Update user
 */
router.put('/users/:id', auth.requireAdmin, (req, res) => {
  const { username, password, isAdmin } = req.body;
  const userId = parseInt(req.params.id);

  const user = users.getById(userId);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  // Prevent removing last admin
  if (user.is_admin && isAdmin === false) {
    const allUsers = users.getAll();
    const adminCount = allUsers.filter(u => u.is_admin).length;
    if (adminCount <= 1) {
      return res.status(400).json({ error: 'Cannot remove the last admin user' });
    }
  }

  try {
    const updates = {};
    if (username !== undefined) updates.username = username;
    if (password !== undefined) updates.password = password;
    if (isAdmin !== undefined) updates.isAdmin = isAdmin;

    users.update(userId, updates);
    logs.add('info', `User updated: ${user.username}`, req.user.id);

    res.json({ success: true });
  } catch (err) {
    console.error('Error updating user:', err);
    res.status(500).json({ error: 'Failed to update user' });
  }
});

/**
 * Delete user
 */
router.delete('/users/:id', auth.requireAdmin, (req, res) => {
  const userId = parseInt(req.params.id);

  const user = users.getById(userId);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  // Prevent deleting yourself
  if (userId === req.user.id) {
    return res.status(400).json({ error: 'Cannot delete yourself' });
  }

  // Prevent deleting last admin
  if (user.is_admin) {
    const allUsers = users.getAll();
    const adminCount = allUsers.filter(u => u.is_admin).length;
    if (adminCount <= 1) {
      return res.status(400).json({ error: 'Cannot delete the last admin user' });
    }
  }

  try {
    users.delete(userId);
    logs.add('info', `User deleted: ${user.username}`, req.user.id);

    res.json({ success: true });
  } catch (err) {
    console.error('Error deleting user:', err);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

/**
 * Generate API key for user
 */
router.post('/users/:id/api-key', auth.requireAdmin, (req, res) => {
  const userId = parseInt(req.params.id);

  const user = users.getById(userId);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  try {
    const apiKey = users.generateApiKey(userId);
    logs.add('info', `API key generated for user: ${user.username}`, req.user.id);

    res.json({ apiKey });
  } catch (err) {
    console.error('Error generating API key:', err);
    res.status(500).json({ error: 'Failed to generate API key' });
  }
});

// ============================================
// Logs Routes (Admin only)
// ============================================

/**
 * Get recent logs
 */
router.get('/logs', auth.requireAdmin, (req, res) => {
  const limit = parseInt(req.query.limit) || 100;
  const level = req.query.level || null;

  try {
    const entries = logs.getRecent(limit, level);
    res.json(entries);
  } catch (err) {
    console.error('Error getting logs:', err);
    res.status(500).json({ error: 'Failed to get logs' });
  }
});

/**
 * Clear old logs
 */
router.delete('/logs', auth.requireAdmin, (req, res) => {
  const days = parseInt(req.query.days) || 30;

  try {
    logs.clearOld(days);
    logs.add('info', `Cleared logs older than ${days} days`, req.user.id);

    res.json({ success: true });
  } catch (err) {
    console.error('Error clearing logs:', err);
    res.status(500).json({ error: 'Failed to clear logs' });
  }
});

// ============================================
// Settings Routes (Admin only)
// ============================================

/**
 * Get all settings
 */
router.get('/settings', auth.requireAdmin, (req, res) => {
  try {
    const allSettings = settings.getAll();
    res.json(allSettings);
  } catch (err) {
    console.error('Error getting settings:', err);
    res.status(500).json({ error: 'Failed to get settings' });
  }
});

/**
 * Update settings
 */
router.put('/settings', auth.requireAdmin, (req, res) => {
  const updates = req.body;

  try {
    for (const [key, value] of Object.entries(updates)) {
      settings.set(key, value);
    }

    logs.add('info', 'Settings updated', req.user.id);
    res.json({ success: true });
  } catch (err) {
    console.error('Error updating settings:', err);
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

module.exports = router;
