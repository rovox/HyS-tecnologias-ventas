import { useState, useEffect } from 'react';
import pb from '@/lib/pocketbaseClient.js';
import { apiClient, authToken, isMockMode } from '@/api/http.js';

export const useSucursalesList = (onlyActive = true) => {
  const [sucursales, setSucursales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;

    const fetchSucursales = async () => {
      try {
        setLoading(true);
        let records;
        if (!isMockMode) {
          records = await apiClient.get('sucursales', { token: authToken() });
        } else {
          records = await pb.collection('sucursales').getFullList({
            sort: 'nombre',
            filter: onlyActive ? 'activa = true' : '',
            $autoCancel: false,
          });
        }

        if (isMounted) {
          setSucursales(records || []);
          setError(null);
        }
      } catch (err) {
        console.warn('Advertencia: Error cargando sucursales.', err);
        if (isMounted) {
          setSucursales([]);
          setError(err.message);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchSucursales();

    return () => {
      isMounted = false;
    };
  }, [onlyActive]);

  return { sucursales, loading, error };
};
