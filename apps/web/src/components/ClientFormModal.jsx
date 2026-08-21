import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog.jsx';
import { Button } from '@/components/ui/button.jsx';
import { Input } from '@/components/ui/input.jsx';
import { Label } from '@/components/ui/label.jsx';
import { Textarea } from '@/components/ui/textarea.jsx';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select.jsx';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useClients } from '@/hooks/useClients.js';
import { QUOTATION_MAIN_CATEGORIES } from '@/mocks/quotations.js';

const CLIENT_TYPE_LABELS = QUOTATION_MAIN_CATEGORIES.map((row) => row.label);

const normalizeClientTipo = (tipo) => {
  if (tipo === 'Proyecto') return 'Proyectos';
  if (tipo === 'Insumos tecnológicos') return 'Equipos y tecnología';
  return tipo || CLIENT_TYPE_LABELS[0];
};

const ClientFormModal = ({ isOpen, onClose, onSuccess, initialData = null }) => {
  const { createClient, updateClient, loading } = useClients();
  
  const [formData, setFormData] = useState({
    nombre: '',
    tipo: '',
    contacto: '',
    email: '',
    telefono: '',
    direccion: '',
    observaciones: ''
  });

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setFormData({
          nombre: initialData.nombre || '',
          tipo: initialData.tipo ? normalizeClientTipo(initialData.tipo) : '',
          contacto: initialData.contacto || '',
          email: initialData.email || '',
          telefono: initialData.telefono || '',
          direccion: initialData.direccion || '',
          observaciones: initialData.observaciones || ''
        });
      } else {
        setFormData({
          nombre: '',
          tipo: '',
          contacto: '',
          email: '',
          telefono: '',
          direccion: '',
          observaciones: ''
        });
      }
    }
  }, [isOpen, initialData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.nombre.trim()) {
      toast.error('El nombre del cliente es obligatorio');
      return;
    }

    try {
      const payload = {
        ...formData,
        tipo: (formData.tipo || '').trim(),
      };
      let saved;
      if (initialData?.id) {
        saved = await updateClient(initialData.id, payload);
        toast.success('Cliente actualizado exitosamente');
      } else {
        saved = await createClient(payload);
        toast.success('Cliente registrado exitosamente');
      }
      onSuccess?.(saved);
      onClose();
    } catch (err) {
      toast.error(err.message || 'Error al guardar el cliente');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent
        className={[
          'sm:max-w-xl bg-background rounded-2xl p-0 gap-0',
          'flex flex-col overflow-hidden',
          'w-[calc(100%-1.25rem)] max-h-[min(92dvh,920px)]',
        ].join(' ')}
      >
        <DialogHeader className="shrink-0 px-4 sm:px-6 pt-4 sm:pt-5 pb-2 pr-12 text-left">
          <DialogTitle className="text-lg sm:text-xl font-extrabold tracking-tight">
            {initialData?.id ? 'Editar Cliente' : 'Registrar Nuevo Cliente'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 sm:px-6 py-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="nombre">Nombre / Razón Social <span className="text-destructive">*</span></Label>
                <Input
                  id="nombre" name="nombre"
                  value={formData.nombre} onChange={handleChange}
                  className="bg-card font-medium min-h-11"
                  placeholder="Ej. Comercializadora ABC"
                  required
                  disabled={loading}
                />
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="tipo">Referencia opcional (categoría)</Label>
                <Select
                  value={formData.tipo || undefined}
                  onValueChange={(val) => setFormData((prev) => ({ ...prev, tipo: val }))}
                  disabled={loading}
                >
                  <SelectTrigger className="bg-card font-medium min-h-11">
                    <SelectValue placeholder="Sin categoría fija (recomendado)" />
                  </SelectTrigger>
                  <SelectContent>
                    {CLIENT_TYPE_LABELS.map((label) => (
                      <SelectItem key={label} value={label}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-[11px] text-muted-foreground leading-snug">
                  Un cliente puede tener cotizaciones y trabajos en varias categorías. No hace falta fijar un tipo aquí.
                </p>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="contacto">Persona de Contacto</Label>
                <Input
                  id="contacto" name="contacto"
                  value={formData.contacto} onChange={handleChange}
                  className="bg-card min-h-11"
                  placeholder="Nombre de contacto"
                  disabled={loading}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="telefono">Teléfono</Label>
                <Input
                  id="telefono" name="telefono"
                  value={formData.telefono} onChange={handleChange}
                  className="bg-card min-h-11"
                  placeholder="Ej. +591 70000000"
                  disabled={loading}
                />
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="email">Correo Electrónico</Label>
                <Input
                  id="email" name="email" type="email"
                  value={formData.email} onChange={handleChange}
                  className="bg-card min-h-11"
                  placeholder="correo@ejemplo.com"
                  disabled={loading}
                />
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="direccion">Dirección</Label>
                <Input
                  id="direccion" name="direccion"
                  value={formData.direccion} onChange={handleChange}
                  className="bg-card min-h-11"
                  placeholder="Dirección completa"
                  disabled={loading}
                />
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="observaciones">Observaciones</Label>
                <Textarea
                  id="observaciones" name="observaciones"
                  value={formData.observaciones} onChange={handleChange}
                  className="bg-card min-h-[64px] max-h-32 resize-y"
                  rows={2}
                  placeholder="Detalles adicionales sobre el cliente..."
                  disabled={loading}
                />
              </div>
            </div>
          </div>

          <DialogFooter className="shrink-0 gap-2 border-t border-border bg-background px-4 sm:px-6 py-3 sm:py-4">
            <Button type="button" variant="ghost" onClick={onClose} disabled={loading} className="font-bold min-h-11">
              Cancelar
            </Button>
            <Button type="submit" disabled={loading} className="font-bold px-6 min-h-11">
              {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              {initialData?.id ? 'Guardar Cambios' : 'Registrar Cliente'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ClientFormModal;