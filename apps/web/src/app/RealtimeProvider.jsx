import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/api/client.js';
import { API_URL } from '@/api/config.js';
import { authStore } from '@/lib/authStore.js';

const BACKOFF_MS = [1_000, 2_000, 5_000, 10_000];
/** The API sends a heartbeat every 25 s; silence longer than this means a dead connection. */
const SILENCE_MS = 40_000;
const streamUrl = (ticket) =>
  `${API_URL.replace(/\/$/, '')}/realtime/events?access_token=${encodeURIComponent(ticket)}`;

/** Legacy pages still listen to `hs-realtime` (useRealtimeEntities) until they move to query hooks. */
const broadcast = (detail) => window.dispatchEvent(new CustomEvent('hs-realtime', { detail }));

/**
 * The single realtime connection. Every API change invalidates the queries of its entity and of the entities it
 * affects, so any open session refreshes by itself. After (re)connecting, everything active is refetched, which also
 * recovers events missed while offline.
 */
export function RealtimeProvider({ children }) {
  const queryClient = useQueryClient();

  useEffect(() => {
    let stopped = false;
    let source = null;
    let attempt = 0;
    let retryTimer;
    let silenceTimer;

    const scheduleReconnect = () => {
      source?.close();
      source = null;
      clearTimeout(silenceTimer);
      if (stopped || !authStore.token) return;
      retryTimer = setTimeout(connect, BACKOFF_MS[Math.min(attempt, BACKOFF_MS.length - 1)]);
      attempt += 1;
    };
    const watchSilence = () => {
      clearTimeout(silenceTimer);
      silenceTimer = setTimeout(scheduleReconnect, SILENCE_MS);
    };

    async function connect() {
      clearTimeout(retryTimer);
      if (stopped || !authStore.token) return;
      try {
        const { token } = await apiClient.post('realtime/ticket', {}, { token: authStore.token });
        if (stopped) return;
        source = new EventSource(streamUrl(token));
        source.onopen = () => {
          attempt = 0;
          watchSilence();
          queryClient.invalidateQueries();
          broadcast({ type: 'reconnect', entity: '*' });
        };
        source.onmessage = (msg) => {
          watchSilence();
          let event;
          try {
            event = JSON.parse(msg.data);
          } catch {
            return;
          }
          if (!event?.entity || event.type === 'heartbeat') return;
          for (const entity of [event.entity, ...(event.affects || [])]) {
            queryClient.invalidateQueries({ queryKey: [entity] });
          }
          queryClient.invalidateQueries({ queryKey: ['history', event.entity, event.id] });
          broadcast(event);
        };
        source.onerror = scheduleReconnect;
      } catch {
        scheduleReconnect();
      }
    }

    const reconnectNow = () => {
      source?.close();
      source = null;
      attempt = 0;
      connect();
    };
    // The browser may keep a dead stream "open" after a network drop: start over as soon as it is back online.
    const goOffline = () => {
      source?.close();
      source = null;
      clearTimeout(silenceTimer);
    };

    connect();
    window.addEventListener('online', reconnectNow);
    window.addEventListener('offline', goOffline);
    const offAuth = authStore.onChange((token) => (token ? reconnectNow() : goOffline()));
    return () => {
      stopped = true;
      window.removeEventListener('online', reconnectNow);
      window.removeEventListener('offline', goOffline);
      offAuth();
      clearTimeout(retryTimer);
      clearTimeout(silenceTimer);
      source?.close();
    };
  }, [queryClient]);

  return children;
}
