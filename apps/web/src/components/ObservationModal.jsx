import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Image as ImageIcon, X } from 'lucide-react';
import { toast } from 'sonner';

const ObservationModal = ({ isOpen, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    descripcion: '',
    tipo: 'normal',
    comentarios: ''
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
    if (selectedFiles.length + files.length > 5) {
      alert("Máximo 5 imágenes permitidas.");
      return;
    }
    setFiles(prev => [...prev, ...selectedFiles]);
    const newPreviews = selectedFiles.map(f => URL.createObjectURL(f));
    setPreviewUrls(prev => [...prev, ...newPreviews]);
  };

  const removeFile = (index) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
    URL.revokeObjectURL(previewUrls[index]);
    setPreviewUrls(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.descripcion || !formData.tipo) return;
    
    setIsSubmitting(true);
    try {
      const data = new FormData();
      data.append('descripcion', formData.descripcion);
      data.append('tipo', formData.tipo);
      if (formData.comentarios) data.append('comentarios', formData.comentarios);
      
      files.forEach(file => data.append('fotografias', file));
      
      const { success, error } = await onSave(data);
      
      if (success) {
        toast.success('Observación registrada');
        onClose();
      } else {
        toast.error('Error al registrar observación');
        console.error(error);
      }
    } catch (err) {
      toast.error('Ocurrió un error inesperado');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Reportar Observación o Novedad</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="space-y-2">
            <Label>Prioridad / Tipo <span className="text-destructive">*</span></Label>
            <Select value={formData.tipo} onValueChange={(val) => setFormData(prev => ({...prev, tipo: val}))}>
              <SelectTrigger><SelectValue placeholder="Seleccionar nivel" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="normal">Normal (Informativo)</SelectItem>
                <SelectItem value="urgente">Urgente (Requiere atención)</SelectItem>
                <SelectItem value="crítico">Crítico (Peligro/Inmovilizado)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Descripción de la Novedad <span className="text-destructive">*</span></Label>
            <Textarea name="descripcion" value={formData.descripcion} onChange={handleChange} required placeholder="Describa el problema, ruido, daño, o evento ocurrido..." className="min-h-[100px]" />
          </div>

          <div className="space-y-2">
            <Label>Comentarios o Solicuitudes adicionales</Label>
            <Textarea name="comentarios" value={formData.comentarios} onChange={handleChange} placeholder="Opcional..." />
          </div>

          <div className="space-y-2 border-t pt-4">
            <Label>Evidencia Fotográfica (Máx 5)</Label>
            {previewUrls.length > 0 && (
              <div className="flex gap-2 overflow-x-auto py-2">
                {previewUrls.map((url, idx) => (
                  <div key={idx} className="relative h-16 w-16 shrink-0 rounded-lg overflow-hidden border shadow-sm">
                    <img src={url} alt="Preview" className="w-full h-full object-cover" />
                    <button type="button" onClick={() => removeFile(idx)} className="absolute top-0.5 right-0.5 bg-black/60 text-white rounded-full p-1 hover:bg-black">
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            {previewUrls.length < 5 && (
              <label className="cursor-pointer flex items-center gap-2 text-sm font-semibold text-primary hover:text-primary/80 transition-colors bg-primary/10 px-4 py-2 rounded-lg w-fit">
                <ImageIcon className="h-5 w-5" /> Adjuntar fotos
                <input type="file" accept="image/*" multiple className="hidden" onChange={handleFileChange} />
              </label>
            )}
          </div>

          <DialogFooter className="pt-4">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>Cancelar</Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Enviando...' : 'Reportar Novedad'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ObservationModal;