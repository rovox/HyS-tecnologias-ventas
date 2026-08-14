import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Navigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import pb from '@/lib/pocketbaseClient.js';
import { useAuth } from '@/contexts/AuthContext.jsx';
import Layout from '@/components/Layout.jsx';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { LayoutDashboard, Database, BarChart3, TrendingUp, AlertCircle, ArrowDownRight, ArrowUpRight, Search, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const ManagementPanelPage = () => {
  const { currentUser } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState({});
  const [summaryData, setSummaryData] = useState({ income: 0, expenses: 0, profit: 0, goal: 1, schedules: [] });
  
  // Audit Tab State
  const [auditLogs, setAuditLogs] = useState([]);
  const [auditLoading, setAuditLoading] = useState(false);
  const [auditActionFilter, setAuditActionFilter] = useState('all');

  const isAdmin = currentUser?.role === 'ADMINISTRADOR';

  const loadSummaryData = useCallback(async () => {
    if (!isAdmin) return;
    
    setLoading(true);
    try {
      // Load user dictionary
      const usersRes = await pb.collection('users').getFullList({ $autoCancel: false });
      const userMap = usersRes.reduce((acc, u) => ({ ...acc, [u.id]: u }), {});
      setUsers(userMap);

      // Current month boundary
      const now = new Date();
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
      
      const [schedules, config, maintenance, fuel, oil, orders] = await Promise.all([
        pb.collection('schedules').getFullList({ 
          filter: `fecha_programada >= "${firstDay}" && (estado = "completado" || estado = "terminado")`, 
          $autoCancel: false 
        }),
        pb.collection('configuration').getFullList({ $autoCancel: false }),
        pb.collection('registros_mantenimiento').getFullList({ filter: `fecha >= "${firstDay}"`, $autoCancel: false }),
        pb.collection('registros_combustible').getFullList({ filter: `fecha >= "${firstDay}"`, $autoCancel: false }),
        pb.collection('registros_aceite').getFullList({ filter: `fecha >= "${firstDay}"`, $autoCancel: false }),
        pb.collection('pedidos_internos').getFullList({ filter: `created >= "${firstDay}" && estado = "entregado"`, $autoCancel: false })
      ]);

      const income = schedules.reduce((sum, s) => sum + (s.monto || 0), 0);
      
      const expenses = 
        maintenance.reduce((sum, m) => sum + (m.costo || 0), 0) +
        fuel.reduce((sum, f) => sum + (f.costo || 0), 0) +
        oil.reduce((sum, o) => sum + (o.costo || 0), 0) +
        orders.reduce((sum, p) => sum + (p.costo_total || 0), 0);
      
      const profit = income - expenses;
      const goal = config[0]?.monthly_goal || 50000; // Fallback to 50k if no config

      setSummaryData({ income, expenses, profit, goal, schedules });
    } catch (err) {
      console.error('Error fetching summary:', err);
      toast.error('Error al cargar el resumen ejecutivo.');
    } finally {
      setLoading(false);
    }
  }, [isAdmin]);

  const loadAuditLogs = useCallback(async () => {
    if (!isAdmin) return;
    
    setAuditLoading(true);
    try {
      const filters = [];
      if (auditActionFilter !== 'all') {
        filters.push(`accion = "${auditActionFilter}"`);
      }

      const records = await pb.collection('historial_actividad').getList(1, 50, {
        sort: '-created',
        filter: filters.length > 0 ? filters.join(' && ') : '',
        $autoCancel: false
      });
      
      setAuditLogs(records.items);
    } catch (err) {
      console.error('Error fetching audit logs:', err);
      toast.error('Error al cargar el registro de auditoría.');
    } finally {
      setAuditLoading(false);
    }
  }, [isAdmin, auditActionFilter]);

  useEffect(() => {
    loadSummaryData();
  }, [loadSummaryData]);

  useEffect(() => {
    loadAuditLogs();
  }, [loadAuditLogs]);

  const branchChartData = useMemo(() => {
    if (!summaryData.schedules.length) return [];
    
    const branchMap = summaryData.schedules.reduce((acc, s) => {
      const b = s.sucursal_id || 'Central';
      acc[b] = (acc[b] || 0) + (s.monto || 0);
      return acc;
    }, {});
    
    return Object.entries(branchMap)
      .map(([name, total]) => ({ name, total }))
      .sort((a, b) => b.total - a.total);
  }, [summaryData.schedules]);

  if (!isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  const goalProgress = Math.min(100, Math.max(0, (summaryData.income / summaryData.goal) * 100));
  const isGoalAtRisk = goalProgress < 80;

  return (
    <Layout>
      <Helmet>
        <title>Management Panel - H&S</title>
      </Helmet>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        <header>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-foreground flex items-center gap-3">
            <LayoutDashboard className="h-10 w-10 text-primary" />
            Panel Ejecutivo
          </h1>
          <p className="text-lg text-muted-foreground mt-2 max-w-prose">
            Control integral de operaciones, rentabilidad y auditoría del sistema.
          </p>
        </header>

        <Tabs defaultValue="resumen" className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-3 mb-8 h-auto p-1 bg-muted/50 rounded-xl">
            <TabsTrigger value="resumen" className="py-2.5 rounded-lg font-medium data-[state=active]:bg-background data-[state=active]:shadow-sm">
              <TrendingUp className="h-4 w-4 mr-2" /> Resumen
            </TabsTrigger>
            <TabsTrigger value="auditoria" className="py-2.5 rounded-lg font-medium data-[state=active]:bg-background data-[state=active]:shadow-sm">
              <Database className="h-4 w-4 mr-2" /> Auditoría
            </TabsTrigger>
            <TabsTrigger value="metricas" className="py-2.5 rounded-lg font-medium data-[state=active]:bg-background data-[state=active]:shadow-sm">
              <BarChart3 className="h-4 w-4 mr-2" /> Métricas
            </TabsTrigger>
          </TabsList>

          {/* TAB 1: RESUMEN */}
          <TabsContent value="resumen" className="space-y-6 animate-in fade-in-50 duration-500">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="border shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Ingresos (Mes Actual)</CardTitle>
                </CardHeader>
                <CardContent>
                  {loading ? <Skeleton className="h-8 w-24" /> : (
                    <div className="flex items-center gap-2">
                      <ArrowUpRight className="h-5 w-5 text-emerald-500" />
                      <span className="text-3xl font-black text-foreground">
                        ${summaryData.income.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="border shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Gastos Operativos</CardTitle>
                </CardHeader>
                <CardContent>
                  {loading ? <Skeleton className="h-8 w-24" /> : (
                    <div className="flex items-center gap-2">
                      <ArrowDownRight className="h-5 w-5 text-destructive" />
                      <span className="text-3xl font-black text-foreground">
                        ${summaryData.expenses.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="border shadow-sm bg-primary text-primary-foreground">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-primary-foreground/80">Utilidad Neta</CardTitle>
                </CardHeader>
                <CardContent>
                  {loading ? <Skeleton className="h-8 w-24 bg-primary-foreground/20" /> : (
                    <span className="text-3xl font-black">
                      ${summaryData.profit.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  )}
                </CardContent>
              </Card>

              <Card className="border shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Meta Mensual</CardTitle>
                </CardHeader>
                <CardContent>
                  {loading ? <Skeleton className="h-8 w-full" /> : (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xl font-bold">{goalProgress.toFixed(1)}%</span>
                        {isGoalAtRisk && <AlertCircle className="h-5 w-5 text-orange-500" />}
                      </div>
                      <Progress value={goalProgress} className={`h-2 ${isGoalAtRisk ? '[&>div]:bg-orange-500' : ''}`} />
                      <p className="text-xs text-muted-foreground font-medium">Objetivo: ${summaryData.goal.toLocaleString()}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* TAB 2: AUDITORÍA */}
          <TabsContent value="auditoria" className="space-y-6 animate-in fade-in-50 duration-500">
            <Card className="border shadow-sm">
              <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b bg-muted/20">
                <div>
                  <CardTitle className="text-xl">Registro de Actividad</CardTitle>
                  <CardDescription>Auditoría de acciones realizadas en el sistema (últimos 50 registros).</CardDescription>
                </div>
                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <Select value={auditActionFilter} onValueChange={setAuditActionFilter} disabled={auditLoading}>
                    <SelectTrigger className="w-[180px] bg-background">
                      <SelectValue placeholder="Filtrar por acción" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas las acciones</SelectItem>
                      <SelectItem value="crear">Creación</SelectItem>
                      <SelectItem value="editar">Edición</SelectItem>
                      <SelectItem value="eliminar">Eliminación</SelectItem>
                      <SelectItem value="cambiar_estado">Cambio de estado</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button variant="outline" size="icon" onClick={loadAuditLogs} disabled={auditLoading}>
                    {auditLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-muted/30 text-muted-foreground uppercase text-xs">
                      <tr>
                        <th className="px-6 py-4 font-semibold">Fecha y Hora</th>
                        <th className="px-6 py-4 font-semibold">Usuario</th>
                        <th className="px-6 py-4 font-semibold">Módulo / Entidad</th>
                        <th className="px-6 py-4 font-semibold">Acción</th>
                        <th className="px-6 py-4 font-semibold">Detalle</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y border-t">
                      {auditLoading ? (
                        <tr>
                          <td colSpan="5" className="p-8 text-center text-muted-foreground">
                            <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                            Cargando registros...
                          </td>
                        </tr>
                      ) : auditLogs.length === 0 ? (
                        <tr>
                          <td colSpan="5" className="p-8 text-center text-muted-foreground">
                            No se encontraron registros para los filtros seleccionados.
                          </td>
                        </tr>
                      ) : (
                        auditLogs.map((log) => (
                          <tr key={log.id} className="hover:bg-muted/20 transition-colors">
                            <td className="px-6 py-3 whitespace-nowrap text-muted-foreground">
                              {format(new Date(log.created), "dd MMM yyyy, HH:mm", { locale: es })}
                            </td>
                            <td className="px-6 py-3 font-medium text-foreground">
                              {users[log.usuario_id]?.name || 'Usuario desconocido'}
                            </td>
                            <td className="px-6 py-3">
                              <Badge variant="outline" className="capitalize">
                                {log.entidad_tipo.replace(/_/g, ' ')}
                              </Badge>
                            </td>
                            <td className="px-6 py-3">
                              <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-semibold capitalize
                                ${log.accion === 'crear' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400' :
                                  log.accion === 'eliminar' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' :
                                  log.accion === 'editar' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' :
                                  'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300'}`}>
                                {log.accion.replace(/_/g, ' ')}
                              </span>
                            </td>
                            <td className="px-6 py-3 max-w-[250px] truncate text-muted-foreground" title={log.descripcion || 'Sin detalle'}>
                              {log.descripcion || '-'}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB 3: MÉTRICAS */}
          <TabsContent value="metricas" className="space-y-6 animate-in fade-in-50 duration-500">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="border shadow-sm">
                <CardHeader>
                  <CardTitle>Ingresos por Sucursal</CardTitle>
                  <CardDescription>Distribución de ingresos completados en el mes actual.</CardDescription>
                </CardHeader>
                <CardContent className="h-[350px]">
                  {loading ? (
                    <div className="w-full h-full flex items-center justify-center">
                      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                  ) : branchChartData.length === 0 ? (
                    <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground">
                      <BarChart3 className="h-10 w-10 mb-2 opacity-20" />
                      <p>No hay ingresos registrados este mes.</p>
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={branchChartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                        <XAxis 
                          dataKey="name" 
                          axisLine={false} 
                          tickLine={false} 
                          tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} 
                          dy={10}
                        />
                        <YAxis 
                          axisLine={false} 
                          tickLine={false} 
                          tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                          tickFormatter={(val) => `$${val}`}
                        />
                        <Tooltip 
                          cursor={{ fill: 'hsl(var(--muted)/0.5)' }}
                          contentStyle={{ 
                            backgroundColor: 'hsl(var(--popover))',
                            borderColor: 'hsl(var(--border))',
                            borderRadius: '8px',
                            color: 'hsl(var(--popover-foreground))',
                            fontWeight: 500
                          }}
                          formatter={(value) => [`$${value.toLocaleString()}`, 'Ingresos']}
                        />
                        <Bar 
                          dataKey="total" 
                          fill="hsl(var(--primary))" 
                          radius={[6, 6, 0, 0]} 
                          barSize={50}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>

              <Card className="border shadow-sm flex flex-col items-center justify-center p-12 text-center bg-muted/10">
                <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center mb-6">
                  <TrendingUp className="h-10 w-10 text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-2 text-foreground">Análisis Predictivo</h3>
                <p className="text-muted-foreground mb-6 max-w-sm">
                  El módulo de reportes predictivos y machine learning estará disponible en la próxima actualización del sistema.
                </p>
                <Button variant="outline" disabled className="pointer-events-none opacity-50">
                  Próximamente
                </Button>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default ManagementPanelPage;