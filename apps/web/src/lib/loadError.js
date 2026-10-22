import { toast } from 'sonner';

/**
 * `.catch` handler for secondary data a screen can render without: the API error is shown (never hidden)
 * and the screen continues with `fallback`. One toast per `what`, so a refresh does not stack them.
 */
export const reportLoadError = (what, fallback) => (err) => {
  toast.error(`No se pudo cargar ${what}: ${err?.message || 'error desconocido'}`, { id: `load-error:${what}` });
  return fallback;
};
