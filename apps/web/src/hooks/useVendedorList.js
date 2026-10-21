import { useState, useEffect, useCallback } from 'react';
import authService from '@/services/auth/index.js';
import { ROLES } from '@/constants/roles.js';

export const useVendedorList = () => {
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchVendors = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      // The directory (id, name, role) is open to every role, so técnico can open the schedule form too.
      const users = await authService.userDirectory();
      const mapped = users
        .filter((u) => u.role === ROLES.ADMIN || u.role === ROLES.VENTAS)
        .map((u) => ({ id: u.id, name: u.name, role: u.role }));
      setVendors(mapped);
    } catch (err) {
      console.error('Error fetching vendors:', err);
      setVendors([]);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchVendors();
  }, [fetchVendors]);

  return { vendors, loading, error, refresh: fetchVendors };
};
