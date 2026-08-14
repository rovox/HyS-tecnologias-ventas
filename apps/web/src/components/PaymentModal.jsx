import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog.jsx';
import { Button } from '@/components/ui/button.jsx';
import { Input } from '@/components/ui/input.jsx';
import { Label } from '@/components/ui/label.jsx';
import { Textarea } from '@/components/ui/textarea.jsx';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select.jsx';
import { useSchedules, calculateBalance } from '@/hooks/useSchedules.js';
import pb from '@/lib/pocketbaseClient.js';
import { toast } from 'sonner';
import { Loader2, DollarSign, Calculator, UserCheck } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext.jsx';
import { crearCobroRendicion } from '@/utils/cobrosRendicion.js';

const PaymentModal = ({ isOpen, onClose, work, onSave }) => {
  const { currentUser, isAdmin, isContadora } = useAuth();
  const canDirectConfirm = isAdmin?.() || isContadora?.();
  const { updateSchedule } = useSchedules();
  const [loading, setLoading] = useState(false);
  const [overpayWarning, setOverpayWarning] = useState('');
  const [usersList, setUsersList] = useState([]);
  const [cajasList, setCajasList] = useState([]);
  const [formData, setFormData] = useState({
    monto_cobrado: '',
    adicional: '',
    motivo_adicional: '',
    metodo_pago: 'efectivo',
    observacion: '',
    cobrado_por_id: currentUser?.id || '',
    caja_banco_id: 'none',
  });

  useEffect(() => {
    if (isOpen) {
      pb.collection('users').getFullList({ sort: 'name', $autoCancel: false })
        .then(setUsersList)
        .catch(() => setUsersList([]));
      pb.collection('cajas_bancos').getFullList({ sort: 'nombre', $autoCancel: false })
        .then(r => setCajasList(r.filter(c => c.activo !== false)))
        .catch(() => setCajasList([]));
      setFormData(prev => ({ ...prev, cobrado_por_id: currentUser?.id || '' }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  if (!work) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const updated = { ...prev, [name]: value };
      // Live overpayment check
      if (name === 'monto_cobrado') {
        const cobro = parseFloat(value) || 0;
        const adicional = parseFloat(updated.adicional) || 0;
        const { saldo: saldoAct } = calculateBalance(work);
        if (cobro > saldoAct) {
          const falta = cobro - saldoAct;
          setOverpayWarning(`El cobro supera el saldo pendiente ($${saldoAct.toFixed(2)}). Agrega al menos $${falta.toFixed(2)} como Monto Adicional para justificarlo.`);
          if (adicional < falta) updated.adicional = String(falta.toFixed(2));
        } else {
          setOverpayWarning('');
        }
      }
      if (name === 'adicional') {
        const cobro = parseFloat(updated.monto_cobrado) || 0;
        const adicional = parseFloat(value) || 0;
        const { saldo: saldoAct } = calculateBalance(work);
        if (cobro > saldoAct && adicional >= cobro - saldoAct) setOverpayWarning('');
      }
      return updated;
    });
  };

  const handleSelectChange = (val) => {
    setFormData(prev => ({ ...prev, metodo_pago: val }));
  };

  const handleSavePayment = async (e) => {
    e.preventDefault();

    const monto_cobrado = parseFloat(formData.monto_cobrado) || 0;
    const monto_adicional = parseFloat(formData.adicional) || 0;

    // Validate: cobro cannot exceed saldo without sufficient adicional
    const { saldo: saldoActual } = calculateBalance(work);
    if (monto_cobrado > saldoActual && monto_adicional < (monto_cobrado - saldoActual)) {
      toast.error(`El monto cobrado ($${monto_cobrado.toFixed(2)}) supera el saldo pendiente ($${saldoActual.toFixed(2)}). Ingresa un Monto Adicional de al menos $${(monto_cobrado - saldoActual).toFixed(2)}.`);
      return;
    }

    if (monto_cobrado <= 0 && monto_adicional <= 0) {
      toast.error('Debe ingresar un monto cobrado o cargo adicional mayor a 0.');
      return;
    }

    if (monto_adicional > 0 && !formData.motivo_adicional.trim()) {
      toast.error('Debe ingresar un motivo para el adicional.');
      return;
    }

    if (!formData.cobrado_por_id) {
      toast.error('Debe seleccionar quién realizó el cobro.');
      return;
    }

    setLoading(true);
    try {
      // (1) Fetch current schedule
      const currentWork = await pb.collection('schedules').getOne(work.id, { $autoCancel: false });
      
      // (2) Calculate new cobros_realizados
      const currentCobros = parseFloat(currentWork.cobros_realizados || currentWork.cobros_registrados || 0);
      const cobros_nuevos = currentCobros + monto_cobrado;
      
      // (3) Calculate new adicionales
      const currentAdicionales = parseFloat(currentWork.adicionales || 0);
      const adicionales_nuevos = currentAdicionales + monto_adicional;

      const updatedWorkObj = {
        ...currentWork,
        cobros_realizados: cobros_nuevos,
        adicionales: adicionales_nuevos
      };

      // Calculate balance based on new totals
      const { saldo: calculatedSaldo, estado_pago: calculatedEstado } = calculateBalance(updatedWorkObj);

      const obsExtra = formData.motivo_adicional ? ` (Motivo adicional: ${formData.motivo_adicional})` : '';
      const finalObs = (formData.observacion + obsExtra).trim();

      const cobradorUser = usersList.find(u => u.id === formData.cobrado_por_id);
      const cobradorNombre = cobradorUser?.name || cobradorUser?.email || currentUser?.name || currentUser?.email || '';

      const cajaSeleccionada = cajasList.find(c => c.id === formData.caja_banco_id);
      const estadoRendicion = (canDirectConfirm && formData.caja_banco_id !== 'none') ? 'Confirmado' : 'Pendiente rendición';

      // (4) Registrar cobro real en Cobros/Rendición (solo si hay dinero recibido)
      if (monto_cobrado > 0) {
        await crearCobroRendicion({
          trabajo_id: work.id,
          tipo: 'Cobro final',
          monto: monto_cobrado,
          metodo_pago: formData.metodo_pago,
          cliente_nombre: work.cliente_nombre || work.cliente || '',
          sucursal_nombre: work.sucursal_nombre || work.sucursal_id || '',
          vendedor_nombre: work.vendedor_nombre || '',
          cobrado_por_id: formData.cobrado_por_id || currentUser?.id,
          cobrado_por_nombre: cobradorNombre,
          origen: 'trabajo_cobro_final',
          confirmado: estadoRendicion === 'Confirmado',
          caja_banco_id: formData.caja_banco_id !== 'none' ? formData.caja_banco_id : '',
          caja_banco_nombre: cajaSeleccionada?.nombre || '',
          observacion: finalObs,
          adicional: monto_adicional,
          saldo_anterior: currentWork.saldo || 0,
          saldo_nuevo: calculatedSaldo,
        });
      }

      // (4b) If Admin/Contadora with caja selected: auto-create movimiento confirmed
      if (canDirectConfirm && formData.caja_banco_id !== 'none' && monto_cobrado > 0) {
        await pb.collection('movimientos').create({
          tipo: 'ingreso',
          categoria: 'Cobro de trabajo',
          descripcion: `Cobro directo - ${work.cliente_nombre || work.cliente || '—'}`,
          fecha: new Date().toISOString().split('T')[0],
          sucursal: work.sucursal_nombre || work.sucursal_id || '',
          caja_banco_id: formData.caja_banco_id,
          caja_banco_nombre: cajaSeleccionada?.nombre || '',
          medio_pago: formData.metodo_pago === 'efectivo' ? 'Efectivo' : formData.metodo_pago,
          monto: monto_cobrado,
          cliente_id: work.cliente_id || '',
          cliente_nombre: work.cliente_nombre || work.cliente || '',
          trabajo_id: work.id,
          estado: 'confirmado',
          observacion: finalObs || `Cobrado por: ${cobradorNombre}`,
          created_by: currentUser?.id || '',
        }, { $autoCancel: false });
      }

      // (5) CRITICAL: Call updateSchedule to persist calculated balance and totals
      const finalUpdatedWork = await updateSchedule(work.id, {
        cobros_realizados: cobros_nuevos,
        adicionales: adicionales_nuevos,
        saldo: calculatedSaldo,
        estado_pago: calculatedEstado
      });

      toast.success('Cobro registrado correctamente');
      setFormData({ monto_cobrado: '', adicional: '', motivo_adicional: '', metodo_pago: 'efectivo', observacion: '', cobrado_por_id: currentUser?.id || '', caja_banco_id: 'none' });
      
      // (6) Call onSave callback with the updated work object
      if (onSave) onSave(finalUpdatedWork);
      
      // (7) Close modal
      onClose();
    } catch (err) {
      console.error('Error al registrar el cobro:', err?.response?.data || err);
      toast.error(err?.response?.data ? JSON.stringify(err.response.data) : 'Error al registrar el cobro');
    } finally {
      setLoading(false);
    }
  };

  // Pre-calculate logic for UI display
  const currentCobrosPrev = parseFloat(work.cobros_realizados || work.cobros_registrados || 0);
  const currentAdicionalesPrev = parseFloat(work.adicionales || 0);
  const previewWork = {
    ...work,
    cobros_realizados: currentCobrosPrev + (parseFloat(formData.monto_cobrado) || 0),
    adicionales: currentAdicionalesPrev + (parseFloat(formData.adicional) || 0)
  };
  const { saldo: saldoNuevo } = calculateBalance(previewWork);
  const { saldo: saldoAnterior } = calculateBalance(work);

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
                Registra un pago y suma cargos extra al trabajo.
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

          {canDirectConfirm && (
            <div className="space-y-2">
              <Label>Caja / Banco destino {canDirectConfirm ? <span className="text-xs text-muted-foreground">(opcional — si no seleccionas, queda pendiente de rendición)</span> : ''}</Label>
              <Select value={formData.caja_banco_id} onValueChange={v => setFormData(prev => ({...prev, caja_banco_id: v}))} disabled={loading}>
                <SelectTrigger><SelectValue placeholder="Seleccionar caja/banco..."/></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sin asignar (Pendiente rendición)</SelectItem>
                  {cajasList.map(c => <SelectItem key={c.id} value={c.id}>{c.nombre} ({c.tipo})</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label className="flex items-center gap-1.5"><UserCheck className="h-3.5 w-3.5"/> Cobrado por <span className="text-destructive">*</span></Label>
            <Select value={formData.cobrado_por_id} onValueChange={(val) => setFormData(prev => ({ ...prev, cobrado_por_id: val }))} disabled={loading}>
              <SelectTrigger className="font-medium">
                <SelectValue placeholder="Selecciona un usuario" />
              </SelectTrigger>
              <SelectContent>
                {usersList.map(u => (
                  <SelectItem key={u.id} value={u.id}>{u.name || u.email}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className={`flex items-center gap-1.5 ${overpayWarning ? 'text-orange-600' : ''}`}><Calculator className="h-3.5 w-3.5"/> Monto Adicional {overpayWarning ? <span className="text-xs font-bold text-orange-600">(requerido)</span> : '(Opcional)'}</Label>
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