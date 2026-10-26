// Visits (relevamientos y asistencias): the only file of this feature that talks HTTP. Keys start with 'relevamiento'
// (its realtime entity); a payment taken on a visit also refreshes the ledger and the client.
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/api/client.js';
import { API_URL } from '@/api/config.js';
import { authToken } from '@/api/http.js';

const opts = (extra) => ({ token: authToken(), ...extra });

export function useVisits() {
  return useQuery({ queryKey: ['relevamiento', 'list'], queryFn: () => apiClient.get('relevamientos', opts()) });
}

export function useVisit(id) {
  return useQuery({ queryKey: ['relevamiento', 'detail', id], queryFn: () => apiClient.get(`relevamientos/${id}`, opts()), enabled: Boolean(id) });
}

/** Jobs of a client, to say which one a visit revisits (warranty). */
export function useClientJobs(clienteId) {
  return useQuery({
    queryKey: ['schedule', 'client', clienteId],
    queryFn: () => apiClient.get('schedules', opts({ query: { clienteId } })),
    enabled: Boolean(clienteId),
  });
}

function useVisitMutation(fn) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSuccess: (visit) => {
      if (visit?.id) queryClient.setQueryData(['relevamiento', 'detail', visit.id], visit);
      for (const key of ['relevamiento', 'client']) queryClient.invalidateQueries({ queryKey: [key] });
    },
  });
}

export function useSaveVisit() {
  return useVisitMutation(({ id, ...data }) => (id ? apiClient.patch(`relevamientos/${id}`, data, opts()) : apiClient.post('relevamientos', data, opts())));
}

/** estado + `motivo` (required to cancel). */
export function useVisitStatus() {
  return useVisitMutation(({ id, ...body }) => apiClient.post(`relevamientos/${id}/estado`, body, opts()));
}

export function useUploadVisitPhoto() {
  return useVisitMutation(({ id, file }) => {
    const form = new FormData();
    form.append('file', file);
    return apiClient.post(`relevamientos/${id}/files`, form, opts());
  });
}

async function photoBlob(url) {
  const path = String(url).replace(/^\/api\//, '').replace(/^\//, '');
  const response = await fetch(`${API_URL.replace(/\/$/, '')}/${path}`, { headers: { Authorization: `Bearer ${authToken()}` } });
  if (!response.ok) throw new Error('No se pudo cargar la foto');
  return URL.createObjectURL(await response.blob());
}

/** A visit photo as a local URL for an <img> (photos need the session token). Its own key: a photo never changes, so
 * realtime refreshes of visits do not download it again. */
export function usePhoto(url) {
  return useQuery({ queryKey: ['visit-photo', url], queryFn: () => photoBlob(url), enabled: Boolean(url), staleTime: Infinity });
}
