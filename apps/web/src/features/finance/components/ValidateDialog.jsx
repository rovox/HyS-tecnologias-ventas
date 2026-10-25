import { useEffect, useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { formatBs } from '@/shared/lib/format.js';
import { notify } from '@/shared/lib/notify.js';
import { useCashBoxes, useMovementAction, useMovementImpact } from '../api.js';
import { CONCEPTO_LABEL } from '../constants.js';
import { impactText } from './useMovementActions.js';

/** Rendición into a box chosen by hand (the ✓ button uses the branch's box). Shows what the box will hold. */
export function ValidateDialog({ movement, onClose }) {
  const { data: boxes = [] } = useCashBoxes();
  const action = useMovementAction();
  const impact = useMovementImpact();
  const [cajaId, setCajaId] = useState('');
  const [effect, setEffect] = useState([]);
  useEffect(() => {
    if (movement) setCajaId(boxes.find((b) => b.sucursalId === movement.sucursal?.id)?.id || boxes[0]?.id || '');
  }, [movement, boxes]);
  useEffect(() => {
    if (!movement || !cajaId) return setEffect([]);
    let live = true;
    impact(movement.id, 'validar', cajaId)
      .then((r) => live && setEffect(impactText(r.efectos)))
      .catch(() => live && setEffect([]));
    return () => {
      live = false;
    };
  }, [movement, cajaId]); // eslint-disable-line react-hooks/exhaustive-deps

  async function validate() {
    try {
      await action.mutateAsync({ id: movement.id, action: 'validar', cajaId });
      notify.success(`Validado en ${boxes.find((b) => b.id === cajaId)?.nombre}`);
      onClose();
    } catch {
      /* shown by the query client */
    }
  }

  return (
    <Dialog open={Boolean(movement)} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Validar en una caja</DialogTitle>
          {movement && (
            <DialogDescription>
              {CONCEPTO_LABEL[movement.concepto] || movement.concepto} de {formatBs(movement.monto)}, registró {movement.registradoPor?.name}
              {movement.recibidoPor && movement.recibidoPor.id !== movement.registradoPor?.id ? `; el dinero lo tiene ${movement.recibidoPor.name}` : ''}.
            </DialogDescription>
          )}
        </DialogHeader>
        <div className="space-y-1.5">
          <Label htmlFor="val-caja">¿En qué caja está el dinero?</Label>
          <select id="val-caja" className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm" value={cajaId} onChange={(e) => setCajaId(e.target.value)}>
            {boxes.map((b) => (
              <option key={b.id} value={b.id}>
                {b.nombre} (hoy {formatBs(b.saldo)})
              </option>
            ))}
          </select>
        </div>
        {effect.length > 0 && (
          <ul className="space-y-1 rounded-md border border-success-border bg-success-soft px-3 py-2 text-sm text-success-fg">
            {effect.map((e) => (
              <li key={e} className="flex gap-2">
                <ArrowRight className="mt-0.5 h-4 w-4 shrink-0" aria-hidden /> {e}
              </li>
            ))}
          </ul>
        )}
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button variant="success" disabled={!cajaId || action.isPending} onClick={validate}>Validar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
