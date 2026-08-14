import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Image as ImageIcon, X } from 'lucide-react';
import { format } from 'date-fns';

const ObservationRegistrationModal = ({ isOpen, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    fecha: format(new Date(), 'yyyy-MM-dd'),
    descripcion: '',
    severidad: 'Baja',
    estado_observacion: 'Abierta'
  });
  const [files, setFiles] = useState([]);
  const [previewUrls, setPreviewUrls] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleSelectChange = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    if (selectedFiles.length + files.length > 5) return alert("Máximo 5 imágenes.");
    setFiles(prev => [...prev, ...selectedFiles]);
    const newPreviews = selectedFiles.map(file => URL.createObjectURL(file));
    setPreviewUrls(prev => [...prev, ...newPreviews]);
  };

  const removeFile = (index) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
    URL.revokeObjectURL(previewUrls[index]);
    setPreviewUrls(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    const data = new FormData();
    Object.entries(formData).forEach(([key, value]) => {
      if (value !== '') data.append(key, value);
    });
    files.forEach(file => data.append('fotografias', file));

    try {
      await onSave(data);
      onClose();
      setFormData({ fecha: format(new Date(), 'yyyy-MM-dd'), descripcion: '', severidad: 'Baja', estado_observacion: 'Abierta' });
      setFiles([]); setPreviewUrls([]);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Registrar Observación / Novedad</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="space-y-2">
            <Label htmlFor="fecha">Fecha <span className="text-destructive">*</span></Label>
            <Input id="fecha" name="fecha" type="date" value={formData.fecha} onChange={handleChange} required className="text-foreground" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="descripcion">Descripción <span className="text-destructive">*</span></Label>
            <Textarea id="descripcion" name="descripcion" value={formData.descripcion} onChange={handleChange} required className="text-foreground min-h-[100px]" placeholder="Detalle la novedad u observación..." />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="severidad">Severidad <span className="text-destructive">*</span></Label>
              <Select value={formData.severidad} onValueChange={(val) => handleSelectChange('severidad', val)}>
                <SelectTrigger className="text-foreground">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Baja">Baja</SelectItem>
                  <SelectItem value="Media">Media</SelectItem>
                  <SelectItem value="Alta">Alta</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="estado_observacion">Estado Inicial <span className="text-destructive">*</span></Label>
              <Select value={formData.estado_observacion} onValueChange={(val) => handleSelectChange('estado_observacion', val)}>
                <SelectTrigger className="text-foreground">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Abierta">Abierta</SelectItem>
                  <SelectItem value="En revision">En revisión</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Evidencia Fotográfica</Label>
            {previewUrls.length > 0 && (
              <div className="flex gap-2 overflow-x-auto py-2">
                {previewUrls.map((url, idx) => (
                  <div key={idx} className="relative h-16 w-16 shrink-0 rounded-lg overflow-hidden border">
                    <img src={url} alt="Preview" className="w-full h-full object-cover" />
                    <button type="button" onClick={() => removeFile(idx)} className="absolute top-0.5 right-0.5 bg-black/60 text-white rounded-full p-0.5">
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            <label className="cursor-pointer flex items-center justify-center gap-2 text-sm font-semibold text-primary hover:text-primary/80 bg-primary/10 px-4 py-2.5 rounded-lg border border-primary/20 transition-all w-full">
              <ImageIcon className="h-4 w-4" /> Subir fotos (Máx 5)
              <input type="file" accept="image/*" multiple className="hidden" onChange={handleFileChange} />
            </label>
          </div>

          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>Cancelar</Button>
            <Button type="submit" disabled={isSubmitting || !formData.descripcion}>
              {isSubmitting ? 'Guardando...' : 'Registrar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ObservationRegistrationModal;