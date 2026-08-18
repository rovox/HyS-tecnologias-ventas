import React, { useMemo, useState } from 'react';
import { ArrowLeft, Loader2, Plus, Receipt, Save, Store, UploadCloud, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import quotationsService from '@/services/quotations/index.js';
import {
  QUOTATION_MAIN_CATEGORIES,
  QUOTATION_SUBCATEGORIES,
  QUOTATION_SUCURSALES,
  COT_PREFIX,
  peekNextQuotationNumero,
} from '@/mocks/quotations.js';
import ClientFormModal from '@/components/ClientFormModal.jsx';

const FormSection = ({ title, children, className = '' }) => (
  <div className={`rounded-2xl border border-border bg-card p-4 md:p-5 space-y-4 shadow-[0_4px_20px_rgba(0,43,91,0.06)] ${className}`}>
    <h3 className="font-semibold text-foreground text-base">{title}</h3>
    {children}
  </div>
);

const emptyVendorRow = (user = null, pct = 100) => ({
  user_id: user?.id || '',
  nombre: user?.name || '',
  comision_pct: pct,
});

export const createEmptyCommercial = (user) => ({
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
  currentUser,
  onSaved,
  onClientCreated,
}) => {
  const [form, setForm] = useState(() => createEmptyCommercial(currentUser));
  const [attachedFiles, setAttachedFiles] = useState([]);
  const [saving, setSaving] = useState(false);
  const [clientModalOpen, setClientModalOpen] = useState(false);

  const nextNumero = peekNextQuotationNumero(quotations);
  const vendorOptions = useMemo(() => {
    const list = [...vendors];
    if (currentUser && !list.some((v) => v.id === currentUser.id)) {
      list.unshift({ id: currentUser.id, name: currentUser.name, role: currentUser.role });
    }
    return list;
  }, [vendors, currentUser]);

  const filteredClients = clients.filter((c) =>
    c.nombre?.toLowerCase().includes((form.cliente_query || '').toLowerCase())
  );
  const commissionTotal = form.vendedores.reduce((sum, row) => sum + (Number(row.comision_pct) || 0), 0);
  const subOptions = QUOTATION_SUBCATEGORIES[form.categoria_id] || [];
  const isInsumos = form.categoria_id === 'insumos_tecnologicos';

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.titulo_resumen.trim()) return toast.error('Ingresa el título / resumen de la cotización');
    if (!form.cliente_id) return toast.error('Selecciona o registra un cliente');
    if (!form.categoria_id) return toast.error('Selecciona una categoría');
    if (!form.sucursal_id) return toast.error('Selecciona una sucursal');
    if (!isInsumos && !form.subcategoria) return toast.error('Selecciona una subcategoría');

    const monto = Number(form.monto);
    if (!monto || monto <= 0) return toast.error('Ingresa el monto de la cotización');
    if (attachedFiles.length === 0) return toast.error('Adjunta al menos un archivo (PDF o imagen)');

    const activeVendors = form.vendedores.filter((row) => row.user_id);
    if (activeVendors.length === 0) return toast.error('Selecciona al menos un vendedor');

    const pdfFile = attachedFiles.find((f) => f.type === 'application/pdf' || f.name.endsWith('.pdf'));
    const imageFile = attachedFiles.find((f) => f.type.startsWith('image/'));

    setSaving(true);
    try {
      const client = clients.find((row) => row.id === form.cliente_id);
      const categoriaLabel = QUOTATION_MAIN_CATEGORIES.find((row) => row.id === form.categoria_id)?.label || '';
      const sucursal = QUOTATION_SUCURSALES.find((row) => row.id === form.sucursal_id);
      const subcategoria = isInsumos ? form.subcategoria_custom.trim() : form.subcategoria;

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
        estado: 'enviada',
        archivo: pdfFile?.name || '',
        imagen_preview: imageFile?.name || '',
        archivos_adjuntos: attachedFiles.map((f) => ({
          nombre: f.name,
          tipo: f.type === 'application/pdf' || f.name.endsWith('.pdf') ? 'pdf' : 'imagen',
        })),
      });

      toast.success(
        commissionTotal === 100
          ? 'Cotización registrada como enviada al cliente'
          : `Cotización enviada. Comisiones suman ${commissionTotal}%.`
      );
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
        <DialogContent className="max-w-lg lg:max-w-5xl w-[calc(100%-1rem)] p-0 gap-0 overflow-hidden max-h-[95vh] flex flex-col">
          <div className="flex items-center gap-3 px-4 py-3 border-b bg-card shrink-0">
            <button
              type="button"
              onClick={() => handleOpenChange(false)}
              className="p-1.5 rounded-lg hover:bg-muted transition-colors"
              aria-label="Volver"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <DialogTitle className="text-lg font-bold flex-1 text-center pr-8">Nueva Cotización</DialogTitle>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0 overflow-y-auto bg-background">
            <div className="p-4 md:p-6 pb-28 grid grid-cols-1 lg:grid-cols-12 gap-4">
              <FormSection title="Identificación" className="lg:col-span-12">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
                  <div className="md:col-span-4 flex items-center justify-between gap-3 rounded-xl border border-border bg-muted/30 px-4 py-3">
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-1">
                        Código
                      </p>
                      <p className="text-xl font-bold tabular-nums text-foreground">{nextNumero}</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">{COT_PREFIX}mes día año</p>
                    </div>
                    <Receipt className="h-6 w-6 text-muted-foreground shrink-0" />
                  </div>
                  <div className="md:col-span-8 space-y-2">
                    <Label className="text-sm font-semibold">Título *</Label>
                    <Input
                      required
                      className="h-11"
                      placeholder="Resumen de la cotización (ej. CCTV 16 canales)"
                      value={form.titulo_resumen}
                      onChange={(e) => setForm({ ...form, titulo_resumen: e.target.value })}
                    />
                    <p className="text-xs text-muted-foreground">
                      Vista: <span className="font-semibold text-foreground">{nextNumero}{form.titulo_resumen.trim() ? ` — ${form.titulo_resumen.trim()}` : ' — …'}</span>
                    </p>
                  </div>
                </div>
              </FormSection>

              <FormSection title="Cliente & Categoría" className="lg:col-span-7">
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <Label className="text-sm font-semibold">Cliente <span className="text-destructive">*</span></Label>
                    <Button type="button" variant="outline" size="sm" className="font-semibold" onClick={() => setClientModalOpen(true)}>
                      <Plus className="h-3.5 w-3.5 mr-1" /> Nuevo cliente
                    </Button>
                  </div>
                  <Input
                    placeholder="Buscar o seleccionar cliente…"
                    value={form.cliente_query}
                    onChange={(e) => setForm({ ...form, cliente_query: e.target.value, cliente_id: '' })}
                    className="h-11"
                  />
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
                        {QUOTATION_MAIN_CATEGORIES.map((cat) => (
                          <SelectItem key={cat.id} value={cat.id}>{cat.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold">
                      Subcategoría {isInsumos ? '(opcional)' : '*'}
                    </Label>
                    {isInsumos ? (
                      <Input
                        placeholder="Texto libre (opcional)"
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

              <FormSection title="Ubicación & Monto" className="lg:col-span-5">
                <div className="space-y-2">
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
                <div className="space-y-2">
                  <Label className="text-sm font-semibold">Monto de la cotización *</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-muted-foreground">Bs.</span>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      required
                      placeholder="0.00"
                      className="h-11 pl-10 text-lg font-semibold tabular-nums"
                      value={form.monto}
                      onChange={(e) => setForm({ ...form, monto: e.target.value })}
                    />
                  </div>
                </div>
              </FormSection>

              <FormSection title="Vendedores & Comisiones" className="lg:col-span-6">
                {form.vendedores.map((row, index) => (
                  <div key={index} className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
                    <div className="sm:col-span-7 space-y-2">
                      <Label className="text-sm font-semibold">Vendedor asignado *</Label>
                      <Select
                        value={row.user_id || 'none'}
                        onValueChange={(v) => {
                          const vendor = vendorOptions.find((u) => u.id === v);
                          updateVendorRow(index, { user_id: v === 'none' ? '' : v, nombre: vendor?.name || '' });
                        }}
                      >
                        <SelectTrigger className="h-11">
                          <div className="flex items-center justify-between w-full">
                            <SelectValue placeholder="Seleccionar vendedor…" />
                            <UserPlus className="h-4 w-4 text-muted-foreground ml-2 shrink-0" />
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
                    <div className="sm:col-span-4 space-y-2">
                      <Label className="text-sm font-semibold">% Comisión</Label>
                      <div className="relative">
                        <Input
                          type="number"
                          min="0"
                          max="100"
                          step="0.1"
                          className="h-11 pr-10 tabular-nums"
                          value={row.comision_pct}
                          onChange={(e) => updateVendorRow(index, { comision_pct: Number(e.target.value) })}
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-bold text-muted-foreground">%</span>
                      </div>
                    </div>
                    {form.vendedores.length > 1 && (
                      <Button type="button" variant="ghost" size="sm" className="sm:col-span-1 text-destructive" onClick={() => {
                        if (form.vendedores.length <= 1) return;
                        setForm({ ...form, vendedores: form.vendedores.filter((_, i) => i !== index) });
                      }}>
                        Quitar
                      </Button>
                    )}
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="font-semibold"
                  onClick={() => setForm({ ...form, vendedores: [...form.vendedores, emptyVendorRow(null, 0)] })}
                >
                  <Plus className="h-4 w-4 mr-1" /> Agregar vendedor
                </Button>
                <p className={`text-xs font-medium ${commissionTotal === 100 ? 'text-muted-foreground' : 'text-amber-800'}`}>
                  Total comisiones: {commissionTotal}% {currentUser?.name ? `· creador: ${currentUser.name}` : ''}
                </p>
              </FormSection>

              <FormSection title="Detalles adicionales" className="lg:col-span-6">
                <div className="space-y-2">
                  <Label className="text-sm font-semibold">Observaciones / descripción</Label>
                  <Textarea
                    placeholder="Detalles específicos de la cotización…"
                    rows={3}
                    className="resize-none"
                    value={form.observacion}
                    onChange={(e) => setForm({ ...form, observacion: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-semibold">Archivos adjuntos *</Label>
                  <label className="flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-outline-variant px-4 py-8 cursor-pointer hover:bg-muted/40 transition-colors">
                    <UploadCloud className="h-8 w-8 text-muted-foreground" />
                    <span className="font-semibold text-sm">Subir archivos</span>
                    <span className="text-xs text-muted-foreground">PDF e imágenes — el detalle vive en el adjunto</span>
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
              </FormSection>

              <p className="lg:col-span-12 text-xs text-center text-muted-foreground">
                Al guardar se registra como <strong>enviada al cliente</strong>. No hay borrador en esta fase.
              </p>
            </div>

            <div className="sticky bottom-0 p-4 border-t bg-card/95 backdrop-blur shrink-0">
              <Button type="submit" variant="action" size="lg" disabled={saving} className="w-full h-12 text-base">
                {saving ? <Loader2 className="h-5 w-5 mr-2 animate-spin" /> : <Save className="h-5 w-5 mr-2" />}
                Guardar cotización
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
