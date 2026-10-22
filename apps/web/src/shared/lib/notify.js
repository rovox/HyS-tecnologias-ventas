// Uniform notifications: success after an action, the API message on error. Built on sonner (the only toast system).
import { toast } from 'sonner';

export const notify = {
  success: (message) => toast.success(message),
  info: (message) => toast(message),
  error: (error, fallback = 'No se pudo completar la acción') =>
    toast.error(typeof error === 'string' ? error : error?.message || fallback),
};
