import { useCallback, useState } from 'react';
import { toast } from 'sonner';
import { solicitudesWebService } from '@/services/solicitudesWeb/index.js';

/** Errors are shown, never swallowed (no silent fallbacks). */
function errorMessage(err, fallback) {
  if (err?.status === 403) return 'No tienes permiso para ver las solicitudes web.';
  if (err?.status === 0) return 'No se pudo conectar con el servidor. Intenta nuevamente.';
  return err?.message || fallback;
}

export const useSolicitudesWeb = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [rows, setRows] = useState([]);

  const fetchSolicitudes = useCallback(async (filters = {}) => {
    setLoading(true);
    setError(null);
    try {
      setRows(await solicitudesWebService.getAll(filters));
    } catch (err) {
      setError(errorMessage(err, 'Error al cargar las solicitudes web.'));
    } finally {
      setLoading(false);
    }
  }, []);

  const updateSolicitud = useCallback(async (id, data, okMessage) => {
    try {
      const row = await solicitudesWebService.update(id, data);
      setRows((prev) => prev.map((r) => (r.id === id ? row : r)));
      if (okMessage) toast.success(okMessage);
      return row;
    } catch (err) {
      toast.error(errorMessage(err, 'No se pudo actualizar la solicitud.'));
      return null;
    }
  }, []);

  const convertSolicitud = useCallback(async (id) => {
    try {
      const res = await solicitudesWebService.convert(id);
      setRows((prev) => prev.map((r) => (r.id === id ? res.solicitud : r)));
      toast.success(res.created ? 'Cliente creado a partir de la solicitud' : 'Solicitud vinculada a un cliente existente');
      return res;
    } catch (err) {
      toast.error(errorMessage(err, 'No se pudo convertir la solicitud.'));
      return null;
    }
  }, []);

  return { rows, loading, error, fetchSolicitudes, updateSolicitud, convertSolicitud };
};
