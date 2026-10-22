import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog.jsx';
import { Button } from '@/components/ui/button.jsx';
import { Input } from '@/components/ui/input.jsx';
import { Label } from '@/components/ui/label.jsx';
import { Textarea } from '@/components/ui/textarea.jsx';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select.jsx';
import { useSchedules } from '@/hooks/useSchedules.js';
import { toast } from 'sonner';
import { Loader2, DollarSign, Calculator } from 'lucide-react';

const EMPTY_FORM = { monto_cobrado: '', adicional: '', motivo_adicional: '', metodo_pago: 'efectivo', observacion: '' };

// The API owns the balance: a cobro cannot exceed the saldo, and an extra charge is its own payment
// (extra_asistencia) that does not reduce the budget.
const PaymentModal = ({ isOpen, onClose, work, onSave }) => {
  const { registerPayment } = useSchedules();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState(EMPTY_FORM);

  useEffect(() => {
    if (isOpen) setFormData(EMPTY_FORM);
  }, [isOpen]);

  if (!work) return null;

  const saldoAnterior = Number(work.saldo) || 0;
  const monto_cobrado = parseFloat(formData.monto_cobrado) || 0;
  const monto_adicional = parseFloat(formData.adicional) || 0;
  const saldoNuevo = Math.max(0, saldoAnterior - monto_cobrado);
  const overpayWarning = monto_cobrado > saldoAnterior
    ? `El cobro supera el saldo pendiente ($${saldoAnterior.toFixed(2)}). Registra el excedente ($${(monto_cobrado - saldoAnterior).toFixed(2)}) como Monto Adicional.`
    : '';

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (val) => {
    setFormData(prev => ({ ...prev, metodo_pago: val }));
  };

  const handleSavePayment = async (e) => {
    e.preventDefault();
    if (overpayWarning) {
      toast.error(overpayWarning);
      return;
    }
    if (monto_cobrado <= 0 && monto_adicional <= 0) {
      toast.error('Debe ingresar un monto cobrado o un adicional mayor a 0.');
      return;
    }
    if (monto_adicional > 0 && !formData.motivo_adicional.trim()) {
      toast.error('Debe ingresar un motivo para el adicional.');
      return;
    }

    setLoading(true);
    try {
      let updated = work;
      if (monto_cobrado > 0) {
        updated = await registerPayment({
          trabajo_id: work.id,
          tipo: 'cobro',
          monto: monto_cobrado,
          metodo: formData.metodo_pago,
          nota: formData.observacion.trim(),
        });
      }
      if (monto_adicional > 0) {
        updated = await registerPayment({
          trabajo_id: work.id,
          tipo: 'extra_asistencia',
          monto: monto_adicional,
          metodo: formData.metodo_pago,
          nota: [`Adicional: ${formData.motivo_adicional.trim()}`, formData.observacion.trim()].filter(Boolean).join('. '),
        });
      }
      toast.success('Cobro registrado correctamente');
      if (onSave) onSave(updated);
      onClose();
    } catch (err) {
      toast.error(err.message || 'Error al registrar el cobro');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg bg-card rounded-2xl">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-primary/10 p-2.5 rounded-full">
              <DollarSign className="h-5 w-5 text-primary" />
            </div>
            <div>
              <DialogTitle className="text-xl font-extrabold tracking-tight">Registrar Cobro / Ajuste</DialogTitle>
              <DialogDescription className="font-medium mt-1">
                Registra un cobro del saldo y, si corresponde, un adicional fuera del presupuesto.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSavePayment} className="space-y-5 mt-2">
          
          <div className="grid grid-cols-2 gap-4 p-4 rounded-xl border border-border bg-muted/30">
            <div>
              <Label className="text-muted-foreground text-xs uppercase tracking-wider font-bold">Saldo Actual</Label>
              <div className="text-xl font-black tabular-nums text-foreground mt-1">
                ${saldoAnterior.toFixed(2)}
              </div>
            </div>
            <div className="text-right">
              <Label className="text-muted-foreground text-xs uppercase tracking-wider font-bold">Nuevo Saldo</Label>
              <div className={`text-xl font-black tabular-nums mt-1 ${saldoNuevo > 0 ? 'text-orange-600' : 'text-emerald-600'}`}>
                ${saldoNuevo.toFixed(2)}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5"><DollarSign className="h-3.5 w-3.5"/> Monto Cobrado <span className="text-destructive">*</span></Label>
              <Input 
                name="monto_cobrado" 
                type="number" 
                step="0.01" 
                min="0"
                value={formData.monto_cobrado} 
                onChange={handleChange} 
                className="font-variant-numeric tabular-nums font-bold"
                placeholder="0.00"
                disabled={loading} 
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Método de Pago</Label>
              <Select value={formData.metodo_pago} onValueChange={handleSelectChange} disabled={loading}>
                <SelectTrigger className="font-medium">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="efectivo">Efectivo</SelectItem>
                  <SelectItem value="transferencia">Transferencia Bancaria</SelectItem>
                  <SelectItem value="QR">Pago QR</SelectItem>
                  <SelectItem value="tarjeta">Tarjeta (Débito/Crédito)</SelectItem>
                  <SelectItem value="otro">Otro</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label className={`flex items-center gap-1.5 ${overpayWarning ? 'text-orange-600' : ''}`}><Calculator className="h-3.5 w-3.5"/> Monto Adicional <span className="text-xs text-muted-foreground font-normal">(fuera del presupuesto, opcional)</span></Label>
            {overpayWarning && (
              <p className="text-xs text-orange-600 font-medium bg-orange-50 border border-orange-200 rounded-lg p-2">{overpayWarning}</p>
            )}
            <Input 
              name="adicional" 
              type="number" 
              step="0.01" 
              min="0"
              value={formData.adicional} 
              onChange={handleChange} 
              className={`font-variant-numeric tabular-nums font-bold ${overpayWarning ? 'border-orange-500 ring-1 ring-orange-300' : ''}`}
              placeholder="0.00"
              disabled={loading} 
            />
          </div>

          {parseFloat(formData.adicional) > 0 && (
            <div className="space-y-2">
              <Label>Motivo del adicional <span className="text-destructive">*</span></Label>
              <Input 
                name="motivo_adicional" 
                value={formData.motivo_adicional} 
                onChange={handleChange} 
                placeholder="Ej: Materiales extra, viáticos..."
                disabled={loading}
                required
              />
            </div>
          )}

          <div className="space-y-2">
            <Label>Observación (Opcional)</Label>
            <Textarea 
              name="observacion"
              placeholder="Detalles adicionales del pago..."
              value={formData.observacion}
              onChange={handleChange}
              className="min-h-[80px] resize-none"
              disabled={loading}
            />
          </div>

          <DialogFooter className="pt-2">
            <Button type="button" variant="ghost" onClick={onClose} disabled={loading} className="font-bold">
              Cancelar
            </Button>
            <Button type="submit" disabled={loading} className="font-bold px-8 shadow-md">
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Registrar Cobro
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default PaymentModal;