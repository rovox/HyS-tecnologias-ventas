// Uniform notifications: success after an action, the API message on error. Built on sonner (the only toast system),
// loaded with the toaster after the first paint (GATE-01): a notification waits until both are ready.
import { toasterReady } from './toasterReady.js';

let sonner;
const show = (fn) => {
  sonner ??= Promise.all([import('sonner'), toasterReady]).then(([m]) => m.toast);
  sonner.then(fn);
};

export const notify = {
  /** `action: { label, onClick }` offers the next step right after the action ("Ver proyecto", "Registrar otro"). */
  success: (message, { action, description } = {}) => show((toast) => toast.success(message, { description, action, duration: action ? 7000 : undefined })),
  info: (message) => show((toast) => toast(message)),
  error: (error, fallback = 'No se pudo completar la acción') =>
    show((toast) => toast.error(typeof error === 'string' ? error : error?.message || fallback)),
};
