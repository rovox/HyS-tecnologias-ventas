import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog.jsx';
import { Button } from '@/components/ui/button.jsx';
import { Textarea } from '@/components/ui/textarea.jsx';
import { Label } from '@/components/ui/label.jsx';
import { Input } from '@/components/ui/input.jsx';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select.jsx';
import { useSchedules, calculateBalance } from '@/hooks/useSchedules.js';
import { useAuth } from '@/contexts/AuthContext.jsx';
import { toast } from 'sonner';
import { Loader2, XCircle } from 'lucide-react';

const CancelWorkModal = ({ isOpen, onClose, work, onSuccess }) => {
  const [motivo, setMotivo] = useState('');
  const [saldoCancelado, setSaldoCancelado] = useState('');
  const [observacion, setObservacion] = useState('');
  
  const { updateScheduleStatus, registerPayment, addObservation, loading } = useSchedules();
  const { currentUser } = useAuth();

  if (!work) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!motivo) {
      toast.error('Debe seleccionar un motivo de cancelación');
      return;
    }

    try {
      const descuento = parseFloat(saldoCancelado || 0);

      let statusPayload = {
        estado: 'cancelado',
        motivo_cancelacion: motivo,
        fecha_cancelacion: new Date().toISOString(),
        usuario_cancelacion: currentUser?.id
      };

      // Si perdonan deuda, se registra como descuento y se actualiza el saldo
      if (descuento > 0) {
        const currentCobros = parseFloat(work.cobros_realizados || work.cobros_registrados || 0);
        const cobros_nuevos = currentCobros + descuento;

        const { saldo: calculatedSaldo, estado_pago: calculatedEstado } = calculateBalance({
          ...work,
          cobros_realizados: cobros_nuevos
        });

        await registerPayment({
          trabajo_id: work.id,
          usuario_id: currentUser?.id,
          cobrado_por_id: currentUser?.id,
          cobrado_por_nombre: currentUser?.name || currentUser?.email || '',
          monto_cobrado: 0,
          descuento: descuento,
          adicional: 0,
          metodo_pago: 'otro',
          observacion: `Ajuste por cancelación: ${motivo}. ${observacion}`,
          saldo_anterior: work.saldo || 0,
          saldo_nuevo: calculatedSaldo
        });

        statusPayload = {
          ...statusPayload,
          cobros_realizados: cobros_nuevos,
          saldo: calculatedSaldo,
          estado_pago: calculatedEstado
        };
      }

      await updateScheduleStatus(work.id, statusPayload);

      await addObservation(work.id, `Cancelado: ${motivo} - ${observacion}`, currentUser?.id, 'cancelado');

      toast.success('Trabajo cancelado correctamente');
      
      setMotivo('');
      setSaldoCancelado('');
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

          <div className="space-y-2 p-3 bg-muted/20 border border-border rounded-lg">
            <Label className="flex justify-between items-center">
              <span>Saldo Perdonado / Cancelado</span>
              <span className="text-xs text-muted-foreground font-normal">Saldo actual: ${work.saldo?.toFixed(2) || '0.00'}</span>
            </Label>
            <Input 
              type="number" 
              step="0.01" 
              min="0"
              placeholder="0.00"
              value={saldoCancelado}
              onChange={e => setSaldoCancelado(e.target.value)}
              disabled={loading}
            />
            <p className="text-[10px] text-muted-foreground">Si el cliente ya no debe pagar el saldo restante, ingrésalo aquí para saldar la cuenta.</p>
          </div>

          <div className="space-y-2">
            <Label>Observación Adicional {parseFloat(saldoCancelado || 0) > 0 && <span className="text-destructive">*</span>}</Label>
            <Textarea 
              placeholder="Detalla la razón..."
              value={observacion}
              onChange={(e) => setObservacion(e.target.value)}
              className="min-h-[80px] resize-none"
              disabled={loading}
              required={parseFloat(saldoCancelado || 0) > 0}
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