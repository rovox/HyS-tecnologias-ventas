import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { formatBs } from '@/shared/lib/format.js';
import { notify } from '@/shared/lib/notify.js';
import { useCashBoxes, useMovementAction } from '../api.js';
import { CONCEPTO_LABEL } from '../constants.js';

/** Rendición: the money is in this box. The branch's box is suggested. */
export function ValidateDialog({ movement, onClose }) {
  const { data: boxes = [] } = useCashBoxes();
  const action = useMovementAction();
  const [cajaId, setCajaId] = useState('');
  useEffect(() => {
    if (movement) setCajaId(boxes.find((b) => b.sucursalId === movement.sucursal?.id)?.id || boxes[0]?.id || '');
  }, [movement, boxes]);

  async function validate() {
    try {
      await action.mutateAsync({ id: movement.id, action: 'validar', cajaId });
      notify.success('Movimiento validado');
      onClose();
    } catch {
      /* shown by the query client */
    }
  }

  return (
    <Dialog open={Boolean(movement)} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Validar movimiento</DialogTitle>
          {movement && (
            <DialogDescription>
              {CONCEPTO_LABEL[movement.concepto] || movement.concepto} de {formatBs(movement.monto)} · registró {movement.registradoPor?.name}
            </DialogDescription>
          )}
        </DialogHeader>
        <div className="space-y-1.5">
          <Label htmlFor="val-caja">¿En qué caja está el dinero?</Label>
          <select id="val-caja" className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm" value={cajaId} onChange={(e) => setCajaId(e.target.value)}>
            {boxes.map((b) => <option key={b.id} value={b.id}>{b.nombre}</option>)}
          </select>
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button disabled={!cajaId || action.isPending} onClick={validate}>Validar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
