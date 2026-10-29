import { Suspense, createContext, lazy, useCallback, useContext, useRef, useState } from 'react';

// The dialog (Radix) is loaded the first time a confirmation is asked, not with the app (GATE-01).
const ConfirmDialog = lazy(() => import('./ConfirmDialog.jsx'));

const ConfirmContext = createContext(null);

/**
 * One confirmation dialog for the whole app. `await confirm({ ... })` resolves to `{ ok: true, reason }` or
 * `{ ok: false }`. Options:
 *   title, description, confirmLabel
 *   destructive (red button) | tone: 'success' (green button, e.g. "Validar")
 *   details: [[label, value], …] — the record the action touches (shown as "campo: valor")
 *   effect: string | string[] — what will change ("La Caja Central baja de Bs 5.200 a Bs 4.700")
 *   reason: 'Motivo' — a non-empty reason is required; reasonOptions: ['Monto incorrecto', …] fill it in one click
 */
export function ConfirmProvider({ children }) {
  const [request, setRequest] = useState(null);
  const [reason, setReason] = useState('');
  // Stays mounted after the first use so it can animate its closing.
  const [used, setUsed] = useState(false);
  const resolver = useRef(null);

  const confirm = useCallback((options) => {
    setReason('');
    setRequest(options);
    setUsed(true);
    return new Promise((resolve) => {
      resolver.current = resolve;
    });
  }, []);

  const close = (result) => {
    resolver.current?.(result);
    resolver.current = null;
    setRequest(null);
  };

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      {used && (
        <Suspense fallback={null}>
          <ConfirmDialog request={request} reason={reason} setReason={setReason} close={close} />
        </Suspense>
      )}
    </ConfirmContext.Provider>
  );
}

export function useConfirm() {
  const confirm = useContext(ConfirmContext);
  if (!confirm) throw new Error('useConfirm must be used within ConfirmProvider');
  return confirm;
}
