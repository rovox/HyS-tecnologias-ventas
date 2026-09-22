import { useState, useCallback } from 'react';
import { apiClient, authToken } from '@/api/http.js';
import { useAuth } from '@/contexts/AuthContext.jsx';
import { toast } from 'sonner';

export const useInternalOrders = () => {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchPedidos = useCallback(async (filters = {}) => {
    setLoading(true);
    setError(null);
    try {
      const rows = await apiClient.get('pedidos-internos', {
        token: authToken(),
        query: {
          estado: filters.estado && filters.estado !== 'Todos' ? filters.estado : undefined,
          search: filters.search || undefined,
          prioridad: filters.prioridad && filters.prioridad !== 'Todas' ? filters.prioridad : undefined,
          sucursal: filters.sucursal && filters.sucursal !== 'Todas' ? filters.sucursal : undefined,
        },
      });
      return rows || [];
    } catch (err) {
      console.error('Error fetchPedidos:', err);
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
    if (!pedidoId) return { pedido: null, detalles: [], comentarios: [], historial: [] };
    setLoading(true);
    try {
      const data = await apiClient.get(`pedidos-internos/${pedidoId}`, { token: authToken() });
      return {
        pedido: data,
        detalles: data.detalles || data.items || [],
        comentarios: data.comentarios || [],
        historial: data.historial || [],
      };
    } catch (err) {
      console.error('Error getPedidoDetails:', err);
      toast.error('Error al cargar detalles del pedido');
      return { pedido: null, detalles: [], comentarios: [], historial: [] };
    } finally {
      setLoading(false);
    }
  };

  const createPedidoWithDetails = async (pedidoData, detalles) => {
    setLoading(true);
    try {
      const record = await apiClient.post('pedidos-internos', {
        ...pedidoData,
        items: detalles,
      }, { token: authToken() });
      return record;
    } catch (err) {
      console.error('Error createPedidoWithDetails:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updatePedidoWithDetails = async (pedidoId, pedidoData, detalles) => {
    setLoading(true);
    try {
      const updated = await apiClient.patch(`pedidos-internos/${pedidoId}`, {
        ...pedidoData,
        items: detalles,
      }, { token: authToken() });
      return updated;
    } catch (err) {
      console.error('Error updatePedidoWithDetails:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deletePedido = async (id) => {
    setLoading(true);
    try {
      await apiClient.delete(`pedidos-internos/${id}`, { token: authToken() });
      return true;
    } catch (err) {
      console.error('Error deletePedido:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateEstadoPedido = useCallback(async (pedidoId, nuevoEstado, extra = {}) => {
    setLoading(true);
    try {
      const updated = await apiClient.patch(`pedidos-internos/${pedidoId}/status`, {
        estado: nuevoEstado,
        ...extra,
      }, { token: authToken() });
      toast.success('Estado actualizado correctamente');
      return updated;
    } catch (err) {
      console.error('Error updateEstadoPedido:', err);
      toast.error('Error al actualizar el estado del pedido');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  const addComment = async (pedidoId, contenido) => {
    setLoading(true);
    try {
      const comment = await apiClient.post(`pedidos-internos/${pedidoId}/comments`, {
        contenido,
      }, { token: authToken() });
      toast.success('Comentario añadido');
      return comment;
    } catch (err) {
      console.error('Error addComment:', err);
      toast.error('Error al comentar');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const fetchDetallesForPedidos = useCallback(async (pedidoIds) => {
    const ids = (pedidoIds || []).filter(Boolean);
    if (ids.length === 0) return {};
    try {
      const results = await Promise.all(
        ids.map((id) => apiClient.get(`pedidos-internos/${id}`, { token: authToken() }).catch(() => null))
      );
      const grouped = {};
      results.forEach((data, i) => {
        if (data) grouped[ids[i]] = data.detalles || data.items || [];
      });
      return grouped;
    } catch (err) {
      console.error('Error fetchDetallesForPedidos:', err);
      return {};
    }
  }, []);

  return {
    loading,
    error,
    fetchPedidos,
    getPedidoDetails,
    createPedidoWithDetails,
    updatePedidoWithDetails,
    deletePedido,
    addComment,
    fetchDetallesForPedidos,
    updateEstadoPedido,
  };
};
