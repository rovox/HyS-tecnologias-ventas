import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import pb from '@/lib/pocketbaseClient.js';
import { useAuth } from '@/contexts/AuthContext.jsx';
import Layout from '@/components/Layout.jsx';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Settings, Target, Users, Building2, Trash2, Wrench, Pencil, Check, X } from 'lucide-react';
import { toast } from 'sonner';
import { goalsService } from '@/services/goals/index.js';
import { isMockMode } from '@/api/config.js';

const ConfigurationPage = () => {
  const { canAccessExecutivePanel, currentUser, isAdmin } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [globalConfig, setGlobalConfig] = useState(null);
  const [salespersonGoals, setSalespersonGoals] = useState([]);
  const [branchGoals, setBranchGoals] = useState([]);
  const [sucursales, setSucursales] = useState([]);
  const [tecnicos, setTecnicos] = useState([]);

  // Form states
  const [globalForm, setGlobalForm] = useState({ general_goal: 0, monthly_goal: 0, weekly_goal: 0 });
  const [newSalesperson, setNewSalesperson] = useState({ salesperson_name: '', monthly_goal: '' });
  const [newBranchGoal, setNewBranchGoal] = useState({ branch_name: '', monthly_goal: '', annual_goal: '' });
  const [newSucursal, setNewSucursal] = useState({ nombre: '', codigo: '' });
  const [newTecnico, setNewTecnico] = useState({ nombre: '' });
  const [editingSucursalId, setEditingSucursalId] = useState(null);
  const [editSucursalForm, setEditSucursalForm] = useState({ nombre: '', codigo: '', activa: true });
  const [editingGoalId, setEditingGoalId] = useState(null);
  const [editGoalValue, setEditGoalValue] = useState('');
  const [savingGoal, setSavingGoal] = useState(false);

  const canEditGoals = isAdmin();

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const [configRes, sgRes, bgRes, sucRes, tecRes] = await Promise.all([
          pb.collection('configuration').getFullList({ $autoCancel: false }),
          goalsService.listSellerGoals(),
          pb.collection('branch_goals').getFullList({ $autoCancel: false }),
          pb.collection('sucursales').getFullList({ sort: 'nombre', $autoCancel: false }),
          pb.collection('tecnicos').getFullList({ sort: 'nombre', $autoCancel: false })
        ]);
        
        if (configRes.length > 0) {
          setGlobalConfig(configRes[0]);
          setGlobalForm({
            general_goal: configRes[0].general_goal || 0,
            monthly_goal: configRes[0].monthly_goal || 0,
            weekly_goal: configRes[0].weekly_goal || 0,
          });
        }
        setSalespersonGoals(sgRes);
        setBranchGoals(bgRes);
        setSucursales(sucRes);
        setTecnicos(tecRes);
      } catch (error) {
        console.error('Error fetching configuration:', error);
        toast.error('Error al cargar la configuración. Revise consola.');
      } finally {
        setLoading(false);
      }
    };

    if (canAccessExecutivePanel()) {
      fetchConfig();
    } else {
      setLoading(false);
    }
  }, [canAccessExecutivePanel]);

  if (!canAccessExecutivePanel()) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleSaveGlobal = async (e) => {
    e.preventDefault();
    try {
      const data = {
        ...globalForm,
        general_goal: Number(globalForm.general_goal),
        monthly_goal: Number(globalForm.monthly_goal),
        weekly_goal: Number(globalForm.weekly_goal),
        updated_by: currentUser.id
      };

      if (globalConfig?.id) {
        await pb.collection('configuration').update(globalConfig.id, data, { $autoCancel: false });
      } else {
        data.created_by = currentUser.id;
        const newRecord = await pb.collection('configuration').create(data, { $autoCancel: false });
        setGlobalConfig(newRecord);
      }
      toast.success('Configuración global guardada correctamente');
    } catch (error) {
      toast.error('Error al guardar configuración global');
    }
  };

  const handleAddSalesperson = async (e) => {
    e.preventDefault();
    if (!canEditGoals) return;
    if (!newSalesperson.salesperson_name) return;
    try {
      const record = await goalsService.createSellerGoal({
        name: newSalesperson.salesperson_name,
        monthlyGoal: newSalesperson.monthly_goal,
      });
      setSalespersonGoals([...salespersonGoals, record]);
      setNewSalesperson({ salesperson_name: '', monthly_goal: '' });
      toast.success('Vendedor y meta mensual agregados');
    } catch (error) {
      toast.error(error.message || 'Error al agregar vendedor');
    }
  };

  const startEditGoal = (row) => {
    if (!canEditGoals) return;
    setEditingGoalId(row.id);
    setEditGoalValue(String(row.monthly_goal ?? 0));
  };

  const cancelEditGoal = () => {
    setEditingGoalId(null);
    setEditGoalValue('');
  };

  const handleSaveGoal = async (row) => {
    if (!canEditGoals) return;
    setSavingGoal(true);
    try {
      await goalsService.setMonthlyGoal({
        id: row.id,
        userId: row.user_id,
        monthlyGoal: editGoalValue,
      });
      const next = await goalsService.listSellerGoals();
      setSalespersonGoals(next);
      cancelEditGoal();
      toast.success('Meta mensual actualizada');
    } catch (error) {
      toast.error(error.message || 'No se pudo guardar la meta');
    } finally {
      setSavingGoal(false);
    }
  };

  const handleDeleteSalesperson = async (id) => {
    if (!canEditGoals) return;
    try {
      await goalsService.removeSellerGoal(id);
      setSalespersonGoals(salespersonGoals.filter(s => s.id !== id));
      toast.success('Registro eliminado');
    } catch (error) {
      toast.error(error.message || 'Error al eliminar');
    }
  };

  const handleAddBranchGoal = async (e) => {
    e.preventDefault();
    if (!newBranchGoal.branch_name) return;
    try {
      const data = {
        branch_name: newBranchGoal.branch_name,
        monthly_goal: Number(newBranchGoal.monthly_goal) || 0,
        annual_goal: Number(newBranchGoal.annual_goal) || 0,
        created_by: currentUser.id
      };
      const record = await pb.collection('branch_goals').create(data, { $autoCancel: false });
      setBranchGoals([...branchGoals, record]);
      setNewBranchGoal({ branch_name: '', monthly_goal: '', annual_goal: '' });
      toast.success('Metas de sucursal agregadas');
    } catch (error) {
      toast.error('Error al agregar metas de sucursal');
    }
  };

  const handleDeleteBranchGoal = async (id) => {
    try {
      await pb.collection('branch_goals').delete(id, { $autoCancel: false });
      setBranchGoals(branchGoals.filter(b => b.id !== id));
      toast.success('Metas eliminadas');
    } catch (error) {
      toast.error('Error al eliminar metas');
    }
  };

  const reloadSucursales = async () => {
    try {
      const fresh = await pb.collection('sucursales').getFullList({ sort: 'nombre', $autoCancel: false });
      setSucursales(fresh);
    } catch (error) {
      toast.error('Error al refrescar sucursales');
    }
  };

  const handleAddSucursal = async (e) => {
    e.preventDefault();
    if (!newSucursal.nombre) return;
    try {
      const data = {
        nombre: newSucursal.nombre,
        codigo: newSucursal.codigo,
        activa: true
      };
      await pb.collection('sucursales').create(data, { $autoCancel: false });
      setNewSucursal({ nombre: '', codigo: '' });
      await reloadSucursales();
      toast.success('Sucursal base registrada exitosamente');
    } catch (error) {
      toast.error('Error al registrar sucursal base');
    }
  };

  const handleDeleteSucursal = async (id) => {
    try {
      await pb.collection('sucursales').delete(id, { $autoCancel: false });
      await reloadSucursales();
      toast.success('Sucursal base eliminada');
    } catch (error) {
      toast.error('Error al eliminar sucursal base');
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
    if (!editSucursalForm.nombre) {
      toast.error('El nombre de la sucursal es obligatorio');
      return;
    }
    try {
      await pb.collection('sucursales').update(id, {
        nombre: editSucursalForm.nombre,
        codigo: editSucursalForm.codigo,
        activa: editSucursalForm.activa
      }, { $autoCancel: false });
      await reloadSucursales();
      cancelEditSucursal();
      toast.success('Sucursal actualizada exitosamente');
    } catch (error) {
      toast.error('Error al actualizar la sucursal');
    }
  };

  const handleToggleActivaSucursal = async (s) => {
    try {
      await pb.collection('sucursales').update(s.id, { activa: !s.activa }, { $autoCancel: false });
      await reloadSucursales();
      toast.success(!s.activa ? 'Sucursal activada' : 'Sucursal desactivada');
    } catch (error) {
      toast.error('Error al cambiar el estado de la sucursal');
    }
  };

  const handleAddTecnico = async (e) => {
    e.preventDefault();
    if (!newTecnico.nombre) return;
    try {
      const data = {
        nombre: newTecnico.nombre,
        trabajos_realizados: 0
      };
      const record = await pb.collection('tecnicos').create(data, { $autoCancel: false });
      setTecnicos([...tecnicos, record]);
      setNewTecnico({ nombre: '' });
      toast.success('Técnico registrado exitosamente');
    } catch (error) {
      toast.error('Error al registrar técnico');
    }
  };

  const handleDeleteTecnico = async (id) => {
    if (!window.confirm('¿Está seguro de eliminar este técnico?')) return;
    try {
      await pb.collection('tecnicos').delete(id, { $autoCancel: false });
      setTecnicos(tecnicos.filter(t => t.id !== id));
      toast.success('Técnico eliminado');
    } catch (error) {
      toast.error('Error al eliminar técnico');
    }
  };

  return (
    <Layout>
      <Helmet>
        <title>Configuración General - H&S</title>
      </Helmet>
      
      <div className="content-container space-y-8 py-6 pb-20 w-full max-w-none">
        <div className="w-full">
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-3">
            <Settings className="h-8 w-8 text-blue-600" /> Configuración General
          </h1>
          <p className="text-slate-500 mt-1 font-medium">Administración de parámetros, sucursales, técnicos y metas corporativas</p>
        </div>

        {loading ? (
          <div className="h-40 flex items-center justify-center w-full">Cargando datos...</div>
        ) : (
          <Tabs defaultValue="global" className="w-full">
            <TabsList className="bg-slate-100 dark:bg-slate-900/50 p-1 rounded-xl mb-6 flex flex-wrap h-auto">
              <TabsTrigger value="global" className="rounded-lg gap-2"><Target className="h-4 w-4"/> Metas Globales</TabsTrigger>
              <TabsTrigger value="sales" className="rounded-lg gap-2"><Users className="h-4 w-4"/> Vendedores</TabsTrigger>
              <TabsTrigger value="branches" className="rounded-lg gap-2"><Building2 className="h-4 w-4"/> Sucursales</TabsTrigger>
              <TabsTrigger value="tecnicos" className="rounded-lg gap-2"><Wrench className="h-4 w-4"/> Técnicos</TabsTrigger>
            </TabsList>

            <TabsContent value="global" className="w-full">
              <Card className="border-slate-200 dark:border-slate-800 shadow-sm w-full">
                <CardHeader>
                  <CardTitle>Objetivos Corporativos</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSaveGlobal} className="space-y-4 max-w-xl w-full">
                    <div className="w-full">
                      <label className="block text-sm font-bold mb-1">Meta General (Anual)</label>
                      <input 
                        type="number" 
                        value={globalForm.general_goal} 
                        onChange={(e) => setGlobalForm({...globalForm, general_goal: e.target.value})}
                        className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                      />
                    </div>
                    <div className="w-full">
                      <label className="block text-sm font-bold mb-1">Meta Mensual Base</label>
                      <input 
                        type="number" 
                        value={globalForm.monthly_goal} 
                        onChange={(e) => setGlobalForm({...globalForm, monthly_goal: e.target.value})}
                        className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                      />
                    </div>
                    <div className="w-full">
                      <label className="block text-sm font-bold mb-1">Meta Semanal Base</label>
                      <input 
                        type="number" 
                        value={globalForm.weekly_goal} 
                        onChange={(e) => setGlobalForm({...globalForm, weekly_goal: e.target.value})}
                        className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                      />
                    </div>
                    <Button type="submit" className="w-full">Guardar Configuración Global</Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="sales" className="w-full">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 w-full">
                {isMockMode && canEditGoals && (
                <Card className="border-slate-200 dark:border-slate-800 shadow-sm h-fit w-full">
                  <CardHeader>
                    <CardTitle>Agregar Vendedor</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleAddSalesperson} className="space-y-4 w-full">
                      <div className="w-full">
                        <label className="block text-sm font-bold mb-1">Nombre Completo</label>
                        <input required type="text" value={newSalesperson.salesperson_name} onChange={(e) => setNewSalesperson({...newSalesperson, salesperson_name: e.target.value})} className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white" />
                      </div>
                      <div className="w-full">
                        <label className="block text-sm font-bold mb-1">Meta Mensual (Bs)</label>
                        <input type="number" min="0" value={newSalesperson.monthly_goal} onChange={(e) => setNewSalesperson({...newSalesperson, monthly_goal: e.target.value})} className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white" />
                      </div>
                      <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700">Registrar Vendedor</Button>
                    </form>
                  </CardContent>
                </Card>
                )}

                <Card className={`${isMockMode && canEditGoals ? 'lg:col-span-2' : 'lg:col-span-3'} border-slate-200 dark:border-slate-800 shadow-sm w-full`}>
                  <CardHeader>
                    <CardTitle>Lista de Vendedores y Metas</CardTitle>
                    <p className="text-sm text-muted-foreground font-medium">
                      Solo el administrador puede editar la meta mensual. No se usa meta anual.
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
                                    type="number"
                                    min="0"
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
                                        <Button
                                          type="button"
                                          variant="ghost"
                                          size="sm"
                                          disabled={savingGoal}
                                          onClick={() => handleSaveGoal(s)}
                                          className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                                          title="Guardar"
                                        >
                                          <Check className="h-4 w-4" />
                                        </Button>
                                        <Button
                                          type="button"
                                          variant="ghost"
                                          size="sm"
                                          disabled={savingGoal}
                                          onClick={cancelEditGoal}
                                          className="text-slate-500"
                                          title="Cancelar"
                                        >
                                          <X className="h-4 w-4" />
                                        </Button>
                                      </>
                                    ) : (
                                      <>
                                        <Button
                                          type="button"
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => startEditGoal(s)}
                                          className="text-primary hover:bg-primary/10"
                                          title="Editar meta"
                                        >
                                          <Pencil className="h-4 w-4" />
                                        </Button>
                                        {isMockMode && (
                                          <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleDeleteSalesperson(s.id)}
                                            className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                                            title="Eliminar"
                                          >
                                            <Trash2 className="h-4 w-4" />
                                          </Button>
                                        )}
                                      </>
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
              </div>
            </TabsContent>

            <TabsContent value="branches" className="w-full space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 w-full">
                <Card className="border-slate-200 dark:border-slate-800 shadow-sm h-fit w-full">
                  <CardHeader>
                    <CardTitle>Crear Sucursal Base</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleAddSucursal} className="space-y-4 w-full">
                      <div className="w-full">
                        <label className="block text-sm font-bold mb-1">Nombre (Ej: Central)</label>
                        <input required type="text" value={newSucursal.nombre} onChange={(e) => setNewSucursal({...newSucursal, nombre: e.target.value})} className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white" />
                      </div>
                      <div className="w-full">
                        <label className="block text-sm font-bold mb-1">Código (Opcional)</label>
                        <input type="text" value={newSucursal.codigo} onChange={(e) => setNewSucursal({...newSucursal, codigo: e.target.value})} className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white" />
                      </div>
                      <Button type="submit" className="w-full">Registrar Sucursal Base</Button>
                    </form>
                  </CardContent>
                </Card>

                <Card className="lg:col-span-2 border-slate-200 dark:border-slate-800 shadow-sm w-full">
                  <CardHeader>
                    <CardTitle>Directorio de Sucursales (Bases Activas)</CardTitle>
                  </CardHeader>
                  <CardContent className="w-full">
                    <div className="overflow-x-auto w-full">
                      <table className="w-full text-sm text-left">
                        <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 font-bold uppercase tracking-wider text-xs border-b">
                          <tr>
                            <th className="px-4 py-3">Nombre de la Sucursal</th>
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
                                    <input
                                      type="text"
                                      value={editSucursalForm.nombre}
                                      onChange={(e) => setEditSucursalForm({ ...editSucursalForm, nombre: e.target.value })}
                                      className="w-full p-1.5 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm"
                                      placeholder="Nombre"
                                    />
                                    <input
                                      type="text"
                                      value={editSucursalForm.codigo}
                                      onChange={(e) => setEditSucursalForm({ ...editSucursalForm, codigo: e.target.value })}
                                      className="w-24 p-1.5 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm"
                                      placeholder="Código"
                                    />
                                  </div>
                                </td>
                                <td className="px-4 py-3 text-center">
                                  <label className="inline-flex items-center gap-2 text-xs font-bold cursor-pointer">
                                    <input
                                      type="checkbox"
                                      checked={editSucursalForm.activa}
                                      onChange={(e) => setEditSucursalForm({ ...editSucursalForm, activa: e.target.checked })}
                                    />
                                    {editSucursalForm.activa ? 'Activa' : 'Inactiva'}
                                  </label>
                                </td>
                                <td className="px-4 py-3 text-right">
                                  <div className="flex justify-end gap-1">
                                    <Button variant="ghost" size="sm" onClick={() => handleSaveEditSucursal(s.id)} className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-900/20"><Check className="h-4 w-4"/></Button>
                                    <Button variant="ghost" size="sm" onClick={cancelEditSucursal} className="text-slate-500 hover:text-slate-700 hover:bg-slate-50 dark:hover:bg-slate-900/20"><X className="h-4 w-4"/></Button>
                                  </div>
                                </td>
                              </tr>
                            ) : (
                              <tr key={s.id}>
                                <td className="px-4 py-3 font-bold">{s.nombre} {s.codigo && <span className="text-muted-foreground ml-2">({s.codigo})</span>}</td>
                                <td className="px-4 py-3 text-center">
                                  <button
                                    type="button"
                                    onClick={() => handleToggleActivaSucursal(s)}
                                    className={`text-xs px-2 py-1 rounded-full font-bold transition-colors ${s.activa ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                                    title="Clic para cambiar estado"
                                  >
                                    {s.activa ? 'Activa' : 'Inactiva'}
                                  </button>
                                </td>
                                <td className="px-4 py-3 text-right">
                                  <div className="flex justify-end gap-1">
                                    <Button variant="ghost" size="sm" onClick={() => startEditSucursal(s)} className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20"><Pencil className="h-4 w-4"/></Button>
                                    <Button variant="ghost" size="sm" onClick={() => handleDeleteSucursal(s.id)} className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"><Trash2 className="h-4 w-4"/></Button>
                                  </div>
                                </td>
                              </tr>
                            )
                          ))}
                          {sucursales.length === 0 && (
                            <tr><td colSpan="3" className="text-center p-4 text-slate-500">No hay sucursales registradas en la base.</td></tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 w-full pt-6 border-t border-slate-200 dark:border-slate-800">
                <Card className="border-slate-200 dark:border-slate-800 shadow-sm h-fit w-full bg-slate-50/50 dark:bg-slate-900/20">
                  <CardHeader>
                    <CardTitle>Asignar Metas a Sucursal</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleAddBranchGoal} className="space-y-4 w-full">
                      <div className="w-full">
                        <label className="block text-sm font-bold mb-1">Seleccionar Sucursal</label>
                        <select required value={newBranchGoal.branch_name} onChange={(e) => setNewBranchGoal({...newBranchGoal, branch_name: e.target.value})} className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
                          <option value="">Seleccione una sucursal...</option>
                          {sucursales.map(s => (
                            <option key={s.id} value={s.nombre}>{s.nombre}</option>
                          ))}
                        </select>
                      </div>
                      <div className="w-full">
                        <label className="block text-sm font-bold mb-1">Meta Mensual ($)</label>
                        <input type="number" value={newBranchGoal.monthly_goal} onChange={(e) => setNewBranchGoal({...newBranchGoal, monthly_goal: e.target.value})} className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white" />
                      </div>
                      <div className="w-full">
                        <label className="block text-sm font-bold mb-1">Meta Anual ($)</label>
                        <input type="number" value={newBranchGoal.annual_goal} onChange={(e) => setNewBranchGoal({...newBranchGoal, annual_goal: e.target.value})} className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white" />
                      </div>
                      <Button type="submit" variant="secondary" className="w-full">Registrar Metas</Button>
                    </form>
                  </CardContent>
                </Card>

                <Card className="lg:col-span-2 border-slate-200 dark:border-slate-800 shadow-sm w-full bg-slate-50/50 dark:bg-slate-900/20">
                  <CardHeader>
                    <CardTitle>Historial de Metas por Sucursal</CardTitle>
                  </CardHeader>
                  <CardContent className="w-full">
                    <div className="overflow-x-auto w-full">
                      <table className="w-full text-sm text-left">
                        <thead className="bg-white dark:bg-slate-950 text-slate-500 font-bold uppercase tracking-wider text-xs border-b">
                          <tr>
                            <th className="px-4 py-3">Sucursal</th>
                            <th className="px-4 py-3 text-right">Meta Mensual</th>
                            <th className="px-4 py-3 text-right">Meta Anual</th>
                            <th className="px-4 py-3 text-right">Acción</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                          {branchGoals.map(b => (
                            <tr key={b.id}>
                              <td className="px-4 py-3 font-bold">{b.branch_name}</td>
                              <td className="px-4 py-3 text-right font-medium">${b.monthly_goal?.toLocaleString()}</td>
                              <td className="px-4 py-3 text-right font-medium">${b.annual_goal?.toLocaleString()}</td>
                              <td className="px-4 py-3 text-right">
                                <Button variant="ghost" size="sm" onClick={() => handleDeleteBranchGoal(b.id)} className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"><Trash2 className="h-4 w-4"/></Button>
                              </td>
                            </tr>
                          ))}
                          {branchGoals.length === 0 && (
                            <tr><td colSpan="4" className="text-center p-4 text-slate-500">No hay metas registradas para sucursales.</td></tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="tecnicos" className="w-full">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 w-full">
                <Card className="border-slate-200 dark:border-slate-800 shadow-sm h-fit w-full">
                  <CardHeader>
                    <CardTitle>Agregar Técnico</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleAddTecnico} className="space-y-4 w-full">
                      <div className="w-full">
                        <label className="block text-sm font-bold mb-1">Nombre Completo</label>
                        <input required type="text" value={newTecnico.nombre} onChange={(e) => setNewTecnico({...newTecnico, nombre: e.target.value})} className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white" />
                      </div>
                      <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700">Registrar Técnico</Button>
                    </form>
                  </CardContent>
                </Card>

                <Card className="lg:col-span-2 border-slate-200 dark:border-slate-800 shadow-sm w-full">
                  <CardHeader>
                    <CardTitle>Directorio de Técnicos</CardTitle>
                  </CardHeader>
                  <CardContent className="w-full">
                    <div className="overflow-x-auto w-full">
                      <table className="w-full text-sm text-left">
                        <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 font-bold uppercase tracking-wider text-xs border-b">
                          <tr>
                            <th className="px-4 py-3">Nombre</th>
                            <th className="px-4 py-3 text-center">Trabajos Realizados</th>
                            <th className="px-4 py-3 text-right">Acción</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                          {tecnicos.map(t => (
                            <tr key={t.id}>
                              <td className="px-4 py-3 font-bold">{t.nombre}</td>
                              <td className="px-4 py-3 text-center font-medium">{t.trabajos_realizados || 0}</td>
                              <td className="px-4 py-3 text-right">
                                <Button variant="ghost" size="sm" onClick={() => handleDeleteTecnico(t.id)} className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"><Trash2 className="h-4 w-4"/></Button>
                              </td>
                            </tr>
                          ))}
                          {tecnicos.length === 0 && (
                            <tr><td colSpan="3" className="text-center p-4 text-slate-500">No hay técnicos registrados.</td></tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </Layout>
  );
};

export default ConfigurationPage;