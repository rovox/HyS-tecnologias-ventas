import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Image as ImageIcon, X } from 'lucide-react';

const CommentFormModal = ({ isOpen, onClose, onSubmit, initialData = null, postId, parentId = null }) => {
  const [content, setContent] = useState('');
  const [files, setFiles] = useState([]);
  const [previewUrls, setPreviewUrls] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setContent(initialData.contenido || '');
        setFiles([]);
        setPreviewUrls([]);
      } else {
        setContent('');
        setFiles([]);
        setPreviewUrls([]);
      }
    }
  }, [isOpen, initialData]);

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    if (selectedFiles.length + files.length > 5) {
      alert("Máximo 5 imágenes permitidas.");
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
    if (!content.trim()) return;

    setIsSubmitting(true);
    const formData = new FormData();
    formData.append('contenido', content);
    
    // Explicitly append relationship IDs
    if (parentId) {
      formData.append('comentario_padre_id', parentId);
    }
    
    // `postId` is handled by the hook (appended as `actividad_id`), but we append it here if editing 
    // or if the hook doesn't overwrite it on edit.
    if (postId) {
      formData.append('actividad_id', postId);
    }

    files.forEach(file => formData.append('fotografias', file));

    try {
      await onSubmit(formData, initialData?.id);
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{initialData ? 'Editar Comentario' : (parentId ? 'Responder al comentario' : 'Añadir Comentario')}</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <Textarea
            placeholder="Escribe tu comentario aquí..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="min-h-[120px] resize-none focus-visible:ring-primary text-foreground bg-background"
            required
          />

          {previewUrls.length > 0 && (
            <div className="flex gap-2 overflow-x-auto pb-2">
              {previewUrls.map((url, idx) => (
                <div key={idx} className="relative h-20 w-20 shrink-0 rounded-lg overflow-hidden border border-border">
                  <img src={url} alt="Preview" className="w-full h-full object-cover" />
                  <button 
                    type="button"
                    onClick={() => removeFile(idx)}
                    className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-0.5 hover:bg-black"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {!initialData && (
            <div className="flex items-center">
              <label className="cursor-pointer flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
                <ImageIcon className="h-5 w-5" /> Añadir fotos
                <input type="file" accept="image/*" multiple className="hidden" onChange={handleFileChange} />
              </label>
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>Cancelar</Button>
            <Button type="submit" disabled={isSubmitting || !content.trim()}>
              {isSubmitting ? 'Guardando...' : (initialData ? 'Guardar Cambios' : 'Publicar')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CommentFormModal;