import { useEffect, useMemo, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext.jsx';
import { useClientOptions, useSucursales } from '@/features/catalogs';
import { ClientPicker } from '@/features/clients';
import { useProducts } from '@/features/inventory';
import { SearchSelect } from '@/shared/views';
import { formatBs } from '@/shared/lib/format.js';
import { notify } from '@/shared/lib/notify.js';
import { cn } from '@/lib/utils';
import { useCreateDirectSale } from '../api.js';

/** Every branch is supplied by Central (owner 2026-10-27): a seller sells from his branch or from Central. */
const CENTRAL = 'suc_central';
const METHODS = { efectivo: 'Efectivo', qr: 'QR', transferencia: 'Transferencia' };
const select = 'h-9 w-full rounded-md border border-input bg-background px-2 text-sm';
const cents = (v) => Math.round(v * 100) / 100;
const emptyLine = () => ({ key: Math.random().toString(36).slice(2), productoId: '', cantidad: '1', precioUnitario: '', descuento: '' });

/** Same math as the API (direct-sales.rules saleTotals): line = qty × price − its discount; minus the sale discount. */
function totalsOf(lines, descuento) {
  const subtotal = cents(lines.reduce((s, l) => s + (Number(l.cantidad) || 0) * (Number(l.precioUnitario) || 0) - (Number(l.descuento) || 0), 0));
  return { subtotal, total: cents(subtotal - (Number(descuento) || 0)) };
}

/**
 * Sell (VD-02): products from a branch's stock (the seller's or Central), the client as printed on the note, and how
 * it was paid (one or several methods that add up to the total). `replaces` = an annulled sale to correct: its lines
 * and client come pre-filled and the new one is linked to it.
 */
export function SaleDialog({ open, onOpenChange, replaces, onSaved }) {
  const { currentUser, isAdmin } = useAuth();
  const manager = isAdmin();
  const { data: sucursales = [] } = useSucursales();
  const { data: products = [] } = useProducts(open);
  const { data: clients = [] } = useClientOptions();
  const create = useCreateDirectSale();
  const origins = manager ? sucursales : sucursales.filter((s) => s.id === currentUser?.sucursalId || s.id === CENTRAL);
  const [form, setForm] = useState(null);

  useEffect(() => {
    if (!open) return;
    setForm({
      sucursalId: replaces?.sucursal?.id || currentUser?.sucursalId || CENTRAL,
      clienteId: replaces?.cliente?.id || '',
      clienteNombre: replaces?.clienteNombre === 'Cliente varios' ? '' : replaces?.clienteNombre || '',
      clienteCelular: replaces?.clienteCelular || '',
      clienteNit: replaces?.clienteNit || '',
      descuento: replaces && Number(replaces.descuento) ? String(Number(replaces.descuento)) : '',
      lines: replaces?.items?.length
        ? replaces.items.map((i) => ({ ...emptyLine(), productoId: i.productoId, cantidad: String(Number(i.cantidad)), precioUnitario: String(Number(i.precioUnitario)), descuento: Number(i.descuento) ? String(Number(i.descuento)) : '' }))
        : [emptyLine()],
      pagos: [{ medio: 'efectivo', monto: '' }],
    });
  }, [open, replaces, currentUser]);

  const stockOf = (p) => Number(p?.stock?.[form?.sucursalId] || 0);
  const options = useMemo(
    () => products.filter((p) => p.active !== false && p.tipo !== 'servicio').map((p) => ({ value: p.id, label: `${p.codigo} — ${p.nombre}`, hint: `${stockOf(p)} ${p.unidad} · ${formatBs(p.precio)}`, keywords: p.marca })),
    [products, form?.sucursalId], // eslint-disable-line react-hooks/exhaustive-deps
  );
  if (!form) return null;

  const set = (patch) => setForm((f) => ({ ...f, ...patch }));
  const setLine = (key, patch) => set({ lines: form.lines.map((l) => (l.key === key ? { ...l, ...patch } : l)) });
  const setPago = (i, patch) => set({ pagos: form.pagos.map((p, j) => (j === i ? { ...p, ...patch } : p)) });
  const { subtotal, total } = totalsOf(form.lines, form.descuento);
  const paid = cents(form.pagos.reduce((s, p) => s + (Number(p.monto) || 0), 0));
  const pending = cents(total - paid);
  const productOf = (id) => products.find((p) => p.id === id);

  function pickProduct(key, productoId) {
    const p = productOf(productoId);
    setLine(key, { productoId, precioUnitario: p ? String(Number(p.precio) || '') : '' });
  }

  function pickClient(clienteId) {
    const c = clients.find((x) => x.id === clienteId);
    set({ clienteId, ...(c ? { clienteNombre: c.nombre, clienteCelular: c.telefono || form.clienteCelular } : {}) });
  }

  async function submit(e) {
    e.preventDefault();
    const lines = form.lines.filter((l) => l.productoId);
    if (!lines.length) return notify.error('Agrega al menos un producto');
    const short = lines.find((l) => Number(l.cantidad) > stockOf(productOf(l.productoId)));
    if (short) return notify.error(`No hay stock suficiente de ${productOf(short.productoId)?.nombre} en esta sucursal`);
    if (pending !== 0) return notify.error(pending > 0 ? `Faltan ${formatBs(pending)} por cobrar` : `Los pagos pasan el total por ${formatBs(-pending)}`);
    try {
      const sale = await create.mutateAsync({
        sucursalId: form.sucursalId,
        clienteId: form.clienteId || undefined,
        clienteNombre: form.clienteNombre.trim() || undefined,
        clienteCelular: form.clienteCelular.trim() || undefined,
        clienteNit: form.clienteNit.trim() || undefined,
        descuento: Number(form.descuento) || 0,
        items: lines.map((l) => ({ productoId: l.productoId, cantidad: Number(l.cantidad), precioUnitario: Number(l.precioUnitario) || 0, descuento: Number(l.descuento) || 0 })),
        pagos: form.pagos.filter((p) => Number(p.monto) > 0).map((p) => ({ medio: p.medio, monto: Number(p.monto) })),
        ...(replaces ? { reemplazaAId: replaces.id } : {}),
      });
      notify.success(`Venta ${sale.codigo} registrada`, { description: 'El stock bajó y el cobro ya está en caja' });
      onOpenChange(false);
      onSaved?.(sale);
    } catch {
      /* shown by the query client */
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90dvh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{replaces ? `Corregir la venta ${replaces.codigo}` : 'Nueva venta'}</DialogTitle>
          <DialogDescription>El stock sale de la sucursal elegida y el cobro entra validado a la caja de su medio de pago.</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label htmlFor="sale-origin">Sale de</Label>
              <select id="sale-origin" className={select} value={form.sucursalId} onChange={(e) => set({ sucursalId: e.target.value })}>
                {origins.map((s) => (
                  <option key={s.id} value={s.id}>{s.nombre}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label>Cliente (opcional)</Label>
              <ClientPicker value={form.clienteId} onChange={pickClient} />
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label htmlFor="sale-cli-name">Nombre en la nota</Label>
              <Input id="sale-cli-name" placeholder="Cliente varios" value={form.clienteNombre} onChange={(e) => set({ clienteNombre: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="sale-cli-cel">Celular</Label>
              <Input id="sale-cli-cel" value={form.clienteCelular} onChange={(e) => set({ clienteCelular: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="sale-cli-nit">Razón social / NIT</Label>
              <Input id="sale-cli-nit" value={form.clienteNit} onChange={(e) => set({ clienteNit: e.target.value })} />
            </div>
          </div>

          <section className="space-y-2">
            <h3 className="text-sm font-semibold">Productos</h3>
            {form.lines.map((l, i) => {
              const p = productOf(l.productoId);
              const over = p && Number(l.cantidad) > stockOf(p);
              return (
                <div key={l.key} className="grid grid-cols-12 items-start gap-2">
                  <div className="col-span-5">
                    <SearchSelect aria-label={`Producto ${i + 1}`} value={l.productoId} onChange={(v) => pickProduct(l.key, v)} placeholder="Buscar producto…" searchPlaceholder="Código, nombre o marca…" options={options} />
                    {p && <p className={cn('mt-0.5 text-xs', over ? 'font-semibold text-danger-fg' : 'text-muted-foreground')}>Stock en esta sucursal: {stockOf(p)} {p.unidad}</p>}
                  </div>
                  <Input className="col-span-2" aria-label={`Cantidad ${i + 1}`} type="number" min="0" step="0.01" value={l.cantidad} onChange={(e) => setLine(l.key, { cantidad: e.target.value })} />
                  <Input className="col-span-2" aria-label={`Precio ${i + 1}`} type="number" min="0" step="0.01" placeholder="Precio" value={l.precioUnitario} onChange={(e) => setLine(l.key, { precioUnitario: e.target.value })} />
                  <Input className="col-span-2" aria-label={`Descuento ${i + 1}`} type="number" min="0" step="0.01" placeholder="Desc." value={l.descuento} onChange={(e) => setLine(l.key, { descuento: e.target.value })} />
                  <Button type="button" variant="ghost" size="icon" className="col-span-1 h-9 w-9 text-danger-fg" aria-label={`Quitar línea ${i + 1}`} disabled={form.lines.length === 1} onClick={() => set({ lines: form.lines.filter((x) => x.key !== l.key) })}>
                    <Trash2 />
                  </Button>
                </div>
              );
            })}
            <Button type="button" variant="outline" size="sm" onClick={() => set({ lines: [...form.lines, emptyLine()] })}>
              <Plus /> Agregar producto
            </Button>
          </section>

          <section className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <h3 className="text-sm font-semibold">Cómo pagó</h3>
              {form.pagos.map((p, i) => (
                <div key={i} className="grid grid-cols-12 gap-2">
                  <select aria-label={`Medio de pago ${i + 1}`} className={cn(select, 'col-span-6')} value={p.medio} onChange={(e) => setPago(i, { medio: e.target.value })}>
                    {Object.entries(METHODS).map(([k, label]) => <option key={k} value={k}>{label}</option>)}
                  </select>
                  <Input className="col-span-5" aria-label={`Monto ${i + 1}`} type="number" min="0" step="0.01" value={p.monto} onChange={(e) => setPago(i, { monto: e.target.value })} />
                  <Button type="button" variant="ghost" size="icon" className="col-span-1 h-9 w-9 text-danger-fg" aria-label={`Quitar pago ${i + 1}`} disabled={form.pagos.length === 1} onClick={() => set({ pagos: form.pagos.filter((_, j) => j !== i) })}>
                    <Trash2 />
                  </Button>
                </div>
              ))}
              <div className="flex flex-wrap gap-1.5">
                {Object.entries(METHODS).map(([k, label]) => (
                  <Button key={k} type="button" size="sm" variant="outline" disabled={!(total > 0)} onClick={() => set({ pagos: [{ medio: k, monto: String(total) }] })}>
                    Todo en {label.toLowerCase()}
                  </Button>
                ))}
                <Button type="button" size="sm" variant="ghost" onClick={() => set({ pagos: [...form.pagos, { medio: 'qr', monto: pending > 0 ? String(pending) : '' }] })}>
                  <Plus /> Otro medio
                </Button>
              </div>
            </div>
            <dl className="space-y-1 rounded-md border border-border bg-muted/40 p-3 text-sm">
              <div className="flex justify-between"><dt className="text-muted-foreground">Subtotal</dt><dd className="tabular-nums">{formatBs(subtotal)}</dd></div>
              <div className="flex items-center justify-between gap-2">
                <dt className="text-muted-foreground"><Label htmlFor="sale-desc">Descuento de la venta</Label></dt>
                <dd><Input id="sale-desc" type="number" min="0" step="0.01" className="h-8 w-28 text-right" value={form.descuento} onChange={(e) => set({ descuento: e.target.value })} /></dd>
              </div>
              <div className="flex justify-between text-base font-bold"><dt>Total</dt><dd className="tabular-nums">{formatBs(total)}</dd></div>
              <div className={cn('flex justify-between font-semibold', pending === 0 ? 'text-success-fg' : 'text-danger-fg')}>
                <dt>{pending === 0 ? 'Cuadra con los pagos' : pending > 0 ? 'Falta cobrar' : 'Pagos de más'}</dt>
                <dd className="tabular-nums">{pending === 0 ? '✓' : formatBs(Math.abs(pending))}</dd>
              </div>
            </dl>
          </section>

          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" variant="success" disabled={create.isPending || !(total > 0) || pending !== 0}>
              {create.isPending ? 'Registrando…' : `Vender ${formatBs(total)}`}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
