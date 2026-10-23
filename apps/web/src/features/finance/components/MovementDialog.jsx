import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext.jsx';
import { useSucursales } from '@/features/catalogs';
import { useProjects } from '@/features/projects';
import { notify } from '@/shared/lib/notify.js';
import { useCashBoxes, useCreateMovement, useUpdateMovement } from '../api.js';
import { CONCEPTOS } from '../constants.js';

const TITLES = { egreso: 'Registrar gasto', ingreso: 'Otro ingreso', transferencia: 'Transferencia entre cajas' };
const today = () => new Date().toLocaleDateString('en-CA', { timeZone: 'America/La_Paz' });
const select = 'h-9 w-full rounded-md border border-input bg-background px-2 text-sm';

function initial(tipo, movement, user) {
  return {
    concepto: movement?.concepto || Object.keys(CONCEPTOS[tipo])[0],
    monto: movement ? String(Number(movement.monto)) : '',
    fecha: movement ? String(movement.fecha).slice(0, 10) : today(),
    metodo: movement?.metodo || 'efectivo',
    nota: movement?.nota || '',
    pagadoPor: movement?.pagadoPor || 'empresa',
    projectId: movement?.project?.id || '',
    sucursalId: movement?.sucursal?.id || user?.sucursalId || '',
    cajaId: 'caja_central',
    cajaDestinoId: '',
  };
}

/**
 * Register an expense (anyone), another income (commercial) or a transfer (Gerencia), or correct a movement that is
 * not validated yet. Payments of projects and jobs are registered on them, not here.
 */
export function MovementDialog({ tipo, movement, open, onOpenChange }) {
  const { currentUser, isVentasLevel } = useAuth();
  const create = useCreateMovement();
  const update = useUpdateMovement();
  const { data: sucursales = [] } = useSucursales();
  const { data: boxes = [] } = useCashBoxes();
  const { data: projects = [] } = useProjects(open && tipo === 'egreso' && isVentasLevel());
  const kind = movement?.tipo || tipo;
  const [form, setForm] = useState(() => initial(kind, movement, currentUser));
  useEffect(() => {
    if (open) setForm(initial(kind, movement, currentUser));
  }, [open, kind, movement, currentUser]);
  const set = (patch) => setForm((f) => ({ ...f, ...patch }));
  const saving = create.isPending || update.isPending;
  const concepts = movement && !CONCEPTOS[kind][movement.concepto] ? { [movement.concepto]: movement.concepto, ...CONCEPTOS[kind] } : CONCEPTOS[kind];

  async function submit(e) {
    e.preventDefault();
    const monto = Number(form.monto);
    if (!(monto > 0)) return notify.error('El monto debe ser mayor a 0');
    if (kind === 'transferencia' && (!form.cajaDestinoId || form.cajaDestinoId === form.cajaId)) return notify.error('Elige dos cajas distintas');
    const data = {
      concepto: form.concepto,
      monto,
      fecha: form.fecha,
      metodo: form.metodo,
      nota: form.nota,
      ...(kind === 'egreso' ? { pagadoPor: form.pagadoPor } : {}),
    };
    try {
      if (movement) {
        await update.mutateAsync({ id: movement.id, ...data });
        notify.success(movement.estado === 'observado' ? 'Corregido: vuelve a validación' : 'Movimiento corregido');
      } else {
        await create.mutateAsync({
          tipo: kind,
          ...data,
          sucursalId: form.sucursalId || undefined,
          ...(kind === 'egreso' && form.projectId ? { projectId: form.projectId } : {}),
          ...(kind === 'transferencia' ? { cajaId: form.cajaId, cajaDestinoId: form.cajaDestinoId } : {}),
        });
        notify.success(kind === 'transferencia' ? 'Transferencia registrada' : 'Registrado: queda por validar');
      }
      onOpenChange(false);
    } catch {
      /* shown by the query client */
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{movement ? 'Corregir movimiento' : TITLES[kind]}</DialogTitle>
          {movement?.motivo && <DialogDescription>Observación: {movement.motivo}</DialogDescription>}
        </DialogHeader>
        <form onSubmit={submit} className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1.5">
              <Label htmlFor="mv-concepto">Concepto</Label>
              <select id="mv-concepto" className={select} value={form.concepto} onChange={(e) => set({ concepto: e.target.value })}>
                {Object.entries(concepts).map(([k, label]) => <option key={k} value={k}>{label}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="mv-monto">Monto (Bs) *</Label>
              <Input id="mv-monto" type="number" min="0.01" step="0.01" autoFocus value={form.monto} onChange={(e) => set({ monto: e.target.value })} />
            </div>
          </div>
          {kind === 'egreso' && (
            <div className="space-y-1.5">
              <Label>¿Quién pagó?</Label>
              <div className="grid grid-cols-2 gap-2" role="radiogroup">
                {[['empresa', 'La empresa'], ['empleado', 'Yo (reembolso)']].map(([k, label]) => (
                  <Button key={k} type="button" role="radio" aria-checked={form.pagadoPor === k} variant={form.pagadoPor === k ? 'default' : 'outline'} onClick={() => set({ pagadoPor: k })}>
                    {label}
                  </Button>
                ))}
              </div>
            </div>
          )}
          {kind === 'egreso' && !movement && isVentasLevel() && (
            <div className="space-y-1.5">
              <Label htmlFor="mv-proyecto">Proyecto (suma a su costo)</Label>
              <select id="mv-proyecto" className={select} value={form.projectId} onChange={(e) => set({ projectId: e.target.value })}>
                <option value="">Gasto operativo (sin proyecto)</option>
                {projects.filter((p) => !['cerrado', 'anulado'].includes(p.estado)).map((p) => (
                  <option key={p.id} value={p.id}>{p.codigo} · {p.titulo}</option>
                ))}
              </select>
            </div>
          )}
          {kind === 'transferencia' && (
            <div className="grid grid-cols-2 gap-2">
              {[['cajaId', 'Desde'], ['cajaDestinoId', 'Hacia']].map(([field, label]) => (
                <div key={field} className="space-y-1.5">
                  <Label htmlFor={`mv-${field}`}>{label}</Label>
                  <select id={`mv-${field}`} className={select} value={form[field]} onChange={(e) => set({ [field]: e.target.value })}>
                    <option value="">Elige caja</option>
                    {boxes.map((b) => <option key={b.id} value={b.id}>{b.nombre}</option>)}
                  </select>
                </div>
              ))}
            </div>
          )}
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1.5">
              <Label htmlFor="mv-fecha">Fecha</Label>
              <Input id="mv-fecha" type="date" value={form.fecha} onChange={(e) => set({ fecha: e.target.value })} />
            </div>
            {!movement && kind !== 'transferencia' && (
              <div className="space-y-1.5">
                <Label htmlFor="mv-suc">Sucursal</Label>
                <select id="mv-suc" className={select} value={form.sucursalId} onChange={(e) => set({ sucursalId: e.target.value })}>
                  {sucursales.map((s) => <option key={s.id} value={s.id}>{s.nombre}</option>)}
                </select>
              </div>
            )}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="mv-nota">Nota</Label>
            <Input id="mv-nota" value={form.nota} onChange={(e) => set({ nota: e.target.value })} placeholder="Ej. factura 123, viaje a Punata" />
          </div>
          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" disabled={saving}>{movement ? 'Guardar' : 'Registrar'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
