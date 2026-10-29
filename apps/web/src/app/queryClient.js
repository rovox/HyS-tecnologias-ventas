import { MutationCache, QueryCache, QueryClient } from '@tanstack/react-query';
import { notify } from '@/shared/lib/notify.js';

// One cache for every screen. Fresh data comes from realtime invalidation (RealtimeProvider), focus and reconnect.
// Errors are always shown: a query error once per failing query, a mutation error unless the mutation handles it
// itself (`meta: { silentError: true }`).
export const queryClient = new QueryClient({
  defaultOptions: {
    // A 401 ends the session (api/client.js): no retry and no toast while the login opens.
    queries: { staleTime: 30_000, retry: (count, error) => error?.status !== 401 && count < 1, refetchOnWindowFocus: true },
  },
  queryCache: new QueryCache({
    onError: (error, query) => {
      if (!query.meta?.silentError && error?.status !== 401) notify.error(error, 'No se pudieron cargar los datos');
    },
  }),
  mutationCache: new MutationCache({
    onError: (error, _vars, _ctx, mutation) => {
      if (!mutation.meta?.silentError && error?.status !== 401) notify.error(error);
    },
  }),
});
