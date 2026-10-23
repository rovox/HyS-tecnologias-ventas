import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext.jsx';
import { useProject } from '@/features/projects';
import { formatBs } from '@/shared/lib/format.js';
import { notify } from '@/shared/lib/notify.js';
import { useRegisterJobPayment } from '../api.js';

const TYPES = [['adelanto', 'Adelanto'], ['cobro', 'Cobro'], ['extra_asistencia', 'Adicional']];
const METHODS = ['efectivo', 'transferencia', 'QR', 'tarjeta', 'otro'];

/** A payment taken on a job. For a job of a project it is booked on the project (the API routes it). */
export function JobPaymentDialog({ job, open, onOpenChange }) {
  const { isVentasLevel } = useAuth();
  const pay = useRegisterJobPayment();
  const { data: project } = useProject(job.projectId, open && isVentasLevel());
  const [form, setForm] = useState({ tipo: 'cobro', monto: '', metodo: 'efectivo', nota: '' });
  useEffect(() => {
    if (open) setForm({ tipo: 'cobro', monto: '', metodo: 'efectivo', nota: '' });
  }, [open]);

  const saldo = job.projectId ? project?.saldo : Number(job.saldo);
  const monto = Number(form.monto);
  const over = form.tipo !== 'extra_asistencia' && saldo !== undefined && monto > saldo;

  async function submit(e) {
    e.preventDefault();
    if (!(monto > 0)) return notify.error('Ingresa el monto');
    if (over) return notify.error(`Supera el saldo (${formatBs(saldo)}): registra el excedente como adicional`);
    try {
      await pay.mutateAsync({ id: job.id, tipo: form.tipo, monto, metodo: form.metodo, nota: form.nota || undefined });
      notify.success(`Cobro de ${formatBs(monto)} registrado: queda por validar`);
      onOpenChange(false);
    } catch {
      /* shown by the query client */
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Registrar cobro</DialogTitle>
          <DialogDescription>
            {job.project ? `Se registra en el proyecto ${job.project.codigo}.` : job.cliente?.nombre}
            {saldo !== undefined && ` Saldo pendiente: ${formatBs(saldo)}.`}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-3">
          <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label="Tipo">
            {TYPES.map(([key, label]) => (
              <Button key={key} type="button" role="radio" aria-checked={form.tipo === key} variant={form.tipo === key ? 'default' : 'outline'} onClick={() => setForm({ ...form, tipo: key })}>
                {label}
              </Button>
            ))}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="jp-monto">Monto (Bs) *</Label>
            <Input id="jp-monto" type="number" min="0.01" step="0.01" autoFocus value={form.monto} onChange={(e) => setForm({ ...form, monto: e.target.value })} />
            {over && <p className="text-xs text-destructive">Supera el saldo: registra el excedente como adicional</p>}
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1.5">
              <Label htmlFor="jp-metodo">Método</Label>
              <select id="jp-metodo" className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm" value={form.metodo} onChange={(e) => setForm({ ...form, metodo: e.target.value })}>
                {METHODS.map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="jp-nota">Nota</Label>
              <Input id="jp-nota" value={form.nota} onChange={(e) => setForm({ ...form, nota: e.target.value })} />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" disabled={pay.isPending || over}>Registrar</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
