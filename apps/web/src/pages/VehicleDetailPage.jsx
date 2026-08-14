import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import pb from '@/lib/pocketbaseClient.js';
import Layout from '@/components/Layout.jsx';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, Droplet, Wrench, AlertTriangle, Activity, MapPin, Gauge, FileText, Plus, CheckCircle2, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

import { useVehicleControl } from '@/hooks/useVehicleControl.js';
import { useAuth } from '@/contexts/AuthContext.jsx';
import FuelRegistrationModal from '@/components/FuelRegistrationModal.jsx';
import OilChangeRegistrationModal from '@/components/OilChangeRegistrationModal.jsx';
import MaintenanceRegistrationModal from '@/components/MaintenanceRegistrationModal.jsx';
import ObservationRegistrationModal from '@/components/ObservationRegistrationModal.jsx';
import ProblemRegistrationModal from '@/components/ProblemRegistrationModal.jsx';
import PhotoGallery from '@/components/PhotoGallery.jsx';

const VehicleDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { 
    getVehicleDetail, 
    getRelatedData, 
    isTech,
    registerFuel,
    registerOilChange,
    registerMaintenance,
    registerObservation,
    registerProblem,
    deleteVehicleRecord
  } = useVehicleControl();

  const { currentUser } = useAuth();
  const isAdmin = currentUser?.role === 'ADMINISTRADOR';

  const [vehicle, setVehicle] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const [fuelRecords, setFuelRecords] = useState([]);
  const [oilRecords, setOilRecords] = useState([]);
  const [maintRecords, setMaintRecords] = useState([]);
  const [observations, setObservations] = useState([]);
  const [problems, setProblems] = useState([]);
  const [history, setHistory] = useState([]);
  const [usersMap, setUsersMap] = useState({});

  // Modals
  const [modals, setModals] = useState({
    fuel: false, oil: false, maint: false, obs: false, prob: false
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const vRes = await getVehicleDetail(id);
      if (vRes.success) setVehicle(vRes.data);
      else { navigate('/vehicle-control'); return; }

      const [fRes, oRes, mRes, obsRes, pRes, hRes, uRes] = await Promise.all([
        getRelatedData(id, 'registros_combustible'),
        getRelatedData(id, 'registros_aceite'),
        getRelatedData(id, 'registros_mantenimiento'),
        getRelatedData(id, 'registros_observaciones', '-fecha'),
        getRelatedData(id, 'registros_problemas', '-fecha_reporte'),
        getRelatedData(id, 'historial_actividad_vehiculos', '-created'),
        pb.collection('users').getFullList({ $autoCancel: false }).catch(()=>[])
      ]);

      if (fRes.success) setFuelRecords(fRes.data);
      if (oRes.success) setOilRecords(oRes.data);
      if (mRes.success) setMaintRecords(mRes.data);
      if (obsRes.success) setObservations(obsRes.data);
      if (pRes.success) setProblems(pRes.data);
      if (hRes.success) setHistory(hRes.data);

      const uMap = uRes.reduce((acc, u) => ({ ...acc, [u.id]: u.name }), {});
      setUsersMap(uMap);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const toggleModal = (modalName, state) => setModals(prev => ({...prev, [modalName]: state}));

  const getStatusBadge = (status) => {
    switch (status) {
      case 'activo': return <Badge className="badge-vehicle-disponible px-3 py-1">Disponible</Badge>;
      case 'en_uso': return <Badge className="badge-vehicle-uso px-3 py-1">En Uso</Badge>;
      case 'en_mantenimiento': return <Badge className="badge-vehicle-mantenimiento px-3 py-1">Taller</Badge>;
      default: return <Badge className="badge-vehicle-inactivo px-3 py-1">Fuera Servicio</Badge>;
    }
  };

  const getSeverityBadge = (sev) => {
    if (sev === 'Baja') return <span className="bg-blue-100 text-blue-800 text-[10px] px-2 py-0.5 rounded font-bold uppercase">Baja</span>;
    if (sev === 'Media') return <span className="bg-orange-100 text-orange-800 text-[10px] px-2 py-0.5 rounded font-bold uppercase">Media</span>;
    if (sev === 'Alta') return <span className="bg-red-100 text-red-800 text-[10px] px-2 py-0.5 rounded font-bold uppercase">Alta</span>;
    return <span className="bg-red-600 text-white text-[10px] px-2 py-0.5 rounded font-bold uppercase">Crítica</span>;
  };

  if (loading || !vehicle) {
    return <Layout><div className="content-container py-8"><Skeleton className="h-[200px] w-full mb-8 rounded-2xl" /><Skeleton className="h-[500px] w-full rounded-2xl" /></div></Layout>;
  }

  return (
    <Layout>
      <Helmet><title>{vehicle.patente} - Detalles</title></Helmet>
      
      <div className="content-container space-y-6 py-8 w-full pb-24 max-w-7xl mx-auto">
        <Button variant="ghost" onClick={() => navigate('/vehicle-control')} className="pl-0 text-muted-foreground hover:text-foreground mb-2">
          <ArrowLeft className="h-4 w-4 mr-2" /> Volver a Flota
        </Button>

        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b pb-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-4xl font-extrabold tracking-tight uppercase text-foreground">{vehicle.patente}</h1>
              {getStatusBadge(vehicle.estado)}
            </div>
            <p className="text-muted-foreground font-medium text-lg">
              {vehicle.marca} {vehicle.modelo} {vehicle.anio ? `• ${vehicle.anio}` : ''}
            </p>
          </div>
          <div className="flex gap-4">
            <div className="text-right">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Odómetro</p>
              <p className="text-2xl font-black font-mono">{vehicle.kilometraje_actual?.toLocaleString() || 0} <span className="text-sm text-muted-foreground font-medium">km</span></p>
            </div>
          </div>
        </div>

        <Tabs defaultValue="combustible" className="w-full">
          <TabsList className="w-full h-auto p-1 bg-muted/50 rounded-xl flex overflow-x-auto justify-start custom-scrollbar border mb-6">
            <TabsTrigger value="combustible" className="rounded-lg py-2.5 gap-2 px-4 whitespace-nowrap"><Droplet className="h-4 w-4"/> Combustible</TabsTrigger>
            <TabsTrigger value="aceite" className="rounded-lg py-2.5 gap-2 px-4 whitespace-nowrap"><Droplet className="h-4 w-4 text-yellow-600 dark:text-yellow-500"/> Aceite</TabsTrigger>
            <TabsTrigger value="mantenimiento" className="rounded-lg py-2.5 gap-2 px-4 whitespace-nowrap"><Wrench className="h-4 w-4"/> Taller</TabsTrigger>
            <TabsTrigger value="observaciones" className="rounded-lg py-2.5 gap-2 px-4 whitespace-nowrap"><FileText className="h-4 w-4"/> Novedades</TabsTrigger>
            <TabsTrigger value="problemas" className="rounded-lg py-2.5 gap-2 px-4 whitespace-nowrap"><AlertTriangle className="h-4 w-4 text-destructive"/> Problemas</TabsTrigger>
            <TabsTrigger value="historial" className="rounded-lg py-2.5 gap-2 px-4 whitespace-nowrap"><Activity className="h-4 w-4"/> Historial</TabsTrigger>
          </TabsList>

          <TabsContent value="combustible" className="space-y-6">
            <div className="flex justify-between items-center bg-card p-4 rounded-xl border shadow-sm">
              <div>
                <h3 className="text-lg font-bold text-foreground">Registro de Cargas</h3>
                <p className="text-sm text-muted-foreground">Historial de consumo de combustible</p>
              </div>
              <Button onClick={() => toggleModal('fuel', true)} className="bg-blue-600 hover:bg-blue-700 font-bold gap-2 text-white">
                <Plus className="h-4 w-4" /> Nueva Carga
              </Button>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-6">
               <div className="bg-blue-50/50 dark:bg-blue-950/20 p-5 rounded-2xl border border-blue-100 dark:border-blue-900/30">
                 <p className="text-xs font-bold text-blue-600/80 uppercase tracking-wider mb-2">Total Litros</p>
                 <p className="text-3xl font-black text-blue-700 dark:text-blue-400">{fuelRecords.reduce((a,c)=>a+c.litros,0).toFixed(1)} <span className="text-lg">L</span></p>
               </div>
               {!isTech && (
                 <div className="bg-emerald-50/50 dark:bg-emerald-950/20 p-5 rounded-2xl border border-emerald-100 dark:border-emerald-900/30">
                   <p className="text-xs font-bold text-emerald-600/80 uppercase tracking-wider mb-2">Gasto Total</p>
                   <p className="text-3xl font-black text-emerald-700 dark:text-emerald-400">$ {fuelRecords.reduce((a,c)=>a+c.costo,0).toLocaleString()}</p>
                 </div>
               )}
            </div>

            <Card className="border shadow-sm overflow-hidden rounded-xl bg-card">
              <div className="overflow-x-auto w-full">
                <table className="w-full text-sm text-left">
                  <thead className="bg-muted/50 text-muted-foreground font-bold uppercase tracking-wider text-[10px] border-b">
                    <tr>
                      <th className="px-5 py-3">Fecha</th>
                      <th className="px-5 py-3">Registrado por</th>
                      <th className="px-5 py-3 text-right">Odómetro</th>
                      <th className="px-5 py-3 text-right">Litros</th>
                      {!isTech && <th className="px-5 py-3 text-right">Costo Total</th>}
                      <th className="px-5 py-3 text-center">Evidencia</th>
                      {isAdmin && <th className="px-3 py-3"></th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {fuelRecords.map(f => (
                      <tr key={f.id} className="hover:bg-muted/20">
                        <td className="px-5 py-4 font-bold">{format(new Date(f.fecha), 'dd MMM yyyy', {locale: es})}</td>
                        <td className="px-5 py-4 text-muted-foreground">{f.created_by || usersMap[f.usuario_id]}</td>
                        <td className="px-5 py-4 text-right font-mono">{f.kilometraje?.toLocaleString()}</td>
                        <td className="px-5 py-4 text-right font-bold text-blue-600">{f.litros} L</td>
                        {!isTech && <td className="px-5 py-4 text-right font-bold text-emerald-600">${f.costo}</td>}
                        <td className="px-5 py-4 text-center">
                          {f.fotografias?.length > 0 ? <PhotoGallery photos={f.fotografias} record={f} compact /> : '-'}
                        </td>
                        {isAdmin && (
                          <td className="px-3 py-4 text-center">
                            <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive hover:bg-destructive/10" onClick={() => { if(confirm('¿Eliminar esta carga? También se eliminará el gasto operativo vinculado.')) deleteVehicleRecord('registros_combustible', f.id).then(loadData); }}><Trash2 className="h-4 w-4"/></Button>
                          </td>
                        )}
                      </tr>
                    ))}
                    {fuelRecords.length === 0 && <tr><td colSpan={isTech ? 5 : 6} className="text-center py-12 text-muted-foreground font-medium">Sin registros</td></tr>}
                  </tbody>
                </table>
              </div>
            </Card>
          </TabsContent>

          {/* ... ACEITE TABS ... */}
          <TabsContent value="aceite" className="space-y-6">
            <div className="flex justify-between items-center bg-card p-4 rounded-xl border shadow-sm">
              <div>
                <h3 className="text-lg font-bold text-foreground">Cambios de Aceite</h3>
              </div>
              <Button onClick={() => toggleModal('oil', true)} className="bg-yellow-600 hover:bg-yellow-700 font-bold gap-2 text-white">
                <Plus className="h-4 w-4" /> Registrar Cambio
              </Button>
            </div>
            
            {oilRecords.length > 0 && oilRecords[0].proximo_cambio_km && vehicle.kilometraje_actual >= oilRecords[0].proximo_cambio_km - 500 && (
               <div className="bg-orange-50 border border-orange-200 text-orange-800 p-4 rounded-xl flex items-center gap-3 font-bold shadow-sm">
                 <AlertTriangle className="h-5 w-5 text-orange-500" />
                 <span>¡Atención! Cambio de aceite sugerido. Próximo a los {oilRecords[0].proximo_cambio_km.toLocaleString()} km (Actual: {vehicle.kilometraje_actual.toLocaleString()})</span>
               </div>
            )}

            <Card className="border shadow-sm overflow-hidden rounded-xl bg-card">
              <div className="overflow-x-auto w-full">
                <table className="w-full text-sm text-left">
                  <thead className="bg-muted/50 text-muted-foreground font-bold uppercase tracking-wider text-[10px] border-b">
                    <tr>
                      <th className="px-5 py-3">Fecha</th>
                      <th className="px-5 py-3 text-right">Odómetro</th>
                      <th className="px-5 py-3">Tipo/Marca</th>
                      <th className="px-5 py-3 text-right">Litros</th>
                      {!isTech && <th className="px-5 py-3 text-right">Costo</th>}
                      <th className="px-5 py-3 text-right text-muted-foreground">Próx. Cambio Km</th>
                      {isAdmin && <th className="px-3 py-3"></th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {oilRecords.map(o => (
                      <tr key={o.id} className="hover:bg-muted/20">
                        <td className="px-5 py-4 font-bold">{format(new Date(o.fecha), 'dd MMM yyyy')}</td>
                        <td className="px-5 py-4 text-right font-mono">{o.kilometraje?.toLocaleString()}</td>
                        <td className="px-5 py-4 font-medium text-foreground">{o.tipo_aceite}</td>
                        <td className="px-5 py-4 text-right">{o.cantidad_litros} L</td>
                        {!isTech && <td className="px-5 py-4 text-right font-bold">${o.costo}</td>}
                        <td className="px-5 py-4 text-right font-mono text-muted-foreground">{o.proximo_cambio_km?.toLocaleString() || '-'}</td>
                        {isAdmin && (
                          <td className="px-3 py-4 text-center">
                            <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive hover:bg-destructive/10" onClick={() => { if(confirm('¿Eliminar este cambio de aceite? También se eliminará el gasto operativo vinculado.')) deleteVehicleRecord('registros_aceite', o.id).then(loadData); }}><Trash2 className="h-4 w-4"/></Button>
                          </td>
                        )}
                      </tr>
                    ))}
                    {oilRecords.length === 0 && <tr><td colSpan={isTech ? 5 : 6} className="text-center py-12 text-muted-foreground font-medium">Sin registros</td></tr>}
                  </tbody>
                </table>
              </div>
            </Card>
          </TabsContent>

          {/* ... MANTENIMIENTO TABS ... */}
          <TabsContent value="mantenimiento" className="space-y-6">
            <div className="flex justify-between items-center bg-card p-4 rounded-xl border shadow-sm">
              <h3 className="text-lg font-bold text-foreground">Registro de Taller</h3>
              <Button onClick={() => toggleModal('maint', true)} className="font-bold gap-2">
                <Plus className="h-4 w-4" /> Nuevo Servicio
              </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {maintRecords.map(m => (
                <Card key={m.id} className="p-5 border shadow-sm bg-card flex flex-col h-full">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 bg-muted rounded-xl text-foreground"><Wrench className="h-5 w-5"/></div>
                      <div>
                        <h4 className="font-bold text-foreground uppercase tracking-wide">{m.tipo_mantenimiento}</h4>
                        <p className="text-xs font-bold text-muted-foreground">{format(new Date(m.fecha), 'dd MMM yyyy')}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {!isTech && <span className="font-black text-xl text-emerald-600">${m.costo}</span>}
                      {isAdmin && <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive hover:bg-destructive/10" onClick={() => { if(confirm('¿Eliminar este registro de taller? También se eliminará el gasto operativo vinculado.')) deleteVehicleRecord('registros_mantenimiento', m.id).then(loadData); }}><Trash2 className="h-4 w-4"/></Button>}
                    </div>
                  </div>
                  <div className="bg-muted/30 p-3 rounded-lg border text-sm text-foreground/90 whitespace-pre-wrap mb-4 flex-1">
                    {m.descripcion}
                  </div>
                  <div className="mt-auto">
                    {(m.proximo_mantenimiento_km || m.proximo_mantenimiento_fecha) && (
                      <div className="flex gap-4 pt-3 border-t text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                        <span className="flex items-center gap-1 text-orange-600"><AlertTriangle className="h-3 w-3"/> Próximo Servicio:</span>
                        {m.proximo_mantenimiento_km && <span>A los {m.proximo_mantenimiento_km.toLocaleString()} km</span>}
                        {m.proximo_mantenimiento_fecha && <span>El {format(new Date(m.proximo_mantenimiento_fecha), 'dd MMM yyyy')}</span>}
                      </div>
                    )}
                    {m.fotografias?.length > 0 && <div className="mt-3"><PhotoGallery photos={m.fotografias} record={m} /></div>}
                  </div>
                </Card>
              ))}
              {maintRecords.length === 0 && <div className="col-span-full text-center py-16 border-2 border-dashed rounded-2xl text-muted-foreground font-medium">No hay registros de taller.</div>}
            </div>
          </TabsContent>

          {/* ... PROBLEMAS ... */}
          <TabsContent value="problemas" className="space-y-6">
            <div className="flex justify-between items-center bg-destructive/5 border-destructive/20 border p-4 rounded-xl">
              <div>
                <h3 className="text-lg font-bold text-destructive">Problemas y Fallas</h3>
              </div>
              <Button onClick={() => toggleModal('prob', true)} variant="destructive" className="font-bold gap-2">
                <AlertTriangle className="h-4 w-4" /> Reportar Falla
              </Button>
            </div>

            <div className="space-y-4">
              {problems.map(p => (
                <Card key={p.id} className={`p-5 border shadow-sm ${p.estado_problema !== 'Resuelto' && p.estado_problema !== 'Cancelado' ? 'border-red-200 dark:border-red-900 bg-red-50/20 dark:bg-red-950/10' : 'bg-card'}`}>
                  <div className="flex flex-col sm:flex-row gap-4 justify-between items-start">
                    <div className="space-y-3 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        {getSeverityBadge(p.severidad)}
                        <Badge variant="outline" className="text-[10px] uppercase font-bold tracking-wider">{p.estado_problema}</Badge>
                        <span className="text-xs text-muted-foreground font-medium ml-2">{format(new Date(p.fecha_reporte), 'dd MMM yyyy')}</span>
                      </div>
                      <p className="text-sm font-medium leading-relaxed">{p.descripcion_problema}</p>
                      {p.observaciones && <p className="text-xs text-muted-foreground italic border-l-2 pl-2">Nota: {p.observaciones}</p>}
                      {p.fotografias?.length > 0 && <div className="pt-2"><PhotoGallery photos={p.fotografias} record={p} /></div>}
                    </div>
                    {!isTech && p.costo_reparacion && (
                      <div className="shrink-0 text-right">
                        <p className="text-[10px] font-bold text-muted-foreground uppercase">Costo Estimado</p>
                        <p className="font-black text-red-600">${p.costo_reparacion}</p>
                      </div>
                    )}
                  </div>
                </Card>
              ))}
              {problems.length === 0 && <div className="text-center py-16 border-2 border-dashed rounded-2xl text-muted-foreground font-medium">No hay problemas reportados. ¡Excelente!</div>}
            </div>
          </TabsContent>

          {/* ... HISTORIAL ... */}
          <TabsContent value="historial" className="space-y-6">
            <Card className="border shadow-sm p-6 bg-card">
              <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-border before:to-transparent">
                {history.map((h) => (
                  <div key={h.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group">
                    <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-card bg-muted text-muted-foreground shadow-sm shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
                      <Activity className="h-4 w-4"/>
                    </div>
                    <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-xl border bg-background shadow-sm">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-bold text-sm">{h.created_by || usersMap[h.usuario_id]}</span>
                        <span className="text-[10px] font-bold text-muted-foreground">{format(new Date(h.created), 'dd MMM HH:mm')}</span>
                      </div>
                      <Badge variant="secondary" className="mb-2 text-[10px] uppercase">{h.accion.replace(/_/g, ' ')}</Badge>
                      <p className="text-sm font-medium text-foreground">{h.descripcion}</p>
                      {h.campo_modificado && (
                        <div className="mt-3 text-xs bg-muted/30 p-2 rounded-lg border">
                          <span className="font-bold text-muted-foreground uppercase tracking-wider block mb-1">{h.campo_modificado.replace('_', ' ')}</span>
                          <div className="flex items-center gap-2">
                            <span className="line-through opacity-60 truncate max-w-[120px]">{h.valor_anterior || 'Vacío'}</span>
                            <span className="text-muted-foreground">→</span>
                            <span className="font-bold text-primary truncate max-w-[120px]">{h.valor_nuevo || 'Vacío'}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                {history.length === 0 && <p className="text-center py-8 text-muted-foreground">Sin historial registrado.</p>}
              </div>
            </Card>
          </TabsContent>
          
          <TabsContent value="observaciones" className="space-y-6">
             <div className="flex justify-between items-center bg-card p-4 rounded-xl border shadow-sm">
              <h3 className="text-lg font-bold text-foreground">Novedades</h3>
              <Button onClick={() => toggleModal('obs', true)} className="bg-primary font-bold gap-2">
                <Plus className="h-4 w-4" /> Registrar Novedad
              </Button>
            </div>
             <div className="space-y-4">
              {observations.map(o => (
                <Card key={o.id} className={`p-4 border shadow-sm ${o.estado_observacion === 'Abierta' ? 'bg-orange-50/20 dark:bg-orange-950/10' : 'bg-card'}`}>
                  <div className="flex items-center gap-2 mb-2">
                    {getSeverityBadge(o.severidad)}
                    <span className="text-xs text-muted-foreground ml-auto">{format(new Date(o.fecha), 'dd MMM yyyy')}</span>
                  </div>
                  <p className="text-sm font-medium">{o.descripcion}</p>
                </Card>
              ))}
              {observations.length === 0 && <p className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-xl">Sin novedades.</p>}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <FuelRegistrationModal isOpen={modals.fuel} onClose={() => toggleModal('fuel', false)} onSave={(data) => { return registerFuel(id, data).then(loadData); }} initialKm={vehicle.kilometraje_actual} />
      <OilChangeRegistrationModal isOpen={modals.oil} onClose={() => toggleModal('oil', false)} onSave={(data) => { return registerOilChange(id, data).then(loadData); }} initialKm={vehicle.kilometraje_actual} />
      <MaintenanceRegistrationModal isOpen={modals.maint} onClose={() => toggleModal('maint', false)} onSave={(data) => { return registerMaintenance(id, data).then(loadData); }} />
      <ObservationRegistrationModal isOpen={modals.obs} onClose={() => toggleModal('obs', false)} onSave={(data) => { return registerObservation(id, data).then(loadData); }} />
      <ProblemRegistrationModal isOpen={modals.prob} onClose={() => toggleModal('prob', false)} onSave={(data) => { return registerProblem(id, data).then(loadData); }} />
    </Layout>
  );
};

export default VehicleDetailPage;