import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog.jsx';
import { Button } from '@/components/ui/button.jsx';
import { Textarea } from '@/components/ui/textarea.jsx';
import { useSchedules } from '@/hooks/useSchedules.js';
import { useAuth } from '@/contexts/AuthContext.jsx';
import { toast } from 'sonner';
import { Loader2, MessageSquare as MessageSquareText } from 'lucide-react';

const AddObservationModal = ({ isOpen, onClose, workId, onSuccess }) => {
  const [observacion, setObservacion] = useState('');
  const { addObservation, loading } = useSchedules();
  const { currentUser } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!workId) return;

    if (!observacion.trim()) {
      toast.error('La observación no puede estar vacía');
      return;
    }

    try {
      await addObservation(workId, observacion, currentUser?.id);
      toast.success('Observación guardada correctamente');
      setObservacion('');
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      // Error handled in hook
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-card rounded-2xl">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 p-2.5 rounded-full">
              <MessageSquareText className="h-5 w-5 text-primary" />
            </div>
            <div>
              <DialogTitle className="text-xl font-extrabold">Agregar Observación</DialogTitle>
              <DialogDescription>
                Esta nota quedará guardada en la bitácora del trabajo.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <Textarea 
            placeholder="Escribir nota sobre el trabajo..."
            value={observacion}
            onChange={(e) => setObservacion(e.target.value)}
            className="min-h-[120px] resize-none"
            disabled={loading}
            autoFocus
          />

          <DialogFooter className="pt-2">
            <Button type="button" variant="ghost" onClick={onClose} disabled={loading} className="font-bold">
              Cancelar
            </Button>
            <Button type="submit" disabled={loading || !observacion.trim()} className="font-bold px-6">
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Guardar Nota
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddObservationModal;