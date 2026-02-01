/**
 * Site Framework - Logs Modal
 * ============================================
 *
 * USAGE:
 *   import { LogsModal } from './site-framework/js/logs.js';
 *
 *   const logs = new LogsModal();
 *   logs.open();
 *
 *   // Add log entries
 *   logs.addEntry({ level: 'info', message: 'User logged in' });
 *   logs.addEntry({ level: 'error', message: 'Failed to save' });
 *
 * LOG LEVELS: info, warn, error, success
 */

import { Modal } from './modal.js';

export class LogsModal extends Modal {
  constructor(options = {}) {
    super({
      title: options.title || 'Logs',
      fullscreen: true,
      closable: true,
      ...options
    });

    this.entries = options.entries || [];
    this.maxEntries = options.maxEntries || 1000;
    this.autoScroll = true;
    this.filterLevel = 'all';
  }

  /**
   * Add a log entry
   */
  addEntry(entry) {
    const logEntry = {
      timestamp: entry.timestamp || new Date().toISOString(),
      level: entry.level || 'info',
      message: entry.message || ''
    };

    this.entries.push(logEntry);

    // Trim if over max
    if (this.entries.length > this.maxEntries) {
      this.entries.shift();
    }

    // Update UI if open
    if (this.isOpen) {
      this._appendEntry(logEntry);
    }
  }

  /**
   * Clear all logs
   */
  clear() {
    this.entries = [];
    if (this.isOpen) {
      const terminal = this.element.querySelector('.sf-logs-terminal');
      if (terminal) terminal.innerHTML = '';
    }
  }

  _create() {
    super._create();

    const contentEl = this.element.querySelector('.sf-modal-content');
    contentEl.innerHTML = '';
    contentEl.style.padding = '0';

    const container = document.createElement('div');
    container.className = 'sf-logs-container';
    container.innerHTML = `
      <div class="sf-logs-toolbar">
        <select class="sf-field-input" style="width: auto; padding: 8px 12px;" id="logs-filter">
          <option value="all">All Levels</option>
          <option value="info">Info</option>
          <option value="warn">Warning</option>
          <option value="error">Error</option>
          <option value="success">Success</option>
        </select>
        <label class="sf-checkbox" style="margin-left: auto;">
          <input type="checkbox" class="sf-checkbox-input" id="logs-autoscroll" checked>
          <span class="sf-checkbox-label">Auto-scroll</span>
        </label>
        <button class="sf-btn sf-btn-secondary sf-btn-icon" id="logs-clear" title="Clear logs">
          <i class="sf-icon sf-icon-clear"></i>
        </button>
      </div>
      <div class="sf-logs-terminal" id="logs-terminal">
        ${this.entries.map(e => this._renderEntry(e)).join('')}
      </div>
    `;

    contentEl.appendChild(container);

    // Scroll to bottom
    setTimeout(() => {
      const terminal = container.querySelector('#logs-terminal');
      terminal.scrollTop = terminal.scrollHeight;
    }, 0);
  }

  _bindEvents() {
    // Filter
    const filter = this.element.querySelector('#logs-filter');
    filter.addEventListener('change', () => {
      this.filterLevel = filter.value;
      this._refreshEntries();
    });

    // Auto-scroll toggle
    const autoScroll = this.element.querySelector('#logs-autoscroll');
    autoScroll.addEventListener('change', () => {
      this.autoScroll = autoScroll.checked;
    });

    // Clear button
    const clearBtn = this.element.querySelector('#logs-clear');
    clearBtn.addEventListener('click', () => this.clear());
  }

  _renderEntry(entry) {
    const time = new Date(entry.timestamp).toLocaleTimeString();
    return `
      <div class="sf-log-entry" data-level="${entry.level}">
        <span class="sf-log-timestamp">${time}</span>
        <span class="sf-log-level sf-log-level-${entry.level}">${entry.level}</span>
        <span class="sf-log-message">${this._escapeHtml(entry.message)}</span>
      </div>
    `;
  }

  _appendEntry(entry) {
    if (this.filterLevel !== 'all' && entry.level !== this.filterLevel) {
      return;
    }

    const terminal = this.element.querySelector('.sf-logs-terminal');
    if (!terminal) return;

    const entryEl = document.createElement('div');
    entryEl.innerHTML = this._renderEntry(entry);
    terminal.appendChild(entryEl.firstElementChild);

    if (this.autoScroll) {
      terminal.scrollTop = terminal.scrollHeight;
    }
  }

  _refreshEntries() {
    const terminal = this.element.querySelector('.sf-logs-terminal');
    if (!terminal) return;

    const filtered = this.filterLevel === 'all'
      ? this.entries
      : this.entries.filter(e => e.level === this.filterLevel);

    terminal.innerHTML = filtered.map(e => this._renderEntry(e)).join('');

    if (this.autoScroll) {
      terminal.scrollTop = terminal.scrollHeight;
    }
  }

  _escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }
}

export default LogsModal;
