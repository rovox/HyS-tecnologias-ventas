import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { formatBs } from '@/shared/lib/format.js';

export const emptyItem = () => ({ key: crypto.randomUUID(), productoId: '', materialNombre: '', cantidad: '1', unidad: 'unidad', costoUnitario: '', observaciones: '' });

/**
 * Items of an order: a catalog product (its stock moves on delivery and shows the stock at the origin branch) or free
 * text (moves nothing).
 */
export function OrderItems({ items, onChange, products, origin, readOnly }) {
  const set = (i, patch) => onChange(items.map((item, idx) => (idx === i ? { ...item, ...patch } : item)));
  const pick = (i, id) => {
    const p = products.find((x) => x.id === id);
    set(i, p ? { productoId: p.id, materialNombre: p.nombre, unidad: p.unidad, costoUnitario: String(Number(p.costo)) } : { productoId: '' });
  };
  const total = items.reduce((s, i) => s + (Number(i.cantidad) || 0) * (Number(i.costoUnitario) || 0), 0);

  return (
    <div className="space-y-2">
      {items.map((item, i) => {
        const product = products.find((p) => p.id === item.productoId);
        const available = product && origin ? product.stock[origin] ?? 0 : null;
        const short = available !== null && Number(item.cantidad) > available;
        return (
          <div key={item.key} className="grid gap-2 rounded-md border border-border p-2 sm:grid-cols-12">
            <select
              aria-label="Producto"
              className="h-9 rounded-md border border-input bg-background px-2 text-sm sm:col-span-5"
              value={item.productoId}
              disabled={readOnly}
              onChange={(e) => pick(i, e.target.value)}
            >
              <option value="">Texto libre (no mueve stock)</option>
              {products.filter((p) => p.active && p.tipo !== 'servicio').map((p) => (
                <option key={p.id} value={p.id}>{p.codigo} · {p.nombre}</option>
              ))}
            </select>
            <Input aria-label="Material" className="sm:col-span-7" placeholder="Material o insumo" value={item.materialNombre} disabled={readOnly || Boolean(item.productoId)} onChange={(e) => set(i, { materialNombre: e.target.value })} />
            <Input aria-label="Cantidad" type="number" min="0.01" step="0.01" className="sm:col-span-2" value={item.cantidad} disabled={readOnly} onChange={(e) => set(i, { cantidad: e.target.value })} />
            <Input aria-label="Unidad" className="sm:col-span-2" value={item.unidad} disabled={readOnly || Boolean(item.productoId)} onChange={(e) => set(i, { unidad: e.target.value })} />
            <Input aria-label="Costo unitario (Bs)" type="number" min="0" step="0.01" placeholder="Costo Bs" className="sm:col-span-3" value={item.costoUnitario} disabled={readOnly} onChange={(e) => set(i, { costoUnitario: e.target.value })} />
            <Input aria-label="Observación" placeholder="Observación" className="sm:col-span-4" value={item.observaciones} disabled={readOnly} onChange={(e) => set(i, { observaciones: e.target.value })} />
            <div className="flex items-center justify-end sm:col-span-1">
              {!readOnly && items.length > 1 && (
                <Button type="button" variant="ghost" size="icon" aria-label="Quitar" onClick={() => onChange(items.filter((_, idx) => idx !== i))}>
                  <Trash2 />
                </Button>
              )}
            </div>
            {available !== null && (
              <p className={short ? 'text-xs text-destructive sm:col-span-12' : 'text-xs text-muted-foreground sm:col-span-12'}>
                Stock en la sucursal de origen: {available} {product.unidad}{short ? ' — no alcanza para entregar' : ''}
              </p>
            )}
          </div>
        );
      })}
      <div className="flex items-center justify-between">
        {!readOnly && (
          <Button type="button" variant="ghost" size="sm" onClick={() => onChange([...items, emptyItem()])}>
            <Plus /> Agregar ítem
          </Button>
        )}
        <span className="text-sm">Costo estimado: <span className="font-semibold">{formatBs(total)}</span></span>
      </div>
    </div>
  );
}
