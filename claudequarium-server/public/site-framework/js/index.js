/**
 * Site Framework - JavaScript Entry Point
 * ============================================
 *
 * USAGE:
 *   import * as SF from './site-framework/js/index.js';
 *
 *   // Or import specific modules
 *   import { Modal, SettingsModal } from './site-framework/js/index.js';
 *   import { auth } from './site-framework/js/index.js';
 *   import { toast } from './site-framework/js/index.js';
 */

// Modal system
export { Modal, ConfirmModal, getOpenModalCount } from './modal.js';
export { SettingsModal } from './settings.js';
export { LogsModal } from './logs.js';

// Auth
export { auth } from './auth.js';

// Notifications
export { toast } from './toast.js';

// Form utilities
export {
  createField,
  validateField,
  validateForm,
  getFormValues,
  isFormDirty,
  setFieldError,
  clearFieldError,
  getFieldValue,
  setFieldValue
} from './field.js';

// Table component
export { Table } from './table.js';
