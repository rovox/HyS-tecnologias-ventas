import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog.jsx';
import { Button } from '@/components/ui/button.jsx';
import { Input } from '@/components/ui/input.jsx';
import { Textarea } from '@/components/ui/textarea.jsx';
import { Label } from '@/components/ui/label.jsx';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select.jsx';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import pb from '@/lib/pocketbaseClient.js';
import { useTecnicosList } from '@/hooks/useTecnicosList.js';
import { crearCobroRendicion } from '@/utils/cobrosRendicion.js';

const FinalizeAssistanceModal = ({ isOpen, onClose, job, onSaved }) => {
  const { tecnicos } = useTecnicosList();
  const [diagnostico, setDiagnostico] = useState('');
  const [solucion, setSolucion] = useState('');
  const [seCobra, setSeCobra] = useState('no');
  const [monto, setMonto] = useState('');
  const [metodo, setMetodo] = useState('efectivo');
  const [cobradoPor, setCobradoPor] = useState('');
  const [saving, setSaving] = useState(false);

  const esAsistencia = (job?.tipo_entrada || '').toLowerCase() === 'asistencia';
  const finalizada = job?.estado === 'terminado' || job?.estado === 'completado';

  const handleSave = async () => {
    if (!diagnostico.trim()) { toast.error('El diagnóstico es obligatorio'); return; }
    const montoNum = parseFloat(monto) || 0;
    if (seCobra === 'si' && montoNum <= 0) { toast.error('Ingresá el monto cobrado'); return; }
    setSaving(true);
    try {
      const authUserId = pb.authStore.record?.id || '';
      if (job.visita_id) {
        try {
          await pb.collection('visitas_tecnicas').update(job.visita_id, {
            diagnostico, solucion,
            estado: 'Resuelto',
            se_cobra: seCobra === 'si',
            monto_cobrado: seCobra === 'si' ? montoNum : 0,
            medio_pago: seCobra === 'si' ? metodo : '',
          }, { $autoCancel: false });
        } catch (e) { console.error('update visita err:', e?.response?.data || e); }
      }

      await pb.collection('schedules').update(job.id, {
        estado: 'completado',
        descripcion_trabajo: `${job.descripcion_trabajo || ''}\nDiagnóstico: ${diagnostico}\nSolución: ${solucion}`.trim(),
        monto: seCobra === 'si' ? montoNum : 0,
        saldo: 0,
        estado_pago: seCobra === 'si' ? 'Pagado' : 'Pendiente',
        updated_by: authUserId,
      }, { $autoCancel: false });

      if (seCobra === 'si' && montoNum > 0) {
        const tecNombre = tecnicos.find(t => t.id === cobradoPor)?.nombre || pb.authStore.record?.name || '';
        await crearCobroRendicion({
          trabajo_id: job.id,
          tipo: esAsistencia ? 'Asistencia' : 'Relevamiento',
          monto: montoNum,
          metodo_pago: metodo,
          cliente_nombre: job.cliente_nombre || job.cliente || '',
          sucursal_nombre: job.sucursal_nombre || '',
          vendedor_nombre: job.vendedor_nombre || '',
          cobrado_por_id: cobradoPor || authUserId,
          cobrado_por_nombre: tecNombre,
          origen: esAsistencia ? 'Asistencia' : 'Relevamiento',
          confirmado: false,
          visita_id: job.visita_id || '',
          observacion: solucion || '',
        });
      }

      toast.success(esAsistencia ? 'Asistencia finalizada' : 'Relevamiento finalizado');
      if (onSaved) onSaved();
      onClose();
    } catch (err) {
      console.error('Error finalizando:', err?.response?.data || err);
      toast.error('Error al finalizar. Revisá los datos.');
    } finally {
      setSaving(false);
    }
  };

  if (!job) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(o) => !saving && !o && onClose()}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-extrabold">
            {finalizada ? 'Detalle' : 'Finalizar'} {esAsistencia ? 'Asistencia' : 'Relevamiento'}
          </DialogTitle>
          <DialogDescription className="font-medium">
            {job.cliente_nombre || job.cliente} — {job.fecha_programada}
          </DialogDescription>
        </DialogHeader>

        {finalizada ? (
          <div className="space-y-2 text-sm">
            <p className="whitespace-pre-line bg-muted/30 p-3 rounded-lg">{job.descripcion_trabajo || 'Sin detalle'}</p>
            <p className="font-bold">Monto: ${Number(job.monto || 0).toFixed(2)}</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Diagnóstico <span className="text-destructive">*</span></Label>
              <Textarea value={diagnostico} onChange={e => setDiagnostico(e.target.value)} className="min-h-[70px]" disabled={saving} />
            </div>
            <div className="space-y-2">
              <Label>Solución realizada</Label>
              <Textarea value={solucion} onChange={e => setSolucion(e.target.value)} className="min-h-[70px]" disabled={saving} />
            </div>
            <div className="space-y-2">
              <Label>¿Se cobra {esAsistencia ? 'la asistencia' : 'el relevamiento'}?</Label>
              <Select value={seCobra} onValueChange={setSeCobra} disabled={saving}>
                <SelectTrigger className="font-bold"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="no">No</SelectItem>
                  <SelectItem value="si">Sí</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {seCobra === 'si' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl border border-border bg-muted/30">
                <div className="space-y-2">
                  <Label>Monto cobrado</Label>
                  <Input type="number" step="0.01" value={monto} onChange={e => setMonto(e.target.value)} className="tabular-nums font-bold" disabled={saving} />
                </div>
                <div className="space-y-2">
                  <Label>Método de pago</Label>
                  <Select value={metodo} onValueChange={setMetodo} disabled={saving}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="efectivo">Efectivo</SelectItem>
                      <SelectItem value="transferencia">Transferencia</SelectItem>
                      <SelectItem value="qr">QR</SelectItem>
                      <SelectItem value="cheque">Cheque</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label>Cobrado por</Label>
                  <Select value={cobradoPor} onValueChange={setCobradoPor} disabled={saving}>
                    <SelectTrigger><SelectValue placeholder="Seleccionar técnico" /></SelectTrigger>
                    <SelectContent>
                      {tecnicos.map(t => <SelectItem key={t.id} value={t.id}>{t.nombre}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          <Button variant="ghost" onClick={onClose} disabled={saving} className="font-bold">Cerrar</Button>
          {!finalizada && (
            <Button onClick={handleSave} disabled={saving} className="font-bold px-6">
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null} Finalizar
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default FinalizeAssistanceModal;
