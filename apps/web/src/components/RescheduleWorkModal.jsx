import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog.jsx';
import { Button } from '@/components/ui/button.jsx';
import { Input } from '@/components/ui/input.jsx';
import { Label } from '@/components/ui/label.jsx';
import { useSchedules } from '@/hooks/useSchedules.js';
import { toast } from 'sonner';
import { Loader2, CalendarClock } from 'lucide-react';
import { format, parseISO } from 'date-fns';

const RescheduleWorkModal = ({ isOpen, onClose, workId, initialDate, onSuccess }) => {
  const [date, setDate] = useState('');
  const { rescheduleWork, loading } = useSchedules();

  useEffect(() => {
    if (isOpen) {
      if (initialDate) {
        // Handle ISO strings with time parts
        const dateStr = initialDate.includes(' ') ? initialDate.split(' ')[0] : (initialDate.includes('T') ? initialDate.split('T')[0] : initialDate);
        setDate(dateStr);
      } else {
        setDate(format(new Date(), 'yyyy-MM-dd'));
      }
    }
  }, [isOpen, initialDate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!workId) return;

    if (!date) {
      toast.error('Debe seleccionar una nueva fecha');
      return;
    }

    try {
      await rescheduleWork(workId, date);
      toast.success('Trabajo reprogramado correctamente');
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      // Error handled in hook
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-sm bg-card rounded-2xl">
        <DialogHeader>
          <div className="mx-auto bg-primary/10 p-3 rounded-full mb-2">
            <CalendarClock className="h-6 w-6 text-primary" />
          </div>
          <DialogTitle className="text-xl font-extrabold text-center">Reprogramar Trabajo</DialogTitle>
          <DialogDescription className="text-center">
            Selecciona la nueva fecha para este trabajo.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="space-y-2">
            <Label>Nueva fecha de programación <span className="text-destructive">*</span></Label>
            <Input 
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              disabled={loading}
              className="font-medium"
              required
            />
          </div>

          <DialogFooter className="pt-4">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading} className="font-bold w-full sm:w-auto">
              Cancelar
            </Button>
            <Button type="submit" disabled={loading || !date} className="font-bold w-full sm:w-auto">
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Confirmar Fecha
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default RescheduleWorkModal;