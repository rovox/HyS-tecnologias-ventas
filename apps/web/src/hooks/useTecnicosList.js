import { useState, useEffect, useCallback } from 'react';
import authService from '@/services/auth/index.js';
import { ROLES } from '@/constants/roles.js';

export const useTecnicosList = () => {
  const [tecnicos, setTecnicos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchTecnicos = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      // The directory (id, name, role) is open to every role, so técnico can load the schedule too.
      const users = await authService.userDirectory();
      const mapped = users
        .filter((u) => u.role === ROLES.TEC)
        .map((u) => ({ id: u.id, nombre: u.name, user_id: u.id }));
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
