import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { formatBs } from '@/shared/lib/format.js';
import { notify } from '@/shared/lib/notify.js';
import { useRegisterProjectPayment } from '../api.js';

const METHODS = ['efectivo', 'transferencia', 'QR', 'tarjeta', 'otro'];

/** Register a payment of a project. The API rejects a cobro above the balance (the excess is an "adicional"). */
export function PaymentDialog({ project, open, onOpenChange }) {
  const pay = useRegisterProjectPayment();
  const [form, setForm] = useState({ concepto: 'cobro', monto: '', metodo: 'efectivo', nota: '' });
  useEffect(() => {
    if (open) setForm({ concepto: project.cobrado > 0 ? 'cobro' : 'adelanto', monto: '', metodo: 'efectivo', nota: '' });
  }, [open, project.cobrado]);

  const reducesBalance = form.concepto !== 'adicional';
  const monto = Number(form.monto);
  const error = !(monto > 0) ? 'Ingresa el monto' : reducesBalance && monto > project.saldo ? `Supera el saldo (${formatBs(project.saldo)}): registra el excedente como adicional` : null;

  async function submit(e) {
    e.preventDefault();
    if (error) return notify.error(error);
    try {
      await pay.mutateAsync({ id: project.id, concepto: form.concepto, monto, metodo: form.metodo, nota: form.nota || undefined });
      notify.success(`${form.concepto === 'adicional' ? 'Adicional' : 'Cobro'} de ${formatBs(monto)} registrado: queda por validar`);
      onOpenChange(false);
    } catch {
      /* shown by the query client */
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Registrar cobro · {project.codigo}</DialogTitle>
          <DialogDescription>Saldo pendiente: {formatBs(project.saldo)} de {formatBs(project.montoOficial)}</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-3">
          <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label="Tipo">
            {[['adelanto', 'Adelanto'], ['cobro', 'Cobro'], ['adicional', 'Adicional']].map(([key, label]) => (
              <Button key={key} type="button" role="radio" aria-checked={form.concepto === key} variant={form.concepto === key ? 'default' : 'outline'} onClick={() => setForm({ ...form, concepto: key })}>
                {label}
              </Button>
            ))}
          </div>
          {!reducesBalance && <p className="text-xs text-muted-foreground">Un adicional es un cobro extra: no reduce el saldo del proyecto.</p>}
          <div className="space-y-1.5">
            <Label htmlFor="pay-monto">Monto (Bs) *</Label>
            <Input id="pay-monto" type="number" min="0.01" step="0.01" autoFocus value={form.monto} onChange={(e) => setForm({ ...form, monto: e.target.value })} />
            {form.monto && error && <p className="text-xs text-destructive">{error}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="pay-metodo">Método</Label>
            <select id="pay-metodo" className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm" value={form.metodo} onChange={(e) => setForm({ ...form, metodo: e.target.value })}>
              {METHODS.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="pay-nota">Nota</Label>
            <Input id="pay-nota" value={form.nota} onChange={(e) => setForm({ ...form, nota: e.target.value })} />
          </div>
          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" disabled={pay.isPending || Boolean(error)}>Registrar</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
