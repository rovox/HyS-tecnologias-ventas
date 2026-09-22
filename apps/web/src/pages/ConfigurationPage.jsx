import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { useAuth } from '@/contexts/AuthContext.jsx';
import Layout from '@/components/Layout.jsx';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Settings, Target, Users, Building2, Wrench, Pencil, Check, X, Info } from 'lucide-react';
import { toast } from 'sonner';
import { goalsService } from '@/services/goals/index.js';
import { apiClient, authToken } from '@/api/http.js';

const ConfigurationPage = () => {
  const { canAccessExecutivePanel, isAdmin } = useAuth();

  const [loading, setLoading] = useState(true);
  const [salespersonGoals, setSalespersonGoals] = useState([]);
  const [sucursales, setSucursales] = useState([]);

  const [newSucursal, setNewSucursal] = useState({ nombre: '', codigo: '' });
  const [editingSucursalId, setEditingSucursalId] = useState(null);
  const [editSucursalForm, setEditSucursalForm] = useState({ nombre: '', codigo: '', activa: true });
  const [editingGoalId, setEditingGoalId] = useState(null);
  const [editGoalValue, setEditGoalValue] = useState('');
  const [savingGoal, setSavingGoal] = useState(false);

  const canEditGoals = isAdmin();

  useEffect(() => {
    if (!canAccessExecutivePanel()) { setLoading(false); return; }
    Promise.all([
      goalsService.listSellerGoals(),
      apiClient.get('sucursales', { token: authToken() }),
    ]).then(([sg, suc]) => {
      setSalespersonGoals(sg || []);
      setSucursales(suc || []);
    }).catch((err) => {
      console.error('Error fetching configuration:', err);
      toast.error('Error al cargar la configuración.');
    }).finally(() => setLoading(false));
  }, [canAccessExecutivePanel]);

  if (!canAccessExecutivePanel()) return <Navigate to="/dashboard" replace />;

  const reloadSucursales = async () => {
    const fresh = await apiClient.get('sucursales', { token: authToken() });
    setSucursales(fresh || []);
  };

  const handleAddSucursal = async (e) => {
    e.preventDefault();
    if (!newSucursal.nombre) return;
    try {
      await apiClient.post('sucursales', { nombre: newSucursal.nombre, codigo: newSucursal.codigo, activa: true }, { token: authToken() });
      setNewSucursal({ nombre: '', codigo: '' });
      await reloadSucursales();
      toast.success('Sucursal registrada exitosamente');
    } catch (err) {
      toast.error(err.message || 'Error al registrar sucursal');
    }
  };

  const handleDeleteSucursal = async (id) => {
    try {
      await apiClient.delete(`sucursales/${id}`, { token: authToken() });
      await reloadSucursales();
      toast.success('Sucursal eliminada');
    } catch (err) {
      toast.error(err.message || 'Error al eliminar sucursal');
    }
  };

  const startEditSucursal = (s) => {
    setEditingSucursalId(s.id);
    setEditSucursalForm({ nombre: s.nombre || '', codigo: s.codigo || '', activa: !!s.activa });
  };

  const cancelEditSucursal = () => {
    setEditingSucursalId(null);
    setEditSucursalForm({ nombre: '', codigo: '', activa: true });
  };

  const handleSaveEditSucursal = async (id) => {
    if (!editSucursalForm.nombre) { toast.error('El nombre es obligatorio'); return; }
    try {
      await apiClient.patch(`sucursales/${id}`, { nombre: editSucursalForm.nombre, codigo: editSucursalForm.codigo, activa: editSucursalForm.activa }, { token: authToken() });
      await reloadSucursales();
      cancelEditSucursal();
      toast.success('Sucursal actualizada');
    } catch (err) {
      toast.error(err.message || 'Error al actualizar sucursal');
    }
  };

  const handleToggleActivaSucursal = async (s) => {
    try {
      await apiClient.patch(`sucursales/${s.id}`, { activa: !s.activa }, { token: authToken() });
      await reloadSucursales();
      toast.success(!s.activa ? 'Sucursal activada' : 'Sucursal desactivada');
    } catch (err) {
      toast.error(err.message || 'Error al cambiar estado');
    }
  };

  const startEditGoal = (row) => {
    if (!canEditGoals) return;
    setEditingGoalId(row.id);
    setEditGoalValue(String(row.monthly_goal ?? 0));
  };

  const cancelEditGoal = () => { setEditingGoalId(null); setEditGoalValue(''); };

  const handleSaveGoal = async (row) => {
    if (!canEditGoals) return;
    setSavingGoal(true);
    try {
      await goalsService.setMonthlyGoal({ id: row.id, userId: row.user_id, monthlyGoal: editGoalValue });
      const next = await goalsService.listSellerGoals();
      setSalespersonGoals(next);
      cancelEditGoal();
      toast.success('Meta mensual actualizada');
    } catch (err) {
      toast.error(err.message || 'No se pudo guardar la meta');
    } finally {
      setSavingGoal(false);
    }
  };

  return (
    <Layout>
      <Helmet><title>Configuración General - H&S</title></Helmet>
      <div className="content-container space-y-8 py-6 w-full">
        <div className="w-full">
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-3">
            <Settings className="h-8 w-8 text-blue-600" /> Configuración General
          </h1>
          <p className="text-slate-500 mt-1 font-medium">Administración de sucursales, técnicos y metas corporativas</p>
        </div>

        {loading ? (
          <div className="h-40 flex items-center justify-center w-full">Cargando datos...</div>
        ) : (
          <Tabs defaultValue="sales" className="w-full">
            <TabsList className="bg-slate-100 dark:bg-slate-900/50 p-1 rounded-xl mb-6 flex flex-wrap h-auto">
              <TabsTrigger value="sales" className="rounded-lg gap-2"><Users className="h-4 w-4"/> Vendedores</TabsTrigger>
              <TabsTrigger value="branches" className="rounded-lg gap-2"><Building2 className="h-4 w-4"/> Sucursales</TabsTrigger>
              <TabsTrigger value="tecnicos" className="rounded-lg gap-2"><Wrench className="h-4 w-4"/> Técnicos</TabsTrigger>
              <TabsTrigger value="global" className="rounded-lg gap-2"><Target className="h-4 w-4"/> Metas Globales</TabsTrigger>
            </TabsList>

            <TabsContent value="sales" className="w-full">
              <Card className="border-slate-200 dark:border-slate-800 shadow-sm w-full">
                <CardHeader>
                  <CardTitle>Lista de Vendedores y Metas</CardTitle>
                  <p className="text-sm text-muted-foreground font-medium">
                    Solo el administrador puede editar la meta mensual.
                  </p>
                </CardHeader>
                <CardContent className="w-full">
                  <div className="overflow-x-auto w-full">
                    <table className="w-full text-sm text-left">
                      <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 font-bold uppercase tracking-wider text-xs border-b">
                        <tr>
                          <th className="px-4 py-3">Nombre</th>
                          <th className="px-4 py-3 text-right">Meta Mensual</th>
                          <th className="px-4 py-3 text-right">Acción</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {salespersonGoals.map((s) => (
                          <tr key={s.id}>
                            <td className="px-4 py-3 font-bold">{s.salesperson_name}</td>
                            <td className="px-4 py-3 text-right font-medium">
                              {editingGoalId === s.id ? (
                                <input
                                  type="number" min="0"
                                  value={editGoalValue}
                                  onChange={(e) => setEditGoalValue(e.target.value)}
                                  className="ml-auto w-32 p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-right tabular-nums"
                                  disabled={savingGoal}
                                  autoFocus
                                />
                              ) : (
                                <span className="tabular-nums">Bs {Number(s.monthly_goal || 0).toLocaleString('es-BO')}</span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-right">
                              {canEditGoals ? (
                                <div className="inline-flex items-center gap-1 justify-end">
                                  {editingGoalId === s.id ? (
                                    <>
                                      <Button type="button" variant="ghost" size="sm" disabled={savingGoal} onClick={() => handleSaveGoal(s)} className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50" title="Guardar">
                                        <Check className="h-4 w-4" />
                                      </Button>
                                      <Button type="button" variant="ghost" size="sm" disabled={savingGoal} onClick={cancelEditGoal} className="text-slate-500" title="Cancelar">
                                        <X className="h-4 w-4" />
                                      </Button>
                                    </>
                                  ) : (
                                    <Button type="button" variant="ghost" size="sm" onClick={() => startEditGoal(s)} className="text-primary hover:bg-primary/10" title="Editar meta">
                                      <Pencil className="h-4 w-4" />
                                    </Button>
                                  )}
                                </div>
                              ) : (
                                <span className="text-xs text-muted-foreground">Solo lectura</span>
                              )}
                            </td>
                          </tr>
                        ))}
                        {salespersonGoals.length === 0 && (
                          <tr><td colSpan="3" className="text-center p-4 text-slate-500">No hay vendedores registrados.</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="branches" className="w-full space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 w-full">
                <Card className="border-slate-200 dark:border-slate-800 shadow-sm h-fit w-full">
                  <CardHeader><CardTitle>Crear Sucursal Base</CardTitle></CardHeader>
                  <CardContent>
                    <form onSubmit={handleAddSucursal} className="space-y-4 w-full">
                      <div className="w-full">
                        <label className="block text-sm font-bold mb-1">Nombre (Ej: Central)</label>
                        <input required type="text" value={newSucursal.nombre} onChange={(e) => setNewSucursal({ ...newSucursal, nombre: e.target.value })} className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white" />
                      </div>
                      <div className="w-full">
                        <label className="block text-sm font-bold mb-1">Código (Opcional)</label>
                        <input type="text" value={newSucursal.codigo} onChange={(e) => setNewSucursal({ ...newSucursal, codigo: e.target.value })} className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white" />
                      </div>
                      <Button type="submit" className="w-full">Registrar Sucursal Base</Button>
                    </form>
                  </CardContent>
                </Card>

                <Card className="lg:col-span-2 border-slate-200 dark:border-slate-800 shadow-sm w-full">
                  <CardHeader><CardTitle>Directorio de Sucursales</CardTitle></CardHeader>
                  <CardContent className="w-full">
                    <div className="overflow-x-auto w-full">
                      <table className="w-full text-sm text-left">
                        <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 font-bold uppercase tracking-wider text-xs border-b">
                          <tr>
                            <th className="px-4 py-3">Nombre</th>
                            <th className="px-4 py-3 text-center">Estado</th>
                            <th className="px-4 py-3 text-right">Acción</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                          {sucursales.map(s => (
                            editingSucursalId === s.id ? (
                              <tr key={s.id} className="bg-blue-50/50 dark:bg-blue-900/10">
                                <td className="px-4 py-3">
                                  <div className="flex gap-2">
                                    <input type="text" value={editSucursalForm.nombre} onChange={(e) => setEditSucursalForm({ ...editSucursalForm, nombre: e.target.value })} className="w-full p-1.5 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm" placeholder="Nombre" />
                                    <input type="text" value={editSucursalForm.codigo} onChange={(e) => setEditSucursalForm({ ...editSucursalForm, codigo: e.target.value })} className="w-24 p-1.5 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm" placeholder="Código" />
                                  </div>
                                </td>
                                <td className="px-4 py-3 text-center">
                                  <label className="inline-flex items-center gap-2 text-xs font-bold cursor-pointer">
                                    <input type="checkbox" checked={editSucursalForm.activa} onChange={(e) => setEditSucursalForm({ ...editSucursalForm, activa: e.target.checked })} />
                                    {editSucursalForm.activa ? 'Activa' : 'Inactiva'}
                                  </label>
                                </td>
                                <td className="px-4 py-3 text-right">
                                  <div className="flex justify-end gap-1">
                                    <Button variant="ghost" size="sm" onClick={() => handleSaveEditSucursal(s.id)} className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"><Check className="h-4 w-4"/></Button>
                                    <Button variant="ghost" size="sm" onClick={cancelEditSucursal} className="text-slate-500"><X className="h-4 w-4"/></Button>
                                  </div>
                                </td>
                              </tr>
                            ) : (
                              <tr key={s.id}>
                                <td className="px-4 py-3 font-bold">{s.nombre} {s.codigo && <span className="text-muted-foreground ml-2">({s.codigo})</span>}</td>
                                <td className="px-4 py-3 text-center">
                                  <button type="button" onClick={() => handleToggleActivaSucursal(s)} className={`text-xs px-2 py-1 rounded-full font-bold transition-colors ${s.activa ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                                    {s.activa ? 'Activa' : 'Inactiva'}
                                  </button>
                                </td>
                                <td className="px-4 py-3 text-right">
                                  <div className="flex justify-end gap-1">
                                    <Button variant="ghost" size="sm" onClick={() => startEditSucursal(s)} className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"><Pencil className="h-4 w-4"/></Button>
                                    <Button variant="ghost" size="sm" onClick={() => handleDeleteSucursal(s.id)} className="text-red-500 hover:text-red-700 hover:bg-red-50">X</Button>
                                  </div>
                                </td>
                              </tr>
                            )
                          ))}
                          {sucursales.length === 0 && (
                            <tr><td colSpan="3" className="text-center p-4 text-slate-500">No hay sucursales registradas.</td></tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="tecnicos" className="w-full">
              <Card className="border-slate-200 dark:border-slate-800 shadow-sm w-full">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><Wrench className="h-5 w-5"/> Técnicos del Sistema</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-start gap-3 p-4 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800">
                    <Info className="h-5 w-5 text-blue-600 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-sm font-bold text-blue-900 dark:text-blue-100">Los técnicos se administran como usuarios del sistema</p>
                      <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                        Los técnicos son usuarios con rol <strong>SEGURIDAD ELECTRÓNICA</strong>. Para agregar o gestionar técnicos, solicita al administrador del sistema que cree o actualice la cuenta de usuario correspondiente.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="global" className="w-full">
              <Card className="border-slate-200 dark:border-slate-800 shadow-sm w-full">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><Target className="h-5 w-5"/> Metas Globales y Metas por Sucursal</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
                    <Info className="h-5 w-5 text-amber-600 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-sm font-bold text-amber-900 dark:text-amber-100">Módulo en desarrollo</p>
                      <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                        La configuración de metas globales y metas por sucursal estará disponible próximamente.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </Layout>
  );
};

export default ConfigurationPage;
