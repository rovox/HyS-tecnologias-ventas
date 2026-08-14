import { useState, useEffect } from 'react';
import pb from '@/lib/pocketbaseClient.js';

export const useSucursalesList = (onlyActive = true) => {
  const [sucursales, setSucursales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;

    const fetchSucursales = async () => {
      try {
        setLoading(true);
        const records = await pb.collection('sucursales').getFullList({
          sort: 'nombre',
          filter: onlyActive ? 'activa = true' : '',
          $autoCancel: false
        });
        
        if (isMounted) {
          setSucursales(records);
          setError(null);
        }
      } catch (err) {
        console.warn('Advertencia: Error cargando colección sucursales.', err);
        if (isMounted) {
          // Retornamos array vacío para evitar caídas
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