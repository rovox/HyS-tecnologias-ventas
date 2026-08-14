import { useState, useCallback } from 'react';
import pb from '@/lib/pocketbaseClient.js';
import { toast } from 'sonner';

export const useClients = () => {
  const [loading, setLoading] = useState(false);

  const getClients = useCallback(async () => {
    setLoading(true);
    try {
      const clients = await pb.collection('clientes').getFullList({ 
        sort: '-created', 
        $autoCancel: false 
      });
      
      const schedules = await pb.collection('schedules').getFullList({ 
        filter: "cliente_id != ''", 
        $autoCancel: false 
      });

      return clients.map(client => {
        const clientSchedules = schedules.filter(s => s.cliente_id === client.id && s.estado !== 'terminado');
        const monto_total = clientSchedules.reduce((sum, s) => sum + (s.monto || 0), 0);
        const adelanto_total = clientSchedules.reduce((sum, s) => sum + (s.adelanto || 0), 0);
        
        return {
          ...client,
          monto_total,
          adelanto_total,
          saldo_total: monto_total - adelanto_total,
          cantidad_trabajos: clientSchedules.length
        };
      });
    } catch (e) {
      console.error(e);
      toast.error('Error al cargar clientes');
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const getClientById = useCallback(async (id) => {
    setLoading(true);
    try {
      const client = await pb.collection('clientes').getOne(id, { $autoCancel: false });
      const schedules = await pb.collection('schedules').getFullList({ 
        filter: `cliente_id="${id}"`, 
        sort: '-fecha_programada',
        expand: 'vendedor_responsable_id,tecnico_responsable_id',
        $autoCancel: false 
      });
      
      const validSchedules = schedules.filter(s => s.estado !== 'terminado');
      const monto_total = validSchedules.reduce((sum, s) => sum + (s.monto || 0), 0);
      const adelanto_total = validSchedules.reduce((sum, s) => sum + (s.adelanto || 0), 0);

      return {
        ...client,
        monto_total,
        adelanto_total,
        saldo_total: monto_total - adelanto_total,
        schedules
      };
    } catch (e) {
      console.error(e);
      toast.error('Error al cargar detalles del cliente');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const createClient = async (data) => {
    setLoading(true);
    try {
      // Validate duplicate by exact name match
      const existing = await pb.collection('clientes').getList(1, 1, {
        filter: `nombre = "${data.nombre.trim()}"`,
        $autoCancel: false
      });

      if (existing.items.length > 0) {
        throw new Error('Ya existe un cliente registrado con ese nombre.');
      }

      const record = await pb.collection('clientes').create(data, { $autoCancel: false });
      return record;
    } catch (e) {
      console.error(e);
      throw e;
    } finally {
      setLoading(false);
    }
  };

  const updateClient = async (id, data) => {
    setLoading(true);
    try {
      // Validate duplicate by exact name match excluding current
      if (data.nombre) {
        const existing = await pb.collection('clientes').getList(1, 1, {
          filter: `nombre = "${data.nombre.trim()}" && id != "${id}"`,
          $autoCancel: false
        });

        if (existing.items.length > 0) {
          throw new Error('Ya existe otro cliente registrado con ese nombre.');
        }
      }

      const record = await pb.collection('clientes').update(id, data, { $autoCancel: false });
      return record;
    } catch (e) {
      console.error(e);
      throw e;
    } finally {
      setLoading(false);
    }
  };

  const deleteClient = async (id) => {
    setLoading(true);
    try {
      await pb.collection('clientes').delete(id, { $autoCancel: false });
      return true;
    } catch (e) {
      console.error(e);
      throw e;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    getClients,
    getClientById,
    createClient,
    updateClient,
    deleteClient
  };
};