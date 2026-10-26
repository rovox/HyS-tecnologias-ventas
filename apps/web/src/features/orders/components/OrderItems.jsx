import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SearchSelect } from '@/shared/views';
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
            <div className="space-y-1 sm:col-span-6">
              <Label htmlFor={`item-${item.key}-prod`} className="text-xs">Producto del inventario</Label>
              <SearchSelect
                id={`item-${item.key}-prod`}
                value={item.productoId}
                disabled={readOnly}
                onChange={(id) => pick(i, id)}
                emptyOption="Texto libre (no mueve stock)"
                searchPlaceholder="Buscar por código o nombre…"
                options={products.filter((p) => p.active && p.tipo !== 'servicio').map((p) => ({ value: p.id, label: p.nombre, hint: `${p.codigo}${origin ? ` — stock ${p.stock[origin] ?? 0} ${p.unidad}` : ''}` }))}
              />
            </div>
            {product ? (
              <div className="space-y-1 sm:col-span-6">
                <span className="text-xs font-medium text-muted-foreground">Material</span>
                <p className="flex min-h-9 items-center text-sm font-medium">{product.nombre} <span className="ml-1 text-muted-foreground">({product.unidad})</span></p>
              </div>
            ) : (
              <>
                <div className="space-y-1 sm:col-span-4">
                  <Label htmlFor={`item-${item.key}-mat`} className="text-xs">Material *</Label>
                  <Input id={`item-${item.key}-mat`} placeholder="Ej. Tarugos 8 mm" value={item.materialNombre} disabled={readOnly} onChange={(e) => set(i, { materialNombre: e.target.value })} />
                </div>
                <div className="space-y-1 sm:col-span-2">
                  <Label htmlFor={`item-${item.key}-uni`} className="text-xs">Unidad</Label>
                  <Input id={`item-${item.key}-uni`} placeholder="pza" value={item.unidad} disabled={readOnly} onChange={(e) => set(i, { unidad: e.target.value })} />
                </div>
              </>
            )}
            <div className="space-y-1 sm:col-span-2">
              <Label htmlFor={`item-${item.key}-cant`} className="text-xs">Cantidad *</Label>
              <Input id={`item-${item.key}-cant`} type="number" min="0.01" step="0.01" value={item.cantidad} disabled={readOnly} onChange={(e) => set(i, { cantidad: e.target.value })} />
            </div>
            <div className="space-y-1 sm:col-span-3">
              <Label htmlFor={`item-${item.key}-cost`} className="text-xs">Costo unitario (Bs)</Label>
              <Input id={`item-${item.key}-cost`} type="number" min="0" step="0.01" value={item.costoUnitario} disabled={readOnly} onChange={(e) => set(i, { costoUnitario: e.target.value })} />
            </div>
            <div className={items.length > 1 && !readOnly ? 'space-y-1 sm:col-span-6' : 'space-y-1 sm:col-span-7'}>
              <Label htmlFor={`item-${item.key}-obs`} className="text-xs">Observación</Label>
              <Input id={`item-${item.key}-obs`} value={item.observaciones} disabled={readOnly} onChange={(e) => set(i, { observaciones: e.target.value })} />
            </div>
            {!readOnly && items.length > 1 && (
              <div className="flex items-end justify-end sm:col-span-1">
                <Button type="button" variant="ghost" size="icon" title="Quitar ítem" aria-label="Quitar ítem" className="text-danger-fg hover:bg-danger-soft" onClick={() => onChange(items.filter((_, idx) => idx !== i))}>
                  <Trash2 />
                </Button>
              </div>
            )}
            {available !== null && (
              <p className={short ? 'text-xs font-semibold text-danger-fg sm:col-span-12' : 'text-xs text-muted-foreground sm:col-span-12'}>
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
