import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useSucursales } from '@/features/catalogs';
import { useProjects } from '@/features/projects';
import { notify } from '@/shared/lib/notify.js';
import { useRegisterStockMovement } from '../api.js';

export const MOVEMENT = {
  entrada: { title: 'Entrada (compra)', done: 'Entrada registrada' },
  transferencia: { title: 'Transferir entre sucursales', done: 'Transferencia registrada' },
  salida_proyecto: { title: 'Salida a un proyecto', done: 'Salida registrada: suma al costo del proyecto' },
  ajuste: { title: 'Ajuste de inventario', done: 'Ajuste registrado' },
};
const select = 'h-9 w-full rounded-md border border-input bg-background px-2 text-sm';

/** Move stock of one product. The API refuses going below zero; adjustments are for Gerencia, with a reason. */
export function StockMovementDialog({ product, tipo, onClose }) {
  const register = useRegisterStockMovement();
  const { data: sucursales = [] } = useSucursales();
  const { data: projects = [] } = useProjects(tipo === 'salida_proyecto');
  const [form, setForm] = useState({});
  useEffect(() => {
    if (product) setForm({ cantidad: '', origen: sucursales[0]?.id || '', destino: '', costoUnitario: String(Number(product.costo)), projectId: '', sentido: 'faltante', motivo: '', nota: '' });
  }, [product, tipo, sucursales]);
  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));
  if (!product) return null;

  const needsOrigin = tipo === 'transferencia' || tipo === 'salida_proyecto' || (tipo === 'ajuste' && form.sentido === 'faltante');
  const needsDest = tipo === 'entrada' || tipo === 'transferencia' || (tipo === 'ajuste' && form.sentido === 'sobrante');
  const available = needsOrigin ? product.stock[form.origen] ?? 0 : null;

  async function submit(e) {
    e.preventDefault();
    const cantidad = Number(form.cantidad);
    if (!(cantidad > 0)) return notify.error('Ingresa la cantidad');
    try {
      await register.mutateAsync({
        productoId: product.id,
        tipo,
        cantidad,
        ...(needsOrigin ? { sucursalOrigenId: form.origen } : {}),
        ...(needsDest ? { sucursalDestinoId: tipo === 'ajuste' ? form.origen : form.destino } : {}),
        ...(tipo === 'entrada' ? { costoUnitario: Number(form.costoUnitario) || 0 } : {}),
        ...(tipo === 'salida_proyecto' ? { projectId: form.projectId } : {}),
        ...(tipo === 'ajuste' ? { motivo: form.motivo } : {}),
        nota: form.nota,
      });
      notify.success(MOVEMENT[tipo].done);
      onClose();
    } catch {
      /* shown by the query client */
    }
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{MOVEMENT[tipo].title}</DialogTitle>
          <DialogDescription>{product.codigo} · {product.nombre}</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-3">
          {tipo === 'ajuste' && (
            <div className="grid grid-cols-2 gap-2" role="radiogroup">
              {[['faltante', 'Faltante (baja)'], ['sobrante', 'Sobrante (sube)']].map(([k, label]) => (
                <Button key={k} type="button" role="radio" aria-checked={form.sentido === k} variant={form.sentido === k ? 'default' : 'outline'} onClick={() => setForm((f) => ({ ...f, sentido: k }))}>{label}</Button>
              ))}
            </div>
          )}
          <div className="grid grid-cols-2 gap-2">
            {(needsOrigin || tipo === 'ajuste') && (
              <div className="space-y-1.5">
                <Label htmlFor="sm-origen">{tipo === 'ajuste' ? 'Sucursal' : 'Sale de'}</Label>
                <select id="sm-origen" className={select} value={form.origen} onChange={set('origen')}>
                  {sucursales.map((s) => <option key={s.id} value={s.id}>{s.nombre} ({product.stock[s.id] ?? 0})</option>)}
                </select>
              </div>
            )}
            {needsDest && tipo !== 'ajuste' && (
              <div className="space-y-1.5">
                <Label htmlFor="sm-destino">{tipo === 'entrada' ? 'Entra a' : 'Hacia'}</Label>
                <select id="sm-destino" className={select} value={form.destino} onChange={set('destino')}>
                  <option value="">Elige la sucursal</option>
                  {sucursales.filter((s) => tipo === 'entrada' || s.id !== form.origen).map((s) => <option key={s.id} value={s.id}>{s.nombre}</option>)}
                </select>
              </div>
            )}
            <div className="space-y-1.5">
              <Label htmlFor="sm-cant">Cantidad ({product.unidad}) *</Label>
              <Input id="sm-cant" type="number" min="0.01" step="0.01" autoFocus value={form.cantidad} onChange={set('cantidad')} />
            </div>
            {tipo === 'entrada' && (
              <div className="space-y-1.5">
                <Label htmlFor="sm-costo">Costo unitario (Bs)</Label>
                <Input id="sm-costo" type="number" min="0" step="0.01" value={form.costoUnitario} onChange={set('costoUnitario')} />
              </div>
            )}
          </div>
          {available !== null && Number(form.cantidad) > available && <p className="text-xs text-destructive">Solo hay {available} {product.unidad} en esa sucursal.</p>}
          {tipo === 'salida_proyecto' && (
            <div className="space-y-1.5">
              <Label htmlFor="sm-proyecto">Proyecto *</Label>
              <select id="sm-proyecto" className={select} value={form.projectId} onChange={set('projectId')}>
                <option value="">Elige el proyecto</option>
                {projects.filter((p) => !['cerrado', 'anulado'].includes(p.estado)).map((p) => <option key={p.id} value={p.id}>{p.codigo} · {p.titulo}</option>)}
              </select>
            </div>
          )}
          {tipo === 'ajuste' && (
            <div className="space-y-1.5">
              <Label htmlFor="sm-motivo">Motivo *</Label>
              <Input id="sm-motivo" value={form.motivo} onChange={set('motivo')} placeholder="Ej. conteo físico, dañado" />
            </div>
          )}
          <div className="space-y-1.5">
            <Label htmlFor="sm-nota">Nota</Label>
            <Input id="sm-nota" value={form.nota} onChange={set('nota')} placeholder="Ej. factura 123" />
          </div>
          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
            <Button type="submit" disabled={register.isPending}>Registrar</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
