import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/contexts/AuthContext.jsx';
import { useSucursales, useUserDirectory } from '@/features/catalogs';
import { useProducts } from '@/features/inventory';
import { formatDay } from '@/shared/lib/format.js';
import { notify } from '@/shared/lib/notify.js';
import { useOpenJobs, useOrder, useSaveOrder } from '../api.js';
import { OrderItems, emptyItem } from './OrderItems.jsx';

const PRIORIDADES = ['Baja', 'Normal', 'Alta', 'Urgente'];
const select = 'h-9 w-full rounded-md border border-input bg-background px-2 text-sm';

function fromOrder(data, user, defaultOrigin) {
  const p = data?.pedido;
  return {
    tipo: p?.cronogramaId ? 'trabajo' : 'sucursal',
    cronogramaId: p?.cronogramaId || '',
    sucursalOrigenId: p?.sucursalOrigenId || defaultOrigin || '',
    sucursalDestinoId: p?.cronogramaId ? '' : p?.sucursalDestinoId || '',
    responsableId: p?.responsableId || user?.id || '',
    prioridad: p?.prioridad || 'Normal',
    fecha: p?.fechaEntregaEstimada ? String(p.fechaEntregaEstimada).slice(0, 10) : new Date().toLocaleDateString('en-CA'), // today, local
    observaciones: p?.observaciones || '',
    items: data?.detalles?.length
      ? data.detalles.map((d) => ({ key: d.id, productoId: d.productoId || '', materialNombre: d.materialNombre, cantidad: String(d.cantidad), unidad: d.unidad, costoUnitario: d.costoUnitario ?? '', observaciones: d.observaciones || '' }))
      : [emptyItem()],
  };
}

/**
 * New or edit an internal order: material for a job (catalog items go out to its project on delivery) or for a branch
 * (catalog items move between branches). State changes are on the order page.
 */
