import { useEffect, useRef } from 'react';
import { apiClient, authToken } from '@/api/http.js';

const API_BASE = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');

export function useRealtimeRefresh() {
  const esRef = useRef(null);

  useEffect(() => {
    if (!API_BASE) return undefined;

    let cancelled = false;
    let retryTimer;

    const connect = async () => {
      try {
        const { token } = await apiClient.post('realtime/ticket', {}, { token: authToken() });
        if (cancelled || !token) return;
        const url = `${API_BASE}/realtime/events?access_token=${encodeURIComponent(token)}`;
        const es = new EventSource(url);
        esRef.current = es;
        es.onmessage = (msg) => {
          try {
            const data = JSON.parse(msg.data);
            if (data?.type === 'heartbeat') return;
            window.dispatchEvent(new CustomEvent('hs-realtime', { detail: data }));
          } catch {
            /* ignore malformed */
          }
        };
        es.onerror = () => {
          es.close();
          esRef.current = null;
          if (!cancelled) {
            retryTimer = setTimeout(connect, 8_000);
          }
        };
      } catch {
        if (!cancelled) {
          retryTimer = setTimeout(connect, 12_000);
        }
      }
    };

    connect();
    return () => {
      cancelled = true;
      clearTimeout(retryTimer);
      esRef.current?.close();
      esRef.current = null;
    };
  }, []);
}

/**
 * Runs `onChange(event)` when the API reports a change to one of `entities` (e.g. ['schedule', 'payment']).
 * The single way a screen reacts to realtime until the TanStack Query invalidation of docs/rules/frontend.md exists.
 */
export function useRealtimeEntities(entities, onChange) {
  const handlerRef = useRef(onChange);
  handlerRef.current = onChange;
  const key = entities.join(',');

  useEffect(() => {
    const watched = new Set(key.split(','));
    const onEvent = (e) => {
      if (watched.has(e.detail?.entity)) handlerRef.current(e.detail);
    };
    window.addEventListener('hs-realtime', onEvent);
    return () => window.removeEventListener('hs-realtime', onEvent);
  }, [key]);
}
