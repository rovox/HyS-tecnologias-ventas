import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/contexts/AuthContext.jsx';
import { useCategories, useSucursales } from '@/features/catalogs';
import { notify } from '@/shared/lib/notify.js';
import { cn } from '@/lib/utils';
import { useCreateQuotation, useUpdateQuotation } from '../api.js';
import { SUBCATEGORY_SUGGESTIONS } from '../constants.js';
import { ClientPicker } from './ClientPicker.jsx';
import { SellersField } from './SellersField.jsx';

const day = (value) => (value ? String(value).slice(0, 10) : '');

function initialForm(quote, user) {
  return {
    titulo: quote?.titulo || '',
    clienteId: quote?.clienteId || '',
    categoriaId: quote?.categoriaId || '',
    subcategoria: quote?.subcategoria || '',
    monto: quote ? String(Number(quote.monto)) : '',
    sucursalId: quote?.sucursalId || user?.sucursalId || '',
    vendedores: quote?.sellers?.length
      ? quote.sellers.map((s) => ({ userId: s.userId, nombre: s.nombre, commissionPct: Number(s.commissionPct) }))
      : [{ userId: user?.id || '', nombre: user?.name || '', commissionPct: 100 }],
    plazoFinal: day(quote?.plazoFinal),
    tieneLicitacion: Boolean(quote?.tieneLicitacion),
    licitacionNumero: quote?.licitacionNumero || '',
    licitacionEntidad: quote?.licitacionEntidad || '',
    observacion: quote?.observacion || '',
  };
}

/** What blocks saving, or null. The API checks the same rules; this only avoids a round trip. */
function formError(form, send, hasPdf) {
  if (!form.titulo.trim()) return 'Escribe el título de la cotización';
  if (!form.clienteId) return 'Selecciona el cliente';
  if (!form.categoriaId) return 'Selecciona la categoría';
  if (!(Number(form.monto) > 0)) return 'El monto debe ser mayor a 0';
  if (!form.sucursalId) return 'Selecciona la sucursal';
  const sellers = form.vendedores.filter((v) => v.userId);
  if (!sellers.length) return 'Selecciona al menos un vendedor';
  const total = sellers.reduce((sum, v) => sum + (Number(v.commissionPct) || 0), 0);
  if (sellers.length > 1 && Math.abs(total - 100) > 0.05) return 'Las comisiones deben sumar 100 %';
  if (send && !hasPdf) return 'Adjunta el PDF para enviar la cotización';
  return null;
}

