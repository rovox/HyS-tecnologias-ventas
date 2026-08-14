import { useState, useEffect, useCallback } from 'react';
import pb from '@/lib/pocketbaseClient.js';

export const useTecnicosList = () => {
  const [tecnicos, setTecnicos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchTecnicos = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const records = await pb.collection('tecnicos').getFullList({
        sort: 'nombre',
        $autoCancel: false
      });
      
      setTecnicos(records);
    } catch (err) {
      console.error('Error fetching tecnicos:', err);
      setTecnicos([]);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTecnicos();
  }, [fetchTecnicos]);

  return { tecnicos, loading, error, refresh: fetchTecnicos };
};