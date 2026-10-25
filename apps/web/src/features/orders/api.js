// Internal orders (pedidos internos): the only file of this feature that talks HTTP. Keys start with
// 'pedido_interno' (its realtime entity); delivering also moves stock, projects and clients.
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/api/client.js';
import { authToken } from '@/api/http.js';

const opts = (extra) => ({ token: authToken(), ...extra });

export function useOrders(enabled = true) {
  return useQuery({ queryKey: ['pedido_interno', 'list'], queryFn: () => apiClient.get('pedidos-internos', opts()), enabled });
}

export function useOrder(id) {
  return useQuery({ queryKey: ['pedido_interno', 'detail', id], queryFn: () => apiClient.get(`pedidos-internos/${id}`, opts()), enabled: Boolean(id) });
}

/** Open jobs (for "para trabajo" orders). */
export function useOpenJobs(enabled) {
  return useQuery({
    queryKey: ['schedule', 'open'],
    queryFn: () => apiClient.get('schedules', opts()),
    enabled,
    select: (rows) => rows.filter((j) => !['terminado', 'cancelado'].includes(j.estado)),
  });
}

function useOrderMutation(fn) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSuccess: () => {
      for (const key of ['pedido_interno', 'stock', 'product', 'project', 'client']) queryClient.invalidateQueries({ queryKey: [key] });
    },
  });
}

export function useSaveOrder() {
  return useOrderMutation(({ id, ...data }) => (id ? apiClient.patch(`pedidos-internos/${id}`, data, opts()) : apiClient.post('pedidos-internos', data, opts())));
}

/** estado + optional `observacion` (the reason to reject or cancel). */
export function useOrderStatus() {
  return useOrderMutation(({ id, ...body }) => apiClient.patch(`pedidos-internos/${id}/status`, body, opts()));
}

export function useAddOrderComment() {
  return useOrderMutation(({ id, contenido }) => apiClient.post(`pedidos-internos/${id}/comments`, { contenido }, opts()));
}
