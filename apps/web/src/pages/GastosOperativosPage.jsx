import React, { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet';
import Layout from '@/components/Layout.jsx';
import pb from '@/lib/pocketbaseClient.js';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card.jsx';
import { Button } from '@/components/ui/button.jsx';
import { Input } from '@/components/ui/input.jsx';
import { Label } from '@/components/ui/label.jsx';
import { Textarea } from '@/components/ui/textarea.jsx';
import { Badge } from '@/components/ui/badge.jsx';
import { Skeleton } from '@/components/ui/skeleton.jsx';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select.jsx';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog.jsx';
import { Receipt, Plus, Loader2, Calendar, Image as ImageIcon, CheckCircle2, XCircle, Trash2 } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext.jsx';
import { cn } from '@/lib/utils.js';

const fmtFecha = (d) => {
  if (!d) return '—';
  try { return format(new Date(d.replace ? d.replace(' ', 'T') : d), 'dd/MM/yyyy'); } catch { return d; }
};

const CONCEPTOS_SUGERIDOS = ['Tornillos', 'Cinta', 'Refresco', 'Pasajes', 'Parqueo', 'Compra urgente', 'Combustible', 'Herramientas menores', 'Mano de obra externa', 'Otro'];

const GastosOperativosPage = () => {
  const { currentUser, isAdmin, canApproveExpenses, canDeleteRecords } = useAuth();
  const canApprove = canApproveExpenses();

  const [gastos, setGastos] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [sucursales, setSucursales] = useState([]);
  const [tecnicos, setTecnicos] = useState([]);
  const [cajas, setCajas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [file, setFile] = useState(null);

  // Approval modal state
  const [approvalModal, setApprovalModal] = useState({ open: false, gasto: null });
  const [approvalForm, setApprovalForm] = useState({ medio_pago: 'Efectivo', caja_banco_id: 'none', observacion: '' });
  const [approvingSaving, setApprovingSaving] = useState(false);

  const [formData, setFormData] = useState({
    monto: '',
    concepto: '',
    trabajo_id: 'none',
    sucursal: 'none',
    persona_nombre: '',
    fecha: format(new Date(), 'yyyy-MM-dd'),
    observacion: ''
  });

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [gastosList, schedulesList, sucRes, tecRes, cajaRes, cliRes] = await Promise.all([
        pb.collection('gastos_operativos').getFullList({ sort: '-fecha,-created', $autoCancel: false }).catch(() => []),
        pb.collection('schedules').getFullList({ sort: '-fecha_programada', $autoCancel: false }).catch(() => []),
        pb.collection('sucursales').getFullList({ filter: 'activa = true', sort: 'nombre', $autoCancel: false }).catch(() => []),
        pb.collection('tecnicos').getFullList({ sort: 'nombre', $autoCancel: false }).catch(() => []),
        pb.collection('cajas_bancos').getFullList({ $autoCancel: false }).catch(() => []),
        pb.collection('clientes').getFullList({ $autoCancel: false }).catch(() => []),
      ]);
      const clientsMap = {};
      cliRes.forEach(c => { clientsMap[c.id] = c.nombre; });
      const normalized = schedulesList.map(j => ({
        ...j,
        cliente_nombre: clientsMap[j.cliente_id] || j.cliente || 'Sin cliente',
      }));
      setGastos(gastosList);
      setSchedules(normalized);
      setSucursales(sucRes);
      setTecnicos(tecRes);
      setCajas(cajaRes);
    } catch (err) {
      toast.error('Error al cargar los gastos operativos');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.monto) return toast.error('El monto es requerido');
    if (!formData.concepto.trim()) return toast.error('El concepto es requerido');
    if (!formData.fecha) return toast.error('La fecha es requerida');

    setSaving(true);
    try {
      const payload = new FormData();
      payload.append('persona_id', currentUser?.id || '');
      payload.append('persona_nombre', formData.persona_nombre || currentUser?.name || currentUser?.email || '');
      payload.append('monto', parseFloat(formData.monto));
      payload.append('concepto', formData.concepto.trim());
      if (formData.trabajo_id && formData.trabajo_id !== 'none') payload.append('trabajo_id', formData.trabajo_id);
      const suc = formData.sucursal !== 'none' ? sucursales.find(s => s.id === formData.sucursal)?.nombre || '' : '';
      payload.append('sucursal', suc);
      payload.append('fecha', formData.fecha);
      payload.append('observacion', formData.observacion);
      payload.append('estado', 'Pendiente');
      payload.append('created_by', currentUser?.id || '');
      if (file) payload.append('comprobante', file);

      await pb.collection('gastos_operativos').create(payload, { $autoCancel: false });
      toast.success('Gasto registrado correctamente');
      setIsFormOpen(false);
      setFormData({ monto: '', concepto: '', trabajo_id: 'none', sucursal: 'none', persona_nombre: '', fecha: format(new Date(), 'yyyy-MM-dd'), observacion: '' });
      setFile(null);
      loadData();
    } catch (err) {
      toast.error('Error al registrar el gasto');
    } finally {
      setSaving(false);
    }
  };

  const openApprovalModal = (gasto) => {
    setApprovalModal({ open: true, gasto });
    setApprovalForm({ medio_pago: 'Efectivo', caja_banco_id: cajas[0]?.id || 'none', observacion: '' });
  };

  const handleApproveDevuelto = async () => {
    const { gasto } = approvalModal;
    if (!gasto) return;
    if (approvalForm.caja_banco_id === 'none') return toast.error('Selecciona la caja/banco origen');
    setApprovingSaving(true);
    try {
      // 1. Update gasto estado
      await pb.collection('gastos_operativos').update(gasto.id, {
        estado: 'Devuelto',
        updated_by: currentUser?.id || ''
      }, { $autoCancel: false });

      // 2. Create movimiento egreso
      const caja = cajas.find(c => c.id === approvalForm.caja_banco_id);
      const medioPagoMap = { efectivo: 'Efectivo', qr: 'QR', transferencia: 'Transferencia', tarjeta: 'Tarjeta', cheque: 'Cheque', otro: 'Otro' };
      const medioPagoNorm = medioPagoMap[(approvalForm.medio_pago || '').toLowerCase()] || approvalForm.medio_pago || 'Efectivo';
      await pb.collection('movimientos').create({
        tipo: 'egreso',
        categoria: 'Devolución gasto operativo',
        descripcion: `Devolución gasto: ${gasto.concepto} - ${gasto.persona_nombre}`,
        fecha: format(new Date(), 'yyyy-MM-dd'),
        sucursal: gasto.sucursal || '',
        caja_banco_id: approvalForm.caja_banco_id,
        caja_banco_nombre: caja?.nombre || '',
        medio_pago: medioPagoNorm,
        monto: gasto.monto || 0,
        trabajo_id: gasto.trabajo_id || '',
        estado: 'confirmado',
        observacion: approvalForm.observacion || `Aprobado por ${currentUser?.name || ''}`,
        created_by: currentUser?.id || '',
      }, { $autoCancel: false });

      toast.success('Gasto marcado como Devuelto y egreso registrado en Movimientos');
      setApprovalModal({ open: false, gasto: null });
      loadData();
    } catch (err) {
      toast.error('Error al procesar la devolución');
    } finally {
      setApprovingSaving(false);
    }
  };

  const handleReject = async (id) => {
    try {
      await pb.collection('gastos_operativos').update(id, { estado: 'Rechazado', updated_by: currentUser?.id || '' }, { $autoCancel: false });
      toast.success('Gasto rechazado');
      loadData();
    } catch { toast.error('Error'); }
  };

  const handleDelete = async (id) => {
    try {
      await pb.collection('gastos_operativos').delete(id, { $autoCancel: false });
      setGastos(prev => prev.filter(g => g.id !== id));
      toast.success('Eliminado');
    } catch { toast.error('Error al eliminar'); }
  };

  const getEstadoBadge = (estado) => {
    const map = {
      Devuelto: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      Aprobado: 'bg-blue-100 text-blue-800 border-blue-200',
      Rechazado: 'bg-red-100 text-red-800 border-red-200',
      Pendiente: 'bg-orange-100 text-orange-700 border-orange-200',
    };
    return <Badge className={cn('text-[10px] font-bold border shadow-none', map[estado] || map.Pendiente)}>{estado || 'Pendiente'}</Badge>;
  };

  const totalPendiente = gastos.filter(g => g.estado !== 'Devuelto' && g.estado !== 'Rechazado').reduce((sum, g) => sum + (g.monto || 0), 0);

  return (
    <Layout>
      <Helmet><title>Gastos Operativos - H&S</title></Helmet>

      <div className="content-container py-6 pb-24 space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-3">
              <Receipt className="h-8 w-8 text-primary" /> Gastos Operativos
            </h1>
            <p className="text-muted-foreground mt-1 font-medium">Registro de gastos del personal (tornillos, pasajes, parqueo, compras urgentes).</p>
          </div>
          <Button onClick={() => setIsFormOpen(!isFormOpen)} className="font-bold shadow-md">
            {isFormOpen ? 'Ver Lista' : <><Plus className="h-4 w-4 mr-2"/> Nuevo Gasto</>}
          </Button>
        </div>

        {!isFormOpen && (
          <Card className="border-orange-500/20 bg-orange-500/5 shadow-sm max-w-xs">
            <CardContent className="p-4">
              <p className="text-[11px] font-extrabold text-orange-600/80 uppercase tracking-wider mb-1">Total Pendiente</p>
              <p className="text-2xl font-black text-orange-600 tabular-nums">Bs. {totalPendiente.toFixed(2)}</p>
            </CardContent>
          </Card>
        )}

        {isFormOpen ? (
          <Card className="border rounded-2xl shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-4">
            <CardHeader className="bg-muted/30 border-b">
              <CardTitle className="text-lg font-extrabold">Registrar Gasto</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Persona que gastó</Label>
                    <Input name="persona_nombre" value={formData.persona_nombre} onChange={handleInputChange} placeholder={currentUser?.name || 'Nombre...'} disabled={saving}/>
                  </div>
                  <div className="space-y-2">
                    <Label>Monto (Bs.) <span className="text-destructive">*</span></Label>
                    <Input type="number" step="0.01" name="monto" value={formData.monto} onChange={handleInputChange} required disabled={saving}/>
                  </div>
                  <div className="space-y-2">
                    <Label>Concepto <span className="text-destructive">*</span></Label>
                    <Input name="concepto" list="conceptos-list" value={formData.concepto} onChange={handleInputChange} placeholder="Ej. Tornillos, Pasajes..." required disabled={saving}/>
                    <datalist id="conceptos-list">{CONCEPTOS_SUGERIDOS.map(c => <option key={c} value={c} />)}</datalist>
                  </div>
                  <div className="space-y-2">
                    <Label>Fecha <span className="text-destructive">*</span></Label>
                    <Input type="date" name="fecha" value={formData.fecha} onChange={handleInputChange} required disabled={saving}/>
                  </div>
                  <div className="space-y-2">
                    <Label>Sucursal</Label>
                    <Select value={formData.sucursal} onValueChange={v => setFormData(p => ({...p, sucursal: v}))} disabled={saving}>
                      <SelectTrigger><SelectValue placeholder="Selecciona..."/></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Sin sucursal</SelectItem>
                        {sucursales.map(s => <SelectItem key={s.id} value={s.id}>{s.nombre}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Trabajo Relacionado (Opcional)</Label>
                    <Select value={formData.trabajo_id} onValueChange={v => setFormData(p => ({...p, trabajo_id: v}))} disabled={saving}>
                      <SelectTrigger><SelectValue placeholder="Ninguno"/></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Ninguno</SelectItem>
                        {schedules.slice(0, 80).map(j => (
                          <SelectItem key={j.id} value={j.id}>{j.cliente_nombre} — {fmtFecha(j.fecha_programada)}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Foto / Comprobante</Label>
                    <Input type="file" accept="image/*,application/pdf" onChange={e => setFile(e.target.files?.[0] || null)} disabled={saving}/>
                  </div>
                  <div className="space-y-2 lg:col-span-2">
                    <Label>Observación</Label>
                    <Input name="observacion" value={formData.observacion} onChange={handleInputChange} placeholder="Detalles adicionales..." disabled={saving}/>
                  </div>
                </div>
                <div className="flex justify-end gap-3 pt-4 border-t">
                  <Button type="button" variant="ghost" onClick={() => setIsFormOpen(false)} disabled={saving} className="font-bold">Cancelar</Button>
                  <Button type="submit" disabled={saving} className="font-bold px-8">
                    {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin"/>} Guardar Gasto
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        ) : (
          <div className="overflow-x-auto rounded-xl border shadow-sm bg-card">
            <table className="w-full text-sm text-left whitespace-nowrap min-w-[900px]">
              <thead className="bg-muted/50 text-muted-foreground font-bold uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="px-5 py-4">Fecha</th>
                  <th className="px-5 py-4">Persona</th>
                  <th className="px-5 py-4">Concepto</th>
                  <th className="px-5 py-4">Sucursal</th>
                  <th className="px-5 py-4">Comprobante</th>
                  <th className="px-5 py-4">Estado</th>
                  <th className="px-5 py-4 text-right">Monto</th>
                  {canApprove && <th className="px-5 py-4 text-right">Acciones</th>}
                </tr>
              </thead>
              <tbody className="divide-y">
                {loading ? (
                  <tr><td colSpan="8" className="px-5 py-4"><Skeleton className="h-8 w-full"/></td></tr>
                ) : gastos.length > 0 ? (
                  gastos.map(g => (
                    <tr key={g.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-5 py-3 font-medium flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground"/>
                        {fmtFecha(g.fecha)}
                      </td>
                      <td className="px-5 py-3 font-bold">{g.persona_nombre || '—'}</td>
                      <td className="px-5 py-3 max-w-[200px] truncate" title={g.concepto}>{g.concepto}</td>
                      <td className="px-5 py-3 text-muted-foreground">{g.sucursal || '—'}</td>
                      <td className="px-5 py-3">
                        {g.comprobante ? (
                          <a href={pb.files.getURL(g, g.comprobante)} target="_blank" rel="noopener noreferrer" className="text-primary inline-flex items-center gap-1 font-bold hover:underline">
                            <ImageIcon className="h-4 w-4"/> Ver
                          </a>
                        ) : <span className="text-muted-foreground text-xs">Sin comprobante</span>}
                      </td>
                      <td className="px-5 py-3">{getEstadoBadge(g.estado)}</td>
                      <td className="px-5 py-3 text-right font-black tabular-nums">Bs. {(g.monto || 0).toFixed(2)}</td>
                      {canApprove && (
                        <td className="px-5 py-3 text-right">
                          {(!g.estado || g.estado === 'Pendiente') ? (
                            <div className="flex justify-end gap-1">
                              <Button size="sm" variant="outline" className="text-emerald-600 border-emerald-200 hover:bg-emerald-50 font-bold text-xs h-7 px-2" onClick={() => openApprovalModal(g)}>
                                <CheckCircle2 className="h-3 w-3 mr-1"/> Devolver
                              </Button>
                              <Button size="sm" variant="ghost" className="text-red-600 hover:bg-red-50 font-bold text-xs h-7 px-2" onClick={() => handleReject(g.id)}>
                                <XCircle className="h-3 w-3 mr-1"/> Rechazar
                              </Button>
                              {isAdmin() && (
                                <Button size="sm" variant="ghost" className="text-red-700 hover:bg-red-50 h-7 px-2" onClick={() => handleDelete(g.id)}>
                                  <Trash2 className="h-3 w-3"/>
                                </Button>
                              )}
                            </div>
                          ) : (
                            <div className="flex justify-end gap-1 items-center">
                              <span className="text-xs text-muted-foreground">{g.estado === 'Devuelto' ? '✓ Pagado' : 'Cerrado'}</span>
                              {isAdmin() && (
                                <Button size="sm" variant="ghost" className="text-red-700 hover:bg-red-50 h-7 px-2 ml-1" onClick={() => handleDelete(g.id)}>
                                  <Trash2 className="h-3 w-3"/>
                                </Button>
                              )}
                            </div>
                          )}
                        </td>
                      )}
                    </tr>
                  ))
                ) : (
                  <tr><td colSpan="8" className="px-5 py-12 text-center text-muted-foreground font-medium">No hay gastos operativos registrados.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Approval Modal */}
      <Dialog open={approvalModal.open} onOpenChange={open => !open && setApprovalModal({ open: false, gasto: null })}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-extrabold">Registrar Devolución / Pago</DialogTitle>
          </DialogHeader>
          {approvalModal.gasto && (
            <div className="space-y-4 py-2">
              <div className="p-3 rounded-xl bg-muted/50 border text-sm space-y-1">
                <p className="font-bold">{approvalModal.gasto.concepto}</p>
                <p className="text-muted-foreground">{approvalModal.gasto.persona_nombre} — Bs. {(approvalModal.gasto.monto || 0).toFixed(2)}</p>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-bold">Caja / Banco origen *</Label>
                <Select value={approvalForm.caja_banco_id} onValueChange={v => setApprovalForm(p => ({...p, caja_banco_id: v}))} disabled={approvingSaving}>
                  <SelectTrigger><SelectValue placeholder="Selecciona..."/></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Selecciona...</SelectItem>
                    {cajas.map(c => <SelectItem key={c.id} value={c.id}>{c.nombre}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-bold">Medio de pago</Label>
                <Select value={approvalForm.medio_pago} onValueChange={v => setApprovalForm(p => ({...p, medio_pago: v}))} disabled={approvingSaving}>
                  <SelectTrigger><SelectValue/></SelectTrigger>
                  <SelectContent>
                    {['Efectivo','QR','Transferencia','Tarjeta','Cheque','Otro'].map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-bold">Observación</Label>
                <Input value={approvalForm.observacion} onChange={e => setApprovalForm(p => ({...p, observacion: e.target.value}))} placeholder="Notas del pago..." disabled={approvingSaving}/>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="ghost" onClick={() => setApprovalModal({ open: false, gasto: null })} disabled={approvingSaving}>Cancelar</Button>
            <Button className="font-bold" onClick={handleApproveDevuelto} disabled={approvingSaving}>
              {approvingSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin"/>}
              Confirmar Devolución
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
};

export default GastosOperativosPage;
