import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog.jsx';
import { Button } from '@/components/ui/button.jsx';
import { Textarea } from '@/components/ui/textarea.jsx';
import { Label } from '@/components/ui/label.jsx';
import { Input } from '@/components/ui/input.jsx';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select.jsx';
import { useSchedules } from '@/hooks/useSchedules.js';
import { useAuth } from '@/contexts/AuthContext.jsx';
import { toast } from 'sonner';
import { Loader2, XCircle } from 'lucide-react';

const CancelWorkModal = ({ isOpen, onClose, work, onSuccess }) => {
  const [motivo, setMotivo] = useState('');
  const [observacion, setObservacion] = useState('');
  
  const { updateScheduleStatus, addObservation, loading } = useSchedules();
  const { currentUser } = useAuth();

  if (!work) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!motivo) {
      toast.error('Debe seleccionar un motivo de cancelación');
      return;
    }

    try {
      // A cancelled job owes nothing: the API stops counting its balance (FIN-01), no adjustment is needed.
      // The hook already shows the API error and returns null when the change is rejected.
      if (!(await updateScheduleStatus(work.id, { estado: 'cancelado' }))) return;

      await addObservation(work.id, `Cancelado: ${motivo} - ${observacion}`, currentUser?.id, 'cancelado');

      toast.success('Trabajo cancelado correctamente');
      
      setMotivo('');
      setObservacion('');
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      toast.error(err.message || 'No se pudo cancelar el trabajo');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-card rounded-2xl">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-destructive/10 p-2.5 rounded-full">
              <XCircle className="h-6 w-6 text-destructive" />
            </div>
            <div>
              <DialogTitle className="text-xl font-extrabold tracking-tight">Cancelar Trabajo</DialogTitle>
              <DialogDescription className="font-medium mt-1">
                Indica el motivo por el cual este trabajo no se llevará a cabo.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="space-y-2">
            <Label>Motivo de cancelación <span className="text-destructive">*</span></Label>
            <Select value={motivo} onValueChange={setMotivo} disabled={loading} required>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar motivo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Cliente solicitó cancelación">Cliente solicitó cancelación</SelectItem>
                <SelectItem value="Problema técnico">Problema técnico</SelectItem>
                <SelectItem value="Falta de disponibilidad">Falta de disponibilidad</SelectItem>
                <SelectItem value="Otro">Otro motivo</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {Number(work.saldo) > 0 && (
            <p className="rounded-lg border border-border bg-muted/20 p-3 text-xs text-muted-foreground">
              Saldo pendiente: Bs {Number(work.saldo).toFixed(2)}. Al cancelar, el trabajo deja de deber ese saldo.
            </p>
          )}

          <div className="space-y-2">
            <Label>Observación Adicional</Label>
            <Textarea 
              placeholder="Detalla la razón..."
              value={observacion}
              onChange={(e) => setObservacion(e.target.value)}
              className="min-h-[80px] resize-none"
              disabled={loading}
            />
          </div>

          <DialogFooter className="pt-4">
            <Button type="button" variant="ghost" onClick={onClose} disabled={loading} className="font-bold">
              Volver
            </Button>
            <Button type="submit" variant="destructive" disabled={loading || !motivo} className="font-bold px-6 shadow-md">
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Confirmar Cancelación
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CancelWorkModal;