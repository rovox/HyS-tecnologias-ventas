import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Image as ImageIcon, X } from 'lucide-react';
import { format } from 'date-fns';

const ProblemRegistrationModal = ({ isOpen, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    fecha_reporte: format(new Date(), 'yyyy-MM-dd'),
    descripcion_problema: '',
    severidad: 'Media',
    estado_problema: 'Reportado',
    costo_reparacion: '',
    observaciones: ''
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
      setFormData({ fecha_reporte: format(new Date(), 'yyyy-MM-dd'), descripcion_problema: '', severidad: 'Media', estado_problema: 'Reportado', costo_reparacion: '', observaciones: '' });
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
          <DialogTitle>Reportar Problema / Falla Mayor</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="space-y-2">
            <Label htmlFor="fecha_reporte">Fecha del Reporte <span className="text-destructive">*</span></Label>
            <Input id="fecha_reporte" name="fecha_reporte" type="date" value={formData.fecha_reporte} onChange={handleChange} required className="text-foreground" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="descripcion_problema">Descripción del Problema <span className="text-destructive">*</span></Label>
            <Textarea id="descripcion_problema" name="descripcion_problema" value={formData.descripcion_problema} onChange={handleChange} required className="text-foreground min-h-[100px]" placeholder="Describa la falla en detalle..." />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="severidad">Severidad <span className="text-destructive">*</span></Label>
              <Select value={formData.severidad} onValueChange={(val) => handleSelectChange('severidad', val)}>
                <SelectTrigger className="text-foreground">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Media">Media</SelectItem>
                  <SelectItem value="Alta">Alta</SelectItem>
                  <SelectItem value="Critica">Crítica (No operable)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="estado_problema">Estado Inicial <span className="text-destructive">*</span></Label>
              <Select value={formData.estado_problema} onValueChange={(val) => handleSelectChange('estado_problema', val)}>
                <SelectTrigger className="text-foreground">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Reportado">Reportado</SelectItem>
                  <SelectItem value="En revision">En revisión</SelectItem>
                  <SelectItem value="En reparacion">En taller / Reparación</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="costo_reparacion">Costo Estimado (Opcional)</Label>
            <Input id="costo_reparacion" name="costo_reparacion" type="number" step="0.01" value={formData.costo_reparacion} onChange={handleChange} className="text-foreground" />
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
            <label className="cursor-pointer flex items-center justify-center gap-2 text-sm font-semibold text-destructive hover:text-destructive/80 bg-destructive/10 px-4 py-2.5 rounded-lg border border-destructive/20 transition-all w-full">
              <ImageIcon className="h-4 w-4" /> Subir fotos de daño (Máx 5)
              <input type="file" accept="image/*" multiple className="hidden" onChange={handleFileChange} />
            </label>
          </div>

          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>Cancelar</Button>
            <Button type="submit" disabled={isSubmitting || !formData.descripcion_problema} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {isSubmitting ? 'Enviando...' : 'Reportar Falla'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ProblemRegistrationModal;