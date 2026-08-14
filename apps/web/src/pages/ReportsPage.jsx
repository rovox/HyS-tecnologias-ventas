import React, { useState, useEffect, useMemo } from 'react';
import { Navigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import pb from '@/lib/pocketbaseClient.js';
import { useAuth } from '@/contexts/AuthContext.jsx';
import Layout from '@/components/Layout.jsx';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card.jsx';
import { Button } from '@/components/ui/button.jsx';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs.jsx';
import { Badge } from '@/components/ui/badge.jsx';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Download, Loader2, ClipboardList } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

const COLORS = ['hsl(var(--primary))', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#06b6d4'];

const fmtFecha = (d) => {
  if (!d) return '—';
  try { return format(new Date(String(d).split(' ')[0]), 'dd/MM/yyyy'); } catch { return String(d).split(' ')[0] || '—'; }
};

const fmt$ = (n) => `Bs ${(Number(n) || 0).toLocaleString('es', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const StatCard = ({ label, value, sub, color = 'text-foreground' }) => (
  <Card className="border shadow-sm rounded-2xl">
    <CardContent className="p-4">
      <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">{label}</p>
      <h3 className={`text-2xl font-black ${color}`}>{value}</h3>
      {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
    </CardContent>
  </Card>
);

const EmptyState = ({ msg = 'Sin datos para el período seleccionado.' }) => (
  <div className="py-12 text-center text-muted-foreground font-medium">{msg}</div>
);

const ReportsPage = () => {
  const { isAdmin, isVentasLevel } = useAuth();
  const canView = isVentasLevel();

  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();
  const [filterMonth, setFilterMonth] = useState(currentMonth);
  const [filterYear, setFilterYear] = useState(currentYear);
  const [activeTab, setActiveTab] = useState('vendedores');
  const [loading, setLoading] = useState(true);

  const [data, setData] = useState({
    schedules: [], allSchedules: [], users: [], tecnicos: [], goals: [],
    pedidos: [], detalles: [], visitas: [], materiales: [], equipos: [], gastos: [],
    pagos: [], movimientos: [], sucursales: []
  });

  useEffect(() => {
    if (!canView) return;
    const fetchData = async () => {
      setLoading(true);
      try {
        const start = `${filterYear}-${String(filterMonth).padStart(2, '0')}-01`;
        const endMonth = filterMonth === 12 ? 1 : filterMonth + 1;
        const endYear = filterMonth === 12 ? filterYear + 1 : filterYear;
        const end = `${endYear}-${String(endMonth).padStart(2, '0')}-01`;

        const [schedules, allSchedules, users, tecnicos, goals, pedidos, detalles, visitas, materiales, equipos, gastos, pagos, movimientos, sucursales] = await Promise.all([
          pb.collection('schedules').getFullList({ filter: `fecha_programada >= "${start}" && fecha_programada < "${end}"`, requestKey: 'rep-sched' }).catch(() => []),
          pb.collection('schedules').getFullList({ requestKey: 'rep-all-sched' }).catch(() => []),
          pb.collection('users').getFullList({ requestKey: 'rep-users' }).catch(() => []),
          pb.collection('tecnicos').getFullList({ requestKey: 'rep-tec' }).catch(() => []),
          pb.collection('salesperson_goals').getFullList({ requestKey: 'rep-goals' }).catch(() => []),
          pb.collection('pedidos_internos').getFullList({ filter: `created >= "${start}" && created < "${end}"`, requestKey: 'rep-pedidos' }).catch(() => []),
          pb.collection('detalles_pedidos_internos').getFullList({ requestKey: 'rep-det' }).catch(() => []),
          pb.collection('visitas_tecnicas').getFullList({ filter: `fecha >= "${start}" && fecha < "${end}"`, requestKey: 'rep-vis' }).catch(() => []),
          pb.collection('materiales_trabajo').getFullList({ filter: `fecha >= "${start}" && fecha < "${end}"`, requestKey: 'rep-mat' }).catch(() => []),
          pb.collection('equipos_instalados').getFullList({ filter: `fecha >= "${start}" && fecha < "${end}"`, requestKey: 'rep-equ' }).catch(() => []),
          pb.collection('gastos_directos').getFullList({ filter: `fecha >= "${start}" && fecha < "${end}"`, requestKey: 'rep-gast' }).catch(() => []),
          pb.collection('schedule_payments').getFullList({ filter: `created >= "${start}" && created < "${end}"`, requestKey: 'rep-pag' }).catch(() => []),
          pb.collection('movimientos').getFullList({ filter: `fecha >= "${start}" && fecha < "${end}"`, requestKey: 'rep-mov' }).catch(() => []),
          pb.collection('sucursales').getFullList({ sort: 'nombre', requestKey: 'rep-suc' }).catch(() => []),
        ]);

        setData({ schedules, allSchedules, users, tecnicos, goals, pedidos, detalles, visitas, materiales, equipos, gastos, pagos, movimientos, sucursales });
      } catch {
        toast.error('Error al cargar reportes');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [filterMonth, filterYear, canView]);

  const metrics = useMemo(() => {
    const { schedules, allSchedules, users, tecnicos, goals, pedidos, detalles, visitas, materiales, equipos, gastos, pagos, movimientos, sucursales } = data;
    const usersMap = Object.fromEntries(users.map(u => [u.id, u]));
    const techMap = Object.fromEntries(tecnicos.map(t => [t.id, t]));

    // VENDEDORES
    const norm = (v) => (v || '').trim().toLowerCase();
    const spStats = goals.map(g => {
      const user = users.find(u => norm(u.name) === norm(g.salesperson_name));
      // Match by vendedor_id (salesperson_goals id), legacy user id, or stored vendedor_nombre
      const myScheds = schedules.filter(s =>
        (s.vendedor_id && s.vendedor_id === g.id) ||
        (s.vendedor_responsable_id && (s.vendedor_responsable_id === g.id || s.vendedor_responsable_id === user?.id)) ||
        (s.vendedor_nombre && norm(s.vendedor_nombre) === norm(g.salesperson_name))
      );
      const ventas = myScheds.reduce((sum, s) => sum + (Number(s.monto) || 0), 0);
      const schedIds = new Set(myScheds.map(s => s.id));
      const cobrado = pagos
        .filter(p => schedIds.has(p.trabajo_id))
        .reduce((sum, p) => sum + (Number(p.monto_cobrado) || Number(p.monto) || 0), 0);
      const porCobrar = myScheds.reduce((sum, s) => sum + Math.max(0, Number(s.saldo_pendiente ?? s.saldo) || 0), 0);
      const meta = g.monthly_goal || 1;
      return { name: g.salesperson_name, ventas, cobrado, porCobrar, clientes: [...new Set(myScheds.map(s => s.cliente_id))].length, trabajos: myScheds.length, meta, pct: Math.min(100, Math.round((ventas / meta) * 100)) };
    }).sort((a, b) => b.ventas - a.ventas);

    // TECNICOS
    const techStats = tecnicos.map(t => {
      const asignados = schedules.filter(s => s.tecnico_responsable_id === t.id).length;
      const completados = schedules.filter(s => s.tecnico_responsable_id === t.id && ['completado','terminado'].includes(s.estado)).length;
      const asistencias = visitas.filter(v => v.tecnico_id === t.id).length;
      const pendientes = schedules.filter(s => s.tecnico_responsable_id === t.id && !['completado','terminado','cancelado'].includes(s.estado)).length;
      return { name: t.nombre, asignados, completados, asistencias, pendientes };
    }).filter(t => t.asignados > 0 || t.asistencias > 0);

    // SUCURSALES
    const sucStats = sucursales.map(suc => {
      const myScheds = schedules.filter(s => s.sucursal_id === suc.id);
      const ventas = myScheds.filter(s => ['completado','terminado'].includes(s.estado)).reduce((sum, s) => sum + (s.monto || 0), 0);
      const myPedidos = pedidos.filter(p => p.sucursal_destino_id === suc.id || p.sucursal_origen_id === suc.id);
      const gastosSum = gastos.filter(g => g.sucursal === suc.nombre).reduce((sum, g) => sum + (g.monto || 0), 0);
      return { name: suc.nombre, ventas, trabajos: myScheds.length, pedidos: myPedidos.length, gastos: gastosSum };
    });

    // TRABAJOS
    const prog = schedules.length;
    const compl = schedules.filter(s => ['completado','terminado'].includes(s.estado)).length;
    const cancel = schedules.filter(s => s.estado === 'cancelado').length;
    const saldoPend = schedules.reduce((sum, s) => sum + Math.max(0, s.saldo_pendiente || 0), 0);
    const utilEstimada = schedules.filter(s => ['completado','terminado'].includes(s.estado)).reduce((sum, s) => sum + (s.monto || 0), 0);
    const trabajosData = schedules.map(s => ({ ...s, usuario: usersMap[s.vendedor_responsable_id]?.name || '—', tecnico: techMap[s.tecnico_responsable_id]?.nombre || '—' }));

    // ASISTENCIAS/RELEVAMIENTOS
    const visitaStats = {
      pendientes: visitas.filter(v => ['programado','pendiente'].includes(v.estado)).length,
      enAtencion: visitas.filter(v => v.estado === 'en_atención').length,
      resueltos: visitas.filter(v => v.estado === 'resuelto').length,
      fueraGarantia: visitas.filter(v => v.estado_garantia === 'fuera de garantía').length,
      enGarantia: visitas.filter(v => v.estado_garantia === 'en garantía').length,
      conCobro: visitas.filter(v => v.se_cobra).length,
      sinCobro: visitas.filter(v => !v.se_cobra).length,
    };

    // PEDIDOS INTERNOS
    const pedidoStats = {
      solicitados: pedidos.filter(p => p.estado === 'solicitado').length,
      entregados: pedidos.filter(p => p.estado === 'entregado').length,
      pendientes: pedidos.filter(p => !['entregado','cancelado','rechazado'].includes(p.estado)).length,
      total: pedidos.length,
    };
    const pedidosSucursal = sucursales.map(suc => ({
      name: suc.nombre,
      value: pedidos.filter(p => p.sucursal_destino_id === suc.id).length,
    })).filter(s => s.value > 0);

    // FINANZAS
    const ingresos = movimientos.filter(m => m.tipo === 'ingreso' || m.tipo === 'cobro').reduce((sum, m) => sum + (m.monto || 0), 0);
    const egresos = movimientos.filter(m => m.tipo === 'egreso' || m.tipo === 'pago_proveedor').reduce((sum, m) => sum + (m.monto || 0), 0);
    const cuentasPorCobrar = schedules.reduce((sum, s) => sum + Math.max(0, s.saldo_pendiente || 0), 0);
    const cobros = pagos.reduce((sum, p) => sum + (p.monto || 0), 0);
    const pagProveedores = movimientos.filter(m => m.tipo === 'pago_proveedor').reduce((sum, m) => sum + (m.monto || 0), 0);

    // COSTOS OPERATIVOS
    const totalMat = materiales.reduce((sum, m) => sum + (m.total || 0), 0);
    const totalEquipos = equipos.reduce((sum, e) => sum + (e.costo_total || 0), 0);
    const totalGastos = gastos.reduce((sum, g) => sum + (g.monto || 0), 0);
    const ingresosTrab = schedules.filter(s => ['completado','terminado'].includes(s.estado)).reduce((sum, s) => sum + (s.monto || 0), 0);
    const utilidad = ingresosTrab - totalMat - totalEquipos - totalGastos;

    return { spStats, techStats, sucStats, prog, compl, cancel, saldoPend, utilEstimada, trabajosData, visitaStats, pedidoStats, pedidosSucursal, ingresos, egresos, cuentasPorCobrar, cobros, pagProveedores, totalMat, totalEquipos, totalGastos, utilidad, ingresosTrab };
  }, [data]);

  if (!canView) return <Navigate to="/dashboard" replace />;

  const handleExport = () => {
    let rows = [];
    let filename = `Reporte_${activeTab}_${filterYear}-${filterMonth}.csv`;
    if (activeTab === 'vendedores') {
      rows = ['Vendedor,Ventas,Cobrado,Por Cobrar,Trabajos,Clientes,Meta,% Cumplimiento',
        ...metrics.spStats.map(s => `${s.name},${s.ventas},${s.cobrado},${s.porCobrar},${s.trabajos},${s.clientes},${s.meta},${s.pct}%`)];
    } else if (activeTab === 'tecnicos') {
      rows = ['Técnico,Asignados,Completados,Asistencias,Pendientes',
        ...metrics.techStats.map(t => `${t.name},${t.asignados},${t.completados},${t.asistencias},${t.pendientes}`)];
    } else if (activeTab === 'sucursales') {
      rows = ['Sucursal,Ventas,Trabajos,Pedidos Internos,Gastos',
        ...metrics.sucStats.map(s => `${s.name},${s.ventas},${s.trabajos},${s.pedidos},${s.gastos}`)];
    } else if (activeTab === 'trabajos') {
      rows = ['Cliente,Lugar,Estado,Técnico,Vendedor,Monto,Saldo Pendiente,Fecha',
        ...metrics.trabajosData.map(t => `${t.cliente || ''},${t.lugar || ''},${t.estado || ''},${t.tecnico},${t.usuario},${t.monto || 0},${t.saldo_pendiente || 0},${fmtFecha(t.fecha_programada)}`)];
    } else {
      rows = [`Reporte de ${activeTab} - Sin exportación detallada implementada`];
    }
    const csv = 'data:text/csv;charset=utf-8,' + rows.join('\n');
    const a = document.createElement('a');
    a.href = encodeURI(csv);
    a.download = filename;
    a.click();
    toast.success(`Exportado: ${filename}`);
  };

  const TABS = [
    { id: 'vendedores', label: 'Vendedores' },
    { id: 'tecnicos', label: 'Técnicos' },
    { id: 'sucursales', label: 'Sucursales' },
    { id: 'trabajos', label: 'Trabajos' },
    { id: 'asistencias', label: 'Asistencias' },
    { id: 'pedidos', label: 'Pedidos' },
    { id: 'finanzas', label: 'Finanzas' },
    { id: 'costos', label: 'Costos' },
  ];

  return (
    <Layout>
      <Helmet>
        <title>Reportes - H&S Tecnologías</title>
        <meta name="description" content="Reportes integrales de ventas, operaciones y contabilidad" />
      </Helmet>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24 space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-3">
              <ClipboardList className="h-8 w-8 text-primary" /> Reportes
            </h1>
            <p className="text-muted-foreground mt-1 font-medium">Análisis integral de ventas, operaciones y contabilidad.</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <select value={filterMonth} onChange={e => setFilterMonth(Number(e.target.value))} className="h-9 px-3 border rounded-lg bg-card text-sm font-bold">
              {['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'].map((m, i) => (
                <option key={i + 1} value={i + 1}>{m}</option>
              ))}
            </select>
            <select value={filterYear} onChange={e => setFilterYear(Number(e.target.value))} className="h-9 px-3 border rounded-lg bg-card text-sm font-bold">
              {[2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
            </select>
            <Button onClick={handleExport} className="font-bold h-9"><Download className="h-4 w-4 mr-2" /> Exportar CSV</Button>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center p-20"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>
        ) : (
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="flex flex-wrap gap-1 h-auto p-1 bg-muted/50 rounded-xl mb-6">
              {TABS.map(t => (
                <TabsTrigger key={t.id} value={t.id} className="py-2 px-3 rounded-lg font-bold text-sm data-[state=active]:bg-background data-[state=active]:shadow-sm">
                  {t.label}
                </TabsTrigger>
              ))}
            </TabsList>

            {/* VENDEDORES */}
            <TabsContent value="vendedores" className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard label="Total ventas" value={fmt$(metrics.spStats.reduce((s, v) => s + v.ventas, 0))} color="text-emerald-600" />
                <StatCard label="Total cobrado" value={fmt$(metrics.spStats.reduce((s, v) => s + v.cobrado, 0))} color="text-primary" />
                <StatCard label="Por cobrar" value={fmt$(metrics.spStats.reduce((s, v) => s + v.porCobrar, 0))} color="text-orange-500" />
                <StatCard label="Trabajos completados" value={metrics.spStats.reduce((s, v) => s + v.trabajos, 0)} />
              </div>
              {metrics.spStats.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {metrics.spStats.map((s, i) => (
                    <Card key={i} className="border shadow-sm rounded-2xl">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-lg font-black">{s.name}</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div><span className="text-muted-foreground">Ventas:</span> <strong className="text-emerald-600">{fmt$(s.ventas)}</strong></div>
                          <div><span className="text-muted-foreground">Cobrado:</span> <strong>{fmt$(s.cobrado)}</strong></div>
                          <div><span className="text-muted-foreground">Por cobrar:</span> <strong className="text-orange-500">{fmt$(s.porCobrar)}</strong></div>
                          <div><span className="text-muted-foreground">Clientes:</span> <strong>{s.clientes}</strong></div>
                          <div><span className="text-muted-foreground">Trabajos:</span> <strong>{s.trabajos}</strong></div>
                          <div><span className="text-muted-foreground">Meta:</span> <strong>{fmt$(s.meta)}</strong></div>
                        </div>
                        <div className="h-2 w-full bg-muted rounded-full overflow-hidden mt-2">
                          <div className="h-full bg-primary" style={{ width: `${s.pct}%` }} />
                        </div>
                        <p className="text-xs font-bold text-primary text-right">{s.pct}% de cumplimiento</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : <EmptyState />}
            </TabsContent>

            {/* TECNICOS */}
            <TabsContent value="tecnicos" className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard label="Trabajos asignados" value={metrics.techStats.reduce((s, t) => s + t.asignados, 0)} />
                <StatCard label="Trabajos completados" value={metrics.techStats.reduce((s, t) => s + t.completados, 0)} color="text-emerald-600" />
                <StatCard label="Asistencias" value={metrics.techStats.reduce((s, t) => s + t.asistencias, 0)} color="text-primary" />
                <StatCard label="Pendientes" value={metrics.techStats.reduce((s, t) => s + t.pendientes, 0)} color="text-orange-500" />
              </div>
              {metrics.techStats.length > 0 ? (
                <div className="table-container">
                  <table className="w-full text-sm">
                    <thead><tr className="table-header">
                      {['Técnico','Asignados','Completados','Asistencias','Pendientes'].map(h => (
                        <th key={h} className="table-cell">{h}</th>
                      ))}
                    </tr></thead>
                    <tbody>
                      {metrics.techStats.map((t, i) => (
                        <tr key={i} className="table-row">
                          <td className="table-cell font-bold">{t.name}</td>
                          <td className="table-cell">{t.asignados}</td>
                          <td className="table-cell text-emerald-600 font-bold">{t.completados}</td>
                          <td className="table-cell">{t.asistencias}</td>
                          <td className="table-cell text-orange-500 font-bold">{t.pendientes}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : <EmptyState />}
            </TabsContent>

            {/* SUCURSALES */}
            <TabsContent value="sucursales" className="space-y-6">
              {metrics.sucStats.length > 0 ? (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {metrics.sucStats.filter(s => s.ventas > 0 || s.trabajos > 0).map((s, i) => (
                      <Card key={i} className="border shadow-sm rounded-2xl">
                        <CardHeader className="pb-2"><CardTitle className="font-extrabold">{s.name}</CardTitle></CardHeader>
                        <CardContent className="space-y-2 text-sm">
                          <div className="flex justify-between"><span className="text-muted-foreground">Ventas</span><strong className="text-emerald-600">{fmt$(s.ventas)}</strong></div>
                          <div className="flex justify-between"><span className="text-muted-foreground">Trabajos</span><strong>{s.trabajos}</strong></div>
                          <div className="flex justify-between"><span className="text-muted-foreground">Pedidos internos</span><strong>{s.pedidos}</strong></div>
                          <div className="flex justify-between"><span className="text-muted-foreground">Gastos directos</span><strong className="text-rose-600">{fmt$(s.gastos)}</strong></div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                  <Card className="border shadow-sm rounded-2xl">
                    <CardHeader><CardTitle>Ventas por Sucursal (Bs)</CardTitle></CardHeader>
                    <CardContent className="h-[280px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={metrics.sucStats}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                          <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fontWeight: 'bold' }} />
                          <YAxis axisLine={false} tickLine={false} />
                          <RechartsTooltip contentStyle={{ borderRadius: '8px' }} />
                          <Bar dataKey="ventas" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </>
              ) : <EmptyState />}
            </TabsContent>

            {/* TRABAJOS */}
            <TabsContent value="trabajos" className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard label="Programados" value={metrics.prog} />
                <StatCard label="Completados" value={metrics.compl} color="text-emerald-600" />
                <StatCard label="Cancelados" value={metrics.cancel} color="text-rose-600" />
                <StatCard label="Saldo pendiente" value={fmt$(metrics.saldoPend)} color="text-orange-500" />
              </div>
              <StatCard label="Utilidad estimada (trabajos completados)" value={fmt$(metrics.utilEstimada)} color="text-emerald-600" />
              {metrics.trabajosData.length > 0 ? (
                <div className="table-container">
                  <table className="w-full text-sm">
                    <thead><tr className="table-header">
                      {['Cliente','Lugar','Estado','Técnico','Vendedor','Monto','Saldo','Fecha'].map(h => (
                        <th key={h} className="table-cell">{h}</th>
                      ))}
                    </tr></thead>
                    <tbody>
                      {metrics.trabajosData.slice(0, 50).map((t, i) => (
                        <tr key={i} className="table-row">
                          <td className="table-cell font-bold">{t.cliente || '—'}</td>
                          <td className="table-cell">{t.lugar || '—'}</td>
                          <td className="table-cell">
                            <Badge className={`text-[10px] font-bold ${['completado','terminado'].includes(t.estado) ? 'bg-emerald-100 text-emerald-800' : t.estado === 'cancelado' ? 'bg-rose-100 text-rose-800' : 'bg-blue-100 text-blue-800'}`}>{t.estado}</Badge>
                          </td>
                          <td className="table-cell">{t.tecnico}</td>
                          <td className="table-cell">{t.usuario}</td>
                          <td className="table-cell font-bold text-emerald-600">{fmt$(t.monto)}</td>
                          <td className="table-cell text-orange-500">{fmt$(Math.max(0, t.saldo_pendiente || 0))}</td>
                          <td className="table-cell">{fmtFecha(t.fecha_programada)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {metrics.trabajosData.length > 50 && <p className="text-xs text-muted-foreground text-center py-2">Mostrando 50 de {metrics.trabajosData.length} registros. Exporta CSV para ver todos.</p>}
                </div>
              ) : <EmptyState />}
            </TabsContent>

            {/* ASISTENCIAS */}
            <TabsContent value="asistencias" className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard label="Pendientes" value={metrics.visitaStats.pendientes} color="text-orange-500" />
                <StatCard label="En atención" value={metrics.visitaStats.enAtencion} color="text-blue-600" />
                <StatCard label="Resueltos" value={metrics.visitaStats.resueltos} color="text-emerald-600" />
                <StatCard label="Total" value={data.visitas.length} />
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard label="En garantía" value={metrics.visitaStats.enGarantia} color="text-emerald-600" />
                <StatCard label="Fuera de garantía" value={metrics.visitaStats.fueraGarantia} color="text-rose-600" />
                <StatCard label="Con cobro" value={metrics.visitaStats.conCobro} color="text-primary" />
                <StatCard label="Sin cobro" value={metrics.visitaStats.sinCobro} />
              </div>
              {data.visitas.length > 0 ? (
                <div className="table-container">
                  <table className="w-full text-sm">
                    <thead><tr className="table-header">
                      {['Fecha','Tipo','Cliente','Dirección','Técnico','Estado','Garantía','Cobro'].map(h => <th key={h} className="table-cell">{h}</th>)}
                    </tr></thead>
                    <tbody>
                      {data.visitas.slice(0, 50).map((v, i) => (
                        <tr key={i} className="table-row">
                          <td className="table-cell">{fmtFecha(v.fecha)}</td>
                          <td className="table-cell"><Badge className="text-[10px]">{v.tipo || '—'}</Badge></td>
                          <td className="table-cell font-bold">{v.cliente_nombre || '—'}</td>
                          <td className="table-cell">{v.direccion || '—'}</td>
                          <td className="table-cell">{v.tecnico_nombre || '—'}</td>
                          <td className="table-cell">{v.estado || '—'}</td>
                          <td className="table-cell">{v.estado_garantia || '—'}</td>
                          <td className="table-cell">{v.se_cobra ? `Bs ${v.monto_cobrado || 0}` : 'No'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : <EmptyState />}
            </TabsContent>

            {/* PEDIDOS INTERNOS */}
            <TabsContent value="pedidos" className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard label="Total" value={metrics.pedidoStats.total} />
                <StatCard label="Solicitados" value={metrics.pedidoStats.solicitados} color="text-orange-500" />
                <StatCard label="Pendientes" value={metrics.pedidoStats.pendientes} color="text-blue-600" />
                <StatCard label="Entregados" value={metrics.pedidoStats.entregados} color="text-emerald-600" />
              </div>
              {metrics.pedidosSucursal.length > 0 && (
                <Card className="border shadow-sm rounded-2xl">
                  <CardHeader><CardTitle>Pedidos por Sucursal</CardTitle></CardHeader>
                  <CardContent className="h-[220px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={metrics.pedidosSucursal} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} paddingAngle={2}>
                          {metrics.pedidosSucursal.map((_, idx) => <Cell key={idx} fill={COLORS[idx % COLORS.length]} />)}
                        </Pie>
                        <RechartsTooltip contentStyle={{ borderRadius: '8px' }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              )}
              {data.pedidos.length > 0 ? (
                <div className="table-container">
                  <table className="w-full text-sm">
                    <thead><tr className="table-header">
                      {['Nro. Pedido','Solicitante','Estado','Prioridad','Fecha requerida'].map(h => <th key={h} className="table-cell">{h}</th>)}
                    </tr></thead>
                    <tbody>
                      {data.pedidos.map((p, i) => (
                        <tr key={i} className="table-row">
                          <td className="table-cell font-bold">{p.numero_pedido || '—'}</td>
                          <td className="table-cell">{data.users.find(u => u.id === p.responsable_id)?.name || '—'}</td>
                          <td className="table-cell"><Badge className="text-[10px]">{p.estado || '—'}</Badge></td>
                          <td className="table-cell">{p.prioridad || '—'}</td>
                          <td className="table-cell">{fmtFecha(p.fecha_entrega_estimada)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : <EmptyState />}
            </TabsContent>

            {/* FINANZAS */}
            <TabsContent value="finanzas" className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <StatCard label="Ingresos" value={fmt$(metrics.ingresos)} color="text-emerald-600" />
                <StatCard label="Egresos" value={fmt$(metrics.egresos)} color="text-rose-600" />
                <StatCard label="Resultado neto" value={fmt$(metrics.ingresos - metrics.egresos)} color={metrics.ingresos - metrics.egresos >= 0 ? 'text-emerald-600' : 'text-rose-600'} />
                <StatCard label="Cuentas por cobrar" value={fmt$(metrics.cuentasPorCobrar)} color="text-orange-500" />
                <StatCard label="Cobros/Rendiciones" value={fmt$(metrics.cobros)} color="text-primary" />
                <StatCard label="Pagos a proveedores" value={fmt$(metrics.pagProveedores)} color="text-rose-600" />
              </div>
              {data.movimientos.length > 0 ? (
                <div className="table-container">
                  <table className="w-full text-sm">
                    <thead><tr className="table-header">
                      {['Fecha','Tipo','Categoría','Descripción','Sucursal','Monto','Estado'].map(h => <th key={h} className="table-cell">{h}</th>)}
                    </tr></thead>
                    <tbody>
                      {data.movimientos.slice(0, 50).map((m, i) => (
                        <tr key={i} className="table-row">
                          <td className="table-cell">{fmtFecha(m.fecha)}</td>
                          <td className="table-cell"><Badge className="text-[10px]">{m.tipo || '—'}</Badge></td>
                          <td className="table-cell">{m.categoria || '—'}</td>
                          <td className="table-cell">{m.descripcion || '—'}</td>
                          <td className="table-cell">{m.sucursal_nombre || '—'}</td>
                          <td className={`table-cell font-bold ${m.tipo === 'ingreso' || m.tipo === 'cobro' ? 'text-emerald-600' : 'text-rose-600'}`}>{fmt$(m.monto)}</td>
                          <td className="table-cell">{m.estado || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : <EmptyState />}
            </TabsContent>

            {/* COSTOS OPERATIVOS */}
            <TabsContent value="costos" className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard label="Materiales usados" value={fmt$(metrics.totalMat)} color="text-orange-500" />
                <StatCard label="Equipos instalados" value={fmt$(metrics.totalEquipos)} color="text-primary" />
                <StatCard label="Gastos directos" value={fmt$(metrics.totalGastos)} color="text-rose-600" />
                <StatCard label="Utilidad estimada" value={fmt$(metrics.utilidad)} color={metrics.utilidad >= 0 ? 'text-emerald-600' : 'text-rose-600'} sub={`Sobre ingresos ${fmt$(metrics.ingresosTrab)}`} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {data.materiales.length > 0 && (
                  <Card className="border shadow-sm rounded-2xl">
                    <CardHeader><CardTitle className="text-sm font-extrabold">Materiales ({data.materiales.length} registros)</CardTitle></CardHeader>
                    <CardContent className="p-0 max-h-60 overflow-y-auto custom-scrollbar">
                      <table className="w-full text-xs">
                        <thead><tr className="table-header"><th className="table-cell">Material</th><th className="table-cell">Cantidad</th><th className="table-cell">Total</th></tr></thead>
                        <tbody>
                          {data.materiales.map((m, i) => (
                            <tr key={i} className="table-row">
                              <td className="table-cell">{m.material || m.descripcion || '—'}</td>
                              <td className="table-cell">{m.cantidad}</td>
                              <td className="table-cell font-bold">{fmt$(m.total)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </CardContent>
                  </Card>
                )}
                {data.gastos.length > 0 && (
                  <Card className="border shadow-sm rounded-2xl">
                    <CardHeader><CardTitle className="text-sm font-extrabold">Gastos directos ({data.gastos.length} registros)</CardTitle></CardHeader>
                    <CardContent className="p-0 max-h-60 overflow-y-auto custom-scrollbar">
                      <table className="w-full text-xs">
                        <thead><tr className="table-header"><th className="table-cell">Tipo</th><th className="table-cell">Descripción</th><th className="table-cell">Monto</th></tr></thead>
                        <tbody>
                          {data.gastos.map((g, i) => (
                            <tr key={i} className="table-row">
                              <td className="table-cell">{g.tipo || '—'}</td>
                              <td className="table-cell">{g.descripcion || '—'}</td>
                              <td className="table-cell font-bold text-rose-600">{fmt$(g.monto)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </CardContent>
                  </Card>
                )}
                {data.materiales.length === 0 && data.gastos.length === 0 && <div className="col-span-2"><EmptyState /></div>}
              </div>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </Layout>
  );
};

export default ReportsPage;
