import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useCategories } from '@/features/catalogs';
import { notify } from '@/shared/lib/notify.js';
import { cn } from '@/lib/utils';
import { useSaveProduct } from '../api.js';

const TIPOS = [['equipo', 'Equipo'], ['material', 'Material'], ['servicio', 'Servicio']];
const UNIDADES = ['unidad', 'metro', 'rollo', 'caja', 'kit', 'punto', 'litro'];
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
});

/** New product or edit one (the code is fixed once created). Stock is never typed here: it comes from movements. */
export function ProductDialog({ open, onOpenChange, product }) {
  const { data: categories } = useCategories();
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
      await save.mutateAsync(product ? { id: product.id, ...data } : { codigo: form.codigo.trim(), ...data });
      notify.success(product ? 'Producto guardado' : 'Producto creado');
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
          <div className="space-y-1.5">
            <Label htmlFor="pr-costo">Costo (Bs)</Label>
            <Input id="pr-costo" type="number" min="0" step="0.01" value={form.costo} onChange={set('costo')} />
          </div>
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
