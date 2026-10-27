import { useEffect, useMemo, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/contexts/AuthContext.jsx';
import { useSucursales } from '@/features/catalogs';
import { SearchSelect } from '@/shared/views';
import { notify } from '@/shared/lib/notify.js';
import { cn } from '@/lib/utils';
import { useProducts, useRegisterStockBatch } from '../api.js';

/** Every branch is supplied by Central (owner 2026-10-27): purchases enter there. */
const CENTRAL = 'suc_central';
const select = 'h-9 w-full rounded-md border border-input bg-background px-2 text-sm';
const KIND = {
  entrada: { title: 'Agregar material (compra)', description: 'Lo comprado entra a Central; desde ahí se abastece a las sucursales.', done: 'Material agregado', cost: true },
  transferencia: { title: 'Mover a otra sucursal', description: 'Sale de una sucursal y entra a otra: el total de la empresa no cambia.', done: 'Material movido' },
  baja: { title: 'Quitar material', description: 'Sale del inventario para siempre (dañado, perdido, uso interno). Pide el motivo.', done: 'Material quitado' },
};
const REASONS = ['Dañado', 'Perdido', 'Uso interno', 'Vencido'];
const line = () => ({ key: Math.random().toString(36).slice(2), productoId: '', cantidad: '', costoUnitario: '' });

/**
 * Several products moved the same way in one go (INV-03 quick actions): entrada (purchase, into Central), transferencia
 * or baja. A seller moves from his branch or Central and removes only from his branch; Gerencia from any. All lines or
 * none (the API checks the stock of each one).
 */
export function BatchMovementDialog({ tipo, onClose }) {
  const { currentUser, isAdmin } = useAuth();
  const manager = isAdmin();
  const { data: sucursales = [] } = useSucursales();
  const { data: products = [] } = useProducts(Boolean(tipo));
  const register = useRegisterStockBatch();
  const own = currentUser?.sucursalId || CENTRAL;
  const [form, setForm] = useState(null);
  useEffect(() => {
    if (tipo) setForm({ origen: tipo === 'transferencia' ? CENTRAL : own, destino: tipo === 'entrada' ? CENTRAL : tipo === 'transferencia' && own !== CENTRAL ? own : '', motivo: '', lines: [line()] });
  }, [tipo, own]);
  const kind = KIND[tipo];
  const origins = manager ? sucursales : sucursales.filter((s) => (tipo === 'baja' ? s.id === own : s.id === own || s.id === CENTRAL));
  const destinations = tipo === 'entrada' && !manager ? sucursales.filter((s) => s.id === CENTRAL) : sucursales.filter((s) => s.id !== form?.origen);
  const options = useMemo(
    () => products.filter((p) => p.active !== false && p.tipo !== 'servicio').map((p) => ({ value: p.id, label: `${p.codigo} — ${p.nombre}`, hint: form?.origen && tipo !== 'entrada' ? `${p.stock?.[form.origen] ?? 0} ${p.unidad} en el origen` : p.unidad, keywords: p.marca })),
    [products, form?.origen, tipo],
  );
  if (!kind || !form) return null;
  const set = (patch) => setForm((f) => ({ ...f, ...patch }));
  const setLine = (key, patch) => set({ lines: form.lines.map((l) => (l.key === key ? { ...l, ...patch } : l)) });
  const productOf = (id) => products.find((p) => p.id === id);
  const needsOrigin = tipo !== 'entrada';
  const needsDestination = tipo !== 'baja';

  async function submit(e) {
    e.preventDefault();
    const lines = form.lines.filter((l) => l.productoId);
    if (!lines.length) return notify.error('Agrega al menos un producto');
    if (lines.some((l) => !(Number(l.cantidad) > 0))) return notify.error('Cada cantidad debe ser mayor a 0');
    if (needsOrigin && !form.origen) return notify.error('Elige de qué sucursal sale');
    if (needsDestination && !form.destino) return notify.error('Elige a qué sucursal entra');
    if (tipo === 'baja' && !form.motivo.trim()) return notify.error('Indica por qué se quita el material');
    try {
      await register.mutateAsync({
        tipo,
        ...(needsOrigin ? { sucursalOrigenId: form.origen } : {}),
        ...(needsDestination ? { sucursalDestinoId: form.destino } : {}),
        ...(form.motivo.trim() ? { motivo: form.motivo.trim() } : {}),
        items: lines.map((l) => ({ productoId: l.productoId, cantidad: Number(l.cantidad), ...(kind.cost && l.costoUnitario !== '' ? { costoUnitario: Number(l.costoUnitario) } : {}) })),
      });
      notify.success(`${kind.done}: ${lines.length} producto${lines.length > 1 ? 's' : ''}`);
      onClose();
    } catch {
      /* shown by the query client (it names the product without stock) */
    }
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90dvh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{kind.title}</DialogTitle>
          <DialogDescription>{kind.description}</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            {needsOrigin && (
              <div className="space-y-1.5">
                <Label htmlFor="batch-from">Sale de</Label>
                <select id="batch-from" className={select} value={form.origen} onChange={(e) => set({ origen: e.target.value, destino: form.destino === e.target.value ? '' : form.destino })}>
                  {origins.map((s) => <option key={s.id} value={s.id}>{s.nombre}</option>)}
                </select>
              </div>
            )}
            {needsDestination && (
              <div className="space-y-1.5">
                <Label htmlFor="batch-to">Entra a</Label>
                <select id="batch-to" className={select} value={form.destino} onChange={(e) => set({ destino: e.target.value })}>
                  <option value="">Elige sucursal</option>
                  {destinations.map((s) => <option key={s.id} value={s.id}>{s.nombre}</option>)}
                </select>
              </div>
            )}
          </div>
          <section className="space-y-2">
            {form.lines.map((l, i) => {
              const p = productOf(l.productoId);
              const available = needsOrigin && p ? Number(p.stock?.[form.origen] ?? 0) : null;
              const over = available !== null && Number(l.cantidad) > available;
              return (
                <div key={l.key} className="grid grid-cols-12 items-start gap-2">
                  <div className={kind.cost ? 'col-span-6' : 'col-span-8'}>
                    <SearchSelect aria-label={`Producto ${i + 1}`} value={l.productoId} onChange={(productoId) => setLine(l.key, { productoId, costoUnitario: kind.cost ? String(Number(productOf(productoId)?.costo) || '') : '' })} placeholder="Buscar producto…" searchPlaceholder="Código, nombre o marca…" options={options} />
                    {p && available !== null && <p className={cn('mt-0.5 text-xs', over ? 'font-semibold text-danger-fg' : 'text-muted-foreground')}>Hay {available} {p.unidad} en el origen</p>}
                  </div>
                  <Input className="col-span-3" aria-label={`Cantidad ${i + 1}`} type="number" min="0" step="0.01" placeholder={p?.unidad || 'Cantidad'} value={l.cantidad} onChange={(e) => setLine(l.key, { cantidad: e.target.value })} />
                  {kind.cost && <Input className="col-span-2" aria-label={`Costo unitario ${i + 1}`} type="number" min="0" step="0.01" placeholder="Costo" value={l.costoUnitario} onChange={(e) => setLine(l.key, { costoUnitario: e.target.value })} />}
                  <Button type="button" variant="ghost" size="icon" className="col-span-1 h-9 w-9 text-danger-fg" aria-label={`Quitar línea ${i + 1}`} disabled={form.lines.length === 1} onClick={() => set({ lines: form.lines.filter((x) => x.key !== l.key) })}>
                    <Trash2 />
                  </Button>
                </div>
              );
            })}
            <Button type="button" variant="outline" size="sm" onClick={() => set({ lines: [...form.lines, line()] })}>
              <Plus /> Agregar producto
            </Button>
          </section>
          {tipo === 'baja' ? (
            <div className="space-y-2">
              <Label htmlFor="batch-reason">Motivo *</Label>
              <div className="flex flex-wrap gap-1.5">
                {REASONS.map((r) => (
                  <button key={r} type="button" onClick={() => set({ motivo: r })} className={cn('rounded-md border px-2 py-1 text-xs font-medium', form.motivo === r ? 'border-primary bg-primary text-primary-foreground' : 'border-border hover:bg-muted')}>
                    {r}
                  </button>
                ))}
              </div>
              <Textarea id="batch-reason" rows={2} value={form.motivo} onChange={(e) => set({ motivo: e.target.value })} />
            </div>
          ) : (
            <div className="space-y-1.5">
              <Label htmlFor="batch-note">Nota (opcional)</Label>
              <Input id="batch-note" value={form.motivo} placeholder={tipo === 'entrada' ? 'Proveedor, factura…' : 'Para qué se mueve'} onChange={(e) => set({ motivo: e.target.value })} />
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
            <Button type="submit" variant={tipo === 'baja' ? 'destructive' : 'default'} disabled={register.isPending}>{register.isPending ? 'Guardando…' : kind.title.split(' (')[0]}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
