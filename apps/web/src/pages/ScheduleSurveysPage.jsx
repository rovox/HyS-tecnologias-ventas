import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Helmet } from 'react-helmet';
import Layout from '@/components/Layout.jsx';
import pb from '@/lib/pocketbaseClient.js';
import { useAuth } from '@/contexts/AuthContext.jsx';
import { Button } from '@/components/ui/button.jsx';
import { Badge } from '@/components/ui/badge.jsx';
import { Input } from '@/components/ui/input.jsx';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select.jsx';
import { Skeleton } from '@/components/ui/skeleton.jsx';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog.jsx';
import { toast } from 'sonner';
import { MapPin, Clock, User, Plus, ExternalLink, Search, Eye, Wrench, ClipboardList, AlertTriangle, Trash2, Shield, RotateCcw } from 'lucide-react';
import VisitaFormModal from '@/components/VisitaFormModal.jsx';

const fmtDate = (d) => {
  if (!d) return '—';
  try {
    const clean = String(d).split(' ')[0].split('T')[0];
    const [y, m, day] = clean.split('-');
    return `${day}/${m}/${y}`;
  } catch { return String(d); }
};

const fmtTime = (h) => h ? String(h).slice(0, 5) : '';

const openMaps = (mapsLink, lugar) => {
  if (mapsLink?.trim()) {
    window.open(mapsLink, '_blank', 'noopener');
  } else if (lugar?.trim()) {
    window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(lugar)}`, '_blank', 'noopener');
  } else {
    toast.error('No hay ubicación disponible');
  }
};

const ESTADO_COLORS = {
  programado: 'bg-blue-100 text-blue-800 border-blue-200',
  en_camino: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  en_atencion: 'bg-orange-100 text-orange-800 border-orange-200',
  resuelto: 'bg-green-100 text-green-800 border-green-200',
  pendiente: 'bg-gray-100 text-gray-600 border-gray-200',
  cancelado: 'bg-red-100 text-red-700 border-red-200',
};

const ESTADO_LABELS = {
  programado: 'Programado',
  en_camino: 'En camino',
  en_atencion: 'En atención',
  resuelto: 'Resuelto',
  pendiente: 'Pendiente',
  cancelado: 'Cancelado',
};

const PRIORIDAD_COLORS = {
  baja: 'text-gray-400',
  media: 'text-blue-500',
  alta: 'text-orange-500',
  urgente: 'text-red-600',
};

const TABS = [
  { key: 'activos', label: 'Activos', states: ['pendiente', 'programado', 'en_camino', 'en_atencion'] },
  { key: 'requiere_volver', label: 'Requiere volver', states: null, custom: 'requiere_volver' },
  { key: 'resuelto', label: 'Resueltos', states: ['resuelto'] },
  { key: 'cancelado', label: 'Cancelados', states: ['cancelado'] },
  { key: 'todos', label: 'Todos', states: null },
];

const DetailModal = ({ visita, onClose, onEdit, onStatusChange, canEdit, canDelete, onDelete }) => {
  const [saving, setSaving] = useState(false);
  if (!visita) return null;
  const esAsistencia = visita.tipo_visita === 'Asistencia';

  const changeStatus = async (newStatus) => {
    setSaving(true);
    try {
      await pb.collection('visitas_tecnicas').update(visita.id, { estado: newStatus });
      toast.success('Estado actualizado');
      onStatusChange();
    } catch { toast.error('Error al actualizar'); }
    finally { setSaving(false); }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-extrabold">
            {visita.tipo_visita} — {visita.cliente_nombre || '—'}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 text-sm">
          <div className="grid grid-cols-2 gap-3">
            <div><span className="text-muted-foreground font-semibold">Fecha:</span> <span className="font-bold">{fmtDate(visita.fecha)}</span></div>
            <div><span className="text-muted-foreground font-semibold">Hora:</span> <span className="font-bold">{fmtTime(visita.hora) || '—'}</span></div>
            <div><span className="text-muted-foreground font-semibold">Técnico:</span> <span className="font-bold">{visita.tecnico_nombre || '—'}</span></div>
            <div><span className="text-muted-foreground font-semibold">Sucursal:</span> <span className="font-bold">{visita.sucursal_nombre || '—'}</span></div>
            <div><span className="text-muted-foreground font-semibold">Prioridad:</span> <span className={`font-bold capitalize ${PRIORIDAD_COLORS[visita.prioridad] || ''}`}>{visita.prioridad || '—'}</span></div>
            <div>
              <span className="text-muted-foreground font-semibold">Estado:</span>{' '}
              <Badge className={`text-[10px] border capitalize ${ESTADO_COLORS[visita.estado] || ''}`}>{ESTADO_LABELS[visita.estado] || visita.estado || '—'}</Badge>
            </div>
          </div>
          {visita.lugar && (
            <div className="flex items-start gap-2">
              <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
              <span>{visita.lugar}</span>
              <Button variant="ghost" size="sm" className="h-6 px-2 text-xs" onClick={() => openMaps(visita.google_maps_link, visita.lugar)}>
                <ExternalLink className="h-3 w-3 mr-1" /> Maps
              </Button>
            </div>
          )}
          {esAsistencia && (
            <div className="space-y-2 border-t pt-3">
              <p className="font-extrabold text-blue-700 dark:text-blue-300">Datos de asistencia</p>
              {visita.motivo && <div><span className="font-semibold text-muted-foreground">Motivo:</span> {visita.motivo}</div>}
              {visita.equipo_afectado && <div><span className="font-semibold text-muted-foreground">Equipo afectado:</span> {visita.equipo_afectado}</div>}
              {visita.problema_reportado && <div><span className="font-semibold text-muted-foreground">Problema:</span> {visita.problema_reportado}</div>}
              {visita.diagnostico && <div><span className="font-semibold text-muted-foreground">Diagnóstico:</span> {visita.diagnostico}</div>}
              {visita.solucion && <div><span className="font-semibold text-muted-foreground">Solución:</span> {visita.solucion}</div>}
              <div className="flex gap-4 flex-wrap text-xs">
                {visita.requiere_material && <span className="text-orange-600 font-bold">⚠ Requiere material</span>}
                {visita.requiere_volver && <span className="text-red-600 font-bold">↩ Requiere volver</span>}
              </div>
              {/* Garantía */}
              {visita.estado_garantia && (
                <div>
                  <span className="font-semibold text-muted-foreground">Garantía:</span>{' '}
                  <span className={`font-bold ${visita.estado_garantia === 'En garantía' ? 'text-green-600' : visita.estado_garantia === 'Fuera de garantía' ? 'text-red-600' : 'text-amber-600'}`}>
                    {visita.estado_garantia}
                  </span>
                  {visita.garantia_hasta && <span className="text-muted-foreground ml-1">(hasta {fmtDate(visita.garantia_hasta)})</span>}
                </div>
              )}
              {/* Cobro */}
              {visita.se_cobra !== undefined && (
                <div>
                  <span className="font-semibold text-muted-foreground">Cobro:</span>{' '}
                  {visita.se_cobra
                    ? <span className="text-green-700 font-bold">Se cobra{visita.monto_cobrado > 0 ? ` — Bs ${Number(visita.monto_cobrado).toFixed(2)}` : ''} {visita.medio_pago ? `(${visita.medio_pago})` : ''}</span>
                    : <span className="text-muted-foreground">Sin costo</span>}
                </div>
              )}
            </div>
          )}
          {!esAsistencia && (
            <div className="space-y-2 border-t pt-3">
              <p className="font-extrabold text-green-700 dark:text-green-300">Datos de relevamiento</p>
              {visita.necesidad_cliente && <div><span className="font-semibold text-muted-foreground">Necesidad:</span> {visita.necesidad_cliente}</div>}
              {visita.area_revisar && <div><span className="font-semibold text-muted-foreground">Área:</span> {visita.area_revisar}</div>}
              {visita.cantidad_estimada > 0 && <div><span className="font-semibold text-muted-foreground">Cantidad estimada:</span> {visita.cantidad_estimada}</div>}
              {visita.observacion_tecnica && <div><span className="font-semibold text-muted-foreground">Obs. técnica:</span> {visita.observacion_tecnica}</div>}
              {visita.requiere_cotizacion && <span className="text-blue-600 font-bold text-xs">Requiere cotización</span>}
            </div>
          )}
          {visita.observacion_final && (
            <div className="border-t pt-3">
              <span className="font-semibold text-muted-foreground">Observación:</span> {visita.observacion_final}
            </div>
          )}
          {canEdit && (
            <div className="border-t pt-3 space-y-3">
              <p className="font-bold text-xs text-muted-foreground uppercase tracking-wide">Cambiar estado</p>
              <div className="flex flex-wrap gap-2">
                {['programado','en_camino','en_atencion','resuelto','pendiente','cancelado'].map(s => (
                  <Button key={s} size="sm" variant={visita.estado === s ? 'default' : 'outline'}
                    className="text-xs font-bold capitalize" disabled={saving}
                    onClick={() => changeStatus(s)}>
                    {ESTADO_LABELS[s]}
                  </Button>
                ))}
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" className="font-bold text-xs flex-1" onClick={() => { onClose(); onEdit(visita); }}>
                  ✏ Editar visita
                </Button>
                {canDelete && (
                  <Button size="sm" variant="outline" className="text-xs font-bold text-destructive hover:bg-destructive/10"
                    onClick={() => { onClose(); onDelete(visita); }}>
                    <Trash2 className="h-3.5 w-3.5 mr-1" /> Eliminar
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

const ScheduleSurveysPage = () => {
  const { currentUser, isAdmin, isVentas, isContadora, isSeguridad } = useAuth();
  const canEdit = isAdmin() || isVentas() || isContadora();
  const canDelete = isAdmin();

  const [visitas, setVisitas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('activos');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVisita, setEditingVisita] = useState(null);
  const [detailVisita, setDetailVisita] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Filters
  const [search, setSearch] = useState('');
  const [filterEstado, setFilterEstado] = useState('all');
  const [filterTipo, setFilterTipo] = useState('all');
  const [filterTecnico, setFilterTecnico] = useState('all');
  const [filterSucursal, setFilterSucursal] = useState('all');
  const [filterFechaDesde, setFilterFechaDesde] = useState('');
  const [filterFechaHasta, setFilterFechaHasta] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const records = await pb.collection('visitas_tecnicas').getFullList({
        sort: '-fecha',
        requestKey: 'surveys-fetch',
      });
      setVisitas(records);
    } catch (err) {
      console.error('Error al cargar visitas:', err);
      setVisitas([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Unique tecnicos and sucursales for filter dropdowns
  const uniqueTecnicos = useMemo(() => {
    const map = {};
    visitas.forEach(v => { if (v.tecnico_nombre) map[v.tecnico_nombre] = true; });
    return Object.keys(map).sort();
  }, [visitas]);

  const uniqueSucursales = useMemo(() => {
    const map = {};
    visitas.forEach(v => { if (v.sucursal_nombre) map[v.sucursal_nombre] = true; });
    return Object.keys(map).sort();
  }, [visitas]);

  const filtered = useMemo(() => {
    const tab = TABS.find(t => t.key === activeTab);
    return visitas.filter(v => {
      // Tab filter
      if (tab.custom === 'requiere_volver') {
        if (!v.requiere_volver) return false;
        if (v.estado === 'resuelto' || v.estado === 'cancelado') return false;
      } else if (tab.states) {
        if (!tab.states.includes(v.estado)) return false;
      }
      // Search
      if (search) {
        const q = search.toLowerCase();
        const hay = `${v.cliente_nombre||''} ${v.tecnico_nombre||''} ${v.lugar||''} ${v.motivo||''} ${v.necesidad_cliente||''} ${v.equipo_afectado||''}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (filterEstado !== 'all' && v.estado !== filterEstado) return false;
      if (filterTipo !== 'all' && v.tipo_visita !== filterTipo) return false;
      if (filterTecnico !== 'all' && v.tecnico_nombre !== filterTecnico) return false;
      if (filterSucursal !== 'all' && v.sucursal_nombre !== filterSucursal) return false;
      // Date range
      if (filterFechaDesde || filterFechaHasta) {
        const fecha = String(v.fecha || '').split(' ')[0].split('T')[0];
        if (filterFechaDesde && fecha < filterFechaDesde) return false;
        if (filterFechaHasta && fecha > filterFechaHasta) return false;
      }
      return true;
    });
  }, [visitas, activeTab, search, filterEstado, filterTipo, filterTecnico, filterSucursal, filterFechaDesde, filterFechaHasta]);

  const tabCounts = useMemo(() => {
    const counts = {};
    TABS.forEach(tab => {
      if (tab.custom === 'requiere_volver') {
        counts[tab.key] = visitas.filter(v => v.requiere_volver && v.estado !== 'resuelto' && v.estado !== 'cancelado').length;
      } else if (tab.states) {
        counts[tab.key] = visitas.filter(v => tab.states.includes(v.estado)).length;
      } else {
        counts[tab.key] = visitas.length;
      }
    });
    return counts;
  }, [visitas]);

  const openNew = () => { setEditingVisita(null); setIsModalOpen(true); };
  const openEdit = (v) => { setEditingVisita(v); setIsModalOpen(true); };
  const onSaved = () => { setIsModalOpen(false); setEditingVisita(null); fetchData(); };
  const onStatusChange = () => { setDetailVisita(null); fetchData(); };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await pb.collection('visitas_tecnicas').delete(deleteTarget.id);
      toast.success('Visita eliminada');
      setDeleteTarget(null);
      fetchData();
    } catch (e) {
      toast.error('Error al eliminar');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Layout>
      <Helmet>
        <title>Relevamientos y Asistencias - H&S Tecnologías</title>
        <meta name="description" content="Bandeja operativa de visitas técnicas, relevamientos y asistencias" />
      </Helmet>

      <div className="content-container py-6 pb-24 space-y-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-3">
              <ClipboardList className="h-8 w-8 text-primary" /> Relevamientos y Asistencias
            </h1>
            <p className="text-muted-foreground mt-1 font-medium">Bandeja operativa de visitas técnicas.</p>
          </div>
          {canEdit && (
            <Button onClick={openNew} className="font-bold shadow-md">
              <Plus className="h-4 w-4 mr-2" /> Nueva visita
            </Button>
          )}
        </div>

        {/* Status Tabs */}
        <div className="flex flex-wrap gap-2">
          {TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2 rounded-xl text-sm font-bold border transition-all ${
                activeTab === tab.key
                  ? 'bg-primary text-primary-foreground border-primary shadow'
                  : 'bg-card text-muted-foreground border-border hover:border-primary/40 hover:text-foreground'
              }`}
            >
              {tab.label}
              <span className={`ml-2 text-xs font-black px-1.5 py-0.5 rounded-full ${activeTab === tab.key ? 'bg-white/20' : 'bg-muted'}`}>
                {tabCounts[tab.key] || 0}
              </span>
            </button>
          ))}
        </div>

        {/* Filters */}
        <div className="bg-card border rounded-2xl p-4 space-y-3 shadow-sm">
          <div className="flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-[180px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input className="pl-9" placeholder="Buscar cliente, técnico, dirección, falla..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <Select value={filterTipo} onValueChange={setFilterTipo}>
              <SelectTrigger className="w-40 font-bold"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tipo: Todos</SelectItem>
                <SelectItem value="Asistencia">Asistencia</SelectItem>
                <SelectItem value="Relevamiento">Relevamiento</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterEstado} onValueChange={setFilterEstado}>
              <SelectTrigger className="w-40 font-bold"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Estado: Todos</SelectItem>
                <SelectItem value="programado">Programado</SelectItem>
                <SelectItem value="en_camino">En camino</SelectItem>
                <SelectItem value="en_atencion">En atención</SelectItem>
                <SelectItem value="resuelto">Resuelto</SelectItem>
                <SelectItem value="pendiente">Pendiente</SelectItem>
                <SelectItem value="cancelado">Cancelado</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-wrap gap-3">
            <Select value={filterTecnico} onValueChange={setFilterTecnico}>
              <SelectTrigger className="w-44 font-bold"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Técnico: Todos</SelectItem>
                {uniqueTecnicos.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={filterSucursal} onValueChange={setFilterSucursal}>
              <SelectTrigger className="w-44 font-bold"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Sucursal: Todas</SelectItem>
                {uniqueSucursales.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-muted-foreground">Desde</span>
              <Input type="date" className="w-36" value={filterFechaDesde} onChange={e => setFilterFechaDesde(e.target.value)} />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-muted-foreground">Hasta</span>
              <Input type="date" className="w-36" value={filterFechaHasta} onChange={e => setFilterFechaHasta(e.target.value)} />
            </div>
            {(search || filterEstado !== 'all' || filterTipo !== 'all' || filterTecnico !== 'all' || filterSucursal !== 'all' || filterFechaDesde || filterFechaHasta) && (
              <Button variant="ghost" size="sm" className="text-xs font-bold text-muted-foreground" onClick={() => {
                setSearch(''); setFilterEstado('all'); setFilterTipo('all'); setFilterTecnico('all');
                setFilterSucursal('all'); setFilterFechaDesde(''); setFilterFechaHasta('');
              }}>
                Limpiar filtros
              </Button>
            )}
          </div>
        </div>

        {/* Cards grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-44 rounded-2xl" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <ClipboardList className="h-12 w-12 mx-auto mb-4 opacity-30" />
            <p className="font-bold text-lg">Sin visitas en esta bandeja</p>
            <p className="text-sm mt-1">Ajusta los filtros o crea una nueva visita técnica.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filtered.map(v => {
              const stateClass = ESTADO_COLORS[v.estado] || 'bg-gray-100 text-gray-600 border-gray-200';
              const isAsistencia = v.tipo_visita === 'Asistencia';
              const garantiaColor = v.estado_garantia === 'En garantía' ? 'text-green-600' : v.estado_garantia === 'Fuera de garantía' ? 'text-red-600' : 'text-amber-500';
              const urgente = v.prioridad === 'urgente' || v.prioridad === 'alta';

              return (
                <div key={v.id} className={`bg-card border rounded-2xl p-4 shadow-sm hover:shadow-md transition-all space-y-3 ${urgente ? 'border-orange-300 dark:border-orange-700' : ''}`}>
                  {/* Top row */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <span className="font-extrabold text-foreground text-base leading-tight block truncate">{v.cliente_nombre || '—'}</span>
                      <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                        {isAsistencia
                          ? <Wrench className="h-3 w-3 text-blue-500 shrink-0" />
                          : <ClipboardList className="h-3 w-3 text-green-500 shrink-0" />}
                        <span className={`text-xs font-bold ${isAsistencia ? 'text-blue-600' : 'text-green-600'}`}>{v.tipo_visita}</span>
                        {isAsistencia && v.estado_garantia && (
                          <span className={`text-[10px] font-bold ${garantiaColor}`}>• {v.estado_garantia}</span>
                        )}
                      </div>
                    </div>
                    <Badge className={`text-[10px] font-bold border capitalize shrink-0 ${stateClass}`}>
                      {ESTADO_LABELS[v.estado] || v.estado || '—'}
                    </Badge>
                  </div>

                  {/* Info */}
                  <div className="space-y-1.5 text-xs text-muted-foreground">
                    {(v.motivo || v.necesidad_cliente) && (
                      <p className="font-semibold text-foreground line-clamp-2">{v.motivo || v.necesidad_cliente}</p>
                    )}
                    {v.lugar && (
                      <div className="flex items-start gap-1.5">
                        <MapPin className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                        <span className="truncate">{v.lugar}</span>
                      </div>
                    )}
                    {v.tecnico_nombre && (
                      <div className="flex items-center gap-1.5">
                        <User className="h-3.5 w-3.5 shrink-0" />
                        <span>{v.tecnico_nombre}</span>
                        {v.fecha && <span className="text-muted-foreground/60">• {fmtDate(v.fecha)}{v.hora ? ` ${fmtTime(v.hora)}` : ''}</span>}
                      </div>
                    )}

                    {/* Cobro / garantía badges */}
                    {isAsistencia && (
                      <div className="flex items-center gap-2 flex-wrap pt-0.5">
                        {v.se_cobra && v.monto_cobrado > 0 && (
                          <span className="text-[10px] font-bold bg-green-100 text-green-700 border border-green-200 rounded px-1.5 py-0.5">
                            Bs {Number(v.monto_cobrado).toFixed(2)} cobrado
                          </span>
                        )}
                        {v.se_cobra && !v.monto_cobrado && (
                          <span className="text-[10px] font-bold bg-orange-100 text-orange-700 border border-orange-200 rounded px-1.5 py-0.5">Se cobra</span>
                        )}
                        {!v.se_cobra && (
                          <span className="text-[10px] font-bold text-muted-foreground">Sin costo</span>
                        )}
                        {v.cobro_pendiente_rendicion && (
                          <span className="text-[10px] font-bold bg-yellow-100 text-yellow-700 border border-yellow-200 rounded px-1.5 py-0.5">Pendiente rendición</span>
                        )}
                        {v.requiere_material && <span className="text-[10px] font-bold text-orange-500">⚠ Mat.</span>}
                        {v.requiere_volver && <span className="text-[10px] font-bold text-red-500">↩ Volver</span>}
                      </div>
                    )}
                    {urgente && (
                      <div className={`flex items-center gap-1.5 font-bold ${PRIORIDAD_COLORS[v.prioridad]}`}>
                        <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                        <span className="capitalize">Prioridad {v.prioridad}</span>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-1">
                    <Button variant="outline" size="sm" className="flex-1 text-xs font-bold"
                      onClick={() => openMaps(v.google_maps_link, v.lugar)}>
                      <MapPin className="h-3.5 w-3.5 mr-1" /> Abrir dirección
                    </Button>
                    <Button variant="ghost" size="sm" className="text-xs font-bold text-primary"
                      onClick={() => setDetailVisita(v)}>
                      <Eye className="h-3.5 w-3.5 mr-1" /> Detalle
                    </Button>
                    {canDelete && (
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10 shrink-0"
                        onClick={() => setDeleteTarget(v)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Form Modal */}
      {isModalOpen && (
        <VisitaFormModal
          isOpen={isModalOpen}
          onClose={() => { setIsModalOpen(false); setEditingVisita(null); }}
          onSave={onSaved}
          initialData={editingVisita || {}}
        />
      )}

      {/* Detail Modal */}
      {detailVisita && (
        <DetailModal
          visita={detailVisita}
          onClose={() => setDetailVisita(null)}
          onEdit={(v) => { setDetailVisita(null); openEdit(v); }}
          onStatusChange={onStatusChange}
          canEdit={canEdit}
          canDelete={canDelete}
          onDelete={(v) => { setDetailVisita(null); setDeleteTarget(v); }}
        />
      )}

      {/* Delete confirmation */}
      {deleteTarget && (
        <Dialog open onOpenChange={() => setDeleteTarget(null)}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle className="font-extrabold flex items-center gap-2 text-destructive">
                <Trash2 className="h-5 w-5" /> Eliminar visita
              </DialogTitle>
            </DialogHeader>
            <p className="text-sm text-muted-foreground">
              ¿Seguro que deseas eliminar la visita de <strong>{deleteTarget.cliente_nombre || 'este cliente'}</strong>? Esta acción no se puede deshacer.
            </p>
            <div className="flex gap-3 pt-2">
              <Button variant="outline" className="flex-1 font-bold" onClick={() => setDeleteTarget(null)}>Cancelar</Button>
              <Button variant="destructive" className="flex-1 font-bold" disabled={deleting} onClick={handleDeleteConfirm}>
                {deleting ? 'Eliminando...' : 'Sí, eliminar'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </Layout>
  );
};

export default ScheduleSurveysPage;
