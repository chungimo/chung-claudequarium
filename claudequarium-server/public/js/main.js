// Main Entry Point
// Initializes all game modules and starts the game loop

import { entities } from './state.js';
import { updateEntity } from './entities.js';
import { connectWebSocket } from './network.js';
import { initRenderer, render } from './renderer.js';
import { initUI } from './ui.js';
import { loadMapData, isMapLoaded } from './mapData.js';
import { Menu } from './components/menu.js';

// Debug module
import {
  DEBUG,
  toggleDebug,
  isDebugEnabled,
  setDebugMode,
  initDebugMode,
  saveDebugMode,
  setupDebugControls,
  setupDebugKeyboardShortcuts
} from './debug/index.js';
import { LoginModal } from './components/loginModal.js';

// Site Framework imports
import { auth } from '../site-framework/js/auth.js';
import { toast } from '../site-framework/js/toast.js';
import { SettingsModal } from '../site-framework/js/settings.js';
import { LogsModal } from '../site-framework/js/logs.js';
import { Table } from '../site-framework/js/table.js';

// ============================================
// Game State
// ============================================

let lastFrameTime = 0;
let isInitialized = false;
let mainMenu = null;
let logsModal = null;

// ============================================
// Initialization
// ============================================

async function init() {
  console.log('Initializing Claudequarium...');

  // Initialize renderer first so we can show loading state
  initRenderer();
  initUI();

  // Check existing auth state
  const isLoggedIn = auth.isLoggedIn();

  // Initialize menu
  mainMenu = new Menu({
    containerId: 'menu-container',
    isLoggedIn: isLoggedIn,
    onItemClick: handleMenuItemClick
  });
  mainMenu.create();

  // Listen for auth changes
  auth.setOnAuthChange((loggedIn, user) => {
    mainMenu.setLoggedIn(loggedIn);
    updateUserDisplay(loggedIn, user);
    if (loggedIn) {
      toast.success(`Welcome, ${user.username}!`, 'Logged In');
    }
  });

  // Set initial user display
  if (isLoggedIn) {
    const user = auth.getUser();
    updateUserDisplay(true, user);
  }

  // Start game loop immediately to show loading screen
  lastFrameTime = performance.now();
  requestAnimationFrame(gameLoop);

  try {
    // Load map data (required for gameplay)
    console.log('Loading map data...');
    await loadMapData();
    console.log('Map data loaded successfully');

    // Setup debug module
    initDebugMode();
    setupDebugControls();
    setupDebugKeyboardShortcuts();

    // Connect to server
    connectWebSocket();

    // Mark as initialized
    isInitialized = true;
    console.log('Game initialized successfully');

  } catch (error) {
    console.error('Failed to initialize game:', error);
    showError('Failed to load game resources. Please refresh the page.');
  }
}

// ============================================
// User Display
// ============================================

function updateUserDisplay(loggedIn, user) {
  const userDisplay = document.getElementById('user-display');
  if (!userDisplay) return;

  if (loggedIn && user) {
    userDisplay.textContent = user.username;
    userDisplay.classList.remove('hidden');
  } else {
    userDisplay.textContent = '';
    userDisplay.classList.add('hidden');
  }
}

// ============================================
// Menu Handlers
// ============================================

function handleMenuItemClick(itemId, _event) {
  console.log(`Menu item clicked: ${itemId}`);

  switch (itemId) {
    case 'account':
      if (auth.isLoggedIn()) {
        // Show account info - go to users section
        showSettingsModal('users');
      } else {
        showLoginModal();
      }
      break;
    case 'logs':
      showLogsModal();
      break;
    case 'settings':
      showSettingsModal();
      break;
    case 'logout':
      handleLogout();
      break;
  }
}

function showLoginModal() {
  const modal = new LoginModal({
    onLoginSuccess: (user) => {
      console.log('Login successful:', user.username);
    },
    onClose: () => {
      console.log('Login modal closed');
    }
  });
  modal.open();
}

async function handleLogout() {
  // Show logout toast with countdown
  toast.logout(() => {
    auth.logout();
    window.location.reload();
  }, 3000);
}

// ============================================
// Settings Modal
// ============================================

function showSettingsModal(defaultSection = 'site') {
  const settingsModal = new SettingsModal({
    title: 'Settings',
    defaultSection: defaultSection,
    sections: [
      {
        id: 'site',
        label: 'Site Settings',
        icon: '<i class="sf-icon sf-icon-settings"></i>',
        content: renderSiteSettings
      },
      {
        id: 'users',
        label: 'User Accounts',
        icon: '<i class="sf-icon sf-icon-users"></i>',
        content: () => renderUserAccounts(settingsModal)
      },
      {
        id: 'integrations',
        label: 'Integrations',
        icon: '<i class="sf-icon sf-icon-link"></i>',
        content: renderIntegrations
      }
    ]
  });
  settingsModal.open();
}

