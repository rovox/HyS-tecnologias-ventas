import { useState, useEffect, useCallback } from 'react';
import pb from '@/lib/pocketbaseClient.js';

export const useVendedorList = () => {
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchVendors = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Load real vendors from Configuración > Vendedores (salesperson_goals)
      const records = await pb.collection('salesperson_goals').getFullList({
        sort: 'salesperson_name',
        $autoCancel: false
      });

      const mappedVendors = records.map(r => ({
        id: r.id,
        name: r.salesperson_name || 'Sin nombre',
        role: 'VENTAS / ADMINISTRACIÓN'
      }));

      setVendors(mappedVendors);
    } catch (err) {
      console.error('Error fetching vendors from salesperson_goals:', err);
      // Fallback to users if salesperson_goals not accessible
      try {
        const users = await pb.collection('users').getFullList({
          sort: 'name',
          filter: "role = 'VENTAS / ADMINISTRACIÓN'",
          $autoCancel: false
        });
        setVendors(users.map(u => ({ id: u.id, name: u.name || u.email, role: u.role })));
      } catch (e2) {
        setVendors([]);
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchVendors();
  }, [fetchVendors]);

  return { vendors, loading, error, refresh: fetchVendors };
};
