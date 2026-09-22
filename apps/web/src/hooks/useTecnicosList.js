import { useState, useEffect, useCallback } from 'react';
import { apiClient, authToken } from '@/api/http.js';
import { ROLES } from '@/constants/roles.js';

export const useTecnicosList = () => {
  const [tecnicos, setTecnicos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchTecnicos = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const users = await apiClient.get('users', { token: authToken() });
      const mapped = (users || [])
        .filter((u) => u.role === ROLES.TEC)
        .map((u) => ({
          id: u.id,
          nombre: u.name || u.email,
          user_id: u.id,
          sucursal_id: u.sucursalId || '',
        }));
      setTecnicos(mapped);
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