function renderSiteSettings() {
  const container = document.createElement('div');

  // Get current debug mode state
  const debugEnabled = isDebugEnabled();

  container.innerHTML = `
    <p style="color: var(--sf-text-muted); margin-bottom: 24px;">
      Configure site-specific settings for Claudequarium.
    </p>

    <div class="sf-field">
      <input type="text" id="setting-site-name" class="sf-field-input" placeholder=" " value="Claudequarium">
      <label class="sf-field-label" for="setting-site-name">Site Name</label>
    </div>

    <div style="margin-top: 24px; padding-top: 24px; border-top: 1px solid var(--sf-border-light);">
      <h4 style="color: var(--sf-text-primary); margin-bottom: 16px; font-size: 16px;">Developer Options</h4>

      <label class="sf-checkbox">
        <input type="checkbox" class="sf-checkbox-input" id="setting-debug-mode" ${debugEnabled ? 'checked' : ''}>
        <span class="sf-checkbox-label">Enable Debug Mode</span>
      </label>
      <p style="color: var(--sf-text-muted); font-size: 12px; margin-top: 8px; margin-left: 26px;">
        Shows debug controls panel for spawning entities, changing states, and toggling overlays.
      </p>
    </div>

    <div style="margin-top: 32px; padding-top: 16px; border-top: 1px solid var(--sf-border-light); display: flex; justify-content: flex-end;">
      <button class="sf-btn sf-btn-primary" id="btn-apply-settings">Apply Settings</button>
    </div>
  `;

  // Setup event listener for Apply Settings after render
  setTimeout(() => {
    const applyBtn = container.querySelector('#btn-apply-settings');
    if (applyBtn) {
      applyBtn.addEventListener('click', () => {
        // Get debug mode checkbox value
        const debugCheckbox = container.querySelector('#setting-debug-mode');
        const newDebugMode = debugCheckbox?.checked || false;

        // Apply debug mode
        setDebugMode(newDebugMode);
        saveDebugMode();

        // Show confirmation toast
        toast.success('Settings applied successfully!', 'Settings');
      });
    }
  }, 0);

  return container;
}

function renderUserAccounts(settingsModal) {
  const container = document.createElement('div');

  // Check if admin
  if (!auth.isAdmin()) {
    container.innerHTML = `
      <p style="color: var(--sf-text-muted);">
        You need admin privileges to manage user accounts.
      </p>
    `;
    return container;
  }

  container.innerHTML = `
    <div style="display: flex; justify-content: flex-end; margin-bottom: 16px;">
      <button class="sf-btn sf-btn-primary" id="btn-add-user">+ Add User</button>
    </div>
    <div id="users-table"></div>
  `;

  // Load users after render
  setTimeout(async () => {
    await loadUsersTable(container.querySelector('#users-table'), settingsModal);

    // Add user button
    container.querySelector('#btn-add-user').addEventListener('click', () => {
      showAddUserModal(() => {
        settingsModal.refreshSection('users');
      });
    });
  }, 0);

  return container;
}

async function loadUsersTable(tableContainer, settingsModal) {
  try {
    const response = await auth.fetch('/api/users');
    if (!response.ok) throw new Error('Failed to load users');
    const users = await response.json();

    const table = new Table({
      container: tableContainer,
      columns: [
        { id: 'username', label: 'Username', sortable: true },
        { id: 'last_login', label: 'Last Login', sortable: true, type: 'date',
          render: (row) => row.last_login ? new Date(row.last_login).toLocaleString() : 'Never'
        },
        { id: 'is_admin', label: 'Role', sortable: true,
          render: (row) => row.is_admin ? '<span style="color: var(--sf-primary);">Admin</span>' : 'User'
        },
        { id: 'actions', label: '',
          render: (row) => `
            <div class="sf-table-actions">
              <button class="sf-btn sf-btn-secondary sf-btn-icon" data-action="edit" data-id="${row.id}" title="Edit"><i class="sf-icon sf-icon-edit"></i></button>
              <button class="sf-btn sf-btn-danger sf-btn-icon" data-action="delete" data-id="${row.id}" title="Delete"><i class="sf-icon sf-icon-delete"></i></button>
            </div>
          `
        }
      ],
      data: users,
      defaultSort: 'username',
      onRowClick: (row) => {
        showEditUserModal(row, () => settingsModal.refreshSection('users'));
      }
    });

    // Handle action buttons
    tableContainer.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-action]');
      if (!btn) return;

      const action = btn.dataset.action;
      const userId = parseInt(btn.dataset.id);
      const user = users.find(u => u.id === userId);

      if (action === 'edit') {
        showEditUserModal(user, () => settingsModal.refreshSection('users'));
      } else if (action === 'delete') {
        showDeleteUserConfirm(user, () => settingsModal.refreshSection('users'));
      }
    });
  } catch (err) {
    console.error('Error loading users:', err);
    tableContainer.innerHTML = '<p style="color: var(--sf-danger);">Failed to load users</p>';
  }
}

