import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, ChevronDown, Loader2, Plus, Receipt, Save, Store, UploadCloud, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import quotationsService from '@/services/quotations/index.js';
import clientsService from '@/services/clients/index.js';
import {
  QUOTATION_MAIN_CATEGORIES,
  QUOTATION_SUBCATEGORIES,
  QUOTATION_SUCURSALES,
  EQUIPOS_TECNOLOGIA_ID,
  COT_PREFIX,
  peekNextQuotationNumero,
} from '@/mocks/quotations.js';
import ClientFormModal from '@/components/ClientFormModal.jsx';

const FormSection = ({ title, children, className = '' }) => (
  <div className={`rounded-xl border border-border bg-card p-3 sm:p-4 space-y-3 shadow-[0_4px_20px_rgba(0,43,91,0.06)] min-w-0 ${className}`}>
    <h3 className="font-semibold text-foreground text-sm tracking-tight">{title}</h3>
    {children}
  </div>
);

const emptyVendorRow = (user = null, pct = 100) => ({
  user_id: user?.id || '',
  nombre: user?.name || '',
  comision_pct: pct,
});

const createEmptyCommercial = (user) => ({
  titulo_resumen: '',
  categoria_id: '',
  subcategoria: '',
  subcategoria_custom: '',
  sucursal_id: QUOTATION_SUCURSALES[0]?.id || '',
  cliente_id: '',
  cliente_query: '',
  monto: '',
  observacion: '',
  vendedores: user ? [emptyVendorRow(user, 100)] : [emptyVendorRow(null, 100)],
});

