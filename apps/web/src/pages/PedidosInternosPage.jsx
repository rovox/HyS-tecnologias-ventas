import React, { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet';
import { Package, Plus, Search, Eye, Edit2, Trash2, Calendar, AlertCircle, Boxes, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout.jsx';
import { Button } from '@/components/ui/button.jsx';
import { Input } from '@/components/ui/input.jsx';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select.jsx';
import { Badge } from '@/components/ui/badge.jsx';
import { Skeleton } from '@/components/ui/skeleton.jsx';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog.jsx';
import { useAuth } from '@/contexts/AuthContext.jsx';
import { useInternalOrders } from '@/hooks/useInternalOrders.js';
import PedidoInternoFormModal from '@/components/PedidoInternoFormModal.jsx';
import EntregaPedidoModal from '@/components/EntregaPedidoModal.jsx';
import DeleteConfirmationModal from '@/components/DeleteConfirmationModal.jsx';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import pb from '@/lib/pocketbaseClient.js';
import { toast } from 'sonner';

const PRIORIDADES = ['Todas', 'Baja', 'Normal', 'Alta', 'Urgente'];
const ESTADOS = ['Todos', 'solicitado', 'aprobado', 'en_preparación', 'entregado', 'rechazado', 'cancelado'];
const TIPOS = ['Todos', 'Para trabajo', 'Para sucursal'];
const ESTADOS_CAMBIO = ['solicitado', 'aprobado', 'en_preparación', 'entregado', 'rechazado'];

const ESTADO_LABELS = {
  solicitado: 'Solicitado',
  aprobado: 'Aprobado',
  en_preparación: 'En preparación',
  entregado: 'Entregado',
  rechazado: 'Rechazado',
  cancelado: 'Cancelado'
};

const PedidosInternosPage = () => {
  const { currentUser } = useAuth();
  const isAdmin = currentUser?.role === 'ADMINISTRADOR';
  const navigate = useNavigate();

  const { fetchPedidos, deletePedido, fetchDetallesForPedidos, updateEstadoPedido, error: pedidosError } = useInternalOrders();

  const [pedidos, setPedidos] = useState([]);
  const [usersMap, setUsersMap] = useState({});
  const [materialesMap, setMaterialesMap] = useState({});
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [filtroTipo, setFiltroTipo] = useState('Todos');
  const [filtroEstado, setFiltroEstado] = useState('Todos');
  const [filtroPrioridad, setFiltroPrioridad] = useState('Todas');
  const [filtroSucursal, setFiltroSucursal] = useState('Todas');

  // Modals
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isViewOnly, setIsViewOnly] = useState(false);
  const [selectedPedido, setSelectedPedido] = useState(null);

  const [isEntregaOpen, setIsEntregaOpen] = useState(false);
  const [pedidoParaEntregar, setPedidoParaEntregar] = useState(null);
  const [updatingEstadoId, setUpdatingEstadoId] = useState(null);
  const [savingEntrega, setSavingEntrega] = useState(false);
  const [materialesDialogPedido, setMaterialesDialogPedido] = useState(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const pedidosRes = await fetchPedidos({
        search,
        estado: filtroEstado,
        prioridad: filtroPrioridad,
        tipo: filtroTipo,
        sucursal: filtroSucursal
      });

      const usersRes = await pb.collection('users').getFullList({ $autoCancel: false }).catch(() => []);
      const map = {};
      usersRes.forEach(u => map[u.id] = u.name);

      setUsersMap(map);
      setPedidos(pedidosRes || []);

      if (pedidosRes && pedidosRes.length > 0) {
        const detallesMap = await fetchDetallesForPedidos(pedidosRes.map(p => p.id));
        setMaterialesMap(detallesMap);
      } else {
        setMaterialesMap({});
      }

    } catch (e) {
      console.error('Failed to load internal orders', e);
      toast.error('Error al cargar pedidos');
    } finally {
      setLoading(false);
    }
  }, [fetchPedidos, fetchDetallesForPedidos, search, filtroEstado, filtroPrioridad, filtroTipo, filtroSucursal]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const getStatusClass = (status) => {
    switch(status) {
      case 'solicitado': return 'bg-slate-100 text-slate-800 dark:bg-slate-800/50 dark:text-slate-300';
      case 'aprobado': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300';
      case 'en_preparación': return 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300';
      case 'entregado': return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300';
      case 'rechazado': return 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300';
      case 'cancelado': return 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getPriorityClass = (priority) => {
    switch(priority) {
      case 'Baja': return 'text-slate-500';
      case 'Normal': return 'text-blue-500';
      case 'Alta': return 'text-amber-500';
      case 'Urgente': return 'text-red-500 font-extrabold';
      default: return 'text-muted-foreground';
    }
  };

  const formatMaterialLine = (item) => `${item.material_nombre} x${item.cantidad}${item.unidad && item.unidad !== 'unidades' ? item.unidad : ''}`;

  const getMaterialesSummary = (pedidoId) => {
    const items = materialesMap[pedidoId] || [];
    if (items.length === 0) return { count: 0, top: [] };
    return { count: items.length, top: items.slice(0, 3).map(formatMaterialLine) };
  };

  const getRelacionLabel = (pedido) => {
    if (pedido.cronograma_id) {
      return { tipo: 'Trabajo', relacion: pedido.sucursal_destino_id || 'Trabajo asignado' };
    }
    return { tipo: 'Sucursal', relacion: pedido.sucursal_destino_id || 'N/A' };
  };

  const handleOpenForm = (pedido = null, viewOnly = false) => {
    setSelectedPedido(pedido);
    setIsViewOnly(viewOnly);
    setIsFormOpen(true);
  };

  const handleNavigateDetail = (pedidoId) => {
    navigate(`/pedidos-internos/${pedidoId}`);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedPedido) return;
    try {
      setLoading(true);
      await deletePedido(selectedPedido.id);
      toast.success('Pedido eliminado exitosamente');
      loadData();
    } catch (e) {
      console.error(e);
      toast.error('Error al eliminar el pedido');
    } finally {
      setIsDeleteOpen(false);
      setSelectedPedido(null);
      setLoading(false);
    }
  };

  const handleEstadoChange = async (pedido, nuevoEstado) => {
    if (nuevoEstado === pedido.estado) return;

    if (nuevoEstado === 'entregado') {
      setPedidoParaEntregar(pedido);
      setIsEntregaOpen(true);
      return;
    }

    setUpdatingEstadoId(pedido.id);
    try {
      await updateEstadoPedido(pedido.id, nuevoEstado);
      loadData();
    } catch (e) {
      console.error(e);
    } finally {
      setUpdatingEstadoId(null);
    }
  };

  const handleConfirmEntrega = async (extra) => {
    if (!pedidoParaEntregar) return;
    setSavingEntrega(true);
    try {
      await updateEstadoPedido(pedidoParaEntregar.id, 'entregado', extra);
      setIsEntregaOpen(false);
      setPedidoParaEntregar(null);
      loadData();
    } catch (e) {
      console.error(e);
    } finally {
      setSavingEntrega(false);
    }
  };

  const canChangeEstado = (pedido) => isAdmin || currentUser.id === pedido.responsable_id;

  return (
    <Layout>
      <Helmet>
        <title>Pedidos Internos - H&S Tecnologías</title>
      </Helmet>
      
      <div className="content-container space-y-6 py-8 pb-24 w-full">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 w-full bg-card p-6 rounded-2xl border shadow-sm">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-3">
              <Package className="h-8 w-8 text-primary" /> Pedidos Internos
            </h1>
            <p className="text-muted-foreground mt-2 font-medium max-w-prose">Gestiona requerimientos de materiales entre sucursales y proyectos operativos.</p>
          </div>
          <Button onClick={() => handleOpenForm()} className="gap-2 shadow-md font-bold px-6 py-5 rounded-xl text-md shrink-0">
            <Plus className="h-5 w-5" /> Crear Pedido
          </Button>
        </div>

        {/* Filtros */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="relative lg:col-span-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Buscar por N° de solicitud o destino..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-card border-border h-11 shadow-sm font-medium"
            />
          </div>
          
          <Select value={filtroTipo} onValueChange={setFiltroTipo}>
            <SelectTrigger className="bg-card h-11 shadow-sm font-bold text-muted-foreground">
              <SelectValue placeholder="Tipo" />
            </SelectTrigger>
            <SelectContent>
              {TIPOS.map(t => <SelectItem key={t} value={t} className="font-medium">{t}</SelectItem>)}
            </SelectContent>
          </Select>

          <Select value={filtroEstado} onValueChange={setFiltroEstado}>
            <SelectTrigger className="bg-card h-11 shadow-sm font-bold text-muted-foreground">
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              {ESTADOS.map(e => <SelectItem key={e} value={e} className="font-medium capitalize">{e === 'Todos' ? e : (ESTADO_LABELS[e] || e)}</SelectItem>)}
            </SelectContent>
          </Select>

          <Select value={filtroPrioridad} onValueChange={setFiltroPrioridad}>
            <SelectTrigger className="bg-card h-11 shadow-sm font-bold text-muted-foreground">
              <SelectValue placeholder="Prioridad" />
            </SelectTrigger>
            <SelectContent>
              {PRIORIDADES.map(p => <SelectItem key={p} value={p} className="font-medium">{p}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {/* Tabla */}
        <div className="table-container overflow-x-hidden">
          <table className="w-full text-sm text-left table-fixed">
            <colgroup>
              <col className="w-[16%]" />
              <col className="w-[10%]" />
              <col className="w-[16%]" />
              <col className="w-[22%]" />
              <col className="w-[11%]" />
              <col className="w-[9%]" />
              <col className="w-[9%]" />
              <col className="w-[7%]" />
            </colgroup>
            <thead className="table-header">
              <tr>
                <th className="px-4 py-4 rounded-tl-xl">Solicitante</th>
                <th className="px-4 py-4">Para</th>
                <th className="px-4 py-4">Trabajo/Sucursal</th>
                <th className="px-4 py-4">Materiales</th>
                <th className="px-4 py-4">Estado</th>
                <th className="px-4 py-4">Prioridad</th>
                <th className="px-4 py-4">Entrega Est.</th>
                <th className="px-4 py-4 text-right rounded-tr-xl">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i} className="table-row">
                    <td className="px-4 py-4" colSpan="8"><Skeleton className="h-8 w-full rounded-md" /></td>
                  </tr>
                ))
              ) : pedidosError ? (
                <tr>
                  <td colSpan="8" className="px-6 py-24 text-center">
                    <div className="flex flex-col items-center justify-center text-muted-foreground">
                      <AlertCircle className="h-12 w-12 mb-4 opacity-30 text-destructive" />
                      <p className="text-lg font-bold text-destructive">{pedidosError}</p>
                      <p className="text-sm mt-1">Contacta a un administrador si crees que esto es un error.</p>
                    </div>
                  </td>
                </tr>
              ) : pedidos.length > 0 ? (
                pedidos.map(p => {
                  const { tipo, relacion } = getRelacionLabel(p);
                  const puedeEditarEstado = canChangeEstado(p) && p.estado !== 'cancelado';
                  const { count, top } = getMaterialesSummary(p.id);
                  return (
                    <tr key={p.id} className="table-row group align-top">
                      <td className="table-cell font-medium">
                        <div className="flex items-center gap-2">
                          <div className="h-6 w-6 rounded-full bg-secondary text-secondary-foreground flex items-center justify-center text-[10px] font-black shrink-0 uppercase">
                            {usersMap[p.responsable_id]?.charAt(0) || 'U'}
                          </div>
                          <div className="min-w-0">
                            <span className="block truncate">{usersMap[p.responsable_id] || 'No asignado'}</span>
                            <span className="block text-[10px] text-muted-foreground/70 font-normal truncate">{p.numero_pedido}</span>
                          </div>
                        </div>
                      </td>
                      <td className="table-cell">
                        <Badge variant="outline" className="font-bold text-[10px] uppercase shadow-none">
                          {tipo}
                        </Badge>
                      </td>
                      <td className="table-cell text-muted-foreground truncate" title={relacion}>
                        {relacion}
                      </td>
                      <td className="table-cell text-xs text-foreground/90">
                        {count === 0 ? (
                          <div className="flex items-center gap-1.5 text-muted-foreground">
                            <Boxes className="h-3.5 w-3.5 shrink-0" />
                            <span>Sin materiales</span>
                          </div>
                        ) : (
                          <div className="flex flex-col gap-0.5">
                            <span className="font-bold text-foreground flex items-center gap-1.5">
                              <Boxes className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                              {count} material{count !== 1 ? 'es' : ''} solicitado{count !== 1 ? 's' : ''}
                            </span>
                            <span className="text-muted-foreground truncate" title={top.join(', ')}>{top.join(', ')}</span>
                            <button
                              type="button"
                              onClick={() => setMaterialesDialogPedido(p)}
                              className="text-[11px] font-bold text-primary hover:underline self-start mt-0.5"
                            >
                              Ver detalle
                            </button>
                          </div>
                        )}
                      </td>
                      <td className="table-cell">
                        {puedeEditarEstado ? (
                          <Select
                            value={p.estado}
                            onValueChange={(val) => handleEstadoChange(p, val)}
                            disabled={updatingEstadoId === p.id}
                          >
                            <SelectTrigger className={`h-8 w-full font-extrabold uppercase tracking-wider text-[10px] px-2.5 border-transparent shadow-none ${getStatusClass(p.estado)}`}>
                              {updatingEstadoId === p.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <SelectValue />}
                            </SelectTrigger>
                            <SelectContent>
                              {ESTADOS_CAMBIO.map(e => (
                                <SelectItem key={e} value={e} className="font-bold text-xs">{ESTADO_LABELS[e]}</SelectItem>
                              ))}
                              {p.estado === 'cancelado' && (
                                <SelectItem value="cancelado" disabled className="font-bold text-xs">Cancelado</SelectItem>
                              )}
                            </SelectContent>
                          </Select>
                        ) : (
                          <Badge variant="outline" className={`font-extrabold uppercase tracking-wider text-[10px] px-2.5 py-1 shadow-none border-transparent ${getStatusClass(p.estado)}`}>
                            {ESTADO_LABELS[p.estado] || p.estado}
                          </Badge>
                        )}
                      </td>
                      <td className="table-cell">
                        <span className={`font-bold flex items-center gap-1.5 ${getPriorityClass(p.prioridad)}`}>
                          <AlertCircle className="h-3.5 w-3.5 shrink-0"/> {p.prioridad}
                        </span>
                      </td>
                      <td className="table-cell font-bold text-foreground">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
                          <span className="truncate">{p.fecha_entrega_estimada ? format(new Date(p.fecha_entrega_estimada), "dd MMM", { locale: es }) : 'N/A'}</span>
                        </div>
                      </td>
                      <td className="table-cell text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="icon" onClick={() => handleNavigateDetail(p.id)} className="h-8 w-8 text-primary hover:bg-primary/10" title="Ver Detalle">
                            <Eye className="h-4 w-4" />
                          </Button>
                          {(isAdmin || currentUser.id === p.responsable_id) && (
                            <Button variant="ghost" size="icon" onClick={() => handleOpenForm(p, false)} className="h-8 w-8 text-foreground hover:bg-muted" title="Editar">
                              <Edit2 className="h-4 w-4" />
                            </Button>
                          )}
                          {isAdmin && (
                            <Button variant="ghost" size="icon" onClick={() => { setSelectedPedido(p); setIsDeleteOpen(true); }} className="h-8 w-8 text-destructive hover:bg-destructive/10" title="Eliminar">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="8" className="px-6 py-24 text-center">
                    <div className="flex flex-col items-center justify-center text-muted-foreground">
                      <Package className="h-12 w-12 mb-4 opacity-20" />
                      <p className="text-lg font-bold">No hay pedidos internos</p>
                      <p className="text-sm">Ajusta los filtros o crea un nuevo pedido para empezar.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog open={!!materialesDialogPedido} onOpenChange={(open) => !open && setMaterialesDialogPedido(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-extrabold flex items-center gap-2">
              <Boxes className="h-5 w-5 text-primary" /> Materiales de {materialesDialogPedido?.numero_pedido}
            </DialogTitle>
            <DialogDescription>Lista completa de materiales solicitados en este pedido.</DialogDescription>
          </DialogHeader>
          <div className="max-h-[60vh] overflow-y-auto divide-y divide-border -mx-1">
            {(materialesMap[materialesDialogPedido?.id] || []).map((item, idx) => (
              <div key={item.id || idx} className="px-1 py-3 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-bold text-sm text-foreground truncate">{item.material_nombre}</p>
                  {item.observaciones_item && (
                    <p className="text-xs text-muted-foreground italic mt-0.5">{item.observaciones_item}</p>
                  )}
                </div>
                <div className="text-right shrink-0">
                  <p className="font-bold text-sm text-foreground">{item.cantidad} {item.unidad}</p>
                  {typeof item.costo_unitario === 'number' && item.costo_unitario > 0 && (
                    <p className="text-xs text-muted-foreground">${item.costo_unitario.toFixed(2)} c/u</p>
                  )}
                </div>
              </div>
            ))}
            {(!materialesMap[materialesDialogPedido?.id] || materialesMap[materialesDialogPedido?.id].length === 0) && (
              <p className="text-sm text-muted-foreground text-center py-8">Sin materiales registrados.</p>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <PedidoInternoFormModal 
        isOpen={isFormOpen} 
        onClose={() => setIsFormOpen(false)} 
        onSuccess={loadData}
        initialData={selectedPedido}
        isViewOnly={isViewOnly}
      />

      <EntregaPedidoModal
        isOpen={isEntregaOpen}
        onClose={() => { setIsEntregaOpen(false); setPedidoParaEntregar(null); }}
        onConfirm={handleConfirmEntrega}
        submitting={savingEntrega}
      />

      <DeleteConfirmationModal
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDeleteConfirm}
        itemName={`Pedido ${selectedPedido?.numero_pedido}`}
        isDeleting={loading}
      />
    </Layout>
  );
};

export default PedidosInternosPage;
