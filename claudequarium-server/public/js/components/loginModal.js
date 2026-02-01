// Login Modal Component
// Extends Modal for user authentication

import { Modal } from './modal.js';

export class LoginModal extends Modal {
  constructor(options = {}) {
    super({
      id: 'login-modal',
      title: 'Login',
      ...options
    });
    this.onLogin = options.onLogin || (() => {});
  }

  renderContent() {
    return `
      <div class="form-group">
        <label class="form-label" for="login-username">Username</label>
        <input type="text" id="login-username" class="form-input" placeholder="Enter username" autocomplete="username">
      </div>
      <div class="form-group">
        <label class="form-label" for="login-password">Password</label>
        <input type="password" id="login-password" class="form-input" placeholder="Enter password" autocomplete="current-password">
      </div>
    `;
  }

  renderFooter() {
    return `
      <button class="btn btn-primary" id="login-submit">Login</button>
      <button class="btn btn-secondary" id="login-cancel">Cancel</button>
    `;
  }

  bindEvents() {
    const submitBtn = this.element.querySelector('#login-submit');
    const cancelBtn = this.element.querySelector('#login-cancel');
    const usernameInput = this.element.querySelector('#login-username');
    const passwordInput = this.element.querySelector('#login-password');

    submitBtn.addEventListener('click', () => this.handleLogin());
    cancelBtn.addEventListener('click', () => this.close());

    // Submit on Enter key
    const handleEnter = (e) => {
      if (e.key === 'Enter') {
        this.handleLogin();
      }
    };
    usernameInput.addEventListener('keydown', handleEnter);
    passwordInput.addEventListener('keydown', handleEnter);

    // Focus username input
    setTimeout(() => usernameInput.focus(), 100);
  }

  handleLogin() {
    const username = this.element.querySelector('#login-username').value.trim();
    const password = this.element.querySelector('#login-password').value;

    if (!username || !password) {
      this.showError('Please enter both username and password');
      return;
    }

    this.onLogin(username, password);
  }

  showError(message) {
    let errorEl = this.element.querySelector('.form-error');
    if (!errorEl) {
      errorEl = document.createElement('div');
      errorEl.className = 'form-error';
      const content = this.element.querySelector('.modal-content');
      content.insertBefore(errorEl, content.firstChild);
    }
    errorEl.textContent = message;
  }
}

export default LoginModal;