function showAddUserModal(onSuccess) {
  const { Modal } = window.SF || {};
  // Import dynamically to avoid circular deps
  import('../site-framework/js/modal.js').then(({ Modal }) => {
    const modal = new Modal({
      title: 'Add User',
      content: `
        <form autocomplete="off" onsubmit="return false;">
          <div class="sf-field sf-field-required">
            <input type="text" id="new-username" class="sf-field-input" placeholder=" " autocomplete="new-username" name="new-user-name">
            <label class="sf-field-label" for="new-username">Username</label>
          </div>
          <div class="sf-field sf-field-required">
            <input type="password" id="new-password" class="sf-field-input" placeholder=" " autocomplete="new-password" name="new-user-pass">
            <label class="sf-field-label" for="new-password">Password</label>
            <span class="sf-field-hint">Minimum 6 characters</span>
          </div>
          <label class="sf-checkbox" style="margin-top: 16px;">
            <input type="checkbox" class="sf-checkbox-input" id="new-is-admin">
            <span class="sf-checkbox-label">Administrator</span>
          </label>
        </form>
      `,
      footer: `
        <button class="sf-btn sf-btn-primary" id="btn-create-user">Create User</button>
        <button class="sf-btn sf-btn-secondary" id="btn-cancel">Cancel</button>
      `,
      onClose: () => {}
    });

    modal.open();

    modal.element.querySelector('#btn-cancel').addEventListener('click', () => modal.close());
    modal.element.querySelector('#btn-create-user').addEventListener('click', async () => {
      const username = modal.element.querySelector('#new-username').value.trim();
      const password = modal.element.querySelector('#new-password').value;
      const isAdmin = modal.element.querySelector('#new-is-admin').checked;

      if (!username || !password) {
        modal.showError('Please fill in all required fields');
        return;
      }

      if (password.length < 6) {
        modal.showError('Password must be at least 6 characters');
        return;
      }

      try {
        const response = await auth.fetch('/api/users', {
          method: 'POST',
          body: JSON.stringify({ username, password, isAdmin })
        });

        if (!response.ok) {
          const data = await response.json();
          modal.showError(data.error || 'Failed to create user');
          return;
        }

        toast.success(`User "${username}" created successfully`);
        modal.close();
        if (onSuccess) onSuccess();
      } catch (err) {
        modal.showError('Network error');
      }
    });
  });
}

function showEditUserModal(user, onSuccess) {
  import('../site-framework/js/modal.js').then(({ Modal }) => {
    const modal = new Modal({
      title: `Edit User: ${user.username}`,
      content: `
        <form autocomplete="off" onsubmit="return false;">
          <div class="sf-field sf-field-required">
            <input type="text" id="edit-username" class="sf-field-input" placeholder=" " value="${user.username}" autocomplete="edit-username" name="edit-user-name">
            <label class="sf-field-label" for="edit-username">Username</label>
          </div>
          <div class="sf-field">
            <input type="password" id="edit-password" class="sf-field-input" placeholder=" " autocomplete="new-password" name="edit-user-pass">
            <label class="sf-field-label" for="edit-password">New Password</label>
            <span class="sf-field-hint">Leave blank to keep current password</span>
          </div>
          <label class="sf-checkbox" style="margin-top: 16px;">
            <input type="checkbox" class="sf-checkbox-input" id="edit-is-admin" ${user.is_admin ? 'checked' : ''}>
            <span class="sf-checkbox-label">Administrator</span>
          </label>
        </form>
      `,
      footer: `
        <button class="sf-btn sf-btn-primary" id="btn-save-user">Save Changes</button>
        <button class="sf-btn sf-btn-secondary" id="btn-cancel">Cancel</button>
      `
    });

    modal.open();

    modal.element.querySelector('#btn-cancel').addEventListener('click', () => modal.close());
    modal.element.querySelector('#btn-save-user').addEventListener('click', async () => {
      const username = modal.element.querySelector('#edit-username').value.trim();
      const password = modal.element.querySelector('#edit-password').value;
      const isAdmin = modal.element.querySelector('#edit-is-admin').checked;

      if (!username) {
        modal.showError('Username is required');
        return;
      }

      const updates = { username, isAdmin };
      if (password) {
        if (password.length < 6) {
          modal.showError('Password must be at least 6 characters');
          return;
        }
        updates.password = password;
      }

      try {
        const response = await auth.fetch(`/api/users/${user.id}`, {
          method: 'PUT',
          body: JSON.stringify(updates)
        });

        if (!response.ok) {
          const data = await response.json();
          modal.showError(data.error || 'Failed to update user');
          return;
        }

        toast.success('User updated successfully');
        modal.close();
        if (onSuccess) onSuccess();
      } catch (err) {
        modal.showError('Network error');
      }
    });
  });
}

