import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext.jsx';
import { useCategories, useSucursales } from '@/features/catalogs';
import { notify } from '@/shared/lib/notify.js';
import { cn } from '@/lib/utils';
import { useSaveProduct } from '../api.js';

const TIPOS = [['equipo', 'Equipo'], ['material', 'Material'], ['servicio', 'Servicio']];
const UNIDADES = ['unidad', 'metro', 'rollo', 'caja', 'kit', 'punto', 'litro'];
/** Purchases enter at Central (owner 2026-10-27); Gerencia may enter them at any branch. */
const CENTRAL = 'suc_central';
const initial = (p) => ({
  codigo: p?.codigo || '',
  nombre: p?.nombre || '',
  marca: p?.marca || '',
  categoriaId: p?.categoriaId || '',
  tipo: p?.tipo || 'equipo',
  unidad: p?.unidad || 'unidad',
  costo: p ? String(Number(p.costo)) : '',
  precio: p ? String(Number(p.precio)) : '',
  stockMinimo: p ? String(Number(p.stockMinimo)) : '',
  // New product only: its first purchase (LAUNCH P1-4).
  cantidad: '',
  sucursalId: CENTRAL,
  nota: '',
});

/**
 * New product or edit one (the code is fixed once created). A new product (not a service) is created together with its
 * first purchase — quantity, unit cost and branch — so the catalog never holds a product without stock (LAUNCH P1-4).
 * Later stock only comes from movements.
 */
export function ProductDialog({ open, onOpenChange, product }) {
  const { isAdmin } = useAuth();
  const { data: categories } = useCategories();
  const { data: sucursales = [] } = useSucursales();
  const save = useSaveProduct();
  const [form, setForm] = useState(() => initial(product));
  useEffect(() => {
    if (open) setForm(initial(product));
  }, [open, product]);
  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  async function submit(e) {
    e.preventDefault();
    if (!form.codigo.trim() || !form.nombre.trim()) return notify.error('Código y nombre son obligatorios');
    if (!form.categoriaId) return notify.error('Elige la categoría');
    const firstEntry = !product && form.tipo !== 'servicio';
    if (firstEntry && !(Number(form.cantidad) > 0)) return notify.error('Indica cuántos entran (mayor a 0)');
    if (firstEntry && !(Number(form.costo) > 0)) return notify.error('Indica el costo unitario de la compra');
    const data = {
      nombre: form.nombre.trim(),
      marca: form.marca.trim(),
      categoriaId: form.categoriaId,
      tipo: form.tipo,
      unidad: form.unidad,
      costo: Number(form.costo) || 0,
      precio: Number(form.precio) || 0,
      stockMinimo: Number(form.stockMinimo) || 0,
    };
    try {
      await save.mutateAsync(
        product
          ? { id: product.id, ...data }
          : {
              codigo: form.codigo.trim(),
              ...data,
              ...(firstEntry ? { stockInicial: { cantidad: Number(form.cantidad), costoUnitario: Number(form.costo), sucursalId: form.sucursalId, ...(form.nota.trim() ? { nota: form.nota.trim() } : {}) } } : {}),
            },
      );
      notify.success(product ? 'Producto guardado' : firstEntry ? `Producto creado con ${form.cantidad} ${form.unidad} en stock` : 'Producto creado');
      onOpenChange(false);
    } catch {
      /* shown by the query client */
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{product ? `Editar ${product.codigo}` : 'Nuevo producto'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="pr-codigo">Código *</Label>
            <Input id="pr-codigo" value={form.codigo} disabled={Boolean(product)} onChange={set('codigo')} placeholder="CAM-IP-4MP" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="pr-marca">Marca</Label>
            <Input id="pr-marca" value={form.marca} onChange={set('marca')} />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="pr-nombre">Nombre *</Label>
            <Input id="pr-nombre" value={form.nombre} onChange={set('nombre')} />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label>Categoría *</Label>
            <div className="grid gap-2 sm:grid-cols-3" role="radiogroup">
              {(categories?.divisions || []).map((c) => (
                <button key={c.id} type="button" role="radio" aria-checked={form.categoriaId === c.id} onClick={() => setForm((f) => ({ ...f, categoriaId: c.id }))}
                  className={cn('min-h-11 rounded-md border px-2 text-sm font-medium', form.categoriaId === c.id ? 'border-primary bg-primary text-primary-foreground' : 'border-input hover:bg-muted')}>
                  {c.label}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="pr-tipo">Tipo</Label>
            <select id="pr-tipo" className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm" value={form.tipo} onChange={set('tipo')}>
              {TIPOS.map(([k, label]) => <option key={k} value={k}>{label}</option>)}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="pr-unidad">Unidad</Label>
            <Input id="pr-unidad" list="pr-unidades" value={form.unidad} onChange={set('unidad')} />
            <datalist id="pr-unidades">{UNIDADES.map((u) => <option key={u} value={u} />)}</datalist>
          </div>
          {!product && form.tipo !== 'servicio' ? (
            <fieldset className="space-y-2 rounded-md border border-border p-2 sm:col-span-2">
              <legend className="px-1 text-sm font-semibold">Primera entrada *</legend>
              <div className="grid gap-2 sm:grid-cols-3">
                <div className="space-y-1.5">
                  <Label htmlFor="pr-cantidad">Cantidad *</Label>
                  <Input id="pr-cantidad" type="number" min="0.01" step="0.01" value={form.cantidad} onChange={set('cantidad')} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="pr-costo">Costo unitario (Bs) *</Label>
                  <Input id="pr-costo" type="number" min="0.01" step="0.01" value={form.costo} onChange={set('costo')} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="pr-suc">Entra a</Label>
                  <select id="pr-suc" className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm" value={form.sucursalId} disabled={!isAdmin()} onChange={set('sucursalId')}>
                    {(isAdmin() ? sucursales : sucursales.filter((s) => s.id === CENTRAL)).map((s) => <option key={s.id} value={s.id}>{s.nombre}</option>)}
                  </select>
                </div>
              </div>
              <Input aria-label="Nota de la compra" placeholder="Proveedor, factura…" value={form.nota} onChange={set('nota')} />
            </fieldset>
          ) : (
            <div className="space-y-1.5">
              <Label htmlFor="pr-costo">Costo (Bs)</Label>
              <Input id="pr-costo" type="number" min="0" step="0.01" value={form.costo} onChange={set('costo')} />
            </div>
          )}
          <div className="space-y-1.5">
            <Label htmlFor="pr-precio">Precio de venta (Bs)</Label>
            <Input id="pr-precio" type="number" min="0" step="0.01" value={form.precio} onChange={set('precio')} />
          </div>
          {form.tipo !== 'servicio' && (
            <div className="space-y-1.5">
              <Label htmlFor="pr-min">Stock mínimo (alerta)</Label>
              <Input id="pr-min" type="number" min="0" step="0.01" value={form.stockMinimo} onChange={set('stockMinimo')} />
            </div>
          )}
          <DialogFooter className="gap-2 sm:col-span-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" disabled={save.isPending}>{product ? 'Guardar' : 'Crear'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
