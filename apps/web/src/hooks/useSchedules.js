import { useState, useCallback } from 'react';
import pb from '@/lib/pocketbaseClient.js';
import { useAuth } from '@/contexts/AuthContext.jsx';
import { toast } from 'sonner';

export const calculateBalance = (trabajo) => {
  const costo_total = parseFloat(trabajo.monto || trabajo.costo_total || 0);
  const adicionales = parseFloat(trabajo.adicionales || 0);
  const adelanto_recibido = parseFloat(trabajo.adelanto || trabajo.adelanto_recibido || 0);
  const cobros_realizados = parseFloat(trabajo.cobros_realizados || trabajo.cobros_registrados || 0);
  
  const saldo = costo_total + adicionales - adelanto_recibido - cobros_realizados;
  const estado_pago = saldo <= 0 ? 'Pagado' : 'Pendiente';
  
  return { saldo, estado_pago };
};

export const useSchedules = () => {
  const [loading, setLoading] = useState(false);
  const { currentUser } = useAuth();

  const getSchedules = useCallback(async () => {
    setLoading(true);
    try {
      const result = await pb.collection('schedules').getList(1, 500, {
        sort: '-fecha_programada',
        expand: 'vendedor_responsable_id,tecnico_responsable_id',
        $autoCancel: false
      });

      const records = result.items || [];
      const clients = await pb.collection('clientes').getFullList({ $autoCancel: false });
      const clientsMap = {};
      clients.forEach(c => { clientsMap[c.id] = c; });

      const normalizedRecords = records.map(record => {
        const { saldo, estado_pago } = calculateBalance(record);
        record.saldo = saldo;
        record.estado_pago = estado_pago;

        const clientData = clientsMap[record.cliente_id] || null;
        const fallbackLocation = clientData?.direccion?.trim() ? clientData.direccion : 'Sin ubicación';
        const finalLugar = record.lugar?.trim() ? record.lugar : fallbackLocation;
        
        const dateStr = record.fecha_programada ? record.fecha_programada.split(' ')[0] : '';
          
        return {
          ...record,
          id: record.id,
          cliente_id: record.cliente_id,
          cliente_nombre: clientData?.nombre || record.cliente || 'Sin cliente',
          tipo_trabajo: record.type,
          lugar: finalLugar,
          fecha_programada: dateStr,
          vendedor_id: record.vendedor_responsable_id,
          tecnico_id: record.tecnico_responsable_id,
          estado: record.estado,
          estado_pago: estado_pago,
          costo_total: record.monto || 0,
          adelanto: record.adelanto || 0,
          saldo: saldo,
          clientData
        };
      });

      return normalizedRecords;
    } catch (err) {
      console.error('Error in getSchedules:', err);
      toast.error('Error al cargar cronogramas.');
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const createClient = async (clientData) => {
    setLoading(true);
    try {
      if (!clientData.nombre || clientData.nombre.trim() === '') {
        throw new Error("El nombre del cliente es requerido");
      }

      const record = await pb.collection('clientes').create({
        ...clientData,
        created_by: currentUser?.id || ''
      }, { $autoCancel: false });
      
      if (!record) throw new Error("Error al crear cliente: No se recibió respuesta");
      
      return record;
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

      if (!cliente_id || cliente_id.trim() === '') {
        throw new Error('cliente_id es requerido');
      }

      const record = await pb.collection('schedules').create(data, { $autoCancel: false });
      return record;
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
      if (data instanceof FormData) {
        data.set('updated_by', currentUser?.id || '');
      } else {
        data.updated_by = currentUser?.id || '';
      }

      const record = await pb.collection('schedules').update(id, data, { $autoCancel: false });
      return record;
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
      const currentRecord = await pb.collection('schedules').getOne(id, { $autoCancel: false });
      const existingClienteId = currentRecord.cliente_id;

      const record = await pb.collection('schedules').update(id, {
        fecha_programada,
        cliente_id: existingClienteId,
        updated_by: currentUser?.id || ''
      }, { $autoCancel: false });
      
      return record;
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
      const result = await pb.collection('schedule_observations').getList(1, 50, {
        filter: `trabajo_id="${trabajo_id}"`,
        sort: '-created',
        expand: 'usuario_id',
        $autoCancel: false
      });
      return result.items || [];
    } catch (err) {
      console.error('Error fetching observations:', err);
      return [];
    }
  };

  const getPaymentHistory = async (trabajo_id) => {
    try {
      const result = await pb.collection('schedule_payments').getList(1, 50, {
        filter: `trabajo_id="${trabajo_id}"`,
        sort: '-created',
        expand: 'usuario_id',
        $autoCancel: false
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
      const record = await pb.collection('schedule_payments').create(paymentData, { $autoCancel: false });
      return record;
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
      const currentRecord = await pb.collection('schedules').getOne(id, { $autoCancel: false });
      
      const payload = {
        ...statusData,
        updated_by: currentUser?.id || ''
      };
      
      const record = await pb.collection('schedules').update(id, payload, { $autoCancel: false });
      return record;
    } catch (err) {
      console.error('Error updating status:', err);
      toast.error('Error al actualizar el estado del trabajo');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const addObservation = async (trabajo_id, observacion_text, usuario_id, tipo = 'nota') => {
    setLoading(true);
    try {
      const record = await pb.collection('schedule_observations').create({
        trabajo_id,
        usuario_id,
        observacion: observacion_text,
        tipo,
        created_by: usuario_id
      }, { $autoCancel: false });
      return record;
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
    getObservations
  };
};