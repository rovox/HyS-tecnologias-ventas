import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import pb from '@/lib/pocketbaseClient.js';

const ESTADOS = [
  { value: 'activo', label: 'Disponible / Activo' },
  { value: 'en_uso', label: 'En Uso' },
  { value: 'en_mantenimiento', label: 'Mantenimiento' },
  { value: 'inactivo', label: 'Fuera de Servicio' }
];

const VehicleFormModal = ({ isOpen, onClose, onSave, initialData = null }) => {
  const [formData, setFormData] = useState({
    patente: '',
    marca: '',
    modelo: '',
    anio: '',
    sucursal_id: '',
    estado: 'activo',
    kilometraje_actual: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sucursales, setSucursales] = useState([]);

  useEffect(() => {
    pb.collection('sucursales').getFullList({ filter: 'activa = true', sort: 'nombre', requestKey: 'vfm-suc' })
      .then(setSucursales).catch(() => setSucursales([]));
  }, []);

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setFormData({
          patente: initialData.patente || '',
          marca: initialData.marca || '',
          modelo: initialData.modelo || '',
          anio: initialData.anio || '',
          sucursal_id: initialData.sucursal_id || '',
          estado: initialData.estado || 'activo',
          kilometraje_actual: initialData.kilometraje_actual || ''
        });
      } else {
        setFormData({
          patente: '',
          marca: '',
          modelo: '',
          anio: '',
          sucursal_id: '',
          estado: 'activo',
          kilometraje_actual: ''
        });
      }
    }
  }, [isOpen, initialData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.patente) return;
    
    setIsSubmitting(true);
    try {
      const dataToSave = { ...formData };
      if (dataToSave.anio) dataToSave.anio = parseInt(dataToSave.anio, 10);
      if (dataToSave.kilometraje_actual) dataToSave.kilometraje_actual = parseInt(dataToSave.kilometraje_actual, 10);
      
      await onSave(dataToSave, initialData?.id, initialData);
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{initialData ? 'Editar Vehículo' : 'Registrar Nuevo Vehículo'}</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="space-y-2">
            <Label htmlFor="patente">Placa / Patente <span className="text-destructive">*</span></Label>
            <Input id="patente" name="patente" value={formData.patente} onChange={handleChange} required className="uppercase text-foreground" placeholder="ABC-1234" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="marca">Marca</Label>
              <Input id="marca" name="marca" value={formData.marca} onChange={handleChange} className="text-foreground" placeholder="Toyota" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="modelo">Modelo</Label>
              <Input id="modelo" name="modelo" value={formData.modelo} onChange={handleChange} className="text-foreground" placeholder="Hilux" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="anio">Año</Label>
              <Input id="anio" name="anio" type="number" value={formData.anio} onChange={handleChange} className="text-foreground" placeholder="2020" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="kilometraje_actual">Kilometraje Inicial</Label>
              <Input id="kilometraje_actual" name="kilometraje_actual" type="number" value={formData.kilometraje_actual} onChange={handleChange} className="text-foreground" placeholder="0" />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="sucursal_id">Sucursal Base</Label>
            <Select value={formData.sucursal_id || 'none'} onValueChange={(val) => handleSelectChange('sucursal_id', val === 'none' ? '' : val)}>
              <SelectTrigger className="text-foreground">
                <SelectValue placeholder="Selecciona sucursal" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Sin asignar</SelectItem>
                {sucursales.map(s => <SelectItem key={s.id} value={s.id}>{s.nombre}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="estado">Estado</Label>
            <Select value={formData.estado} onValueChange={(val) => handleSelectChange('estado', val)}>
              <SelectTrigger className="text-foreground">
                <SelectValue placeholder="Selecciona estado" />
              </SelectTrigger>
              <SelectContent>
                {ESTADOS.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <DialogFooter className="pt-4 mt-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>Cancelar</Button>
            <Button type="submit" disabled={isSubmitting || !formData.patente}>
              {isSubmitting ? 'Guardando...' : 'Guardar Vehículo'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default VehicleFormModal;