/** Create or edit a quotation. Once approved, amount, client and division are the project's and stay fixed. */
export function QuotationFormDialog({ open, onOpenChange, quote, onSaved }) {
  const { currentUser } = useAuth();
  const { data: categories } = useCategories();
  const { data: sucursales = [] } = useSucursales();
  const create = useCreateQuotation();
  const update = useUpdateQuotation();
  const [form, setForm] = useState(() => initialForm(quote, currentUser));
  const [pdf, setPdf] = useState(null);
  const [licitacion, setLicitacion] = useState([]);
  const locked = quote?.estado === 'aprobado';
  const saving = create.isPending || update.isPending;

  useEffect(() => {
    if (open) {
      setForm(initialForm(quote, currentUser));
      setPdf(null);
      setLicitacion([]);
    }
  }, [open, quote, currentUser]);

  const set = (patch) => setForm((f) => ({ ...f, ...patch }));
  const suggestions = [...(SUBCATEGORY_SUGGESTIONS[form.categoriaId] || []), ...(categories?.chips || []).map((c) => c.label)];

  async function save(send) {
    const error = formError(form, send, Boolean(pdf || quote?.archivoPdfUrl));
    if (error) return notify.error(error);
    const data = {
      titulo: form.titulo.trim(),
      subcategoria: form.subcategoria.trim(),
      sucursalId: form.sucursalId,
      vendedores: form.vendedores.filter((v) => v.userId).map((v) => ({ ...v, commissionPct: Number(v.commissionPct) || 0 })),
      plazoFinal: form.plazoFinal || undefined,
      tieneLicitacion: form.tieneLicitacion,
      licitacionNumero: form.tieneLicitacion ? form.licitacionNumero : undefined,
      licitacionEntidad: form.tieneLicitacion ? form.licitacionEntidad : undefined,
      observacion: form.observacion,
      ...(locked ? {} : { clienteId: form.clienteId, categoriaId: form.categoriaId, monto: Number(form.monto) }),
    };
    if (quote) delete data.sucursalId;
    const files = { pdf, licitacion };
    try {
      const saved = quote
        ? await update.mutateAsync({ id: quote.id, data, files })
        : await create.mutateAsync({ data, files, send });
      notify.success(quote ? 'Cotización guardada' : send ? 'Cotización creada y enviada' : 'Borrador guardado');
      onOpenChange(false);
      onSaved?.(saved);
    } catch {
      /* the query client already showed the API error; the dialog stays open to fix it */
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>{quote ? `Editar ${quote.numero}` : 'Nueva cotización'}</DialogTitle>
        </DialogHeader>
        <form className="grid gap-4 sm:grid-cols-2" onSubmit={(e) => { e.preventDefault(); save(false); }}>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="q-titulo">Título *</Label>
            <Input id="q-titulo" value={form.titulo} onChange={(e) => set({ titulo: e.target.value })} placeholder="Ej. CCTV 16 cámaras para almacén" />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label>Cliente *</Label>
            <ClientPicker value={form.clienteId} onChange={(clienteId) => set({ clienteId })} disabled={locked} />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label>Categoría *</Label>
            <div className="grid gap-2 sm:grid-cols-3" role="radiogroup">
              {(categories?.divisions || []).map((c) => (
                <button
                  key={c.id}
                  type="button"
                  role="radio"
                  aria-checked={form.categoriaId === c.id}
                  disabled={locked}
                  onClick={() => set({ categoriaId: c.id })}
                  className={cn(
                    'min-h-11 rounded-md border px-3 text-sm font-medium',
                    form.categoriaId === c.id ? 'border-primary bg-primary text-primary-foreground' : 'border-input hover:bg-muted',
                  )}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="q-sub">Subcategoría</Label>
            <Input id="q-sub" list="q-sub-list" value={form.subcategoria} onChange={(e) => set({ subcategoria: e.target.value })} />
            <datalist id="q-sub-list">{suggestions.map((s) => <option key={s} value={s} />)}</datalist>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="q-monto">Monto (Bs) *</Label>
            <Input id="q-monto" type="number" min="0.01" step="0.01" value={form.monto} disabled={locked} onChange={(e) => set({ monto: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="q-suc">Sucursal *</Label>
            <select id="q-suc" disabled={Boolean(quote)} className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm" value={form.sucursalId} onChange={(e) => set({ sucursalId: e.target.value })}>
              <option value="">Selecciona</option>
              {sucursales.map((s) => <option key={s.id} value={s.id}>{s.nombre}</option>)}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="q-plazo">Plazo de entrega</Label>
            <Input id="q-plazo" type="date" value={form.plazoFinal} onChange={(e) => set({ plazoFinal: e.target.value })} />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label>Vendedor(es) *</Label>
            <SellersField value={form.vendedores} onChange={(vendedores) => set({ vendedores })} />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="q-obs">Observación</Label>
            <Textarea id="q-obs" rows={3} value={form.observacion} onChange={(e) => set({ observacion: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="q-pdf">PDF de la cotización {quote?.archivo ? `(actual: ${quote.archivo})` : ''}</Label>
            <Input id="q-pdf" type="file" accept="application/pdf" onChange={(e) => setPdf(e.target.files?.[0] || null)} />
          </div>
          <div className="space-y-1.5">
            <label className="flex items-center gap-2 text-sm font-medium">
              <input type="checkbox" checked={form.tieneLicitacion} onChange={(e) => set({ tieneLicitacion: e.target.checked })} />
              Es licitación
            </label>
            {form.tieneLicitacion && (
              <div className="grid gap-2">
                <Input placeholder="N.º de licitación" value={form.licitacionNumero} onChange={(e) => set({ licitacionNumero: e.target.value })} />
                <Input placeholder="Entidad" value={form.licitacionEntidad} onChange={(e) => set({ licitacionEntidad: e.target.value })} />
                <Input type="file" multiple aria-label="Documentos de licitación" onChange={(e) => setLicitacion([...(e.target.files || [])])} />
              </div>
            )}
          </div>
          <DialogFooter className="gap-2 sm:col-span-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            {!quote && (
              <Button type="button" variant="secondary" disabled={saving} onClick={() => save(true)}>Guardar y enviar</Button>
            )}
            <Button type="submit" disabled={saving}>
              {saving && <Loader2 className="animate-spin" />} {quote ? 'Guardar' : 'Guardar borrador'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
