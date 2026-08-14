import React, { useState } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

const SurveyForm = ({ onClose, onSubmit, initialData = null }) => {
  const [formData, setFormData] = useState(initialData || {
    cliente: '',
    direccion: '',
    motivo: '',
    fecha: '',
    hora: '',
    monto: '',
    adelanto: '',
    responsable: '',
    observaciones: '',
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
    onClose();
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-card rounded-2xl shadow-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-card border-b px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold">
            {initialData ? 'Editar Relevamiento' : 'Crear Nuevo Relevamiento'}
          </h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="cliente">Cliente *</Label>
              <Input
                id="cliente"
                value={formData.cliente}
                onChange={(e) => handleChange('cliente', e.target.value)}
                required
                className="bg-background text-foreground"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="direccion">Dirección *</Label>
              <Input
                id="direccion"
                value={formData.direccion}
                onChange={(e) => handleChange('direccion', e.target.value)}
                required
                className="bg-background text-foreground"
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="motivo">Motivo *</Label>
              <Input
                id="motivo"
                value={formData.motivo}
                onChange={(e) => handleChange('motivo', e.target.value)}
                required
                className="bg-background text-foreground"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="fecha">Fecha *</Label>
              <Input
                id="fecha"
                type="date"
                value={formData.fecha}
                onChange={(e) => handleChange('fecha', e.target.value)}
                required
                className="bg-background text-foreground"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="hora">Hora *</Label>
              <Input
                id="hora"
                type="time"
                value={formData.hora}
                onChange={(e) => handleChange('hora', e.target.value)}
                required
                className="bg-background text-foreground"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="responsable">Responsable *</Label>
              <Input
                id="responsable"
                value={formData.responsable}
                onChange={(e) => handleChange('responsable', e.target.value)}
                required
                className="bg-background text-foreground"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="monto">Monto ($)</Label>
              <Input
                id="monto"
                type="number"
                step="0.01"
                value={formData.monto}
                onChange={(e) => handleChange('monto', e.target.value)}
                className="bg-background text-foreground"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="adelanto">Adelanto ($)</Label>
              <Input
                id="adelanto"
                type="number"
                step="0.01"
                value={formData.adelanto}
                onChange={(e) => handleChange('adelanto', e.target.value)}
                className="bg-background text-foreground"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="observaciones">Observaciones</Label>
            <Textarea
              id="observaciones"
              value={formData.observaciones}
              onChange={(e) => handleChange('observaciones', e.target.value)}
              rows={4}
              className="bg-background text-foreground"
            />
          </div>

          <div className="flex gap-3 justify-end pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" className="bg-primary text-primary-foreground hover:bg-primary/90">
              {initialData ? 'Guardar Cambios' : 'Crear Relevamiento'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SurveyForm;