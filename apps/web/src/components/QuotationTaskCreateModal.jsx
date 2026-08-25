import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import quotationsService from '@/services/quotations/index.js';
import tasksService from '@/services/tasks/index.js';
import { QUOTATION_MAIN_CATEGORIES } from '@/mocks/quotations.js';

const todayIso = () => new Date().toISOString().slice(0, 10);

const titleFromDescription = (text) => {
  const line = String(text || '').trim().split('\n')[0] || '';
  return line.slice(0, 200);
};

const emptyForm = () => ({
  descripcion: '',
  cliente_id: '',
  plazo_final: todayIso(),
  prioridad: 'media',
  prioridadMotivo: '',
  asignadoId: '',
  fileKind: 'licitacion',
});

/** Modal rápido: solo la descripción es obligatoria. Cliente y extras son opcionales. */
export default function QuotationTaskCreateModal({
  open,
  onOpenChange,
  categories = QUOTATION_MAIN_CATEGORIES,
  clients = [],
  vendors = [],
  currentUser,
  onPublished,
}) {
  const mainCats = categories?.length ? categories : QUOTATION_MAIN_CATEGORIES;
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [files, setFiles] = useState([]);
  const [showExtra, setShowExtra] = useState(false);

  useEffect(() => {
    if (!open) return;
    setForm(emptyForm());
    setFiles([]);
    setShowExtra(false);
  }, [open]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const descripcion = form.descripcion.trim();
    if (!descripcion) return toast.error('Escribe la descripción de la tarea');
    if (form.prioridad === 'alta' && !form.prioridadMotivo.trim()) {
      return toast.error('Indica el motivo de la prioridad alta');
    }

    setCreating(true);
    try {
      const categoria = mainCats[0];
      const cliente = form.cliente_id ? clients.find((c) => c.id === form.cliente_id) : null;
      const assignee = form.asignadoId
        ? vendors.find((u) => u.id === form.asignadoId)
        : null;
      const plazo = form.plazo_final || todayIso();
      const titulo = titleFromDescription(descripcion);
      const vendedores = assignee
        ? [{ user_id: assignee.id, nombre: assignee.name, comision_pct: 100 }]
        : (currentUser ? [{ user_id: currentUser.id, nombre: currentUser.name, comision_pct: 100 }] : []);

      let quote = await quotationsService.create({
        titulo,
        categoria: categoria?.label || 'Sin categoría',
        categoria_id: categoria?.id || '',
        observacion: descripcion,
        plazo_final: plazo,
        ...(form.cliente_id ? { cliente_id: form.cliente_id } : {}),
        estado: 'borrador',
        monto: 1,
        tiene_licitacion: form.fileKind === 'licitacion' && files.length > 0,
        sucursal_id: currentUser?.sucursalId || currentUser?.sucursal_id || cliente?.sucursal_id || 'suc_central',
        sucursal_nombre: cliente?.sucursal_nombre || 'Central',
        vendedores,
      }, []);

      for (const file of files) {
        quote = await quotationsService.attachFile(quote.id, file, form.fileKind);
      }

      await tasksService.create({
        titulo,
        descripcion,
        tipo: 'cotizacion',
        estado: 'pendiente',
        prioridad: form.prioridad,
        prioridadMotivo: form.prioridad === 'alta' ? form.prioridadMotivo.trim() : null,
        plazo,
        cotizacionId: quote.id,
        cotizacion_numero: quote.numero || '',
        sucursalId: quote.sucursal_id || currentUser?.sucursalId,
        asignadoId: assignee?.id || null,
        asignado_nombre: assignee?.name || null,
        asignadoPorId: assignee ? currentUser?.id : null,
      });

      toast.success('Tarea publicada');
      onOpenChange(false);
      if (onPublished) await onPublished();
    } catch (err) {
      toast.error(err.message || 'Error al publicar tarea');
    } finally {
      setCreating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] flex flex-col gap-0 p-0">
        <DialogHeader className="px-6 pt-6 pb-2 shrink-0">
          <DialogTitle>Nueva tarea de cotización</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col min-h-0 flex-1">
          <div className="px-6 pb-3 space-y-3 overflow-y-auto text-sm flex-1 min-h-0">
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Descripción *</Label>
              <Textarea
                value={form.descripcion}
                onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
                rows={4}
                placeholder="Qué hay que cotizar, observaciones y requisitos…"
                className="resize-none"
                autoFocus
              />
            </div>

            <button
              type="button"
              className="text-xs font-semibold text-primary hover:underline"
              onClick={() => setShowExtra((v) => !v)}
            >
              {showExtra ? 'Ocultar opciones' : 'Cliente, plazo y extras (opcional)'}
            </button>

            {showExtra ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1 sm:col-span-2">
                  <Label className="text-xs font-semibold">Cliente</Label>
                  <Select
                    value={form.cliente_id || 'none'}
                    onValueChange={(v) => setForm({ ...form, cliente_id: v === 'none' ? '' : v })}
                  >
                    <SelectTrigger className="h-10"><SelectValue placeholder="Sin cliente" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Sin cliente</SelectItem>
                      {clients.map((cli) => (
                        <SelectItem key={cli.id} value={cli.id}>{cli.nombre}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Plazo</Label>
                  <Input
                    type="date"
                    value={form.plazo_final}
                    onChange={(e) => setForm({ ...form, plazo_final: e.target.value })}
                    className="h-10"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Prioridad</Label>
                  <Select value={form.prioridad} onValueChange={(v) => setForm({ ...form, prioridad: v })}>
                    <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="baja">Baja</SelectItem>
                      <SelectItem value="media">Media</SelectItem>
                      <SelectItem value="alta">Alta</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1 sm:col-span-2">
                  <Label className="text-xs font-semibold">Encargado</Label>
                  <Select
                    value={form.asignadoId || 'pool'}
                    onValueChange={(v) => setForm({ ...form, asignadoId: v === 'pool' ? '' : v })}
                  >
                    <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pool">Disponible (pool)</SelectItem>
                      {vendors.map((u) => (
                        <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {form.prioridad === 'alta' && (
                  <div className="space-y-1 sm:col-span-2">
                    <Label className="text-xs font-semibold">Motivo prioridad alta *</Label>
                    <Input
                      value={form.prioridadMotivo}
                      onChange={(e) => setForm({ ...form, prioridadMotivo: e.target.value })}
                      placeholder="¿Por qué es alta?"
                      className="h-10"
                    />
                  </div>
                )}
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Documento</Label>
                  <Select value={form.fileKind} onValueChange={(v) => setForm({ ...form, fileKind: v })}>
                    <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="licitacion">Licitación</SelectItem>
                      <SelectItem value="prerequisito">Prerrequisitos</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Archivos</Label>
                  <Input
                    type="file"
                    multiple
                    accept=".pdf,image/*"
                    onChange={(e) => setFiles(Array.from(e.target.files || []))}
                    className="h-10 text-xs"
                  />
                </div>
              </div>
            ) : null}
          </div>
          <DialogFooter className="px-6 py-4 border-t shrink-0 gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={creating}>
              Cancelar
            </Button>
            <Button type="submit" variant="default" disabled={creating}>
              {creating ? 'Publicando…' : 'Publicar tarea'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
