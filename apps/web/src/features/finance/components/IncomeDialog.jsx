import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext.jsx';
import { useUserDirectory } from '@/features/catalogs';
import { ROLES } from '@/constants/roles.js';
import { SearchSelect } from '@/shared/views';
import { formatBs } from '@/shared/lib/format.js';
import { notify } from '@/shared/lib/notify.js';
import { useRegisterIncome } from '../api.js';

const TYPES = [
  ['adelanto', 'Adelanto'],
  ['cobro', 'Cobro'],
  ['adicional', 'Adicional'],
];
const METHODS = ['efectivo', 'transferencia', 'QR', 'tarjeta', 'otro'];

/**
 * One payment dialog for projects, stand-alone jobs and visits (a job of a project pays into the project; the API
 * routes it; a visit is charged as "asistencia" and owes nothing beforehand).
 * target: { kind: 'project' | 'job' | 'visit', id, title, saldo?, total? }. It records who received the money: until it is
 * validated, that person holds it ("por rendir"). A técnico only registers money he received himself.
 */
export function IncomeDialog({ target, open, onOpenChange }) {
  const navigate = useNavigate();
  const { currentUser, isSeguridad, readsAll } = useAuth();
  const { data: people = [] } = useUserDirectory();
  const pay = useRegisterIncome();
  const visit = target.kind === 'visit';
  const fresh = () => ({ concepto: visit ? 'asistencia' : target.cobrado > 0 ? 'cobro' : 'adelanto', monto: '', metodo: 'efectivo', nota: '', recibidoPorId: currentUser?.id || '' });
  const [form, setForm] = useState(fresh);
  useEffect(() => {
    if (open) setForm(fresh());
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps
  const set = (patch) => setForm((f) => ({ ...f, ...patch }));

  const saldo = target.saldo;
  const monto = Number(form.monto);
  const reducesBalance = !['adicional', 'asistencia'].includes(form.concepto);
  const error = !(monto > 0) ? 'Ingresa el monto' : reducesBalance && saldo !== undefined && monto > saldo ? `Supera el saldo (${formatBs(saldo)}): registra el excedente como adicional` : null;
  const holder = people.find((p) => p.id === form.recibidoPorId);

  async function submit(e) {
    e.preventDefault();
    if (error) return notify.error(error);
    try {
      await pay.mutateAsync({ target, concepto: form.concepto, monto, metodo: form.metodo, nota: form.nota || undefined, recibidoPorId: form.recibidoPorId || undefined });
      notify.success(`${form.concepto === 'adicional' ? 'Adicional' : visit ? 'Cobro de la asistencia' : 'Cobro'} de ${formatBs(monto)} registrado: queda por validar`, {
        description: holder ? `El dinero lo tiene ${holder.id === currentUser?.id ? 'usted' : holder.name} hasta entregarlo en caja.` : undefined,
        action: readsAll() ? { label: 'Ver por rendir', onClick: () => navigate('/finanzas?vista=por_rendir') } : undefined,
      });
      onOpenChange(false);
    } catch {
      /* shown by the query client */
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Registrar cobro{target.title ? ` en ${target.title}` : ''}</DialogTitle>
          {saldo !== undefined && (
            <DialogDescription>
              Saldo pendiente: <strong className={saldo > 0 ? 'text-danger-fg' : 'text-success-fg'}>{formatBs(saldo)}</strong>
              {target.total !== undefined && ` de ${formatBs(target.total)}`}
            </DialogDescription>
          )}
        </DialogHeader>
        <form onSubmit={submit} className="space-y-3">
          {visit ? (
            <p className="text-sm text-muted-foreground">Cobro de la asistencia: va al libro de caja y queda por validar.</p>
          ) : (
            <>
              <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label="Tipo de cobro">
                {TYPES.map(([key, label]) => (
                  <Button key={key} type="button" role="radio" aria-checked={form.concepto === key} variant={form.concepto === key ? 'default' : 'outline'} onClick={() => set({ concepto: key })}>
                    {label}
                  </Button>
                ))}
              </div>
              {!reducesBalance && <p className="text-xs text-muted-foreground">Un adicional es un cobro extra: no reduce el saldo.</p>}
            </>
          )}
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1.5">
              <Label htmlFor="inc-monto">Monto (Bs) *</Label>
              <Input id="inc-monto" type="number" min="0.01" step="0.01" autoFocus value={form.monto} onChange={(e) => set({ monto: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="inc-metodo">Método</Label>
              <select id="inc-metodo" className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm" value={form.metodo} onChange={(e) => set({ metodo: e.target.value })}>
                {METHODS.map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
          </div>
          {form.monto && error && <p className="text-xs font-semibold text-danger-fg">{error}</p>}
          <div className="space-y-1.5">
            <Label htmlFor="inc-recibe">¿Quién recibió el dinero?</Label>
            {isSeguridad() ? (
              <p className="text-sm">Usted: lo entrega en caja y Contabilidad lo valida.</p>
            ) : (
              <SearchSelect
                id="inc-recibe"
                value={form.recibidoPorId}
                onChange={(recibidoPorId) => set({ recibidoPorId: recibidoPorId || currentUser?.id })}
                searchPlaceholder="Buscar persona…"
                options={people.filter((p) => p.role !== ROLES.NONE).map((p) => ({ value: p.id, label: p.id === currentUser?.id ? `${p.name} (yo)` : p.name, hint: p.role }))}
              />
            )}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="inc-nota">Nota</Label>
            <Input id="inc-nota" value={form.nota} placeholder="Ej. recibo 123, pago por QR" onChange={(e) => set({ nota: e.target.value })} />
          </div>
          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" variant="success" disabled={pay.isPending || Boolean(error)}>Registrar cobro</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
