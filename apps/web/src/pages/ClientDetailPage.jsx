import React, { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout.jsx';
import { Card, CardContent } from '@/components/ui/card.jsx';
import { Button } from '@/components/ui/button.jsx';
import { Badge } from '@/components/ui/badge.jsx';
import { Skeleton } from '@/components/ui/skeleton.jsx';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs.jsx';
import { ArrowLeft, Building2, MapPin, Mail, Phone, Edit2, Trash2, Calendar, FileText, DollarSign, Briefcase, Plus, Shield, Wrench, ClipboardList, AlertTriangle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext.jsx';
import { useClients } from '@/hooks/useClients.js';
import ClientFormModal from '@/components/ClientFormModal.jsx';
import ScheduleFormModal from '@/components/ScheduleFormModal.jsx';
import DeleteConfirmationModal from '@/components/DeleteConfirmationModal.jsx';
import pb from '@/lib/pocketbaseClient.js';
import { cn } from '@/lib/utils.js';

const fmtDate = (d) => {
  if (!d) return '—';
  try {
    const clean = String(d).split(' ')[0].split('T')[0];
    const [y, m, day] = clean.split('-');
    return `${day}/${m}/${y}`;
  } catch { return String(d); }
};

const calcGarantiaHasta = (fechaProgramada) => {
  if (!fechaProgramada) return null;
  try {
    const d = new Date(String(fechaProgramada).split(' ')[0].split('T')[0]);
    d.setFullYear(d.getFullYear() + 1);
    return d;
  } catch { return null; }
};

const garantiaEstado = (fechaProgramada) => {
  const hasta = calcGarantiaHasta(fechaProgramada);
  if (!hasta) return { label: '—', cls: 'text-muted-foreground' };
  const hoy = new Date();
  if (hoy <= hasta) return { label: 'Vigente', cls: 'text-emerald-600 font-bold' };
  return { label: 'Vencida', cls: 'text-destructive font-bold' };
};

const ClientDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAdmin, isVentas, isContadora } = useAuth();
  const { getClientById, deleteClient } = useClients();

  const [clientData, setClientData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [equipos, setEquipos] = useState([]);
  const [visitas, setVisitas] = useState([]);
  const [payments, setPayments] = useState([]);
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState(null);

  const canEdit = isAdmin() || isVentas() || isContadora();

  const loadData = useCallback(async () => {
    setLoading(true);
    const data = await getClientById(id);
    if (!data) { navigate('/clientes'); return; }
    setClientData(data);

    // Load related data in parallel
    const [eq, vis, pay] = await Promise.all([
      pb.collection('equipos_instalados').getFullList({
        filter: pb.filter('cliente_nombre = {:n} || trabajo_id != ""', { n: data.nombre || '' }),
        sort: '-fecha',
        requestKey: 'cd-equipos',
      }).catch(() => []),
      pb.collection('visitas_tecnicas').getFullList({
        filter: pb.filter('cliente_id = {:id}', { id }),
        sort: '-fecha',
        requestKey: 'cd-visitas',
      }).catch(() => []),
      pb.collection('schedule_payments').getFullList({
        sort: '-created',
        requestKey: 'cd-payments',
      }).catch(() => []),
    ]);

    // Filter equipos by schedules of this client
    const scheduleIds = new Set((data.schedules || []).map(s => s.id));
    setEquipos(eq.filter(e => scheduleIds.has(e.trabajo_id) || e.cliente_nombre === data.nombre));
    setVisitas(vis);
    // filter payments by client's schedule ids
    setPayments(pay.filter(p => scheduleIds.has(p.trabajo_id)));
    setLoading(false);
  }, [id, navigate, getClientById]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleDeleteConfirm = async () => {
    const success = await deleteClient(id);
    if (success) navigate('/clientes');
  };

  const handleCreateWork = () => { setSelectedSchedule({ cliente_id: id }); setIsScheduleModalOpen(true); };
  const handleEditWork = (schedule) => { setSelectedSchedule(schedule); setIsScheduleModalOpen(true); };

  if (loading) {
    return (
      <Layout>
        <div className="content-container py-8 space-y-6">
          <Skeleton className="h-10 w-48" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Skeleton className="h-64 md:col-span-1 rounded-2xl" />
            <Skeleton className="h-64 md:col-span-2 rounded-2xl" />
          </div>
        </div>
      </Layout>
    );
  }

  if (!clientData) return null;

  const schedules = clientData.schedules || [];
  const totalTrabajos = schedules.length;
  const totalIngresos = schedules.reduce((acc, s) => acc + (s.monto || 0), 0);
  const totalAdelantos = schedules.reduce((acc, s) => acc + (s.adelanto || 0), 0);
  const totalSaldo = schedules.reduce((acc, s) => acc + (s.saldo_pendiente ?? ((s.monto||0) - (s.adelanto||0))), 0);

  // Garantías desde trabajos completados
  const garantias = schedules.filter(s => s.fecha_programada);

  // Deudas pendientes
  const deudas = schedules.filter(s => {
    const saldo = s.saldo_pendiente ?? ((s.monto||0)-(s.adelanto||0));
    return saldo > 0;
  });

  return (
    <Layout>
      <Helmet><title>{clientData.nombre} - H&S</title>
        <meta name="description" content={`Historial completo del cliente ${clientData.nombre}`} />
      </Helmet>
      
      <div className="content-container py-6 pb-24 space-y-6 max-w-7xl">
        <Button variant="ghost" onClick={() => navigate('/clientes')} className="pl-0 text-muted-foreground hover:text-foreground font-bold">
          <ArrowLeft className="h-4 w-4 mr-2" /> Volver a Clientes
        </Button>

        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-3 mb-2">
              <h1 className="text-3xl font-extrabold tracking-tight text-foreground">{clientData.nombre}</h1>
              <Badge className="uppercase text-[10px] font-bold shadow-none tracking-wider bg-primary/10 text-primary">
                {clientData.tipo}
              </Badge>
            </div>
            {clientData.contacto && <p className="text-muted-foreground font-medium text-lg">Contacto: {clientData.contacto}</p>}
          </div>
          {canEdit && (
            <div className="flex gap-2 shrink-0">
              <Button variant="outline" onClick={() => setIsFormOpen(true)} className="font-bold">
                <Edit2 className="h-4 w-4 mr-2" /> Editar Cliente
              </Button>
              {isAdmin() && (
                <Button variant="outline" onClick={() => setIsDeleteOpen(true)} className="text-destructive hover:bg-destructive/10 font-bold">
                  <Trash2 className="h-4 w-4 mr-2" /> Eliminar
                </Button>
              )}
            </div>
          )}
        </div>

        {/* KPI cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Card className="rounded-2xl border bg-card shadow-sm p-5">
            <p className="text-xs font-bold text-muted-foreground mb-1 uppercase tracking-wider">Trabajos</p>
            <p className="text-2xl font-black tabular-nums">{totalTrabajos}</p>
          </Card>
          <Card className="rounded-2xl border bg-card shadow-sm p-5">
            <p className="text-xs font-bold text-muted-foreground mb-1 uppercase tracking-wider">Inversión Total</p>
            <p className="text-2xl font-black tabular-nums">Bs {totalIngresos.toFixed(0)}</p>
          </Card>
          <Card className="rounded-2xl border bg-card shadow-sm p-5">
            <p className="text-xs font-bold text-blue-600/80 mb-1 uppercase tracking-wider">Adelantos</p>
            <p className="text-2xl font-black text-blue-600 tabular-nums">Bs {totalAdelantos.toFixed(0)}</p>
          </Card>
          <Card className={cn("rounded-2xl border shadow-sm p-5", totalSaldo > 0 ? 'bg-destructive/5' : 'bg-emerald-50 dark:bg-emerald-950/20')}>
            <p className={cn("text-xs font-bold mb-1 uppercase tracking-wider", totalSaldo > 0 ? 'text-destructive/80' : 'text-emerald-700')}>Saldo Pendiente</p>
            <p className={cn("text-2xl font-black tabular-nums", totalSaldo > 0 ? 'text-destructive' : 'text-emerald-600')}>Bs {totalSaldo.toFixed(0)}</p>
          </Card>
        </div>

        {/* Main content: info + tabs */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Info sidebar */}
          <Card className="rounded-2xl border shadow-sm h-fit lg:col-span-1">
            <CardContent className="p-6 space-y-5">
              <h3 className="font-extrabold text-sm uppercase tracking-wider text-muted-foreground">Datos del cliente</h3>
              {clientData.telefono && (
                <div className="flex items-start gap-3">
                  <Phone className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Teléfono</p>
                    <p className="text-sm font-medium">{clientData.telefono}</p>
                  </div>
                </div>
              )}
              {clientData.email && (
                <div className="flex items-start gap-3">
                  <Mail className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Email</p>
                    <p className="text-sm font-medium">{clientData.email}</p>
                  </div>
                </div>
              )}
              {clientData.direccion && (
                <div className="flex items-start gap-3">
                  <MapPin className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Dirección</p>
                    <p className="text-sm font-medium">{clientData.direccion}</p>
                  </div>
                </div>
              )}
              {clientData.observaciones && (
                <div className="pt-4 border-t">
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Observaciones</p>
                  <p className="text-sm bg-muted/40 p-3 rounded-xl border">{clientData.observaciones}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Tabs */}
          <div className="lg:col-span-3">
            <Tabs defaultValue="trabajos">
              <TabsList className="grid w-full grid-cols-5 mb-4 h-auto">
                <TabsTrigger value="trabajos" className="text-xs font-bold py-2"><Briefcase className="h-3.5 w-3.5 mr-1" />Trabajos</TabsTrigger>
                <TabsTrigger value="equipos" className="text-xs font-bold py-2"><Building2 className="h-3.5 w-3.5 mr-1" />Equipos</TabsTrigger>
                <TabsTrigger value="garantias" className="text-xs font-bold py-2"><Shield className="h-3.5 w-3.5 mr-1" />Garantías</TabsTrigger>
                <TabsTrigger value="asistencias" className="text-xs font-bold py-2"><Wrench className="h-3.5 w-3.5 mr-1" />Asistencias</TabsTrigger>
                <TabsTrigger value="deudas" className="text-xs font-bold py-2"><AlertTriangle className="h-3.5 w-3.5 mr-1" />Deudas</TabsTrigger>
              </TabsList>

              {/* TAB: Trabajos */}
              <TabsContent value="trabajos">
                <Card className="rounded-2xl border shadow-sm overflow-hidden">
                  <div className="p-4 border-b flex justify-between items-center">
                    <h3 className="font-extrabold">Historial de Trabajos</h3>
                    {canEdit && (
                      <Button onClick={handleCreateWork} size="sm" className="font-bold">
                        <Plus className="h-4 w-4 mr-1" /> Registrar Trabajo
                      </Button>
                    )}
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left whitespace-nowrap">
                      <thead className="bg-muted/50 text-muted-foreground font-bold uppercase text-[10px] tracking-wider">
                        <tr>
                          <th className="px-4 py-3">Nº</th>
                          <th className="px-4 py-3">Lugar</th>
                          <th className="px-4 py-3 min-w-[240px]">Descripción de la labor</th>
                          <th className="px-4 py-3">Tipo</th>
                          <th className="px-4 py-3">Estado</th>
                          <th className="px-4 py-3">Fecha</th>
                          <th className="px-4 py-3">Vendedor</th>
                          <th className="px-4 py-3">Técnico</th>
                          <th className="px-4 py-3 text-right">Monto</th>
                          <th className="px-4 py-3 text-right">Saldo</th>
                          <th className="px-4 py-3">Garantía hasta</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y bg-card">
                        {schedules.length > 0 ? schedules.map(s => {
                          const saldo = s.saldo_pendiente ?? ((s.monto||0)-(s.adelanto||0));
                          const gh = calcGarantiaHasta(s.fecha_programada);
                          return (
                            <tr key={s.id} className={cn("hover:bg-muted/30 transition-colors", canEdit && "cursor-pointer")}
                              onClick={() => canEdit && handleEditWork(s)}>
                              <td className="px-4 py-3 font-mono text-xs text-muted-foreground">#{s.id.slice(-6)}</td>
                              <td className="px-4 py-3 font-bold max-w-[160px] truncate">{s.lugar || '—'}</td>
                              <td className="px-4 py-3 text-xs whitespace-normal max-w-[320px] align-top">
                                {s.descripcion_trabajo || s.descripcion || s.observacion || s.notes || 'Sin descripción registrada'}
                              </td>
                              <td className="px-4 py-3 text-xs font-bold text-primary">{s.tipo_trabajo || s.type || '—'}</td>
                              <td className="px-4 py-3"><Badge variant="outline" className="text-[9px] font-extrabold">{s.estado?.replace('_',' ') || '—'}</Badge></td>
                              <td className="px-4 py-3 text-xs">{fmtDate(s.fecha_programada)}</td>
                              <td className="px-4 py-3 text-xs">{s.vendedor_nombre || s.vendedor || '—'}</td>
                              <td className="px-4 py-3 text-xs">{s.tecnico_nombre || s.tecnico || '—'}</td>
                              <td className="px-4 py-3 text-right tabular-nums">Bs {(s.monto||0).toFixed(0)}</td>
                              <td className={cn("px-4 py-3 text-right font-black tabular-nums", saldo > 0 ? 'text-destructive' : 'text-emerald-600')}>
                                Bs {saldo.toFixed(0)}
                              </td>
                              <td className="px-4 py-3 text-xs">{gh ? fmtDate(gh.toISOString()) : '—'}</td>
                            </tr>
                          );
                        }) : (
                          <tr><td colSpan="11" className="px-4 py-12 text-center text-muted-foreground">
                            <Briefcase className="h-10 w-10 mx-auto mb-3 opacity-20" />
                            <p className="font-bold">No hay trabajos registrados.</p>
                          </td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </Card>
              </TabsContent>

              {/* TAB: Equipos */}
              <TabsContent value="equipos">
                <Card className="rounded-2xl border shadow-sm overflow-hidden">
                  <div className="p-4 border-b">
                    <h3 className="font-extrabold">Equipos Instalados</h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left whitespace-nowrap">
                      <thead className="bg-muted/50 text-muted-foreground font-bold uppercase text-[10px] tracking-wider">
                        <tr>
                          <th className="px-4 py-3">Equipo</th>
                          <th className="px-4 py-3">Marca/Modelo</th>
                          <th className="px-4 py-3">N° Serie</th>
                          <th className="px-4 py-3">Cantidad</th>
                          <th className="px-4 py-3">Fecha</th>
                          <th className="px-4 py-3">Trabajo</th>
                          <th className="px-4 py-3">Estado</th>
                          <th className="px-4 py-3">Garantía hasta</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y bg-card">
                        {equipos.length > 0 ? equipos.map(e => {
                          const gh = calcGarantiaHasta(e.fecha);
                          const g = garantiaEstado(e.fecha);
                          return (
                            <tr key={e.id} className="hover:bg-muted/30">
                              <td className="px-4 py-3 font-bold">{e.equipo_nombre || '—'}</td>
                              <td className="px-4 py-3 text-xs">{e.marca_modelo || '—'}</td>
                              <td className="px-4 py-3 font-mono text-xs">{e.numero_serie || '—'}</td>
                              <td className="px-4 py-3 text-xs">{e.cantidad || 1}</td>
                              <td className="px-4 py-3 text-xs">{fmtDate(e.fecha)}</td>
                              <td className="px-4 py-3 font-mono text-xs text-muted-foreground">#{(e.trabajo_id||'').slice(-6) || '—'}</td>
                              <td className="px-4 py-3"><Badge variant="outline" className="text-[9px] font-bold capitalize">{e.estado || '—'}</Badge></td>
                              <td className={cn("px-4 py-3 text-xs", g.cls)}>{gh ? fmtDate(gh.toISOString()) : '—'} <span className="ml-1 text-[10px]">({g.label})</span></td>
                            </tr>
                          );
                        }) : (
                          <tr><td colSpan="8" className="px-4 py-12 text-center text-muted-foreground">
                            <Building2 className="h-10 w-10 mx-auto mb-3 opacity-20" />
                            <p className="font-bold">No hay equipos instalados registrados.</p>
                          </td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </Card>
              </TabsContent>

              {/* TAB: Garantías */}
              <TabsContent value="garantias">
                <Card className="rounded-2xl border shadow-sm overflow-hidden">
                  <div className="p-4 border-b">
                    <h3 className="font-extrabold">Garantías de trabajos</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">Garantía estándar: 1 año desde la fecha de instalación.</p>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left whitespace-nowrap">
                      <thead className="bg-muted/50 text-muted-foreground font-bold uppercase text-[10px] tracking-wider">
                        <tr>
                          <th className="px-4 py-3">Trabajo</th>
                          <th className="px-4 py-3">Tipo</th>
                          <th className="px-4 py-3">Fecha instalación</th>
                          <th className="px-4 py-3">Garantía hasta</th>
                          <th className="px-4 py-3">Estado</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y bg-card">
                        {garantias.length > 0 ? garantias.map(s => {
                          const gh = calcGarantiaHasta(s.fecha_programada);
                          const g = garantiaEstado(s.fecha_programada);
                          return (
                            <tr key={s.id} className="hover:bg-muted/30">
                              <td className="px-4 py-3"><span className="font-mono text-xs text-muted-foreground">#{s.id.slice(-6)}</span> <span className="ml-1 text-sm font-bold truncate max-w-[120px] inline-block align-middle">{s.lugar || '—'}</span></td>
                              <td className="px-4 py-3 text-xs font-bold text-primary">{s.tipo_trabajo || s.type || '—'}</td>
                              <td className="px-4 py-3 text-xs">{fmtDate(s.fecha_programada)}</td>
                              <td className="px-4 py-3 text-xs font-bold">{gh ? fmtDate(gh.toISOString()) : '—'}</td>
                              <td className={cn("px-4 py-3 text-xs font-bold", g.cls)}>{g.label}</td>
                            </tr>
                          );
                        }) : (
                          <tr><td colSpan="5" className="px-4 py-12 text-center text-muted-foreground">
                            <Shield className="h-10 w-10 mx-auto mb-3 opacity-20" />
                            <p className="font-bold">No hay trabajos con garantía registrados.</p>
                          </td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </Card>
              </TabsContent>

              {/* TAB: Asistencias/Relevamientos */}
              <TabsContent value="asistencias">
                <Card className="rounded-2xl border shadow-sm overflow-hidden">
                  <div className="p-4 border-b">
                    <h3 className="font-extrabold">Asistencias y Relevamientos</h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left whitespace-nowrap">
                      <thead className="bg-muted/50 text-muted-foreground font-bold uppercase text-[10px] tracking-wider">
                        <tr>
                          <th className="px-4 py-3">Fecha</th>
                          <th className="px-4 py-3">Tipo</th>
                          <th className="px-4 py-3">Motivo / Necesidad</th>
                          <th className="px-4 py-3">Técnico</th>
                          <th className="px-4 py-3">Estado</th>
                          <th className="px-4 py-3">Garantía</th>
                          <th className="px-4 py-3">Cobro</th>
                          <th className="px-4 py-3">Monto</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y bg-card">
                        {visitas.length > 0 ? visitas.map(v => {
                          const esAsist = v.tipo_visita === 'Asistencia';
                          return (
                            <tr key={v.id} className="hover:bg-muted/30">
                              <td className="px-4 py-3 text-xs">{fmtDate(v.fecha)}</td>
                              <td className="px-4 py-3">
                                <Badge className={cn("text-[9px] font-bold border", esAsist ? 'bg-blue-100 text-blue-700 border-blue-200' : 'bg-green-100 text-green-700 border-green-200')}>
                                  {v.tipo_visita}
                                </Badge>
                              </td>
                              <td className="px-4 py-3 text-xs max-w-[180px] truncate">{v.motivo || v.necesidad_cliente || v.problema_reportado || '—'}</td>
                              <td className="px-4 py-3 text-xs">{v.tecnico_nombre || '—'}</td>
                              <td className="px-4 py-3"><Badge variant="outline" className="text-[9px] font-bold capitalize">{v.estado || '—'}</Badge></td>
                              <td className="px-4 py-3 text-xs">
                                {v.estado_garantia
                                  ? <span className={cn("font-bold", v.estado_garantia === 'En garantía' ? 'text-emerald-600' : v.estado_garantia === 'Fuera de garantía' ? 'text-destructive' : 'text-amber-600')}>{v.estado_garantia}</span>
                                  : '—'}
                              </td>
                              <td className="px-4 py-3 text-xs">{v.se_cobra ? <span className="text-primary font-bold">Sí</span> : <span className="text-muted-foreground">Sin cobro</span>}</td>
                              <td className="px-4 py-3 text-xs tabular-nums font-bold">{v.monto_cobrado > 0 ? `Bs ${v.monto_cobrado}` : '—'}</td>
                            </tr>
                          );
                        }) : (
                          <tr><td colSpan="8" className="px-4 py-12 text-center text-muted-foreground">
                            <Wrench className="h-10 w-10 mx-auto mb-3 opacity-20" />
                            <p className="font-bold">No hay asistencias ni relevamientos registrados.</p>
                          </td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </Card>
              </TabsContent>

              {/* TAB: Deudas */}
              <TabsContent value="deudas">
                <Card className="rounded-2xl border shadow-sm overflow-hidden">
                  <div className="p-4 border-b">
                    <h3 className="font-extrabold">Cuentas por Cobrar</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">Trabajos con saldo pendiente.</p>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left whitespace-nowrap">
                      <thead className="bg-muted/50 text-muted-foreground font-bold uppercase text-[10px] tracking-wider">
                        <tr>
                          <th className="px-4 py-3">Trabajo</th>
                          <th className="px-4 py-3">Lugar</th>
                          <th className="px-4 py-3">Fecha</th>
                          <th className="px-4 py-3 text-right">Total</th>
                          <th className="px-4 py-3 text-right">Adelanto</th>
                          <th className="px-4 py-3 text-right">Saldo</th>
                          <th className="px-4 py-3">Estado pago</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y bg-card">
                        {deudas.length > 0 ? deudas.map(s => {
                          const saldo = s.saldo_pendiente ?? ((s.monto||0)-(s.adelanto||0));
                          return (
                            <tr key={s.id} className="hover:bg-muted/30">
                              <td className="px-4 py-3 font-mono text-xs text-muted-foreground">#{s.id.slice(-6)}</td>
                              <td className="px-4 py-3 font-bold text-xs max-w-[160px] truncate">{s.lugar || '—'}</td>
                              <td className="px-4 py-3 text-xs">{fmtDate(s.fecha_programada)}</td>
                              <td className="px-4 py-3 text-right tabular-nums">Bs {(s.monto||0).toFixed(0)}</td>
                              <td className="px-4 py-3 text-right tabular-nums text-blue-600">Bs {(s.adelanto||0).toFixed(0)}</td>
                              <td className="px-4 py-3 text-right font-black tabular-nums text-destructive">Bs {saldo.toFixed(0)}</td>
                              <td className="px-4 py-3">
                                <Badge variant="outline" className="text-[9px] font-bold text-amber-600 border-amber-300 bg-amber-50">
                                  {s.estado_pago || 'Pendiente'}
                                </Badge>
                              </td>
                            </tr>
                          );
                        }) : (
                          <tr><td colSpan="7" className="px-4 py-12 text-center text-muted-foreground">
                            <AlertTriangle className="h-10 w-10 mx-auto mb-3 opacity-20" />
                            <p className="font-bold text-emerald-600">✓ Sin deudas pendientes</p>
                          </td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                  {deudas.length > 0 && (
                    <div className="p-4 border-t bg-destructive/5 flex justify-between items-center">
                      <span className="font-extrabold text-sm">Total pendiente de cobro:</span>
                      <span className="font-black text-destructive text-lg tabular-nums">
                        Bs {deudas.reduce((a,s) => a + (s.saldo_pendiente ?? ((s.monto||0)-(s.adelanto||0))), 0).toFixed(0)}
                      </span>
                    </div>
                  )}
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>

      {canEdit && (
        <>
          <ClientFormModal 
            isOpen={isFormOpen}
            onClose={() => setIsFormOpen(false)}
            onSave={() => { setIsFormOpen(false); loadData(); }}
            initialData={clientData}
          />
          <ScheduleFormModal
            isOpen={isScheduleModalOpen}
            onClose={() => { setIsScheduleModalOpen(false); setSelectedSchedule(null); }}
            onSave={() => { setIsScheduleModalOpen(false); setSelectedSchedule(null); loadData(); }}
            initialData={selectedSchedule}
          />
        </>
      )}
      {isAdmin() && (
        <DeleteConfirmationModal
          isOpen={isDeleteOpen}
          onClose={() => setIsDeleteOpen(false)}
          onConfirm={handleDeleteConfirm}
          title="Eliminar Cliente"
          description={`¿Eliminar a ${clientData.nombre}? Esta acción es irreversible.`}
        />
      )}
    </Layout>
  );
};

export default ClientDetailPage;