const NewQuotationForm = ({
  open,
  onOpenChange,
  quotations = [],
  clients = [],
  vendors = [],
  categories = QUOTATION_MAIN_CATEGORIES,
  currentUser,
  onSaved,
  onClientCreated,
}) => {
  const [form, setForm] = useState(() => createEmptyCommercial(currentUser));
  const [attachedFiles, setAttachedFiles] = useState([]);
  const [saving, setSaving] = useState(false);
  const [clientModalOpen, setClientModalOpen] = useState(false);
  const [searchHits, setSearchHits] = useState([]);

  const categoryOptions = (categories?.length ? categories : QUOTATION_MAIN_CATEGORIES).map((row) => ({
    id: row.id,
    label: row.label || row.nombre,
  }));

  const nextNumero = peekNextQuotationNumero(quotations);
  const vendorOptions = useMemo(() => {
    const list = [...vendors];
    if (currentUser && !list.some((v) => v.id === currentUser.id)) {
      list.unshift({ id: currentUser.id, name: currentUser.name, role: currentUser.role });
    }
    return list;
  }, [vendors, currentUser]);

  const filteredClients = (searchHits.length ? searchHits : clients).filter((c) =>
    [c.nombre, c.telefono, c.email, c.contacto]
      .some((v) => String(v || '').toLowerCase().includes((form.cliente_query || '').toLowerCase())),
  );

  useEffect(() => {
    const q = (form.cliente_query || '').trim();
    if (!q || form.cliente_id) {
      setSearchHits([]);
      return undefined;
    }
    const t = setTimeout(() => {
      clientsService.search(q).then(setSearchHits).catch(() => setSearchHits([]));
    }, 200);
    return () => clearTimeout(t);
  }, [form.cliente_query, form.cliente_id]);
  const commissionTotal = form.vendedores.reduce((sum, row) => sum + (Number(row.comision_pct) || 0), 0);
  const primaryVendorLabel = form.vendedores
    .filter((row) => row.user_id)
    .map((row) => row.nombre || vendorOptions.find((v) => v.id === row.user_id)?.name || 'Vendedor')
    .join(', ') || currentUser?.name || 'sin asignar';
  const subOptions = QUOTATION_SUBCATEGORIES[form.categoria_id] || [];
  const usesCustomSub = form.categoria_id === EQUIPOS_TECNOLOGIA_ID || (form.categoria_id && subOptions.length === 0);

  const reset = () => {
    setForm(createEmptyCommercial(currentUser));
    setAttachedFiles([]);
  };

  const handleOpenChange = (next) => {
    if (!next) reset();
    onOpenChange(next);
  };

  const setCategory = (categoriaId) => {
    const subs = QUOTATION_SUBCATEGORIES[categoriaId] || [];
    setForm({
      ...form,
      categoria_id: categoriaId,
      subcategoria: subs[0] || '',
      subcategoria_custom: '',
    });
  };

  const updateVendorRow = (index, patch) => {
    setForm({
      ...form,
      vendedores: form.vendedores.map((row, i) => (i === index ? { ...row, ...patch } : row)),
    });
  };

  const handleSubmit = async (e, asEnviado = false) => {
    e.preventDefault();
    if (!form.titulo_resumen.trim()) return toast.error('Ingresa el título / resumen de la cotización');
    if (!form.cliente_id) return toast.error('Selecciona o registra un cliente');
    if (!form.categoria_id) return toast.error('Selecciona una categoría');
    if (!form.sucursal_id) return toast.error('Selecciona una sucursal');
    if (!usesCustomSub && !form.subcategoria) return toast.error('Selecciona una subcategoría');

    const monto = Number(form.monto);
    if (!monto || monto <= 0) return toast.error('Ingresa el monto de la cotización');
    if (asEnviado && attachedFiles.length === 0) return toast.error('Adjunta el PDF para enviar la cotización');

    const activeVendors = form.vendedores.filter((row) => row.user_id);
    if (activeVendors.length === 0) return toast.error('Selecciona al menos un vendedor');
    if (activeVendors.length > 1 && Math.abs(commissionTotal - 100) > 0.05) {
      return toast.error('Las comisiones deben sumar 100%');
    }

    const pdfFile = attachedFiles.find((f) => f.type === 'application/pdf' || f.name.endsWith('.pdf'));
    const imageFile = attachedFiles.find((f) => f.type.startsWith('image/'));

    setSaving(true);
    try {
      const client = clients.find((row) => row.id === form.cliente_id);
      const categoriaLabel = categoryOptions.find((row) => row.id === form.categoria_id)?.label || '';
      const sucursal = QUOTATION_SUCURSALES.find((row) => row.id === form.sucursal_id);
      const subcategoria = usesCustomSub ? form.subcategoria_custom.trim() : form.subcategoria;

      await quotationsService.create({
        kind: 'commercial',
        titulo: form.titulo_resumen.trim(),
        categoria: categoriaLabel,
        categoria_id: form.categoria_id,
        subcategoria,
        subcategoria_custom: form.subcategoria_custom.trim(),
        sucursal_id: form.sucursal_id,
        sucursal_nombre: sucursal?.nombre || '',
        cliente_id: form.cliente_id,
        cliente_nombre: client?.nombre || form.cliente_query,
        observacion: form.observacion,
        monto,
        vendedores: activeVendors.map((row) => {
          const vendor = vendorOptions.find((u) => u.id === row.user_id);
          return {
            user_id: row.user_id,
            nombre: vendor?.name || row.nombre || '',
            comision_pct: Number(row.comision_pct) || 0,
          };
        }),
        uploaded_by: currentUser?.name,
        estado: asEnviado ? 'enviado' : 'borrador',
        archivo: pdfFile?.name || '',
        imagen_preview: imageFile?.name || '',
      }, attachedFiles);

      toast.success(asEnviado ? 'Cotización enviada al cliente' : 'Borrador guardado');
      reset();
      onOpenChange(false);
      onSaved?.();
    } catch (err) {
      toast.error(err.message || 'Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="w-[calc(100%-1.5rem)] max-w-5xl p-0 gap-0 overflow-hidden max-h-[95vh] flex flex-col sm:rounded-xl">
          <div className="flex items-center gap-3 px-4 py-2.5 border-b bg-card shrink-0">
            <button
              type="button"
              onClick={() => handleOpenChange(false)}
              className="p-1.5 rounded-lg hover:bg-muted transition-colors min-h-11 min-w-11 flex items-center justify-center"
              aria-label="Volver"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <DialogTitle className="text-base sm:text-lg font-bold flex-1 text-center pr-8">Nueva Cotización</DialogTitle>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0 overflow-y-auto bg-background">
            <div className="p-3 sm:p-4 md:p-5 pb-24 grid grid-cols-1 md:grid-cols-12 gap-3 md:gap-4">
              <FormSection title="Identificación" className="md:col-span-12">
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-stretch min-w-0">
                  <div className="sm:w-[11.5rem] shrink-0 min-w-0 rounded-lg border border-border bg-muted/30 px-3 py-2.5 flex flex-col justify-center">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                        Código
                      </p>
                      <Receipt className="h-4 w-4 text-muted-foreground shrink-0" aria-hidden />
                    </div>
                    <p className="mt-0.5 text-base font-bold tabular-nums text-foreground break-all leading-snug">
                      {nextNumero}
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{COT_PREFIX}mes día año</p>
                  </div>
                  <div className="flex-1 min-w-0 space-y-1.5">
                    <Label className="text-sm font-semibold">Título *</Label>
                    <Input
                      required
                      className="h-11 min-w-0"
                      placeholder="Articulo de la cotización (ej. Router, cerco, camaras ,CCTV 16 canales)"
                      value={form.titulo_resumen}
                      onChange={(e) => setForm({ ...form, titulo_resumen: e.target.value })}
                    />
                    <p className="text-xs text-muted-foreground break-words line-clamp-2">
                      Vista:{' '}
                      <span className="font-semibold text-foreground">
                        {nextNumero}{form.titulo_resumen.trim() ? ` — ${form.titulo_resumen.trim()}` : ' — …'}
                      </span>
                    </p>
                  </div>
                </div>
              </FormSection>

              <FormSection title="Cliente & Categoría" className="md:col-span-7">
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <Label className="text-sm font-semibold">Cliente <span className="text-destructive">*</span></Label>
                    <div className="flex flex-col sm:flex-row gap-2 min-w-0">
                      <Input
                        placeholder="Buscar o seleccionar cliente…"
                        value={form.cliente_query}
                        onChange={(e) => setForm({ ...form, cliente_query: e.target.value, cliente_id: '' })}
                        className="h-11 min-w-0 flex-1"
                      />
                      <Button type="button" variant="outline" className="font-semibold min-h-11 shrink-0" onClick={() => setClientModalOpen(true)}>
                        <Plus className="h-4 w-4 mr-1" /> Nuevo
                      </Button>
                    </div>
                  </div>
                  {form.cliente_query && !form.cliente_id && (
                    <div className="rounded-xl border bg-background max-h-36 overflow-y-auto">
                      {filteredClients.length > 0 ? filteredClients.slice(0, 8).map((client) => (
                        <button
                          key={client.id}
                          type="button"
                          className="w-full text-left px-3 py-2.5 text-sm font-medium hover:bg-muted/60 border-b last:border-0"
                          onClick={() => setForm({ ...form, cliente_id: client.id, cliente_query: client.nombre })}
                        >
                          {client.nombre}
                        </button>
                      )) : (
                        <div className="px-3 py-3 text-sm text-muted-foreground">
                          Sin coincidencias.{' '}
                          <button type="button" className="text-primary font-semibold underline" onClick={() => setClientModalOpen(true)}>
                            Registrar cliente
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                  {form.cliente_id && (
                    <p className="text-xs font-semibold text-primary">Seleccionado: {form.cliente_query}</p>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold">Categoría *</Label>
                    <Select value={form.categoria_id || 'none'} onValueChange={(v) => v !== 'none' && setCategory(v)}>
                      <SelectTrigger className="h-11"><SelectValue placeholder="Seleccionar categoría…" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none" disabled>Seleccionar categoría…</SelectItem>
                        {categoryOptions.map((cat) => (
                          <SelectItem key={cat.id} value={cat.id}>{cat.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold">
                      Subcategoría {usesCustomSub ? '(opcional)' : '*'}
                    </Label>
                    {usesCustomSub ? (
                      <Input
                        placeholder="Ej. laptop, panel solar, impresora"
                        className="h-11"
                        value={form.subcategoria_custom}
                        onChange={(e) => setForm({ ...form, subcategoria_custom: e.target.value })}
                      />
                    ) : (
                      <Select
                        value={form.subcategoria || 'none'}
                        onValueChange={(v) => v !== 'none' && setForm({ ...form, subcategoria: v })}
                        disabled={!form.categoria_id}
                      >
                        <SelectTrigger className="h-11"><SelectValue placeholder="Seleccionar subcategoría…" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none" disabled>Seleccionar…</SelectItem>
                          {subOptions.map((sub) => (
                            <SelectItem key={sub} value={sub}>{sub}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                </div>
              </FormSection>

              <FormSection title="Ubicación & Monto" className="md:col-span-5">
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <Label className="text-sm font-semibold">Sucursal *</Label>
                    <Select value={form.sucursal_id} onValueChange={(v) => setForm({ ...form, sucursal_id: v })}>
                      <SelectTrigger className="h-11">
                        <div className="flex items-center justify-between w-full">
                          <SelectValue placeholder="Sucursal" />
                          <Store className="h-4 w-4 text-muted-foreground ml-2 shrink-0" />
                        </div>
                      </SelectTrigger>
                      <SelectContent>
                        {QUOTATION_SUCURSALES.map((suc) => (
                          <SelectItem key={suc.id} value={suc.id}>{suc.nombre}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-sm font-semibold">Monto de la cotización *</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-muted-foreground">Bs.</span>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        required
                        placeholder="0.00"
                        className="h-11 pl-10 text-base font-semibold tabular-nums"
                        value={form.monto}
                        onChange={(e) => setForm({ ...form, monto: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
              </FormSection>

              <details className="md:col-span-12 group rounded-lg border border-dashed border-border bg-muted/15 px-3 py-1.5 min-w-0">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-2 min-h-9 text-xs font-medium text-muted-foreground [&::-webkit-details-marker]:hidden">
                  <span className="truncate min-w-0">
                    Vendedores
                    <span className="text-foreground/70 font-normal"> · {primaryVendorLabel} · {commissionTotal}%</span>
                  </span>
                  <span className="inline-flex items-center gap-1 shrink-0 text-[10px] uppercase tracking-wide">
                    Ajustar
                    <ChevronDown className="h-3.5 w-3.5 transition-transform group-open:rotate-180" />
                  </span>
                </summary>
                <div className="mt-2 space-y-2 border-t border-border/60 pt-2 pb-1">
                  {form.vendedores.map((row, index) => (
                    <div key={index} className="flex flex-col sm:flex-row gap-2 sm:items-end min-w-0">
                      <div className="flex-1 min-w-0 space-y-1">
                        <Label className="text-[11px] font-semibold text-muted-foreground">Vendedor</Label>
                        <Select
                          value={row.user_id || 'none'}
                          onValueChange={(v) => {
                            const vendor = vendorOptions.find((u) => u.id === v);
                            updateVendorRow(index, { user_id: v === 'none' ? '' : v, nombre: vendor?.name || '' });
                          }}
                        >
                          <SelectTrigger className="h-9 text-sm">
                            <div className="flex items-center justify-between w-full">
                              <SelectValue placeholder="Seleccionar…" />
                              <UserPlus className="h-3.5 w-3.5 text-muted-foreground ml-2 shrink-0" />
                            </div>
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none" disabled>Seleccionar…</SelectItem>
                            {vendorOptions.map((vendor) => (
                              <SelectItem key={vendor.id} value={vendor.id}>{vendor.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="w-full sm:w-24 shrink-0 space-y-1">
                        <Label className="text-[11px] font-semibold text-muted-foreground">% Com.</Label>
                        <div className="relative">
                          <Input
                            type="number"
                            min="0"
                            max="100"
                            step="0.1"
                            className="h-9 pr-8 text-sm tabular-nums"
                            value={row.comision_pct}
                            onChange={(e) => updateVendorRow(index, { comision_pct: Number(e.target.value) })}
                          />
                          <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-muted-foreground">%</span>
                        </div>
                      </div>
                      {form.vendedores.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="text-destructive h-9 shrink-0"
                          onClick={() => {
                            if (form.vendedores.length <= 1) return;
                            setForm({ ...form, vendedores: form.vendedores.filter((_, i) => i !== index) });
                          }}
                        >
                          Quitar
                        </Button>
                      )}
                    </div>
                  ))}
                  <div className="flex flex-wrap items-center gap-2 pt-0.5">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-8 px-2 text-xs font-semibold text-muted-foreground"
                      onClick={() => setForm({ ...form, vendedores: [...form.vendedores, emptyVendorRow(null, 0)] })}
                    >
                      <Plus className="h-3.5 w-3.5 mr-1" /> Agregar
                    </Button>
                    <p className={`text-[11px] ${commissionTotal === 100 ? 'text-muted-foreground' : 'text-amber-800'}`}>
                      Total {commissionTotal}%
                      {currentUser?.name ? ` · creador: ${currentUser.name}` : ''}
                    </p>
                  </div>
                </div>
              </details>

              <FormSection title="Detalles adicionales" className="md:col-span-12">
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <Label className="text-sm font-semibold">Observaciones / descripción</Label>
                    <Textarea
                      placeholder="Detalles específicos de la cotización…"
                      rows={3}
                      className="resize-none"
                      value={form.observacion}
                      onChange={(e) => setForm({ ...form, observacion: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-sm font-semibold">Archivos adjuntos</Label>
                    <label className="flex flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed border-outline-variant px-3 py-5 cursor-pointer hover:bg-muted/40 transition-colors">
                      <UploadCloud className="h-6 w-6 text-muted-foreground" />
                      <span className="font-semibold text-sm">Subir archivos</span>
                      <span className="text-xs text-muted-foreground text-center">PDF e imágenes — obligatorio para enviar</span>
                      <input
                        type="file"
                        accept=".pdf,application/pdf,image/*"
                        multiple
                        className="sr-only"
                        onChange={(e) => setAttachedFiles(Array.from(e.target.files || []))}
                      />
                    </label>
                    {attachedFiles.length > 0 && (
                      <ul className="text-xs text-muted-foreground space-y-1">
                        {attachedFiles.map((f) => (
                          <li key={f.name} className="truncate font-medium">· {f.name}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              </FormSection>

              <p className="md:col-span-12 text-xs text-center text-muted-foreground">
                <strong>Guardar borrador</strong> no envía al cliente. <strong>Enviar</strong> requiere PDF y pasa a estado enviado.
              </p>
            </div>

            <div className="sticky bottom-0 p-3 sm:p-4 border-t bg-card/95 backdrop-blur shrink-0 flex flex-col sm:flex-row gap-2">
              <Button type="submit" variant="outline" size="lg" disabled={saving} className="flex-1 min-h-11 h-11 text-sm sm:text-base">
                {saving ? <Loader2 className="h-5 w-5 mr-2 animate-spin" /> : <Save className="h-5 w-5 mr-2" />}
                Guardar borrador
              </Button>
              <Button type="button" variant="action" size="lg" disabled={saving} className="flex-1 min-h-11 h-11 text-sm sm:text-base" onClick={(e) => handleSubmit(e, true)}>
                {saving ? <Loader2 className="h-5 w-5 mr-2 animate-spin" /> : <Receipt className="h-5 w-5 mr-2" />}
                Enviar
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <ClientFormModal
        isOpen={clientModalOpen}
        onClose={() => setClientModalOpen(false)}
        initialData={form.cliente_query && !form.cliente_id ? { nombre: form.cliente_query } : null}
        onSuccess={(created) => {
          if (created?.id) {
            setForm((prev) => ({ ...prev, cliente_id: created.id, cliente_query: created.nombre }));
            onClientCreated?.(created);
          }
        }}
      />
    </>
  );
};

export default NewQuotationForm;
