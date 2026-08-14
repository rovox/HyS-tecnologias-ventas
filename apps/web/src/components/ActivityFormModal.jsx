import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Image as ImageIcon, X } from 'lucide-react';
import pb from '@/lib/pocketbaseClient.js';

const ActivityFormModal = ({ isOpen, onClose, onSubmit, initialData = null }) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [files, setFiles] = useState([]);
  const [previewUrls, setPreviewUrls] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setTitle(initialData.titulo || '');
        setContent(initialData.contenido || '');
        setFiles([]);
        setPreviewUrls([]);
      } else {
        setTitle('');
        setContent('');
        setFiles([]);
        setPreviewUrls([]);
      }
    }
  }, [isOpen, initialData]);

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    if (selectedFiles.length + files.length > 10) {
      alert("Máximo 10 imágenes permitidas.");
      return;
    }
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
    if (!title.trim() || !content.trim()) return;

    setIsSubmitting(true);
    const formData = new FormData();
    formData.append('titulo', title);
    formData.append('contenido', content);
    
    files.forEach(file => formData.append('fotografias', file));

    try {
      await onSubmit(formData, initialData?.id);
      onClose();
    } catch (err) {
      // hook handles toast
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{initialData ? 'Editar Publicación' : 'Crear Nueva Publicación'}</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-5 mt-4">
          <div className="space-y-2">
            <Label htmlFor="title">Título</Label>
            <Input 
              id="title" 
              placeholder="Ej. Avance proyecto zona norte..." 
              value={title}
              onChange={e => setTitle(e.target.value)}
              required
              className="text-foreground bg-background focus-visible:ring-primary"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="content">Contenido</Label>
            <Textarea
              id="content"
              placeholder="Describe los detalles..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="min-h-[150px] resize-none text-foreground bg-background focus-visible:ring-primary"
              required
            />
          </div>

          {previewUrls.length > 0 && (
            <div className="flex gap-3 overflow-x-auto py-2">
              {previewUrls.map((url, idx) => (
                <div key={idx} className="relative h-24 w-24 shrink-0 rounded-xl overflow-hidden border border-border shadow-sm">
                  <img src={url} alt="Preview" className="w-full h-full object-cover" />
                  <button 
                    type="button"
                    onClick={() => removeFile(idx)}
                    className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-1 hover:bg-black transition-colors"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {!initialData && (
            <div className="flex items-center pt-2">
              <label className="cursor-pointer flex items-center gap-2 text-sm font-semibold text-primary hover:text-primary/80 transition-colors bg-primary/10 px-4 py-2 rounded-lg">
                <ImageIcon className="h-5 w-5" /> Subir fotografías (Máx 10)
                <input type="file" accept="image/*" multiple className="hidden" onChange={handleFileChange} />
              </label>
            </div>
          )}

          <DialogFooter className="pt-4">
            <Button type="button" variant="ghost" onClick={onClose} disabled={isSubmitting}>Cancelar</Button>
            <Button type="submit" disabled={isSubmitting || !title.trim() || !content.trim()}>
              {isSubmitting ? 'Guardando...' : (initialData ? 'Guardar Cambios' : 'Publicar')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ActivityFormModal;