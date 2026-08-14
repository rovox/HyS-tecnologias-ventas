import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { ArrowLeft, Clock, MapPin, Edit2, CheckCircle2, MessageSquare, Trash2, Calendar, FileText, Send, Plus, X, User, Loader2 } from 'lucide-react';
import Layout from '@/components/Layout.jsx';
import { Button } from '@/components/ui/button.jsx';
import { Card } from '@/components/ui/card.jsx';
import { Badge } from '@/components/ui/badge.jsx';
import { Skeleton } from '@/components/ui/skeleton.jsx';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select.jsx';
import { useInternalOrders } from '@/hooks/useInternalOrders.js';
import { useAuth } from '@/contexts/AuthContext.jsx';
import PhotoGallery from '@/components/PhotoGallery.jsx';
import PedidoInternoFormModal from '@/components/PedidoInternoFormModal.jsx';
import EntregaPedidoModal from '@/components/EntregaPedidoModal.jsx';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import pb from '@/lib/pocketbaseClient.js';
import { Textarea } from '@/components/ui/textarea.jsx';
import { toast } from 'sonner';
import { isValidTransition, canUserChangeState, getValidNextStates } from '@/hooks/StateFlowValidator.js';
import { logStateChange } from '@/hooks/StateChangeLogger.js';

