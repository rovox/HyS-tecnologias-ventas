// Tasks: the only file of this feature that talks HTTP. Keys start with the API entity ('task'): any session's change
// refreshes the badge and the panel everywhere.
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/api/client.js';
import { authToken } from '@/api/http.js';

const opts = (extra) => ({ token: authToken(), ...extra });

/** Pending tasks, or with `archivadas` the completed and discarded ones (kept 30 days, TSK-03). */
export function useTasks(enabled = true, { archivadas = false } = {}) {
  return useQuery({
    queryKey: ['task', 'list', archivadas ? 'archivadas' : 'pendientes'],
    queryFn: () => apiClient.get('tasks', opts(archivadas ? { query: { archivadas: '1' } } : undefined)),
    enabled,
  });
}

/** { mias, sinAsignar, vencidas } for the badge. */
export function useTaskSummary() {
  return useQuery({ queryKey: ['task', 'summary'], queryFn: () => apiClient.get('tasks/resumen', opts()) });
}

function useTaskMutation(fn) {
  const queryClient = useQueryClient();
  return useMutation({ mutationFn: fn, onSuccess: () => queryClient.invalidateQueries({ queryKey: ['task'] }) });
}

export function useCreateTask() {
  return useTaskMutation((data) => apiClient.post('tasks', data, opts()));
}

/** Any change: estado (pendiente | completada | descartada), asignadoId, plazo, prioridad, titulo, clienteId. */
export function useUpdateTask() {
  return useTaskMutation(({ id, ...data }) => apiClient.patch(`tasks/${id}`, data, opts()));
}

/** Take an unassigned task; the API refuses (409) when someone took it first. */
export function useClaimTask() {
  return useTaskMutation((id) => apiClient.post(`tasks/${id}/claim`, {}, opts()));
}
