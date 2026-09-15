import { useEffect, useRef } from 'react';
import { isMockMode } from '@/api/config.js';
import { apiClient, authToken } from '@/api/http.js';

const API_BASE = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');

/**
 * Una conexión SSE por pestaña. Emite `hs-realtime` en window para que
 * páginas/listas hagan refetch sin recargar.
 */
export function useRealtimeRefresh() {
  const esRef = useRef(null);

  useEffect(() => {
    if (isMockMode || !API_BASE) return undefined;

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

export function onRealtime(handler) {
  const fn = (e) => handler(e.detail);
  window.addEventListener('hs-realtime', fn);
  return () => window.removeEventListener('hs-realtime', fn);
}
