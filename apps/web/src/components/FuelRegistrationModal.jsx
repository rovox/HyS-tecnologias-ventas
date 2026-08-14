import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Image as ImageIcon, X } from 'lucide-react';
import { format } from 'date-fns';

const FuelRegistrationModal = ({ isOpen, onClose, onSave, initialKm = 0 }) => {
  const [formData, setFormData] = useState({
    fecha: format(new Date(), 'yyyy-MM-dd'),
    kilometraje: initialKm || '',
    litros: '',
    costo: '',
    observaciones: ''
  });
  const [files, setFiles] = useState([]);
  const [previewUrls, setPreviewUrls] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
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
      // Reset
      setFormData({ fecha: format(new Date(), 'yyyy-MM-dd'), kilometraje: '', litros: '', costo: '', observaciones: '' });
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
          <DialogTitle>Registrar Carga de Combustible</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="space-y-2">
            <Label htmlFor="fecha">Fecha <span className="text-destructive">*</span></Label>
            <Input id="fecha" name="fecha" type="date" value={formData.fecha} onChange={handleChange} required className="text-foreground" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="kilometraje">Odómetro Actual (Km) <span className="text-destructive">*</span></Label>
            <Input id="kilometraje" name="kilometraje" type="number" value={formData.kilometraje} onChange={handleChange} required className="text-foreground" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="litros">Litros Cargados <span className="text-destructive">*</span></Label>
              <Input id="litros" name="litros" type="number" step="0.01" value={formData.litros} onChange={handleChange} required className="text-foreground" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="costo">Costo Total ($us/Bs) <span className="text-destructive">*</span></Label>
              <Input id="costo" name="costo" type="number" step="0.01" value={formData.costo} onChange={handleChange} required className="text-foreground" />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="observaciones">Observaciones</Label>
            <Textarea id="observaciones" name="observaciones" value={formData.observaciones} onChange={handleChange} className="text-foreground resize-none h-20" />
          </div>

          <div className="space-y-2">
            <Label>Evidencia Fotográfica (Ticket)</Label>
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
            <Button type="submit" disabled={isSubmitting || !formData.kilometraje || !formData.litros || !formData.costo}>
              {isSubmitting ? 'Guardando...' : 'Registrar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default FuelRegistrationModal;