export function OrderFormDialog({ open, onOpenChange, pedidoId, readOnly, onSaved }) {
  const { currentUser } = useAuth();
  const { data: order, isLoading } = useOrder(open ? pedidoId : null);
  const { data: sucursales = [] } = useSucursales();
  const { data: users = [] } = useUserDirectory();
  const { data: products = [] } = useProducts(open);
  const [form, setForm] = useState(null);
  const { data: jobs = [] } = useOpenJobs(open && form?.tipo === 'trabajo');
  const save = useSaveOrder();

  useEffect(() => {
    if (!open) return setForm(null);
    if (!pedidoId || order) setForm(fromOrder(order, currentUser, sucursales[0]?.id));
  }, [open, pedidoId, order, currentUser, sucursales]);
  const set = (patch) => setForm((f) => ({ ...f, ...patch }));

  async function submit(e) {
    e.preventDefault();
    if (form.tipo === 'trabajo' && !form.cronogramaId) return notify.error('Elige el trabajo');
    if (form.tipo === 'sucursal' && (!form.sucursalDestinoId || form.sucursalDestinoId === form.sucursalOrigenId)) return notify.error('Elige una sucursal de destino distinta al origen');
    if (!form.fecha) return notify.error('Indica la fecha requerida');
    const items = form.items.filter((i) => i.materialNombre.trim());
    if (!items.length) return notify.error('Agrega al menos un material');
    try {
      const saved = await save.mutateAsync({
        id: pedidoId,
        responsableId: form.responsableId,
        sucursalOrigenId: form.sucursalOrigenId,
        sucursalDestinoId: form.tipo === 'sucursal' ? form.sucursalDestinoId : '',
        cronogramaId: form.tipo === 'trabajo' ? form.cronogramaId : '',
        prioridad: form.prioridad,
        fechaEntregaEstimada: `${form.fecha}T12:00:00.000Z`,
        observaciones: form.observaciones,
        items: items.map((i) => ({
          ...(i.productoId ? { productoId: i.productoId } : {}),
          materialNombre: i.materialNombre.trim(),
          cantidad: Number(i.cantidad) || 1,
          unidad: i.unidad || 'unidad',
          ...(i.costoUnitario !== '' ? { costoUnitario: Number(i.costoUnitario) } : {}),
          ...(i.observaciones ? { observaciones: i.observaciones } : {}),
        })),
      });
      notify.success(pedidoId ? 'Pedido guardado' : 'Pedido creado');
      onOpenChange(false);
      onSaved?.(saved);
    } catch {
      /* shown by the query client */
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>{readOnly ? 'Pedido interno' : pedidoId ? 'Editar pedido interno' : 'Nuevo pedido interno'}</DialogTitle>
          <DialogDescription>Los ítems del inventario mueven stock al entregarse: al proyecto del trabajo o a la sucursal de destino.</DialogDescription>
        </DialogHeader>
        {!form || (pedidoId && isLoading) ? (
          <Skeleton className="h-64 w-full" />
        ) : (
          <form onSubmit={submit} className="space-y-3">
            <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Para">
              {[['trabajo', 'Para un trabajo'], ['sucursal', 'Para una sucursal']].map(([key, label]) => (
                <Button key={key} type="button" role="radio" aria-checked={form.tipo === key} variant={form.tipo === key ? 'default' : 'outline'} disabled={readOnly} onClick={() => set({ tipo: key })}>
                  {label}
                </Button>
              ))}
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="ord-origen">Sale de</Label>
                <select id="ord-origen" className={select} value={form.sucursalOrigenId} disabled={readOnly} onChange={(e) => set({ sucursalOrigenId: e.target.value })}>
                  {sucursales.map((s) => <option key={s.id} value={s.id}>{s.nombre}</option>)}
                </select>
              </div>
              {form.tipo === 'trabajo' ? (
                <div className="space-y-1.5">
                  <Label htmlFor="ord-trabajo">Trabajo *</Label>
                  <select id="ord-trabajo" className={select} value={form.cronogramaId} disabled={readOnly} onChange={(e) => set({ cronogramaId: e.target.value })}>
                    <option value="">Elige el trabajo</option>
                    {jobs.map((j) => (
                      <option key={j.id} value={j.id}>
                        {j.cliente?.nombre} · {j.descripcionTrabajo} · {formatDay(j.fechaProgramada)}{j.project ? ` · ${j.project.codigo}` : ' · sin proyecto'}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="space-y-1.5">
                  <Label htmlFor="ord-destino">Para la sucursal *</Label>
                  <select id="ord-destino" className={select} value={form.sucursalDestinoId} disabled={readOnly} onChange={(e) => set({ sucursalDestinoId: e.target.value })}>
                    <option value="">Elige la sucursal</option>
                    {sucursales.filter((s) => s.id !== form.sucursalOrigenId).map((s) => <option key={s.id} value={s.id}>{s.nombre}</option>)}
                  </select>
                </div>
              )}
              <div className="space-y-1.5">
                <Label htmlFor="ord-resp">Solicita</Label>
                <select id="ord-resp" className={select} value={form.responsableId} disabled={readOnly} onChange={(e) => set({ responsableId: e.target.value })}>
                  {users.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1.5">
                  <Label htmlFor="ord-prio">Prioridad</Label>
                  <select id="ord-prio" className={select} value={form.prioridad} disabled={readOnly} onChange={(e) => set({ prioridad: e.target.value })}>
                    {PRIORIDADES.map((p) => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="ord-fecha">Para el *</Label>
                  <Input id="ord-fecha" type="date" value={form.fecha} disabled={readOnly} onChange={(e) => set({ fecha: e.target.value })} />
                </div>
              </div>
            </div>
            <OrderItems items={form.items} onChange={(items) => set({ items })} products={products} origin={form.sucursalOrigenId} readOnly={readOnly} />
            <div className="space-y-1.5">
              <Label htmlFor="ord-obs">Observaciones</Label>
              <Textarea id="ord-obs" rows={2} value={form.observaciones} disabled={readOnly} onChange={(e) => set({ observaciones: e.target.value })} />
            </div>
            <DialogFooter className="gap-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>{readOnly ? 'Cerrar' : 'Cancelar'}</Button>
              {!readOnly && <Button type="submit" disabled={save.isPending}>{pedidoId ? 'Guardar' : 'Crear pedido'}</Button>}
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
