import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/api/client.js';
import { authToken } from '@/api/http.js';

/** Query key invalidated by RealtimeProvider whenever this record changes. */
const historyKey = (entity, id) => ['history', entity, id];

export function useRecordHistory(entity, id) {
  return useQuery({
    queryKey: historyKey(entity, id),
    queryFn: () => apiClient.get(`activity/${entity}/${id}`, { token: authToken() }),
    enabled: Boolean(entity && id),
  });
}

/** The latest changes of the whole app (Gerencia): who did what, newest first. */
export function useActivityFeed(limit = 15, enabled = true) {
  return useQuery({ queryKey: ['history', 'feed', limit], queryFn: () => apiClient.get('activity', { token: authToken(), query: { limit } }), enabled, refetchInterval: 60000 });
}
