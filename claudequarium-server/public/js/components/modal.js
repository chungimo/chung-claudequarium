// Modal Component - Reusable modal dialog
// Base class for creating glass-style modals

export class Modal {
  constructor(options = {}) {
    this.id = options.id || 'modal';
    this.title = options.title || '';
    this.onClose = options.onClose || (() => {});
    this.element = null;
    this.overlayElement = null;
  }

  create() {
    // Create overlay
    this.overlayElement = document.createElement('div');
    this.overlayElement.className = 'modal-overlay';
    this.overlayElement.addEventListener('click', (e) => {
      if (e.target === this.overlayElement) {
        this.close();
      }
    });

    // Create modal
    this.element = document.createElement('div');
    this.element.className = 'modal glass-panel';
    this.element.id = this.id;
    this.element.innerHTML = this.render();

    this.overlayElement.appendChild(this.element);
    document.body.appendChild(this.overlayElement);

    // Bind events
    this.bindEvents();

    // Trigger open animation
    requestAnimationFrame(() => {
      this.overlayElement.classList.add('open');
      this.element.classList.add('open');
    });

    // Close on escape
    this.escapeHandler = (e) => {
      if (e.key === 'Escape') {
        this.close();
      }
    };
    document.addEventListener('keydown', this.escapeHandler);

    return this.element;
  }

  render() {
    return `
      <div class="modal-header">
        <h2 class="modal-title">${this.title}</h2>
      </div>
      <div class="modal-content">
        ${this.renderContent()}
      </div>
      <div class="modal-footer">
        ${this.renderFooter()}
      </div>
    `;
  }

  renderContent() {
    return '';
  }

  renderFooter() {
    return '';
  }

  bindEvents() {
    // Override in subclass
  }

  close() {
    this.overlayElement.classList.remove('open');
    this.element.classList.remove('open');

    // Wait for animation to complete
    setTimeout(() => {
      document.removeEventListener('keydown', this.escapeHandler);
      this.overlayElement.remove();
      this.onClose();
    }, 250);
  }

  destroy() {
    if (this.overlayElement) {
      document.removeEventListener('keydown', this.escapeHandler);
      this.overlayElement.remove();
      this.element = null;
      this.overlayElement = null;
    }
  }
}

export default Modal;
