import { createContext, useCallback, useContext, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

const ConfirmContext = createContext(null);

/**
 * One confirmation dialog for the whole app. `await confirm({ title, description, confirmLabel, destructive,
 * reason })` resolves to `{ ok: true, reason }` or `{ ok: false }`. With `reason: 'Motivo'` a non-empty reason is
 * required (deletions, rejections, cancellations).
 */
export function ConfirmProvider({ children }) {
  const [request, setRequest] = useState(null);
  const [reason, setReason] = useState('');
  const resolver = useRef(null);

  const confirm = useCallback((options) => {
    setReason('');
    setRequest(options);
    return new Promise((resolve) => {
      resolver.current = resolve;
    });
  }, []);

  const close = (result) => {
    resolver.current?.(result);
    resolver.current = null;
    setRequest(null);
  };

  const needsReason = Boolean(request?.reason);
  const canConfirm = !needsReason || reason.trim().length > 0;

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      <Dialog open={Boolean(request)} onOpenChange={(open) => !open && close({ ok: false })}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{request?.title}</DialogTitle>
            {request?.description && <DialogDescription>{request.description}</DialogDescription>}
          </DialogHeader>
          {needsReason && (
            <div className="space-y-2">
              <Label htmlFor="confirm-reason">{request.reason} *</Label>
              <Textarea id="confirm-reason" autoFocus value={reason} onChange={(e) => setReason(e.target.value)} rows={3} />
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => close({ ok: false })}>
              Cancelar
            </Button>
            <Button
              variant={request?.destructive ? 'destructive' : 'default'}
              disabled={!canConfirm}
              onClick={() => close({ ok: true, reason: reason.trim() || undefined })}
            >
              {request?.confirmLabel || 'Confirmar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ConfirmContext.Provider>
  );
}

export function useConfirm() {
  const confirm = useContext(ConfirmContext);
  if (!confirm) throw new Error('useConfirm must be used within ConfirmProvider');
  return confirm;
}
