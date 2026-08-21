import { useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext.jsx';
import { toast } from 'sonner';
import schedulesService, { calculateBalance } from '@/services/schedules/index.js';
import clientsService from '@/services/clients/index.js';
import { isMockMode } from '@/api/http.js';
import pb from '@/lib/pocketbaseClient.js';

export { calculateBalance };

export const useSchedules = () => {
  const [loading, setLoading] = useState(false);
  const { currentUser } = useAuth();

  const getSchedules = useCallback(async () => {
    setLoading(true);
    try {
      return await schedulesService.getAll();
    } catch (err) {
      console.error('Error in getSchedules:', err);
      toast.error(err.message || 'Error al cargar cronogramas.');
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const createClient = async (clientData) => {
    setLoading(true);
    try {
      if (!clientData.nombre || clientData.nombre.trim() === '') {
        throw new Error('El nombre del cliente es requerido');
      }
      return await clientsService.create({
        ...clientData,
        sucursal_id: clientData.sucursal_id || currentUser?.sucursalId || currentUser?.department,
      });
    } catch (err) {
      console.error('Error in createClient:', err);
      throw new Error(err.message || 'Error al crear el cliente');
    } finally {
      setLoading(false);
    }
  };

  const createSchedule = async (data) => {
    setLoading(true);
    try {
      const cliente_id = data instanceof FormData ? data.get('cliente_id') : data.cliente_id;
      if (!cliente_id || String(cliente_id).trim() === '') {
        throw new Error('cliente_id es requerido');
      }
      return await schedulesService.create(data);
    } catch (err) {
      console.error('Error in createSchedule:', err);
      throw new Error(err.message || 'Error al crear el trabajo programado');
    } finally {
      setLoading(false);
    }
  };

  const updateSchedule = async (id, data) => {
    setLoading(true);
    try {
      return await schedulesService.update(id, data);
    } catch (err) {
      console.error('Error in updateSchedule:', err);
      throw new Error(err.message || 'Error al actualizar el trabajo programado');
    } finally {
      setLoading(false);
    }
  };

  const rescheduleWork = async (id, fecha_programada) => {
    setLoading(true);
    try {
      return await schedulesService.update(id, { fecha_programada });
    } catch (err) {
      console.error('Error in rescheduleWork:', err);
      toast.error('Error al reprogramar el trabajo');
      throw new Error(err.message || 'Error al reprogramar el trabajo');
    } finally {
      setLoading(false);
    }
  };

  const getObservations = async (trabajo_id) => {
    try {
      return await schedulesService.getObservations(trabajo_id);
    } catch (err) {
      console.error('Error fetching observations:', err);
      return [];
    }
  };

  const getPaymentHistory = async (trabajo_id) => {
    try {
      if (!isMockMode) return [];
      const result = await pb.collection('schedule_payments').getList(1, 50, {
        filter: `trabajo_id="${trabajo_id}"`,
        sort: '-created',
        expand: 'usuario_id',
        $autoCancel: false,
      });
      return result.items || [];
    } catch (err) {
      console.error('Error fetching payments:', err);
      return [];
    }
  };

  const registerPayment = async (paymentData) => {
    setLoading(true);
    try {
      return await schedulesService.registerPayment(paymentData);
    } catch (err) {
      console.error('Error in registerPayment:', err);
      throw new Error(err.message || 'Error al registrar el pago');
    } finally {
      setLoading(false);
    }
  };

  const updateScheduleStatus = async (id, statusData) => {
    setLoading(true);
    try {
      let estado = statusData.estado;
      if (estado === 'completado') estado = 'terminado';
      if (estado) {
        return await schedulesService.updateStatus(id, estado, statusData);
      }
      return await schedulesService.update(id, statusData);
    } catch (err) {
      console.error('Error updating status:', err);
      toast.error(err.message || 'Error al actualizar el estado del trabajo');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const addObservation = async (trabajo_id, observacion_text, usuario_id, tipo = 'nota') => {
    setLoading(true);
    try {
      return await schedulesService.addObservation(trabajo_id, observacion_text, usuario_id, tipo);
    } catch (err) {
      console.error('Error adding observation:', err);
      toast.error('Error al guardar la observación');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    getSchedules,
    createClient,
    createSchedule,
    updateSchedule,
    rescheduleWork,
    updateScheduleStatus,
    getPaymentHistory,
    registerPayment,
    addObservation,
    getObservations,
  };
};
