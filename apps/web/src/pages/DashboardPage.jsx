import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext.jsx';
import Layout from '@/components/Layout.jsx';
import { Helmet } from 'react-helmet';
import pb from '@/lib/pocketbaseClient.js';
import {
  Target,
  Building2,
  Wrench,
  ArrowUpRight,
  ArrowUp,
  ArrowDown,
  Minus,
  Megaphone,
  Truck,
  Package,
  CalendarDays,
  Trophy,
  Activity,
  Star,
  ImageIcon
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card.jsx';
import { Button } from '@/components/ui/button.jsx';
import { Skeleton } from '@/components/ui/skeleton.jsx';
import { Badge } from '@/components/ui/badge.jsx';
import { format, startOfMonth, endOfMonth, subMonths, addDays, isSameDay } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'sonner';

const DashboardPage = () => {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    salespersonGoals: [],
    schedulesThisMonth: [],
    schedulesLastMonth: [],
    schedulesUpcoming: [],
    activeCampaigns: [],
    activeVehicles: [],
    pedidos: [],
    usersMap: {},
    actividad: [],
    sucursales: [],
    schedules: []
  });

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        const today = new Date();
        const startOfM = format(startOfMonth(today), 'yyyy-MM-dd');
        const endOfM = format(endOfMonth(today), 'yyyy-MM-dd');
        const prevMonthDate = subMonths(today, 1);
        const startOfPrevM = format(startOfMonth(prevMonthDate), 'yyyy-MM-dd');
        const endOfPrevM = format(endOfMonth(prevMonthDate), 'yyyy-MM-dd');
        const todayStr = format(today, 'yyyy-MM-dd');
        const nextWeekStr = format(addDays(today, 6), 'yyyy-MM-dd');

        const [
          goalsRes,
          schedThisMonthRes,
          schedLastMonthRes,
          schedUpcomingRes,
          campaignsRes,
          vehiclesRes,
          pedidosRes,
          usersRes,
          actividadRes,
          sucursalesRes
        ] = await Promise.all([
          pb.collection('salesperson_goals').getFullList({ $autoCancel: false }).catch(() => []),
          pb.collection('schedules').getFullList({
            filter: `fecha_programada >= "${startOfM}" && fecha_programada <= "${endOfM}"`,
            $autoCancel: false
          }).catch(() => []),
          pb.collection('schedules').getFullList({
            filter: `fecha_programada >= "${startOfPrevM}" && fecha_programada <= "${endOfPrevM}"`,
            $autoCancel: false
          }).catch(() => []),
          pb.collection('schedules').getFullList({
            filter: `fecha_programada >= "${todayStr}" && fecha_programada <= "${nextWeekStr}"`,
            sort: 'fecha_programada',
            $autoCancel: false
          }).catch(() => []),
          pb.collection('campaigns_new').getFullList({ filter: `status = "active"`, $autoCancel: false }).catch(() => []),
          pb.collection('vehiculos').getFullList({ filter: `estado = "activo"`, $autoCancel: false }).catch(() => []),
          pb.collection('pedidos_internos').getList(1, 5, { sort: '-created', $autoCancel: false }).catch(() => ({ items: [] })),
          pb.collection('users').getFullList({ $autoCancel: false }).catch(() => []),
          pb.collection('actividad_interna').getList(1, 6, { sort: '-fijado,-created', $autoCancel: false }).catch(() => ({ items: [] })),
          pb.collection('sucursales').getFullList({ filter: 'activa = true', sort: 'nombre', $autoCancel: false }).catch(() => [])
        ]);

        const usersMap = {};
        (usersRes || []).forEach(u => { usersMap[u.id] = u; });

        let itemsCountMap = {};
        if (pedidosRes.items?.length > 0) {
          const filterConditions = pedidosRes.items.map(p => `pedido_id = "${p.id}"`).join(' || ');
          const detalles = await pb.collection('detalles_pedidos_internos').getFullList({
            filter: `(${filterConditions})`,
            $autoCancel: false
          }).catch(() => []);

          detalles.forEach(d => {
            itemsCountMap[d.pedido_id] = (itemsCountMap[d.pedido_id] || 0) + 1;
          });
        }

        setData({
          salespersonGoals: goalsRes,
          schedulesThisMonth: schedThisMonthRes,
          schedulesLastMonth: schedLastMonthRes,
          schedulesUpcoming: schedUpcomingRes,
          activeCampaigns: campaignsRes,
          activeVehicles: vehiclesRes,
          pedidos: pedidosRes.items?.map(p => ({ ...p, itemsCount: itemsCountMap[p.id] || 0 })) || [],
          usersMap,
          actividad: actividadRes.items || [],
          schedules: schedThisMonthRes,
          sucursales: sucursalesRes || []
        });
      } catch (err) {
        console.error(err);
        toast.error('Error al cargar datos del dashboard');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const metrics = useMemo(() => {
    const isDone = (s) => s.estado === 'completado' || s.estado === 'terminado';

    // 1. Cumplimiento metas comerciales (mes actual vs mes anterior)
    let totalSalesIncome = 0;
    data.schedulesThisMonth.forEach(s => { if (isDone(s)) totalSalesIncome += (s.monto || 0); });
    let totalSalesGoals = 0;
    data.salespersonGoals.forEach(g => { totalSalesGoals += (g.monthly_goal || 0); });
    const globalSalesCompletion = totalSalesGoals > 0 ? Math.min(100, (totalSalesIncome / totalSalesGoals) * 100) : 0;

    let totalSalesIncomeLast = 0;
    data.schedulesLastMonth.forEach(s => { if (isDone(s)) totalSalesIncomeLast += (s.monto || 0); });
    const globalSalesCompletionLast = totalSalesGoals > 0 ? Math.min(100, (totalSalesIncomeLast / totalSalesGoals) * 100) : 0;
    const salesTrend = globalSalesCompletion - globalSalesCompletionLast;

    // 2. Avance programación operativa (mes actual vs mes anterior)
    const totalOps = data.schedulesThisMonth.length;
    const completedOps = data.schedulesThisMonth.filter(isDone).length;
    const opsCompletion = totalOps > 0 ? Math.round((completedOps / totalOps) * 100) : 0;

    const totalOpsLast = data.schedulesLastMonth.length;
    const completedOpsLast = data.schedulesLastMonth.filter(isDone).length;
    const opsCompletionLast = totalOpsLast > 0 ? Math.round((completedOpsLast / totalOpsLast) * 100) : 0;
    const opsTrend = opsCompletion - opsCompletionLast;

    // Rendimiento por sucursal: siempre basado en la lista real de sucursales activas.
    // Una sucursal sin trabajos este mes muestra 0%, nunca datos inventados.
    const branchRefs = data.sucursales.length > 0
      ? data.sucursales.map(s => ({ id: s.id, name: s.nombre }))
      : [...new Set(data.schedulesThisMonth.map(s => s.sucursal_id).filter(Boolean))].map(id => ({ id, name: id }));
    const branchStats = branchRefs.map(b => {
      const bScheds = data.schedulesThisMonth.filter(s => s.sucursal_id === b.id);
      const done = bScheds.filter(isDone).length;
      const completion = bScheds.length > 0 ? Math.round((done / bScheds.length) * 100) : 0;
      return { name: b.name, completion, total: bScheds.length };
    }).sort((a, b) => b.completion - a.completion);

    // Salesperson ranking (real): match salesperson_name to a user, sum completed monto vs monthly_goal
    const salesByUserId = {};
    data.schedulesThisMonth.forEach(s => {
      if (isDone(s) && s.vendedor_responsable_id) {
        salesByUserId[s.vendedor_responsable_id] = (salesByUserId[s.vendedor_responsable_id] || 0) + (s.monto || 0);
      }
    });

    const spStats = data.salespersonGoals.map(g => {
      const matchedUser = Object.values(data.usersMap).find(
        u => (u.name || '').trim().toLowerCase() === (g.salesperson_name || '').trim().toLowerCase()
      );
      const achieved = matchedUser ? (salesByUserId[matchedUser.id] || 0) : 0;
      const completion = g.monthly_goal > 0 ? Math.min(100, Math.round((achieved / g.monthly_goal) * 100)) : 0;
      return { name: g.salesperson_name, goal: g.monthly_goal, achieved, completion, hasData: !!matchedUser };
    }).sort((a, b) => b.completion - a.completion);

    return {
      globalSalesCompletion,
      salesTrend,
      opsCompletion,
      opsTrend,
      activeCampaigns: data.activeCampaigns.length,
      activeVehicles: data.activeVehicles.length,
      branchStats,
      spStats
    };
  }, [data]);

  const weeklySummary = useMemo(() => {
    const today = new Date();
    const days = Array.from({ length: 7 }).map((_, i) => addDays(today, i));
    return days.map(day => {
      const jobs = data.schedulesUpcoming.filter(s => {
        if (!s.fecha_programada) return false;
        const jobDate = new Date(`${s.fecha_programada.split(' ')[0]}T00:00:00`);
        return isSameDay(jobDate, day);
      });
      return { day, jobs };
    });
  }, [data.schedulesUpcoming]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'entregado':
      case 'terminado':
      case 'completado': return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400';
      case 'por_culminar':
      case 'en_preparación': return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400';
      case 'en_proceso':
      case 'aprobado': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
      case 'cancelado':
      case 'rechazado': return 'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-400';
      default: return 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300';
    }
  };

  const TrendBadge = ({ value }) => {
    if (value === null || value === undefined || Number.isNaN(value)) return null;
    const rounded = Math.round(value * 10) / 10;
    if (rounded === 0) {
      return (
        <Badge variant="outline" className="bg-slate-50 text-slate-600 border-slate-200 shadow-none gap-1">
          <Minus className="h-3 w-3" /> 0%
        </Badge>
      );
    }
    const isUp = rounded > 0;
    return (
      <Badge
        variant="outline"
        className={`shadow-none gap-1 ${isUp ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200'}`}
      >
        {isUp ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
        {isUp ? '+' : ''}{rounded}%
      </Badge>
    );
  };

  const formatDateLabel = (date) => format(date, 'EEE dd', { locale: es });

  return (
    <Layout>
      <Helmet><title>H&S Dashboard - H&S Tecnologías</title></Helmet>

      <div className="content-container space-y-8 py-10 pb-24">
        <div>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-foreground">
            H&amp;S Dashboard
          </h1>
          <p className="text-lg text-muted-foreground mt-2 font-medium">Resumen ejecutivo de operaciones y rendimiento.</p>
        </div>

        {/* FILA 1: KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="metric-card group">
            <div className="flex items-start justify-between mb-4">
              <div className="bg-primary/10 p-3 rounded-xl text-primary group-hover:scale-110 transition-transform"><Target className="h-6 w-6" /></div>
              {!loading && <TrendBadge value={metrics.salesTrend} />}
            </div>
            <div className="space-y-2">
              <h3 className="text-3xl font-black tabular-nums">{loading ? <Skeleton className="h-8 w-24" /> : `${metrics.globalSalesCompletion.toFixed(1)}%`}</h3>
              <p className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Metas Comerciales</p>
              <div className="progress-bar-container">
                <div className="progress-bar-fill" style={{ width: `${loading ? 0 : Math.min(100, metrics.globalSalesCompletion)}%` }}></div>
              </div>
            </div>
          </div>

          <div className="metric-card group">
            <div className="flex items-start justify-between mb-4">
              <div className="bg-[hsl(160,70%,40%)]/10 p-3 rounded-xl text-[hsl(160,70%,32%)] group-hover:scale-110 transition-transform"><Wrench className="h-6 w-6" /></div>
              {!loading && <TrendBadge value={metrics.opsTrend} />}
            </div>
            <div className="space-y-2">
              <h3 className="text-3xl font-black tabular-nums">{loading ? <Skeleton className="h-8 w-24" /> : `${metrics.opsCompletion}%`}</h3>
              <p className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Avance Operativo</p>
              <div className="progress-bar-container">
                <div className="progress-bar-fill" style={{ width: `${loading ? 0 : metrics.opsCompletion}%`, backgroundColor: 'hsl(160,70%,40%)' }}></div>
              </div>
            </div>
          </div>

          <div className="metric-card group">
            <div className="flex items-start justify-between mb-4">
              <div className="bg-primary/10 p-3 rounded-xl text-primary group-hover:scale-110 transition-transform"><Megaphone className="h-6 w-6" /></div>
            </div>
            <div className="space-y-2">
              <h3 className="text-3xl font-black tabular-nums">{loading ? <Skeleton className="h-8 w-16" /> : metrics.activeCampaigns}</h3>
              <p className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Campañas Activas</p>
              <p className="text-xs text-muted-foreground font-medium">{metrics.activeCampaigns === 0 && !loading ? 'Sin campañas activas' : 'En ejecución actualmente'}</p>
            </div>
          </div>

          <div className="metric-card group">
            <div className="flex items-start justify-between mb-4">
              <div className="bg-[hsl(160,70%,40%)]/10 p-3 rounded-xl text-[hsl(160,70%,32%)] group-hover:scale-110 transition-transform"><Truck className="h-6 w-6" /></div>
            </div>
            <div className="space-y-2">
              <h3 className="text-3xl font-black tabular-nums">{loading ? <Skeleton className="h-8 w-16" /> : metrics.activeVehicles}</h3>
              <p className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Vehículos Operativos</p>
              <p className="text-xs text-muted-foreground font-medium">{metrics.activeVehicles === 0 && !loading ? 'Sin registros' : 'Flota disponible'}</p>
            </div>
          </div>
        </div>

        {/* FILA 2: Sucursales / Vendedores / Pedidos */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="border-none shadow-md rounded-2xl bg-card overflow-hidden">
            <CardHeader className="bg-muted/30 border-b pb-4">
              <CardTitle className="text-base font-extrabold flex items-center gap-2"><Building2 className="h-5 w-5 text-primary" /> Rendimiento por Sucursal</CardTitle>
            </CardHeader>
            <CardContent className="p-5 space-y-5">
              {loading ? (
                <Skeleton className="h-32 w-full" />
              ) : metrics.branchStats.length > 0 ? (
                metrics.branchStats.map((b, i) => (
                  <div key={i} className="space-y-2">
                    <div className="flex justify-between text-sm font-bold">
                      <span className="text-foreground">{b.name}</span>
                      <span className="text-muted-foreground tabular-nums">{b.completion}% ({b.total})</span>
                    </div>
                    <div className="progress-bar-container">
                      <div className="progress-bar-fill" style={{ width: `${b.completion}%` }}></div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground font-medium text-center py-6">Sin registros este mes.</p>
              )}
            </CardContent>
          </Card>

          <Card className="border-none shadow-md rounded-2xl bg-card overflow-hidden">
            <CardHeader className="bg-muted/30 border-b pb-4">
              <CardTitle className="text-base font-extrabold flex items-center gap-2"><Trophy className="h-5 w-5 text-[hsl(160,70%,32%)]" /> Cumplimiento por Vendedores</CardTitle>
            </CardHeader>
            <CardContent className="p-5 space-y-3">
              {loading ? (
                <Skeleton className="h-32 w-full" />
              ) : metrics.spStats.length > 0 ? (
                metrics.spStats.map((s, i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-xl border border-border bg-background shadow-sm hover:border-primary/20 transition-colors">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center text-xs font-black text-muted-foreground shrink-0">{i + 1}</div>
                      <div className="min-w-0">
                        <div className="font-bold text-sm text-foreground truncate">{s.name}</div>
                        <div className="text-xs text-muted-foreground font-medium">Meta: ${s.goal?.toLocaleString() || 0}</div>
                      </div>
                    </div>
                    <Badge variant="outline" className={`shadow-none font-extrabold shrink-0 ${s.hasData ? 'bg-primary/10 text-primary border-primary/20' : 'bg-muted/50 text-muted-foreground'}`}>
                      {s.hasData ? `${s.completion}%` : 'Sin datos'}
                    </Badge>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground font-medium text-center py-6">No hay metas configuradas.</p>
              )}
            </CardContent>
          </Card>

          <Card className="border-none shadow-md rounded-2xl bg-card overflow-hidden">
            <CardHeader className="bg-muted/30 border-b pb-4 flex flex-row items-center justify-between">
              <CardTitle className="text-base font-extrabold flex items-center gap-2"><Package className="h-5 w-5 text-primary" /> Pedidos Internos</CardTitle>
              <Button variant="ghost" size="sm" className="font-bold text-xs" onClick={() => navigate('/pedidos-internos')}>
                Ver todos <ArrowUpRight className="h-4 w-4 ml-1" />
              </Button>
            </CardHeader>
            <CardContent className="p-0 divide-y divide-border max-h-[340px] overflow-y-auto custom-scrollbar">
              {loading ? (
                <div className="p-5 space-y-4"><Skeleton className="h-16 w-full" /><Skeleton className="h-16 w-full" /></div>
              ) : data.pedidos.length > 0 ? (
                data.pedidos.map(p => {
                  const solicitante = data.usersMap[p.responsable_id]?.name || p.responsable_nombre || 'N/A';
                  const allSched = [...(data.schedulesThisMonth||[]), ...(data.schedulesUpcoming||[])];
                  const para = p.cronograma_id
                    ? (allSched.find(s => s.id === p.cronograma_id)?.cliente || 'Trabajo vinculado')
                    : (p.sucursal_destino_id ? 'Sucursal' : '—');
                  return (
                    <div key={p.id} className="p-3 hover:bg-[hsl(var(--table-row-hover))] transition-colors">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <div className="font-black text-sm text-foreground truncate">{p.numero_pedido}</div>
                        <Badge variant="outline" className={`text-[10px] font-extrabold uppercase shadow-none border-transparent shrink-0 ${getStatusColor(p.estado)}`}>
                          {(p.estado || '').replace(/_/g, ' ')}
                        </Badge>
                      </div>
                      <div className="text-xs text-muted-foreground space-y-0.5">
                        <div className="flex gap-3">
                          <span>👤 {solicitante}</span>
                          {p.prioridad && <span className={`font-bold ${p.prioridad === 'urgente' ? 'text-red-600' : p.prioridad === 'alta' ? 'text-orange-500' : ''}`}>⬆ {p.prioridad}</span>}
                        </div>
                        <div className="flex gap-3">
                          <span>📦 Para: {para}</span>
                          <span>{p.itemsCount} ítem(s)</span>
                        </div>
                        {p.fecha_entrega_estimada && <div>📅 Requerido: {format(new Date(p.fecha_entrega_estimada.split(' ')[0]), 'dd/MM/yyyy')}</div>}
                      </div>
                      <button className="text-[11px] text-primary font-bold mt-1 hover:underline" onClick={() => navigate(`/pedidos-internos/${p.id}`)}>Ver pedido →</button>
                    </div>
                  );
                })
              ) : (
                <p className="p-8 text-center text-muted-foreground font-medium text-sm">Sin registros de pedidos.</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* FILA 3: Cronograma / Actividad reciente */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2 border-none shadow-md rounded-2xl bg-card overflow-hidden">
            <CardHeader className="bg-muted/30 border-b pb-4 flex flex-row items-center justify-between">
              <CardTitle className="text-base font-extrabold flex items-center gap-2"><CalendarDays className="h-5 w-5 text-primary" /> Cronograma Semanal (Instalaciones/Proyectos)</CardTitle>
              <Button variant="ghost" size="sm" className="font-bold text-xs" onClick={() => navigate('/schedule')}>
                Ver calendario <ArrowUpRight className="h-4 w-4 ml-1" />
              </Button>
            </CardHeader>
            <CardContent className="p-5">
              {loading ? (
                <div className="grid grid-cols-7 gap-2"><Skeleton className="h-40 w-full col-span-7" /></div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
                  {weeklySummary.map(({ day, jobs }, i) => (
                    <div key={i} className="rounded-xl border border-border bg-background p-3 min-h-[120px] flex flex-col shadow-sm">
                      <div className="text-[10px] font-black uppercase text-muted-foreground tracking-wider">{formatDateLabel(day)}</div>
                      <div className="text-xs font-bold text-muted-foreground mb-2 tabular-nums">{jobs.length} trabajo(s)</div>
                      <div className="space-y-1 overflow-hidden flex-1">
                        {jobs.slice(0, 3).map(j => (
                          <div key={j.id} className="text-[11px] font-semibold text-foreground bg-muted/50 rounded-md px-2 py-1 truncate" title={j.cliente}>
                            {j.cliente}
                          </div>
                        ))}
                        {jobs.length === 0 && <div className="text-[11px] text-muted-foreground font-medium">Sin trabajos</div>}
                        {jobs.length > 3 && <div className="text-[10px] text-primary font-bold">+{jobs.length - 3} más</div>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-none shadow-md rounded-2xl bg-card overflow-hidden">
            <CardHeader className="bg-muted/30 border-b pb-4 flex flex-row items-center justify-between">
              <CardTitle className="text-base font-extrabold flex items-center gap-2"><Activity className="h-5 w-5 text-[hsl(160,70%,32%)]" /> Muro de Actividad</CardTitle>
              <Button variant="ghost" size="sm" className="font-bold text-xs" onClick={() => navigate('/activity-wall')}>
                Ver muro <ArrowUpRight className="h-4 w-4 ml-1" />
              </Button>
            </CardHeader>
            <CardContent className="p-0 divide-y divide-border max-h-[350px] overflow-y-auto custom-scrollbar">
              {loading ? (
                <div className="p-5 space-y-4"><Skeleton className="h-14 w-full" /><Skeleton className="h-14 w-full" /></div>
              ) : data.actividad.length > 0 ? (
                data.actividad.map(a => {
                  const authorName = a.created_by_nombre || data.usersMap[a.usuario_id]?.name || 'Usuario';
                  const authorRole = data.usersMap[a.usuario_id || a.created_by]?.role || '';
                  const hasPhoto = a.fotografias?.length > 0;
                  return (
                    <div key={a.id} className="p-3 hover:bg-[hsl(var(--table-row-hover))] transition-colors">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="h-6 w-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-[10px] font-black shrink-0">
                            {authorName.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <span className="font-bold text-xs text-foreground truncate block">{authorName}</span>
                            {authorRole && <span className="text-[10px] text-muted-foreground">{authorRole.split('/')[0].trim()}</span>}
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          {a.es_importante && <Star className="h-3 w-3 text-orange-500 fill-orange-500" />}
                          {hasPhoto && <ImageIcon className="h-3 w-3 text-muted-foreground" title="Foto adjunta" />}
                          <span className="text-[10px] text-muted-foreground">{format(new Date(a.created), 'dd/MM HH:mm')}</span>
                        </div>
                      </div>
                      {a.tipo && a.tipo !== 'General' && <span className="text-[10px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded mr-1">{a.tipo}</span>}
                      {a.es_importante && <span className="text-[10px] font-bold text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded mr-1">Importante</span>}
                      <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{a.contenido}</p>
                    </div>
                  );
                })
              ) : (
                <p className="p-8 text-center text-muted-foreground font-medium text-sm">Sin publicaciones recientes.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default DashboardPage;
