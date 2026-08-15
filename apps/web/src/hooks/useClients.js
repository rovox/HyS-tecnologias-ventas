import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import clientsService from '@/services/clients/index.js';

export const useClients = () => {
  const [loading, setLoading] = useState(false);

  const getClients = useCallback(async () => {
    setLoading(true);
    try {
      return await clientsService.getAll();
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
      return await clientsService.getById(id);
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
      return await clientsService.create(data);
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
      return await clientsService.update(id, data);
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
      await clientsService.delete(id);
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
