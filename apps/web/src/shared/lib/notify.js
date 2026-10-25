// Uniform notifications: success after an action, the API message on error. Built on sonner (the only toast system).
import { toast } from 'sonner';

export const notify = {
  /** `action: { label, onClick }` offers the next step right after the action ("Ver proyecto", "Registrar otro"). */
  success: (message, { action, description } = {}) => toast.success(message, { description, action, duration: action ? 7000 : undefined }),
  info: (message) => toast(message),
  error: (error, fallback = 'No se pudo completar la acción') =>
    toast.error(typeof error === 'string' ? error : error?.message || fallback),
};
