// Internal orders (pedidos internos): fetch one order for editing and save it. The list and detail pages are still the
// MVP pages; this feature owns the form.
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/api/client.js';
import { authToken } from '@/api/http.js';

const opts = (extra) => ({ token: authToken(), ...extra });

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

export function useSaveOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }) => (id ? apiClient.patch(`pedidos-internos/${id}`, data, opts()) : apiClient.post('pedidos-internos', data, opts())),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['pedido_interno'] }),
  });
}
