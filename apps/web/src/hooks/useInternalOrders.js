import { useState, useCallback } from 'react';
import pb from '@/lib/pocketbaseClient.js';
import { useAuth } from '@/contexts/AuthContext.jsx';
import { toast } from 'sonner';
import { format } from 'date-fns';

export const useInternalOrders = () => {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const logActivity = async (entityId, accion, campo_modificado = '', valor_anterior = '', valor_nuevo = '', descripcion = '') => {
    try {
      await pb.collection('historial_actividad').create({
        entidad_tipo: 'pedidos_internos',
        entidad_id: entityId,
        usuario_id: currentUser.id,
        accion,
        campo_modificado,
        valor_anterior,
        valor_nuevo,
        descripcion,
        created_by: currentUser.id
      }, { $autoCancel: false });
    } catch (err) {
      console.error('Failed to log activity:', err.status, err.message, err.data);
    }
  };

  const fetchPedidos = useCallback(async (filters = {}) => {
    setLoading(true);
    setError(null);
    try {
      let filterString = '';
      const filterConditions = [];

      if (filters.estado && filters.estado.length > 0 && filters.estado !== 'Todos') {
        const estStr = Array.isArray(filters.estado) 
          ? filters.estado.map(e => `estado="${e}"`).join(' || ')
          : `estado="${filters.estado}"`;
        filterConditions.push(`(${estStr})`);
      }
      if (filters.sucursal && filters.sucursal !== 'Todas') {
        filterConditions.push(`(sucursal_origen_id="${filters.sucursal}" || sucursal_destino_id="${filters.sucursal}")`);
      }
      if (filters.search) {
        filterConditions.push(`numero_pedido ~ "${filters.search}"`);
      }
      if (filters.prioridad && filters.prioridad !== 'Todas') {
         filterConditions.push(`prioridad="${filters.prioridad}"`);
      }

      // Department restriction unless admin/seguridad
      if (currentUser.role !== 'ADMINISTRADOR' && currentUser.role !== 'SEGURIDAD ELECTRÓNICA') {
        const dept = currentUser.department || 'Central';
        filterConditions.push(`(sucursal_origen_id="${dept}" || sucursal_destino_id="${dept}" || responsable_id="${currentUser.id}")`);
      }

      if (filterConditions.length > 0) {
        filterString = filterConditions.join(' && ');
      }

      const records = await pb.collection('pedidos_internos').getList(1, 50, {
        filter: filterString,
        sort: '-created',
        $autoCancel: false
      });
      return records.items || [];
    } catch (err) {
      console.error('Error fetchPedidos:', err.status, err.message, err.data);
      if (err.status === 403) {
        setError('No tienes permiso para ver los pedidos internos.');
      } else if (err.status === 0) {
        setError('No se pudo conectar con el servidor. Intenta nuevamente.');
      } else {
        setError('Error al cargar los pedidos internos.');
        toast.error('Error al cargar los pedidos');
      }
      return [];
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  const getPedidoDetails = async (pedidoId) => {
    if (!pedidoId) {
      console.error('getPedidoDetails: pedidoId no proporcionado');
      return { pedido: null, detalles: [], comentarios: [], historial: [] };
    }

    setLoading(true);
    try {
      const pedido = await pb.collection('pedidos_internos').getOne(pedidoId, { $autoCancel: false });
      
      let detalles = [];
      try {
        detalles = await pb.collection('detalles_pedidos_internos').getFullList({ 
          filter: `pedido_id="${pedidoId}"`, 
          $autoCancel: false 
        });
      } catch (errDet) {
        console.warn('Error obteniendo detalles, se devolverá arreglo vacío:', errDet.status, errDet.message);
        detalles = [];
      }
      
      const comentarios = await pb.collection('comentarios_pedidos_internos').getFullList({ 
        filter: `pedido_id="${pedidoId}"`, 
        sort: '-created', 
        $autoCancel: false 
      }).catch(() => []);
      
      const historial = await pb.collection('historial_actividad').getFullList({ 
        filter: `entidad_tipo="pedidos_internos" && entidad_id="${pedidoId}"`, 
        sort: '-created', 
        $autoCancel: false 
      }).catch(() => []);
      
      return { pedido, detalles, comentarios, historial };
    } catch (err) {
      console.error('Error getPedidoDetails:', err.status, err.message, err.data);
      toast.error('Error al cargar detalles del pedido');
      return { pedido: null, detalles: [], comentarios: [], historial: [] };
    } finally {
      setLoading(false);
    }
  };

  const createPedidoWithDetails = async (pedidoData, detalles) => {
    setLoading(true);
    try {
      const numero_pedido = `REQ-${format(new Date(), 'yyMMddHHmm')}`;
      const costo_total = detalles.reduce((sum, item) => sum + (Number(item.costo_unitario || 0) * Number(item.cantidad || 0)), 0);

      const payload = {
        ...pedidoData,
        numero_pedido,
        costo_total,
        estado: pedidoData.estado || 'solicitado',
        created_by: currentUser.id
      };

      // 1. Crear el pedido
      const pedidoRecord = await pb.collection('pedidos_internos').create(payload, { $autoCancel: false });

      // 2. Crear los detalles
      try {
        await Promise.all(detalles.map(item => {
          return pb.collection('detalles_pedidos_internos').create({
            pedido_id: pedidoRecord.id,
            material_nombre: item.material_nombre,
            cantidad: Number(item.cantidad),
            unidad: item.unidad,
            costo_unitario: Number(item.costo_unitario || 0),
            costo_total: Number(item.costo_unitario || 0) * Number(item.cantidad),
            observaciones_item: item.observaciones_item || ''
          }, { $autoCancel: false });
        }));
      } catch (errDet) {
        console.error('Error creando detalles:', errDet.status, errDet.message, errDet.data);
        // No rompemos la creación del pedido principal, solo logueamos el error
      }

      await logActivity(pedidoRecord.id, 'crear', '', '', '', `Creó el pedido ${numero_pedido}`);
      return pedidoRecord;
    } catch (err) {
      console.error('Error createPedidoWithDetails:', err.status, err.message, err.data);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updatePedidoWithDetails = async (pedidoId, pedidoData, detalles) => {
    setLoading(true);
    try {
      const costo_total = detalles.reduce((sum, item) => sum + (Number(item.costo_unitario || 0) * Number(item.cantidad || 0)), 0);

      const payload = {
        ...pedidoData,
        costo_total,
        updated_by: currentUser.id
      };

      // 1. Actualizar el pedido
      const updated = await pb.collection('pedidos_internos').update(pedidoId, payload, { $autoCancel: false });

      // 2. Eliminar detalles antiguos
      try {
        const viejos = await pb.collection('detalles_pedidos_internos').getFullList({ filter: `pedido_id="${pedidoId}"`, $autoCancel: false });
        await Promise.all(viejos.map(v => pb.collection('detalles_pedidos_internos').delete(v.id, { $autoCancel: false })));
      } catch (errDel) {
         console.error('Error eliminando detalles antiguos:', errDel.status, errDel.message);
      }

      // 3. Crear nuevos detalles
      try {
        await Promise.all(detalles.map(item => {
          return pb.collection('detalles_pedidos_internos').create({
            pedido_id: pedidoId,
            material_nombre: item.material_nombre,
            cantidad: Number(item.cantidad),
            unidad: item.unidad,
            costo_unitario: Number(item.costo_unitario || 0),
            costo_total: Number(item.costo_unitario || 0) * Number(item.cantidad),
            observaciones_item: item.observaciones_item || ''
          }, { $autoCancel: false });
        }));
      } catch (errCre) {
         console.error('Error creando nuevos detalles:', errCre.status, errCre.message);
      }

      await logActivity(pedidoId, 'editar', '', '', '', 'Editó la información y materiales del pedido');
      return updated;
    } catch (err) {
      console.error('Error updatePedidoWithDetails:', err.status, err.message, err.data);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deletePedido = async (id) => {
    setLoading(true);
    try {
      const detalles = await pb.collection('detalles_pedidos_internos').getFullList({ 
        filter: `pedido_id="${id}"`, 
        $autoCancel: false 
      }).catch(() => []);
      await Promise.all(detalles.map(d => pb.collection('detalles_pedidos_internos').delete(d.id, { $autoCancel: false }).catch(()=>null)));
      
      const comentarios = await pb.collection('comentarios_pedidos_internos').getFullList({ 
        filter: `pedido_id="${id}"`, 
        $autoCancel: false 
      }).catch(() => []);
      await Promise.all(comentarios.map(c => pb.collection('comentarios_pedidos_internos').delete(c.id, { $autoCancel: false }).catch(()=>null)));

      await pb.collection('pedidos_internos').delete(id, { $autoCancel: false });
      return true;
    } catch (err) {
      console.error('Error deletePedido:', err.status, err.message, err.data);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteDetalle = async (detalleId) => {
    setLoading(true);
    try {
      await pb.collection('detalles_pedidos_internos').delete(detalleId, { $autoCancel: false });
      toast.success('Detalle eliminado');
      return true;
    } catch (err) {
      console.error('Error deleteDetalle:', err.status, err.message, err.data);
      toast.error('Error al eliminar detalle');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const fetchDetallesForPedidos = useCallback(async (pedidoIds) => {
    const ids = (pedidoIds || []).filter(Boolean);
    if (ids.length === 0) return {};
    try {
      const filterString = ids.map(id => `pedido_id="${id}"`).join(' || ');
      const detalles = await pb.collection('detalles_pedidos_internos').getFullList({
        filter: filterString,
        $autoCancel: false
      });
      const grouped = {};
      detalles.forEach(d => {
        if (!grouped[d.pedido_id]) grouped[d.pedido_id] = [];
        grouped[d.pedido_id].push(d);
      });
      return grouped;
    } catch (err) {
      console.error('Error fetchDetallesForPedidos:', err.status, err.message, err.data);
      return {};
    }
  }, []);

  const updateEstadoPedido = useCallback(async (pedidoId, nuevoEstado, extra = {}) => {
    setLoading(true);
    try {
      const payload = { estado: nuevoEstado, updated_by: currentUser?.id };

      if (nuevoEstado === 'entregado') {
        payload.fecha_entrega_real = extra.fecha_entrega || format(new Date(), 'yyyy-MM-dd');
        payload.entregado_por_id = extra.entregado_por_id || currentUser?.id || '';
        if (extra.observacion) {
          payload.observacion_entrega = extra.observacion;
        }
      }

      const updated = await pb.collection('pedidos_internos').update(pedidoId, payload, { $autoCancel: false });
      await logActivity(pedidoId, 'cambiar_estado', 'estado', '', nuevoEstado, `Cambió el estado a ${nuevoEstado.replace('_', ' ')}`);
      toast.success('Estado actualizado correctamente');
      return updated;
    } catch (err) {
      console.error('Error updateEstadoPedido:', err.status, err.message, err.data);
      toast.error('Error al actualizar el estado del pedido');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  const addComment = async (pedidoId, contenido, files) => {
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('pedido_id', pedidoId);
      formData.append('usuario_id', currentUser.id);
      formData.append('contenido', contenido);
      formData.append('created_by', currentUser.id);
      
      if (files && files.length > 0) {
        files.forEach(f => formData.append('fotografias', f));
      }

      const comment = await pb.collection('comentarios_pedidos_internos').create(formData, { $autoCancel: false });
      await logActivity(pedidoId, 'comentar', '', '', '', 'Agregó un comentario');
      toast.success('Comentario añadido');
      return comment;
    } catch (err) {
      console.error('Error addComment:', err.status, err.message, err.data);
      toast.error('Error al comentar');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    fetchPedidos,
    getPedidoDetails,
    createPedidoWithDetails,
    updatePedidoWithDetails,
    deletePedido,
    deleteDetalle,
    addComment,
    fetchDetallesForPedidos,
    updateEstadoPedido
  };
};