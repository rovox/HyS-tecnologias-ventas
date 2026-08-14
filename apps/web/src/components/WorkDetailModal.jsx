import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog.jsx';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog.jsx';
import { Button } from '@/components/ui/button.jsx';
import { Badge } from '@/components/ui/badge.jsx';
import { useAuth } from '@/contexts/AuthContext.jsx';
import { MapPin, User, Wrench, Clock, CheckCircle2, XCircle, Calendar, MessageSquare as MessageSquareText, FileText, Landmark, Trash2, Loader2, MapPinned, Copy } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import pb from '@/lib/pocketbaseClient.js';
import { calculateBalance } from '@/hooks/useSchedules.js';
import { toast } from 'sonner';
import { cn } from '@/lib/utils.js';
import PaymentModal from '@/components/PaymentModal.jsx';
import CancelWorkModal from '@/components/CancelWorkModal.jsx';
import AddObservationModal from '@/components/AddObservationModal.jsx';
import RescheduleWorkModal from '@/components/RescheduleWorkModal.jsx';

const WorkDetailModal = ({ isOpen, onClose, workId, onEdit, onWorkUpdated, onWorkDeleted }) => {
  const { isAdmin, isVentas } = useAuth();
  
  const [trabajo, setTrabajo] = useState(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [observaciones, setObservaciones] = useState([]);
  const [loadingData, setLoadingData] = useState(false);
  const [loadingObs, setLoadingObs] = useState(false);

  const [modalView, setModalView] = useState(null);
  const [isCompleting, setIsCompleting] = useState(false);

  const canEditFull = isAdmin() || isVentas();

  const loadWorkDetails = async (id) => {
    if (!id) return;
    setLoadingData(true);
    try {
      const data = await pb.collection('schedules').getOne(id, { $autoCancel: false });

      const { saldo, estado_pago } = calculateBalance(data);

      const [clienteData, tecnicoData, allUsers] = await Promise.all([
        data.cliente_id
          ? pb.collection('clientes').getOne(data.cliente_id, { $autoCancel: false }).catch(() => null)
          : Promise.resolve(null),
        data.tecnico_responsable_id
          ? pb.collection('tecnicos').getOne(data.tecnico_responsable_id, { $autoCancel: false }).catch(() => null)
          : Promise.resolve(null),
        pb.collection('users').getFullList({ $autoCancel: false, fields: 'id,name' }).catch(() => []),
      ]);
      const vendedorData = data.vendedor_responsable_id
        ? (allUsers.find(u => u.id === data.vendedor_responsable_id) || null)
        : null;
      // If vendedor_nombre is stored on the record, use it directly
      const vendedorNombre = data.vendedor_nombre || vendedorData?.name || null;

      setTrabajo({ ...data, saldo, estado_pago, clienteData, tecnicoData, vendedorData, vendedorNombre });

    } catch (err) {
      console.error("Error loading work details:", err);
      if (err?.status === 404) {
        toast.error('Este trabajo ya no existe. Puede haber sido eliminado.');
        if (onWorkDeleted) onWorkDeleted(id);
        onClose();
      }
      setTrabajo(null);
    } finally {
      setLoadingData(false);
    }
  };

  const loadObservations = async (id) => {
    if (!id) return;
    setLoadingObs(true);
    try {
      const obs = await pb.collection('schedule_observations').getList(1, 50, {
        filter: `trabajo_id="${id}"`,
        sort: '-created',
        expand: 'usuario_id',
        $autoCancel: false
      });
      setObservaciones(obs.items || []);
    } catch (err) {
      console.error("Error loading observations:", err);
      setObservaciones([]);
    } finally {
      setLoadingObs(false);
    }
  };

  useEffect(() => {
    if (workId) {
      loadWorkDetails(workId);
    } else {
      setTrabajo(null);
      setModalView(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workId]);

  useEffect(() => {
    if (workId) {
      loadObservations(workId);
    } else {
      setObservaciones([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workId]);

  const handlePaymentSaved = async (updatedWork) => {
    // Update local state to reflect new saldo and estado_pago immediately
    const { saldo, estado_pago } = calculateBalance(updatedWork);
    const fullyUpdatedWork = { ...updatedWork, saldo, estado_pago };
    
    setTrabajo(fullyUpdatedWork);
    await loadObservations(workId);
    
    // Pass up to the weekly view for immediate re-rendering
    if (onWorkUpdated) onWorkUpdated(workId, fullyUpdatedWork);
    
    setModalView(null);
  };

  // Marcar como Completado: cambio de estado instantáneo, sin modales ni cobros.
  // El dinero se gestiona aparte en "Registrar Cobro / Ajuste".
  const handleMarkCompleted = async () => {
    if (!trabajo?.id) return;
    setIsCompleting(true);
    try {
      const authUserId = pb.authStore.record?.id || '';
      await pb.collection('schedules').update(trabajo.id, {
        estado: 'completado',
        fecha_finalizacion: new Date().toISOString(),
        updated_by: authUserId,
      }, { $autoCancel: false });

      // Si es Asistencia/Relevamiento vinculado a una visita técnica, marcarla como Resuelto
      if (trabajo.visita_id) {
        try {
          await pb.collection('visitas_tecnicas').update(trabajo.visita_id, {
            estado: 'Resuelto',
          }, { $autoCancel: false });
        } catch (e) {
          console.warn('No se pudo sincronizar la visita técnica:', e);
        }
      }

      toast.success('Marcado como completado');
      await loadWorkDetails(workId);
      if (onWorkUpdated) onWorkUpdated(workId);
    } catch (err) {
      console.error('Error al marcar como completado:', err);
      toast.error(err?.message || 'Error al marcar como completado');
    } finally {
      setIsCompleting(false);
    }
  };

  const handleWorkCanceled = async () => {
    setModalView(null);
    await loadWorkDetails(workId);
    await loadObservations(workId);
    if (onWorkUpdated) onWorkUpdated(workId);
  };

  const handleObservationAdded = async () => {
    setModalView(null);
    await loadObservations(workId);
  };

  const handleWorkRescheduled = async () => {
    setModalView(null);
    await loadWorkDetails(workId);
    if (onWorkUpdated) onWorkUpdated(workId);
  };

  const handleDeleteWork = async () => {
    if (!trabajo?.id) return;
    setIsDeleting(true);
    try {
      await pb.collection('schedules').delete(trabajo.id, { $autoCancel: false });
      toast.success('Trabajo eliminado correctamente');
      setIsDeleteDialogOpen(false);
      if (onWorkDeleted) onWorkDeleted(trabajo.id);
      onClose();
    } catch (err) {
      console.error('Error deleting work:', err);
      toast.error(err.message || 'Error al eliminar el trabajo');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCopyLocation = async () => {
    const textToCopy = trabajo?.maps_link?.trim() || trabajo?.lugar || '';
    if (!textToCopy) {
      toast.error('No hay ubicación para copiar');
      return;
    }
    try {
      await navigator.clipboard.writeText(textToCopy);
      toast.success('Ubicación copiada al portapapeles');
    } catch (err) {
      toast.error('No se pudo copiar la ubicación');
    }
  };

  if (!trabajo && loadingData) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-md bg-card rounded-2xl">
          <div className="py-12 text-center text-muted-foreground font-medium flex flex-col items-center justify-center">
            <span className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4"></span>
            Cargando detalles...
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!trabajo) return null;

  const getStatusBadge = (status) => {
    switch (status) {
      case 'completado': return <Badge className="bg-green-100 text-green-800 hover:bg-green-100 shadow-none border-green-200 border">Completado</Badge>;
      case 'en_proceso': return <Badge className="bg-orange-100 text-orange-800 hover:bg-orange-100 shadow-none border-orange-200 border">En Proceso</Badge>;
      case 'cancelado': return <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100 shadow-none border-gray-200 border">Cancelado</Badge>;
      case 'programado': 
      default: return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100 shadow-none border-blue-200 border">Programado</Badge>;
    }
  };

  const getPaymentBadge = (estado_pago) => {
    if (estado_pago === 'Pagado') return <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100 shadow-none border-emerald-200 border ml-2">Pagado</Badge>;
    return <Badge variant="outline" className="shadow-none ml-2 text-orange-600 border-orange-200 bg-orange-50">Pendiente</Badge>;
  };

  const costoTotal = parseFloat(trabajo.monto || trabajo.costo_total || 0);
  const adelantoRecibido = parseFloat(trabajo.adelanto || trabajo.adelanto_recibido || 0);
  const saldoActual = parseFloat(trabajo.saldo || 0);

  const formattedDate = trabajo.fecha_programada ? format(parseISO(trabajo.fecha_programada.split(' ')[0]), "d 'de' MMMM, yyyy", { locale: es }) : 'Sin fecha';
  const clienteNombre = trabajo.clienteData?.nombre || trabajo.cliente || 'Sin cliente';

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => { if(!modalView) onClose(open); }}>
        <DialogContent className="sm:max-w-2xl bg-card rounded-2xl max-h-[90vh] overflow-y-auto custom-scrollbar p-0">
          <DialogHeader className="p-6 pb-4 border-b border-border sticky top-0 bg-card z-10">
            <div className="flex justify-between items-start gap-4">
              <div>
                <DialogTitle className="text-2xl font-extrabold tracking-tight mb-2">Detalles del Trabajo</DialogTitle>
                <DialogDescription className="text-foreground font-medium flex items-center gap-2 flex-wrap">
                  {clienteNombre} {getStatusBadge(trabajo.estado)}
                </DialogDescription>
              </div>
              {canEditFull && (
                <Button variant="ghost" size="sm" onClick={() => { onClose(); onEdit(trabajo); }} className="font-bold text-primary hover:bg-primary/10">
                  Editar todo
                </Button>
              )}
            </div>
          </DialogHeader>

          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1 flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5"/> Lugar</h4>
                  <p className="font-medium text-foreground">{trabajo.lugar || 'No especificado'}</p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {trabajo.maps_link && (
                      <Button type="button" variant="outline" size="sm" className="font-bold text-xs h-8" onClick={() => window.open(trabajo.maps_link, '_blank', 'noopener,noreferrer')}>
                        <MapPinned className="h-3.5 w-3.5 mr-1.5" /> Abrir en Google Maps
                      </Button>
                    )}
                    <Button type="button" variant="ghost" size="sm" className="font-bold text-xs h-8" onClick={handleCopyLocation}>
                      <Copy className="h-3.5 w-3.5 mr-1.5" /> Copiar ubicación
                    </Button>
                  </div>
                </div>
                <div>
                  <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1 flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5"/> Fecha Programada</h4>
                  <p className="font-medium text-foreground capitalize">{formattedDate}</p>
                </div>
                <div>
                  <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1 flex items-center gap-1.5"><FileText className="h-3.5 w-3.5"/> Descripción</h4>
                  <p className="text-sm text-foreground whitespace-pre-wrap">{trabajo.descripcion_trabajo || 'Sin descripción'}</p>
                </div>
              </div>

              <div className="space-y-4 bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
                <div className="flex gap-4 mb-4">
                  <div className="flex-1">
                    <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1 flex items-center gap-1.5"><Wrench className="h-3.5 w-3.5"/> Técnico</h4>
                    <p className="text-sm font-medium text-foreground">{trabajo.tecnicoData?.nombre || 'No asignado'}</p>
                  </div>
                  <div className="flex-1">
                    <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1 flex items-center gap-1.5"><User className="h-3.5 w-3.5"/> Vendedor</h4>
                    <p className="text-sm font-medium text-foreground">{trabajo.vendedorNombre || trabajo.vendedorData?.name || 'No asignado'}</p>
                  </div>
                </div>
                
                <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Costo Total:</span>
                    <span className="font-medium tabular-nums">${costoTotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Adelanto Recibido:</span>
                    <span className="font-medium tabular-nums text-emerald-600">-${adelantoRecibido.toFixed(2)}</span>
                  </div>
                  
                  <div className="flex justify-between items-center pt-3 mt-3 border-t-2 border-slate-200 dark:border-slate-800">
                    <span className="font-bold uppercase text-xs tracking-wider">Saldo Pendiente</span>
                    <span className={`font-black text-lg tabular-nums flex items-center ${saldoActual > 0 ? 'text-orange-600' : 'text-emerald-600'}`}>
                      ${saldoActual.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center pt-2">
                    <span className="font-bold uppercase text-xs tracking-wider">Estado de Pago</span>
                    {getPaymentBadge(trabajo.estado_pago)}
                  </div>
                </div>

                <div className="pt-2 w-full">
                  <Button variant="outline" className="w-full font-bold border-primary/30 text-primary hover:bg-primary/5 shadow-sm" onClick={() => setModalView('payment')}>
                    <Landmark className="h-4 w-4 mr-2" /> Registrar Cobro / Ajuste
                  </Button>
                </div>
              </div>
            </div>

            <div className="border-t border-border pt-6">
              <h4 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
                <MessageSquareText className="h-4 w-4" /> Bitácora y Observaciones
              </h4>
              
              {loadingObs ? (
                <div className="text-center py-4 text-sm text-muted-foreground">Cargando observaciones...</div>
              ) : observaciones.length > 0 ? (
                <div className="space-y-3 max-h-40 overflow-y-auto custom-scrollbar pr-2">
                  {observaciones.map(obs => (
                    <div key={obs.id} className="bg-muted/30 p-3 rounded-lg border border-border text-sm">
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-bold text-xs text-foreground">{obs.expand?.usuario_id?.name || 'Usuario'}</span>
                        <span className="text-[10px] text-muted-foreground">{format(parseISO(obs.created), "dd/MM/yyyy HH:mm")}</span>
                      </div>
                      <p className="text-foreground/90 leading-relaxed">{obs.observacion}</p>
                      {obs.tipo !== 'nota' && (
                        <Badge variant="outline" className="mt-2 text-[9px] font-bold uppercase tracking-wider shadow-none bg-background">{obs.tipo}</Badge>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 border border-dashed border-border rounded-xl bg-muted/10">
                  <p className="text-sm font-medium text-muted-foreground">No hay observaciones registradas.</p>
                </div>
              )}
            </div>
          </div>

          <DialogFooter className="p-6 border-t border-border bg-slate-50 dark:bg-slate-900/50 flex-col sm:flex-row gap-3 sm:gap-0 sticky bottom-0">
            <div className="flex flex-wrap gap-2 w-full justify-center sm:justify-start">
              {trabajo.estado !== 'completado' && trabajo.estado !== 'cancelado' && (
                <>
                  <Button variant="default" className="bg-emerald-600 text-white hover:bg-emerald-700 font-bold shadow-sm" onClick={handleMarkCompleted} disabled={isCompleting}>
                    {isCompleting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle2 className="h-4 w-4 mr-2" />} Marcar Completado
                  </Button>
                  <Button variant="outline" className="font-bold bg-white dark:bg-transparent shadow-sm" onClick={() => setModalView('reschedule')}>
                    <Clock className="h-4 w-4 mr-2" /> Reprogramar
                  </Button>
                </>
              )}
              
              <Button variant="secondary" className="font-bold shadow-sm" onClick={() => setModalView('observe')}>
                <MessageSquareText className="h-4 w-4 mr-2" /> Agregar Nota
              </Button>
              
              {trabajo.estado !== 'cancelado' && trabajo.estado !== 'completado' && (
                <Button variant="ghost" className={cn("font-bold text-red-600 hover:text-red-700 hover:bg-red-50", !isAdmin() && "ml-auto")} onClick={() => setModalView('cancel')}>
                  <XCircle className="h-4 w-4 mr-2" /> Cancelar Trabajo
                </Button>
              )}

              {isAdmin() && (
                <Button variant="ghost" className="font-bold ml-auto text-red-700 hover:text-white hover:bg-red-600 border border-red-200" onClick={() => setIsDeleteDialogOpen(true)}>
                  <Trash2 className="h-4 w-4 mr-2" /> Eliminar Trabajo
                </Button>
              )}
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <PaymentModal 
        isOpen={modalView === 'payment'}
        onClose={() => setModalView(null)}
        work={trabajo}
        onSave={handlePaymentSaved}
      />

      <CancelWorkModal
        isOpen={modalView === 'cancel'}
        onClose={() => setModalView(null)}
        work={trabajo}
        onSuccess={handleWorkCanceled}
      />

      <AddObservationModal
        isOpen={modalView === 'observe'}
        onClose={() => setModalView(null)}
        workId={workId}
        onSuccess={handleObservationAdded}
      />

      <RescheduleWorkModal
        isOpen={modalView === 'reschedule'}
        onClose={() => setModalView(null)}
        workId={workId}
        initialDate={trabajo?.fecha_programada}
        onSuccess={handleWorkRescheduled}
      />

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={(open) => !isDeleting && setIsDeleteDialogOpen(open)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar trabajo</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Seguro que deseas eliminar este trabajo? Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => { e.preventDefault(); handleDeleteWork(); }}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default WorkDetailModal;