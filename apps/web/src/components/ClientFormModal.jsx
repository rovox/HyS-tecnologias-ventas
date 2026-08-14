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

const ClientFormModal = ({ isOpen, onClose, onSuccess, initialData = null }) => {
  const { createClient, updateClient, loading } = useClients();
  
  const [formData, setFormData] = useState({
    nombre: '',
    tipo: 'Seguridad Electrónica',
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
          tipo: initialData.tipo || 'Seguridad Electrónica',
          contacto: initialData.contacto || '',
          email: initialData.email || '',
          telefono: initialData.telefono || '',
          direccion: initialData.direccion || '',
          observaciones: initialData.observaciones || ''
        });
      } else {
        setFormData({
          nombre: '',
          tipo: 'Seguridad Electrónica',
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
      if (initialData?.id) {
        await updateClient(initialData.id, formData);
        toast.success('Cliente actualizado exitosamente');
      } else {
        await createClient(formData);
        toast.success('Cliente registrado exitosamente');
      }
      onSuccess();
      onClose();
    } catch (err) {
      toast.error(err.message || 'Error al guardar el cliente');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-xl bg-background rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-extrabold tracking-tight">
            {initialData ? 'Editar Cliente' : 'Registrar Nuevo Cliente'}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-5 mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="nombre">Nombre / Razón Social <span className="text-destructive">*</span></Label>
              <Input 
                id="nombre" name="nombre" 
                value={formData.nombre} onChange={handleChange} 
                className="bg-card font-medium" 
                placeholder="Ej. Comercializadora ABC"
                required 
                disabled={loading}
              />
            </div>
            
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="tipo">Tipo de Cliente <span className="text-destructive">*</span></Label>
              <Select value={formData.tipo} onValueChange={(val) => setFormData(prev => ({...prev, tipo: val}))} disabled={loading}>
                <SelectTrigger className="bg-card font-medium">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Seguridad Electrónica">Seguridad Electrónica</SelectItem>
                  <SelectItem value="Proyecto">Proyecto</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="contacto">Persona de Contacto</Label>
              <Input 
                id="contacto" name="contacto" 
                value={formData.contacto} onChange={handleChange} 
                className="bg-card" 
                placeholder="Nombre de contacto"
                disabled={loading}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="telefono">Teléfono</Label>
              <Input 
                id="telefono" name="telefono" 
                value={formData.telefono} onChange={handleChange} 
                className="bg-card" 
                placeholder="Ej. +591 70000000"
                disabled={loading}
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="email">Correo Electrónico</Label>
              <Input 
                id="email" name="email" type="email"
                value={formData.email} onChange={handleChange} 
                className="bg-card" 
                placeholder="correo@ejemplo.com"
                disabled={loading}
              />
            </div>
            
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="direccion">Dirección</Label>
              <Input 
                id="direccion" name="direccion" 
                value={formData.direccion} onChange={handleChange} 
                className="bg-card" 
                placeholder="Dirección completa"
                disabled={loading}
              />
            </div>
            
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="observaciones">Observaciones</Label>
              <Textarea 
                id="observaciones" name="observaciones" 
                value={formData.observaciones} onChange={handleChange} 
                className="bg-card min-h-[80px]" 
                placeholder="Detalles adicionales sobre el cliente..."
                disabled={loading}
              />
            </div>
          </div>

          <DialogFooter className="pt-4 border-t border-border mt-4">
            <Button type="button" variant="ghost" onClick={onClose} disabled={loading} className="font-bold">Cancelar</Button>
            <Button type="submit" disabled={loading} className="font-bold px-6">
              {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              {initialData ? 'Guardar Cambios' : 'Registrar Cliente'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ClientFormModal;