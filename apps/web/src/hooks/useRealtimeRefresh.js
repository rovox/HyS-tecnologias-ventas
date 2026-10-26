import { useEffect, useRef } from 'react';

/**
 * Runs `onChange(event)` when the API reports a change to one of `entities` (e.g. ['schedule', 'payment']), or to an
 * entity they affect, and after the realtime connection (re)opens. Legacy bridge for pages not yet on query hooks:
 * the connection itself lives in `app/RealtimeProvider.jsx`. New code uses `features/<x>/api.js` hooks instead.
 */
export function useRealtimeEntities(entities, onChange) {
  const handlerRef = useRef(onChange);
  handlerRef.current = onChange;
  const key = entities.join(',');

  useEffect(() => {
    const watched = new Set(key.split(','));
    const onEvent = (e) => {
      const { entity, affects = [] } = e.detail || {};
      if (entity === '*' || watched.has(entity) || affects.some((a) => watched.has(a))) handlerRef.current(e.detail);
    };
    window.addEventListener('hs-realtime', onEvent);
    return () => window.removeEventListener('hs-realtime', onEvent);
  }, [key]);
}