function showDeleteUserConfirm(user, onSuccess) {
  import('../site-framework/js/modal.js').then(({ ConfirmModal }) => {
    const modal = new ConfirmModal({
      title: 'Delete User',
      message: `Are you sure you want to delete user "${user.username}"? This action cannot be undone.`,
      confirmText: 'Delete',
      confirmStyle: 'danger',
      onConfirm: async () => {
        try {
          const response = await auth.fetch(`/api/users/${user.id}`, {
            method: 'DELETE'
          });

          if (!response.ok) {
            const data = await response.json();
            toast.error(data.error || 'Failed to delete user');
            modal.close();
            return;
          }

          toast.success(`User "${user.username}" deleted`);
          modal.close();
          if (onSuccess) onSuccess();
        } catch (err) {
          toast.error('Network error');
          modal.close();
        }
      }
    });
    modal.open();
  });
}

function renderIntegrations() {
  return `
    <div style="color: var(--sf-text-muted);">
      <h4 style="color: var(--sf-text-primary); margin-bottom: 16px;">Notifications</h4>
      <p style="margin-bottom: 24px;">
        Configure notification channels (Discord, Slack, Teams, Email) for various events.
        This section will be customized per project.
      </p>

      <h4 style="color: var(--sf-text-primary); margin-bottom: 16px;">Webhooks</h4>
      <p>
        Configure outgoing webhooks to integrate with external services.
        Webhook triggers are project-specific.
      </p>
    </div>
  `;
}

// ============================================
// Logs Modal
// ============================================

function showLogsModal() {
  // Check if admin
  if (!auth.isLoggedIn()) {
    toast.warning('Please log in to view logs');
    return;
  }

  if (!auth.isAdmin()) {
    toast.warning('Admin access required to view logs');
    return;
  }

  logsModal = new LogsModal({
    title: 'System Logs'
  });

  // Load existing logs
  loadLogs();

  logsModal.open();
}

async function loadLogs() {
  if (!logsModal) return;

  try {
    const response = await auth.fetch('/api/logs?limit=200');
    if (!response.ok) throw new Error('Failed to load logs');
    const logs = await response.json();

    // Add logs in reverse order (oldest first)
    logs.reverse().forEach(log => {
      logsModal.addEntry({
        timestamp: log.timestamp,
        level: log.level,
        message: log.message
      });
    });
  } catch (err) {
    console.error('Error loading logs:', err);
  }
}

// ============================================
// Game Loop
// ============================================

function gameLoop(currentTime) {
  const deltaTime = (currentTime - lastFrameTime) / 1000;
  lastFrameTime = currentTime;

  // Cap delta time to prevent huge jumps
  const cappedDelta = Math.min(deltaTime, 0.1);

  update(cappedDelta);
  render();

  requestAnimationFrame(gameLoop);
}

function update(deltaTime) {
  if (!isInitialized || !isMapLoaded()) return;

  entities.forEach(entity => {
    updateEntity(entity, deltaTime);
  });
}

// ============================================
// Error Handling
// ============================================

function showError(message) {
  const container = document.getElementById('game-container');
  if (container) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.textContent = message;
    container.appendChild(errorDiv);
  }
}

// ============================================
// Start
// ============================================

// Start when DOM is ready
window.addEventListener('load', init);

// Export for debugging
window.gameDebug = {
  toggleDebug,
  DEBUG,
  isDebugEnabled,
  setDebugMode,
  getEntities: () => Array.from(entities.values()),
  getMenu: () => mainMenu,
  auth
};
