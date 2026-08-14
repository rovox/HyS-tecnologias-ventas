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
import { Loader2, CheckCircle2, DollarSign } from 'lucide-react';
import { crearCobroRendicion } from '@/utils/cobrosRendicion.js';

const CompleteWorkModal = ({ isOpen, onClose, work, onSuccess }) => {
  const [observacionFinal, setObservacionFinal] = useState('');
  
  // Payment states
  const [montoCobrado, setMontoCobrado] = useState('');
  const [saldoCancelado, setSaldoCancelado] = useState('');
  const [adicional, setAdicional] = useState('');
  const [metodoPago, setMetodoPago] = useState('efectivo');
  const [overpayWarning, setOverpayWarning] = useState('');

  const { updateScheduleStatus, addObservation, loading } = useSchedules();
  const { currentUser } = useAuth();

  if (!work) return null;

  const saldoAnterior = work.saldo || 0;
  const isAdjustment = parseFloat(saldoCancelado || 0) > 0 || parseFloat(adicional || 0) > 0;

  const handleMontoCobradoChange = (val) => {
    setMontoCobrado(val);
    const cobro = parseFloat(val) || 0;
    const adicionalVal = parseFloat(adicional) || 0;
    if (cobro > saldoAnterior) {
      const falta = cobro - saldoAnterior;
      setOverpayWarning(`El cobro supera el saldo pendiente ($${saldoAnterior.toFixed(2)}). Agrega al menos $${falta.toFixed(2)} como Monto Adicional.`);
      if (adicionalVal < falta) setAdicional(falta.toFixed(2));
    } else {
      setOverpayWarning('');
    }
  };

  const handleComplete = async (e) => {
    e.preventDefault();

    if (isAdjustment && !observacionFinal.trim()) {
      toast.error('Debe ingresar una observación final justificando el descuento o cargo adicional.');
      return;
    }

    try {
      // 1. Process Payment if any data entered
      const mCobrado = parseFloat(montoCobrado || 0);
      const descuento = parseFloat(saldoCancelado || 0);
      const mAdicional = parseFloat(adicional || 0);

      let statusPayload = {
        estado: 'completado',
        observacion_final: observacionFinal,
        fecha_finalizacion: new Date().toISOString(),
        usuario_finalizacion: currentUser?.id
      };

      // Validate overpayment
      if (mCobrado > saldoAnterior && mAdicional < (mCobrado - saldoAnterior)) {
        toast.error(`El monto cobrado supera el saldo pendiente ($${saldoAnterior.toFixed(2)}). Ingresa un Monto Adicional de al menos $${(mCobrado - saldoAnterior).toFixed(2)}.`);
        return;
      }

      if (mCobrado > 0 || descuento > 0 || mAdicional > 0) {
        const currentCobros = parseFloat(work.cobros_realizados || work.cobros_registrados || 0);
        const currentAdicionales = parseFloat(work.adicionales || 0);
        const cobros_nuevos = currentCobros + mCobrado + descuento;
        const adicionales_nuevos = currentAdicionales + mAdicional;

        const { saldo: calculatedSaldo, estado_pago: calculatedEstado } = calculateBalance({
          ...work,
          cobros_realizados: cobros_nuevos,
          adicionales: adicionales_nuevos
        });

        // Solo se crea cobro/rendición si realmente se recibió dinero.
        // Condonaciones (descuento) y adicionales solo ajustan el saldo.
        if (mCobrado > 0) {
          await crearCobroRendicion({
            trabajo_id: work.id,
            tipo: 'Cobro final',
            monto: mCobrado,
            metodo_pago: metodoPago,
            cliente_nombre: work.cliente_nombre || work.cliente || '',
            sucursal_nombre: work.sucursal_nombre || work.sucursal_id || '',
            vendedor_nombre: work.vendedor_nombre || '',
            cobrado_por_id: currentUser?.id,
            cobrado_por_nombre: currentUser?.name || currentUser?.email || '',
            origen: 'trabajo_cobro_final',
            confirmado: false,
            observacion: observacionFinal,
            descuento,
            adicional: mAdicional,
            saldo_anterior: work.saldo || 0,
            saldo_nuevo: calculatedSaldo,
          });
        }

        statusPayload = {
          ...statusPayload,
          cobros_realizados: cobros_nuevos,
          adicionales: adicionales_nuevos,
          saldo: calculatedSaldo,
          estado_pago: calculatedEstado
        };
      }

      // 2. Update status to completed (and persist balance if payment was made)
      await updateScheduleStatus(work.id, statusPayload);

      if (observacionFinal.trim() !== '') {
        await addObservation(work.id, observacionFinal, currentUser?.id, 'completado');
      }

      toast.success('Trabajo marcado como completado');
      
      // Reset state
      setObservacionFinal('');
      setMontoCobrado('');
      setSaldoCancelado('');
      setAdicional('');
      
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      console.error('Error al completar el trabajo / registrar cobro:', err?.response?.data || err);
      toast.error(err?.response?.data ? JSON.stringify(err.response.data) : 'Error al completar el trabajo');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg bg-card rounded-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-success/10 p-2.5 rounded-full">
              <CheckCircle2 className="h-6 w-6 text-success" />
            </div>
            <div>
              <DialogTitle className="text-xl font-extrabold tracking-tight">Completar Trabajo</DialogTitle>
              <DialogDescription className="font-medium mt-1">
                Confirma la finalización y registra el pago (opcional).
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleComplete} className="space-y-6 mt-2">
          
          {/* Payment Section (Optional) */}
          <div className="p-4 rounded-xl border border-border bg-muted/20 space-y-4">
            <h4 className="text-sm font-bold text-foreground flex items-center gap-1.5 border-b border-border pb-2">
              <DollarSign className="h-4 w-4" /> Registro de Pago (Opcional)
            </h4>
            
            <div className="flex justify-between items-center bg-card p-3 rounded-lg border border-border shadow-sm">
              <span className="text-xs uppercase font-bold text-muted-foreground">Saldo Pendiente:</span>
              <span className={`text-lg font-black tabular-nums ${saldoAnterior > 0 ? 'text-destructive' : 'text-success'}`}>
                ${saldoAnterior.toFixed(2)}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Monto Cobrado</Label>
                <Input 
                  type="number" step="0.01" min="0"
                  value={montoCobrado} 
                  onChange={e => handleMontoCobradoChange(e.target.value)} 
                  placeholder="0.00" 
                  disabled={loading}
                />
                {overpayWarning && <p className="text-xs text-orange-600 font-medium bg-orange-50 border border-orange-200 rounded-lg p-2">{overpayWarning}</p>}
              </div>
              <div className="space-y-2">
                <Label>Método de Pago</Label>
                <Select value={metodoPago} onValueChange={setMetodoPago} disabled={loading}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="efectivo">Efectivo</SelectItem>
                    <SelectItem value="transferencia">Transferencia Bancaria</SelectItem>
                    <SelectItem value="QR">Pago QR</SelectItem>
                    <SelectItem value="tarjeta">Tarjeta</SelectItem>
                    <SelectItem value="otro">Otro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-success">Descuento (Resta deuda)</Label>
                <Input 
                  type="number" step="0.01" min="0"
                  value={saldoCancelado} 
                  onChange={e => setSaldoCancelado(e.target.value)} 
                  placeholder="0.00" 
                  disabled={loading}
                />
              </div>
              <div className="space-y-2">
                <Label className={overpayWarning ? 'text-orange-600' : 'text-destructive'}>Adicional (Suma deuda) {overpayWarning ? <span className="text-xs font-bold">(requerido)</span> : ''}</Label>
                <Input 
                  type="number" step="0.01" min="0"
                  value={adicional} 
                  onChange={e => { setAdicional(e.target.value); const cobro = parseFloat(montoCobrado)||0; if (cobro <= saldoAnterior || parseFloat(e.target.value) >= cobro - saldoAnterior) setOverpayWarning(''); }}
                  placeholder="0.00" 
                  disabled={loading}
                  className={overpayWarning ? 'border-orange-500 ring-1 ring-orange-300' : ''}
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Observación Final {isAdjustment && <span className="text-destructive">*</span>}</Label>
            <Textarea 
              placeholder="Detalles sobre cómo finalizó el trabajo o motivo de ajustes..."
              value={observacionFinal}
              onChange={(e) => setObservacionFinal(e.target.value)}
              className="min-h-[80px] resize-none"
              disabled={loading}
              required={isAdjustment}
            />
          </div>

          <DialogFooter className="pt-2">
            <Button type="button" variant="ghost" onClick={onClose} disabled={loading} className="font-bold">
              Cancelar
            </Button>
            <Button type="submit" disabled={loading} className="bg-success text-success-foreground hover:bg-success/90 font-bold px-6 shadow-md">
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Confirmar Finalización
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CompleteWorkModal;