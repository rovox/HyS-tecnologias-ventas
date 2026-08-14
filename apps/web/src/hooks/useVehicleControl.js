import { useState, useCallback } from 'react';
import pb from '@/lib/pocketbaseClient.js';
import { useAuth } from '@/contexts/AuthContext.jsx';
import { toast } from 'sonner';

export const useVehicleControl = () => {
  const { currentUser, isAdmin } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const isTech = currentUser?.role === 'SEGURIDAD ELECTRÓNICA';

  const handleError = (err, defaultMsg) => {
    console.error(err);
    const msg = err.response?.message || defaultMsg;
    setError(msg);
    toast.error(msg);
    return { success: false, error: msg };
  };

  const logActivity = async (vehiculoId, accion, descripcion, detalles = {}) => {
    try {
      await pb.collection('historial_actividad_vehiculos').create({
        entidad_tipo: 'vehiculo',
        entidad_id: vehiculoId,
        usuario_id: currentUser.id,
        accion,
        descripcion,
        campo_modificado: detalles.campo || '',
        valor_anterior: detalles.anterior || '',
        valor_nuevo: detalles.nuevo || '',
        created_by: currentUser.name
      }, { $autoCancel: false });
    } catch (err) {
      console.error('Failed to log activity', err);
    }
  };

  const getVehicles = useCallback(async (filters = {}) => {
    setLoading(true);
    try {
      let filterString = '';
      const filterParts = [];
      
      if (filters.estado && filters.estado !== 'todos') filterParts.push(`estado = "${filters.estado}"`);
      if (filters.sucursal && filters.sucursal !== 'todas') filterParts.push(`sucursal_id = "${filters.sucursal}"`);
      if (filters.search) filterParts.push(`(patente ~ "${filters.search}" || marca ~ "${filters.search}" || modelo ~ "${filters.search}")`);
      
      if (filterParts.length > 0) filterString = filterParts.join(' && ');

      const records = await pb.collection('vehiculos').getFullList({
        filter: filterString,
        sort: '-created',
        $autoCancel: false
      });
      return { success: true, data: records };
    } catch (err) {
      return handleError(err, 'Error al cargar vehículos');
    } finally {
      setLoading(false);
    }
  }, []);

  const getVehicleDetail = useCallback(async (id) => {
    setLoading(true);
    try {
      const record = await pb.collection('vehiculos').getOne(id, { $autoCancel: false });
      return { success: true, data: record };
    } catch (err) {
      return handleError(err, 'Error al cargar detalles del vehículo');
    } finally {
      setLoading(false);
    }
  }, []);

  const getRelatedData = useCallback(async (vehiculoId, collectionName, sort = '-fecha') => {
    const linkField = collectionName === 'historial_actividad_vehiculos' ? 'entidad_id' : 'vehiculo_id';
    try {
      const records = await pb.collection(collectionName).getFullList({
        filter: `${linkField} = "${vehiculoId}"`,
        sort: sort,
        $autoCancel: false
      });
      return { success: true, data: records };
    } catch (err) {
      try {
        const all = await pb.collection(collectionName).getFullList({ $autoCancel: false });
        const filtered = all.filter((r) => r[linkField] === vehiculoId || r.vehiculo_id === vehiculoId || r.entidad_id === vehiculoId);
        return { success: true, data: filtered };
      } catch (err2) {
        console.error(`Error loading ${collectionName}`, err2);
        return { success: false, data: [] };
      }
    }
  }, []);

  const getAuthUserId = () => pb.authStore.record?.id || pb.authStore.model?.id || currentUser?.id || '';
  const getAuthUserName = () => pb.authStore.record?.name || pb.authStore.model?.name || currentUser?.name || '';

  const registerVehicleExpense = async ({ vehiculoId, patente, concepto, monto, fecha, pagadoPor, sucursal, observacion, idOrigen, comprobante }) => {
    const amount = Number(monto) || 0;
    if (!amount) return;
    const userId = getAuthUserId();
    const userName = getAuthUserName();

    if (!userId) {
      console.error('registerVehicleExpense: no auth user id, skipping gasto creation');
      return;
    }

    // Deduplicate: skip if record with same origen+id_origen already exists
    if (idOrigen) {
      try {
        const existing = await pb.collection('gastos_operativos').getFirstListItem(
          `origen = "Control Vehicular" && id_origen = "${idOrigen}"`,
          { $autoCancel: false }
        );
        if (existing) return; // already registered
      } catch (dedupErr) {
        // If 400 (field missing) or 404 (not found) → proceed to create
        if (dedupErr?.status === 404 || dedupErr?.status === 0) {
          // not found, safe to proceed
        } else if (dedupErr?.status === 400) {
          // fields not available yet — skip dedup, proceed anyway
        }
        // any error: just proceed
      }
    }

    try {
      const data = {
        persona_id: userId,
        persona_nombre: userName,
        monto: amount,
        concepto: `${concepto} — Vehículo ${patente || ''}`.trim(),
        sucursal: sucursal || '',
        fecha: fecha ? fecha.split('T')[0] : new Date().toISOString().split('T')[0],
        estado: 'Pendiente',
        observacion: observacion || 'Pendiente de devolución al técnico/empresa',
        created_by: userId,
        origen: 'Control Vehicular',
        id_origen: idOrigen || vehiculoId || '',
      };

      // attach comprobante file if provided (FormData field)
      let payload;
      if (comprobante && comprobante instanceof File) {
        payload = new FormData();
        Object.entries(data).forEach(([k, v]) => { if (v !== undefined && v !== null) payload.append(k, String(v)); });
        payload.append('comprobante', comprobante);
      } else {
        payload = data;
      }

      await pb.collection('gastos_operativos').create(payload, { $autoCancel: false });
    } catch (err) {
      console.error('No se pudo registrar el gasto vehicular', err);
    }
  };

  const createVehicle = async (data) => {
    setLoading(true);
    try {
      const record = await pb.collection('vehiculos').create({
        ...data,
        created_by: currentUser.name
      }, { $autoCancel: false });
      
      await logActivity(record.id, 'crear', `Vehículo registrado: ${record.patente}`);
      toast.success('Vehículo creado exitosamente');
      return { success: true, data: record };
    } catch (err) {
      return handleError(err, 'Error al crear vehículo');
    } finally {
      setLoading(false);
    }
  };

  const updateVehicle = async (id, data, oldData) => {
    setLoading(true);
    try {
      const record = await pb.collection('vehiculos').update(id, {
        ...data,
        updated_by: currentUser.name
      }, { $autoCancel: false });
      
      let desc = 'Vehículo actualizado';
      if (oldData.estado !== data.estado) desc = `Estado cambiado de ${oldData.estado} a ${data.estado}`;
      await logActivity(id, 'editar', desc);
      
      toast.success('Vehículo actualizado exitosamente');
      return { success: true, data: record };
    } catch (err) {
      return handleError(err, 'Error al actualizar vehículo');
    } finally {
      setLoading(false);
    }
  };

  const deleteVehicle = async (id) => {
    setLoading(true);
    try {
      await pb.collection('vehiculos').delete(id, { $autoCancel: false });
      toast.success('Vehículo eliminado');
      return { success: true };
    } catch (err) {
      return handleError(err, 'Error al eliminar vehículo');
    } finally {
      setLoading(false);
    }
  };

  const registerFuel = async (vehiculoId, formData) => {
    setLoading(true);
    try {
      formData.append('vehiculo_id', vehiculoId);
      formData.append('usuario_id', currentUser.id);
      formData.append('created_by', currentUser.name);

      const record = await pb.collection('registros_combustible').create(formData, { $autoCancel: false });
      
      // Actualizar kilometraje del vehículo (no-fatal if vehicle record missing)
      const km = formData.get('kilometraje');
      try {
        await pb.collection('vehiculos').update(vehiculoId, { kilometraje_actual: km }, { $autoCancel: false });
      } catch (kmErr) {
        console.warn('No se pudo actualizar kilometraje del vehículo:', kmErr);
      }
      
      await logActivity(vehiculoId, 'registrar_combustible', `Carga de ${formData.get('litros')}L de combustible`);
      await registerVehicleExpense({
        vehiculoId,
        patente: formData.get('patente') || '',
        concepto: `Combustible ${formData.get('litros') || ''}L`,
        monto: formData.get('costo_total') || formData.get('monto') || formData.get('costo'),
        fecha: formData.get('fecha'),
        pagadoPor: formData.get('pagado_por') || (isTech ? 'tecnico' : 'empresa'),
        sucursal: formData.get('sucursal_id') || '',
        observacion: formData.get('observacion') || '',
        idOrigen: record.id,
        comprobante: formData.get('fotografias') || null
      });
      
      toast.success('Combustible registrado');
      return { success: true, data: record };
    } catch (err) {
      return handleError(err, 'Error al registrar combustible');
    } finally {
      setLoading(false);
    }
  };

  const registerOilChange = async (vehiculoId, formData) => {
    setLoading(true);
    try {
      formData.append('vehiculo_id', vehiculoId);
      formData.append('usuario_id', currentUser.id);
      formData.append('created_by', currentUser.name);

      const record = await pb.collection('registros_aceite').create(formData, { $autoCancel: false });
      
      const km = formData.get('kilometraje');
      try {
        await pb.collection('vehiculos').update(vehiculoId, { kilometraje_actual: km }, { $autoCancel: false });
      } catch (kmErr) {
        console.warn('No se pudo actualizar kilometraje del vehículo:', kmErr);
      }
      
      await logActivity(vehiculoId, 'registrar_aceite', `Cambio de aceite: ${formData.get('tipo_aceite')}`);
      await registerVehicleExpense({
        vehiculoId,
        patente: formData.get('patente') || '',
        concepto: `Aceite ${formData.get('tipo_aceite') || ''}`,
        monto: formData.get('costo_total') || formData.get('costo') || formData.get('monto'),
        fecha: formData.get('fecha'),
        pagadoPor: formData.get('pagado_por') || (isTech ? 'tecnico' : 'empresa'),
        sucursal: formData.get('sucursal_id') || '',
        observacion: formData.get('observacion') || '',
        idOrigen: record.id
      });
      
      toast.success('Cambio de aceite registrado');
      return { success: true, data: record };
    } catch (err) {
      return handleError(err, 'Error al registrar cambio de aceite');
    } finally {
      setLoading(false);
    }
  };

  const registerMaintenance = async (vehiculoId, formData) => {
    setLoading(true);
    try {
      formData.append('vehiculo_id', vehiculoId);
      formData.append('usuario_id', currentUser.id);
      formData.append('created_by', currentUser.name);

      const record = await pb.collection('registros_mantenimiento').create(formData, { $autoCancel: false });
      
      await logActivity(vehiculoId, 'registrar_mantenimiento', `Mantenimiento: ${formData.get('tipo_mantenimiento')}`);
      await registerVehicleExpense({
        vehiculoId,
        patente: formData.get('patente') || '',
        concepto: `Taller / Repuesto: ${formData.get('tipo_mantenimiento') || ''}`,
        monto: formData.get('costo_total') || formData.get('costo') || formData.get('monto'),
        fecha: formData.get('fecha'),
        pagadoPor: formData.get('pagado_por') || (isTech ? 'tecnico' : 'empresa'),
        sucursal: formData.get('sucursal_id') || '',
        observacion: formData.get('observacion') || '',
        idOrigen: record.id
      });
      
      toast.success('Mantenimiento registrado');
      return { success: true, data: record };
    } catch (err) {
      return handleError(err, 'Error al registrar mantenimiento');
    } finally {
      setLoading(false);
    }
  };

  const registerObservation = async (vehiculoId, formData) => {
    setLoading(true);
    try {
      formData.append('vehiculo_id', vehiculoId);
      formData.append('usuario_id', currentUser.id);
      formData.append('created_by', currentUser.name);

      const record = await pb.collection('registros_observaciones').create(formData, { $autoCancel: false });
      
      await logActivity(vehiculoId, 'reportar_problema', 'Nueva observación registrada');
      
      toast.success('Observación registrada');
      return { success: true, data: record };
    } catch (err) {
      return handleError(err, 'Error al registrar observación');
    } finally {
      setLoading(false);
    }
  };

  const registerProblem = async (vehiculoId, formData) => {
    setLoading(true);
    try {
      formData.append('vehiculo_id', vehiculoId);
      formData.append('usuario_id', currentUser.id);
      formData.append('created_by', currentUser.name);

      const record = await pb.collection('registros_problemas').create(formData, { $autoCancel: false });
      
      await pb.collection('vehiculos').update(vehiculoId, { estado: 'fuera_servicio' }, { $autoCancel: false });
      await logActivity(vehiculoId, 'reportar_problema', 'Problema reportado (Vehículo fuera de servicio)');
      
      toast.success('Problema registrado');
      return { success: true, data: record };
    } catch (err) {
      return handleError(err, 'Error al registrar problema');
    } finally {
      setLoading(false);
    }
  };

  // Admin: delete a vehicle sub-record and its linked gasto operativo
  const deleteVehicleRecord = async (collectionName, recordId) => {
    setLoading(true);
    try {
      // delete linked gasto operativo first
      try {
        const linked = await pb.collection('gastos_operativos').getFirstListItem(
          `origen = "Control Vehicular" && id_origen = "${recordId}"`,
          { $autoCancel: false }
        );
        if (linked) await pb.collection('gastos_operativos').delete(linked.id, { $autoCancel: false });
      } catch (linkErr) {
        if (linkErr?.status !== 404 && linkErr?.status !== 400) {
          console.warn('Error buscando gasto operativo vinculado:', linkErr);
        }
      }
      await pb.collection(collectionName).delete(recordId, { $autoCancel: false });
      toast.success('Registro eliminado');
      return { success: true };
    } catch (err) {
      return handleError(err, 'Error al eliminar registro');
    } finally {
      setLoading(false);
    }
  };

  // Admin: update a vehicle sub-record and sync monto in gastos operativo
  const updateVehicleRecord = async (collectionName, recordId, data) => {
    setLoading(true);
    try {
      const record = await pb.collection(collectionName).update(recordId, data, { $autoCancel: false });
      // sync monto in linked gasto if it exists
      const newMonto = Number(data.costo || data.costo_total || data.monto || 0);
      if (newMonto) {
        try {
          const linked = await pb.collection('gastos_operativos').getFirstListItem(
            `origen = "Control Vehicular" && id_origen = "${recordId}"`,
            { $autoCancel: false }
          );
          if (linked) {
            await pb.collection('gastos_operativos').update(linked.id, {
              monto: newMonto,
              updated_by: getAuthUserId()
            }, { $autoCancel: false });
          }
        } catch (linkErr) {
          if (linkErr?.status !== 404 && linkErr?.status !== 400) {
            console.warn('Error actualizando gasto operativo vinculado:', linkErr);
          }
        }
      }
      toast.success('Registro actualizado');
      return { success: true, data: record };
    } catch (err) {
      return handleError(err, 'Error al actualizar registro');
    } finally {
      setLoading(false);
    }
  };

  const getVehicleComments = useCallback(async (vehiculoId) => {
    return getRelatedData(vehiculoId, 'comentarios_vehiculos', '-created');
  }, [getRelatedData]);

  const createComment = async (vehiculoId, formData) => {
    setLoading(true);
    try {
      formData.append('vehiculo_id', vehiculoId);
      formData.append('usuario_id', currentUser.id);
      formData.append('created_by', currentUser.name);

      const record = await pb.collection('comentarios_vehiculos').create(formData, { $autoCancel: false });
      toast.success('Comentario agregado');
      return { success: true, data: record };
    } catch (err) {
      return handleError(err, 'Error al agregar comentario');
    } finally {
      setLoading(false);
    }
  };

  const getActivityHistory = useCallback(async (vehiculoId) => {
    try {
      const records = await pb.collection('historial_actividad_vehiculos').getFullList({
        filter: `entidad_id = "${vehiculoId}"`,
        sort: '-created',
        $autoCancel: false
      });
      return { success: true, data: records };
    } catch (err) {
      console.error('Error loading historial_actividad_vehiculos', err);
      return { success: false, data: [] };
    }
  }, []);

  return {
    loading,
    error,
    isTech,
    getVehicles,
    getVehicleDetail,
    getRelatedData,
    registerVehicleExpense,
    createVehicle,
    updateVehicle,
    deleteVehicle,
    registerFuel,
    registerOilChange,
    registerMaintenance,
    registerObservation,
    registerProblem,
    getVehicleComments,
    createComment,
    getActivityHistory,
    deleteVehicleRecord,
    updateVehicleRecord
  };
};