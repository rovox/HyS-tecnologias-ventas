import { useState, useEffect } from 'react';
import { apiClient, authToken } from '@/api/http.js';

export const useSucursalesList = (onlyActive = true) => {
  const [sucursales, setSucursales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;

    const fetchSucursales = async () => {
      try {
        setLoading(true);
        const records = await apiClient.get('sucursales', { token: authToken() });
        if (isMounted) {
          setSucursales((records || []).filter((s) => !onlyActive || s.activa !== false));
          setError(null);
        }
      } catch (err) {
        console.warn('Advertencia: Error cargando sucursales.', err);
        if (isMounted) {
          setSucursales([]);
          setError(err.message);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchSucursales();
    return () => { isMounted = false; };
  }, [onlyActive]);

  return { sucursales, loading, error };
};
