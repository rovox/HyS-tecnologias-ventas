// Clients: the only file of this feature that talks HTTP. Keys start with 'client'; projects, jobs and payments carry
// 'client' in `affects`, so balances refresh by themselves.
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/api/client.js';
import { authToken } from '@/api/http.js';

const opts = (extra) => ({ token: authToken(), ...extra });

/** Every client with saldo pendiente, work in course and servicioEnCurso (read model). */
export function useClientsOverview() {
  return useQuery({ queryKey: ['client', 'overview'], queryFn: () => apiClient.get('reporting/clients', opts()) });
}

/** The client page: projects with warranty, jobs, quotations, payments and visits. */
export function useClientSummary(id) {
  return useQuery({ queryKey: ['client', 'summary', id], queryFn: () => apiClient.get(`reporting/clients/${id}`, opts()), enabled: Boolean(id) });
}

/** Create (no id) or update a client. */
export function useSaveClient() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }) => (id ? apiClient.patch(`clients/${id}`, data, opts()) : apiClient.post('clients', data, opts())),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['client'] }),
  });
}
