// Cronograma: the only file of this feature that talks HTTP. Keys start with 'schedule' (the realtime entity of jobs);
// payments and project changes carry 'schedule' in `affects`, so the calendar refreshes by itself.
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/api/client.js';
import { authToken } from '@/api/http.js';

const opts = (extra) => ({ token: authToken(), ...extra });

/** Jobs scheduled between two days (YYYY-MM-DD, inclusive). */
export function useJobs(from, to) {
  return useQuery({
    queryKey: ['schedule', 'list', from, to],
    queryFn: () => apiClient.get('schedules', opts({ query: { from, to: `${to}T23:59:59.999Z` } })),
  });
}

export function useJob(id) {
  return useQuery({ queryKey: ['schedule', 'detail', id], queryFn: () => apiClient.get(`schedules/${id}`, opts()), enabled: Boolean(id) });
}

function useJobMutation(fn) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSuccess: (job) => {
      // The response is the updated job: show it at once instead of waiting for the refetch.
      if (job?.id) queryClient.setQueryData(['schedule', 'detail', job.id], job);
      for (const key of ['schedule', 'project', 'movement', 'client']) queryClient.invalidateQueries({ queryKey: [key] });
    },
  });
}

export function useCreateJob() {
  return useJobMutation((data) => apiClient.post('schedules', data, opts()));
}

/** estado, tecnicoId, fechaProgramada, horario, observaciones, lugar… (a técnico only changes estado, horario and notes). */
export function useUpdateJob() {
  return useJobMutation(({ id, ...data }) => apiClient.patch(`schedules/${id}`, data, opts()));
}

/** tipo: adelanto | cobro | extra_asistencia. A job of a project pays into the project (the API routes it). */
export function useRegisterJobPayment() {
  return useJobMutation(({ id, ...payment }) => apiClient.post(`schedules/${id}/payments`, payment, opts()));
}