const PedidoInternoDetailPage = () => {
  const { id: pedido_id } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { loading, getPedidoDetails, addComment, deleteDetalle, updateEstadoPedido } = useInternalOrders();

  const [data, setData] = useState(null);
  const [users, setUsers] = useState({});
  const [newComment, setNewComment] = useState('');
  const [commentFiles, setCommentFiles] = useState([]);
  const [previewUrls, setPreviewUrls] = useState([]);
  const [isUpdatingState, setIsUpdatingState] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isEntregaOpen, setIsEntregaOpen] = useState(false);

  const isTecnico = currentUser?.role === 'SEGURIDAD ELECTRÓNICA';
  const isAdmin = currentUser?.role === 'ADMINISTRADOR';

  const loadData = async () => {
    if (!pedido_id) return;
    try {
      const res = await getPedidoDetails(pedido_id);
      if (res && res.pedido) {
        setData(res);
        try {
          const uRes = await pb.collection('users').getFullList({ $autoCancel: false });
          const map = uRes.reduce((acc, u) => ({...acc, [u.id]: u.name}), {});
          map[currentUser.id] = currentUser.name;
          setUsers(map);
        } catch (e) {
          setUsers({[currentUser.id]: currentUser.name});
        }
      } else {
        toast.error("El pedido no existe o fue eliminado");
      }
    } catch(err) {
      console.warn("Fallo al cargar pedido", err);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pedido_id]);

  const getStatusClass = (status) => {
    switch(status) {
      case 'solicitado': return 'bg-slate-100 text-slate-800 dark:bg-slate-800/50 dark:text-slate-300';
      case 'aprobado': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300';
      case 'en_preparación': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300';
      case 'entregado': return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300';
      case 'cancelado': return 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getPriorityClass = (priority) => {
    switch(priority) {
      case 'Baja': return 'bg-slate-100 text-slate-700 dark:bg-slate-800/50 dark:text-slate-300';
      case 'Normal': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300';
      case 'Alta': return 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300';
      case 'Urgente': return 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const handleStateChange = async (newState) => {
    if (!newState || newState === data.pedido.estado) return;
    
    const validation = isValidTransition('pedidos_internos', data.pedido.estado, newState);
    if (!validation.valid) {
      toast.error(`Transición inválida: ${validation.reason}`);
      return;
    }

    const hasPermission = canUserChangeState(currentUser?.role);
    if (!hasPermission) {
      toast.error('No tienes permisos para cambiar el estado');
      return;
    }

    if (newState === 'entregado') {
      setIsEntregaOpen(true);
      return;
    }

    setIsUpdatingState(true);
    try {
      await updateEstadoPedido(pedido_id, newState);
      
      await logStateChange({
        entityType: 'pedidos_internos',
        entityId: pedido_id,
        userId: currentUser.id,
        userName: currentUser.name,
        estadoAnterior: data.pedido.estado,
        estadoNuevo: newState
      });
      
      loadData();
    } catch (e) {
      console.error(e);
      toast.error('Error al actualizar el estado');
    } finally {
      setIsUpdatingState(false);
    }
  };

  const handleConfirmEntrega = async (extra) => {
    setIsUpdatingState(true);
    try {
      await updateEstadoPedido(pedido_id, 'entregado', extra);
      await logStateChange({
        entityType: 'pedidos_internos',
        entityId: pedido_id,
        userId: currentUser.id,
        userName: currentUser.name,
        estadoAnterior: data.pedido.estado,
        estadoNuevo: 'entregado'
      });
      setIsEntregaOpen(false);
      loadData();
    } catch (e) {
      console.error(e);
      toast.error('Error al registrar la entrega');
    } finally {
      setIsUpdatingState(false);
    }
  };

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    setCommentFiles(prev => [...prev, ...selectedFiles]);
    const newPreviews = selectedFiles.map(file => URL.createObjectURL(file));
    setPreviewUrls(prev => [...prev, ...newPreviews]);
  };

  const removePreview = (index) => {
    URL.revokeObjectURL(previewUrls[index]);
    setPreviewUrls(prev => prev.filter((_, i) => i !== index));
    setCommentFiles(prev => prev.filter((_, i) => i !== index));
  };

  const submitComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim() && commentFiles.length === 0) return;
    try {
      await addComment(pedido_id, newComment, commentFiles);
      setNewComment('');
      setCommentFiles([]);
      setPreviewUrls([]);
      loadData();
    } catch(err) {
      console.error(err);
    }
  };

  const handleDeleteDetalle = async (detalleId) => {
    const success = await deleteDetalle(detalleId);
    if (success) {
      loadData();
    }
  };

  if (!data && loading) {
    return (
      <Layout>
        <div className="content-container py-8 space-y-6">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-64 w-full" />
        </div>
      </Layout>
    );
  }

  if (!pedido_id || (!data && !loading)) {
    return (
      <Layout>
        <div className="content-container py-12 text-center flex flex-col items-center">
         <h2 className="text-xl font-bold mb-4">Pedido no encontrado o ID inválido</h2>
         <Button onClick={() => navigate('/pedidos-internos')} className="font-bold">Volver a pedidos</Button>
        </div>
      </Layout>
    );
  }

  const { pedido, detalles, comentarios, historial } = data;
  const validNextStates = getValidNextStates('pedidos_internos', pedido.estado);
  const canChangeState = canUserChangeState(currentUser?.role);
  const canEdit = isAdmin || currentUser.id === pedido.responsable_id;

  return (
    <Layout>
      <Helmet>
        <title>{pedido.numero_pedido} - Pedidos Internos</title>
      </Helmet>
      
      <div className="content-container space-y-6 py-6 pb-24 w-full max-w-none">
        <Button variant="ghost" onClick={() => navigate('/pedidos-internos')} className="pl-0 text-muted-foreground hover:text-foreground font-bold">
          <ArrowLeft className="h-4 w-4 mr-2" /> Volver a Pedidos
        </Button>

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 w-full">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-extrabold tracking-tight text-foreground">{pedido.numero_pedido}</h1>
              <Badge className={`uppercase text-[10px] font-bold tracking-wider shadow-none ${getStatusClass(pedido.estado)}`}>
                {pedido.estado.replace('_', ' ')}
              </Badge>
            </div>
            <p className="text-muted-foreground font-medium flex items-center gap-2">
              Creado el {format(new Date(pedido.created), "dd MMM yyyy 'a las' HH:mm", { locale: es })}
            </p>
          </div>
          
          <div className="flex flex-wrap gap-2 w-full md:w-auto">
            {canEdit && (
              <Button variant="outline" onClick={() => setIsEditModalOpen(true)} className="font-bold">
                <Edit2 className="h-4 w-4 mr-2" /> Editar Pedido
              </Button>
            )}
            {canChangeState ? (
              <Select value={pedido.estado} onValueChange={handleStateChange} disabled={isUpdatingState}>
                <SelectTrigger className="w-full md:w-[200px] font-bold bg-primary text-primary-foreground border-none shadow-md">
                  {isUpdatingState ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle2 className="h-4 w-4 mr-2" />}
                  <SelectValue placeholder="Cambiar Estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={pedido.estado} disabled className="font-bold">{pedido.estado.replace('_', ' ')} (Actual)</SelectItem>
                  {validNextStates.map(state => (
                    <SelectItem key={state} value={state} className="font-bold">{state.replace('_', ' ')}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : null}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 w-full">
          <div className="lg:col-span-2 space-y-6 w-full">
            <Card className="border shadow-sm rounded-2xl overflow-hidden w-full">
              <div className="p-6 bg-card border-b flex flex-wrap gap-y-4 justify-between items-center w-full">
                <div>
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Ruta del Pedido</p>
                  <p className="font-black text-lg text-foreground flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-primary" /> {pedido.sucursal_origen_id} <span className="text-muted-foreground font-normal">→</span> {pedido.sucursal_destino_id}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Prioridad</p>
                  <Badge className={`font-bold shadow-none ${getPriorityClass(pedido.prioridad)}`}>{pedido.prioridad}</Badge>
                </div>
                <div>
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Entrega Estimada</p>
                  <p className="font-bold text-foreground flex items-center gap-1">
                    <Calendar className="h-4 w-4 text-muted-foreground" /> {pedido.fecha_entrega_estimada ? format(new Date(pedido.fecha_entrega_estimada), "dd MMM yyyy", { locale: es }) : 'No asignada'}
                  </p>
                </div>
              </div>

              <div className="px-6 py-4 bg-muted/10 border-b w-full flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Responsable</p>
                  <div className="flex items-center gap-2 font-bold text-foreground">
                    <User className="h-4 w-4 text-primary" />
                    <span>{users[pedido.responsable_id] || 'No asignado'}</span>
                  </div>
                </div>
              </div>

              <div className="p-6 bg-card w-full">
                <h3 className="text-lg font-bold text-foreground mb-4">Materiales Solicitados</h3>
                <div className="overflow-x-auto w-full border rounded-xl">
                  {detalles && detalles.length > 0 ? (
                    <table className="w-full text-sm text-left whitespace-nowrap">
                      <thead className="bg-muted/50 text-muted-foreground font-bold uppercase text-xs">
                        <tr>
                          <th className="px-4 py-3">Material</th>
                          <th className="px-4 py-3 text-center">Cantidad</th>
                          <th className="px-4 py-3">Unidad</th>
                          {!isTecnico && <th className="px-4 py-3 text-right">C. Unitario</th>}
                          {!isTecnico && <th className="px-4 py-3 text-right">C. Total</th>}
                          <th className="px-4 py-3">Observaciones</th>
                          {canEdit && <th className="px-4 py-3 text-center">Acción</th>}
                        </tr>
                      </thead>
                      <tbody className="divide-y bg-card">
                        {detalles.map(d => (
                          <tr key={d.id} className="hover:bg-muted/20">
                            <td className="px-4 py-3 font-medium text-foreground">{d.material_nombre}</td>
                            <td className="px-4 py-3 text-center font-bold">{d.cantidad}</td>
                            <td className="px-4 py-3 text-muted-foreground">{d.unidad}</td>
                            {!isTecnico && <td className="px-4 py-3 text-right font-variant-numeric">${d.costo_unitario?.toFixed(2) || '0.00'}</td>}
                            {!isTecnico && <td className="px-4 py-3 text-right font-bold font-variant-numeric">${d.costo_total?.toFixed(2) || '0.00'}</td>}
                            <td className="px-4 py-3 text-muted-foreground text-xs italic truncate max-w-[150px]" title={d.observaciones_item}>{d.observaciones_item || '-'}</td>
                            {canEdit && (
                              <td className="px-4 py-3 text-center">
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10" onClick={() => handleDeleteDetalle(d.id)}>
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </td>
                            )}
                          </tr>
                        ))}
                      </tbody>
                      {!isTecnico && (
                        <tfoot className="bg-muted/20 border-t">
                          <tr>
                            <td colSpan="4" className="px-4 py-3 text-right font-bold text-foreground">Total General:</td>
                            <td className="px-4 py-3 text-right font-black text-emerald-600">${pedido.costo_total?.toFixed(2) || '0.00'}</td>
                            <td colSpan={canEdit ? "2" : "1"}></td>
                          </tr>
                        </tfoot>
                      )}
                    </table>
                  ) : (
                    <div className="p-8 text-center bg-muted/20 text-muted-foreground font-medium">
                      Sin materiales agregados
                    </div>
                  )}
                </div>
                
                {pedido.observaciones && (
                  <div className="mt-6 p-4 bg-muted/40 border rounded-xl">
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Observaciones Generales</p>
                    <p className="text-sm text-foreground whitespace-pre-wrap">{pedido.observaciones}</p>
                  </div>
                )}

                {pedido.fotografias?.length > 0 && (
                  <div className="mt-6">
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">Evidencia Fotográfica</p>
                    <PhotoGallery record={pedido} photos={pedido.fotografias} />
                  </div>
                )}
              </div>
            </Card>

            <Card className="border shadow-sm rounded-2xl w-full flex flex-col">
              <div className="p-6 border-b bg-card w-full">
                <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-primary" /> Comentarios
                </h3>
              </div>
              <div className="p-6 space-y-6 flex-1 w-full bg-card">
                {comentarios.map(c => (
                  <div key={c.id} className="flex gap-4 w-full">
                    <div className="h-10 w-10 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold shrink-0">
                      {users[c.usuario_id] ? users[c.usuario_id][0].toUpperCase() : 'U'}
                    </div>
                    <div className="flex-1 bg-muted/30 border rounded-2xl p-4 w-full">
                      <div className="flex justify-between items-center mb-2 w-full">
                        <span className="font-bold text-sm">{users[c.usuario_id] || 'Usuario'}</span>
                        <span className="text-xs text-muted-foreground font-medium">{format(new Date(c.created), "dd MMM, HH:mm", { locale: es })}</span>
                      </div>
                      <p className="text-sm text-foreground/90 whitespace-pre-wrap w-full">{c.contenido}</p>
                      {c.fotografias?.length > 0 && (
                        <div className="mt-3 w-full">
                          <PhotoGallery record={c} photos={c.fotografias} />
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                {comentarios.length === 0 && <p className="text-sm text-muted-foreground text-center font-medium">Sin comentarios aún.</p>}
              </div>
              <div className="p-4 border-t bg-muted/10 w-full shrink-0">
                <form onSubmit={submitComment} className="flex flex-col gap-3 w-full">
                  <Textarea 
                    value={newComment} 
                    onChange={(e) => setNewComment(e.target.value)} 
                    placeholder="Escribe un comentario o actualización..."
                    className="min-h-[80px] resize-none bg-background w-full"
                  />
                  {previewUrls.length > 0 && (
                    <div className="flex gap-2 overflow-x-auto py-2 w-full">
                      {previewUrls.map((url, idx) => (
                        <div key={idx} className="relative h-16 w-16 shrink-0 rounded-lg overflow-hidden border shadow-sm">
                          <img src={url} alt="Preview" className="w-full h-full object-cover" />
                          <button 
                            type="button" 
                            onClick={() => removePreview(idx)} 
                            className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-0.5 hover:bg-black"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="flex justify-between items-center w-full">
                    <label className="cursor-pointer text-sm font-bold text-primary hover:text-primary/80 flex items-center gap-1 bg-primary/10 px-3 py-1.5 rounded-lg transition-colors">
                      <FileText className="h-4 w-4" /> Adjuntar fotos
                      <input type="file" accept="image/*" multiple className="hidden" onChange={handleFileChange} />
                    </label>
                    <Button type="submit" disabled={!newComment.trim() && commentFiles.length === 0} className="font-bold">
                      <Send className="h-4 w-4 mr-2" /> Enviar
                    </Button>
                  </div>
                </form>
              </div>
            </Card>
          </div>

          <div className="space-y-6 w-full">
            <Card className="border shadow-sm rounded-2xl w-full">
              <div className="p-5 border-b bg-card w-full">
                <h3 className="font-bold text-foreground flex items-center gap-2">
                  <Clock className="h-5 w-5 text-primary" /> Historial de Actividad
                </h3>
              </div>
              <div className="p-5 w-full bg-card">
                <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-border w-full">
                  {historial.map(h => (
                    <div key={h.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active w-full">
                      <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-card bg-muted text-muted-foreground shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow-sm z-10">
                        {h.accion === 'crear' ? <Plus className="h-4 w-4 text-emerald-500" /> :
                         h.accion === 'cambiar_estado' ? <CheckCircle2 className="h-4 w-4 text-blue-500" /> :
                         h.accion === 'comentar' ? <MessageSquare className="h-4 w-4 text-purple-500" /> :
                         <Edit2 className="h-4 w-4" />}
                      </div>
                      <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-xl border bg-card shadow-sm w-full">
                        <div className="flex items-center justify-between mb-1 w-full">
                          <span className="font-bold text-sm text-foreground">{users[h.usuario_id] || 'Usuario'}</span>
                          <span className="text-[10px] font-bold text-muted-foreground">{format(new Date(h.created), "dd MMM, HH:mm", { locale: es })}</span>
                        </div>
                        <p className="text-xs text-muted-foreground w-full break-words">{h.descripcion}</p>
                      </div>
                    </div>
                  ))}
                  {historial.length === 0 && <p className="text-sm text-muted-foreground text-center font-medium">Sin actividad registrada.</p>}
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>

      <PedidoInternoFormModal 
        isOpen={isEditModalOpen} 
        onClose={() => setIsEditModalOpen(false)} 
        onSuccess={loadData}
        initialData={pedido}
        isViewOnly={false}
      />

      <EntregaPedidoModal
        isOpen={isEntregaOpen}
        onClose={() => setIsEntregaOpen(false)}
        onConfirm={handleConfirmEntrega}
        submitting={isUpdatingState}
      />
    </Layout>
  );
};

export default PedidoInternoDetailPage;