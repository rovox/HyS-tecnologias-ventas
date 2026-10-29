import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext.jsx';
import { useSucursales } from '@/features/catalogs';
import { useProducts, useRegisterStockMovement } from '@/features/inventory';
import { SearchSelect } from '@/shared/views';
import { notify } from '@/shared/lib/notify.js';

const select = 'h-9 w-full rounded-md border border-input bg-background px-2 text-sm';

/**
 * Material used on a project job (SCH-04): it leaves the stock of a branch (the técnico's by default) and becomes
 * the project's material cost. The técnico can do it on his own jobs; the API checks the job and the stock.
 */
export function MaterialDialog({ job, open, onOpenChange }) {
  const { currentUser } = useAuth();
  const { data: products = [] } = useProducts(open);
  const { data: sucursales = [] } = useSucursales();
  const register = useRegisterStockMovement();
  const [form, setForm] = useState({ productoId: '', cantidad: '', sucursalOrigenId: '' });
  useEffect(() => {
    if (open) setForm({ productoId: '', cantidad: '', sucursalOrigenId: currentUser?.sucursalId || job?.sucursalId || '' });
  }, [open, currentUser, job]);
  const set = (patch) => setForm((f) => ({ ...f, ...patch }));
  const product = products.find((p) => p.id === form.productoId);
  const available = product ? Number(product.stock?.[form.sucursalOrigenId] || 0) : 0;
  const options = products
    .filter((p) => p.active !== false && p.tipo !== 'servicio')
    .map((p) => ({ value: p.id, label: `${p.codigo} — ${p.nombre} (${Number(p.stock?.[form.sucursalOrigenId] || 0)} ${p.unidad})` }));

  async function submit(e) {
    e.preventDefault();
    const cantidad = Number(form.cantidad);
    if (!form.productoId) return notify.error('Elige el material');
    if (!form.sucursalOrigenId) return notify.error('Elige de qué sucursal sale');
    if (!(cantidad > 0)) return notify.error('La cantidad debe ser mayor a 0');
    try {
      await register.mutateAsync({ tipo: 'salida_proyecto', productoId: form.productoId, cantidad, sucursalOrigenId: form.sucursalOrigenId, projectId: job.projectId, nota: `Trabajo: ${job.descripcionTrabajo}` });
      notify.success(`Material registrado en ${job.project?.codigo || 'el proyecto'}`, { description: `${cantidad} ${product.unidad} de ${product.nombre}` });
      onOpenChange(false);
    } catch {
      /* shown by the query client */
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Registrar material usado</DialogTitle>
          <DialogDescription>Sale del stock de la sucursal y queda como costo del proyecto {job?.project?.codigo}.</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="mat-suc">Sale de</Label>
            <select id="mat-suc" className={select} value={form.sucursalOrigenId} onChange={(e) => set({ sucursalOrigenId: e.target.value })}>
              <option value="">Elige sucursal</option>
              {sucursales.map((s) => <option key={s.id} value={s.id}>{s.nombre}</option>)}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="mat-prod">Material</Label>
            <SearchSelect id="mat-prod" aria-label="Material" value={form.productoId} onChange={(productoId) => set({ productoId })} placeholder="Buscar material…" searchPlaceholder="Código o nombre…" options={options} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="mat-cant">Cantidad{product ? ` (${product.unidad})` : ''}</Label>
            <Input id="mat-cant" type="number" min="0" step="0.01" value={form.cantidad} onChange={(e) => set({ cantidad: e.target.value })} />
            {product && Number(form.cantidad) > available && <p className="text-xs font-semibold text-danger-fg">Solo hay {available} {product.unidad} en esta sucursal</p>}
          </div>
          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" disabled={register.isPending}>Registrar</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
