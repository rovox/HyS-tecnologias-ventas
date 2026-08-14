import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { Search, Plus, CarFront, AlertCircle, Wrench, CheckCircle, Car } from 'lucide-react';
import Layout from '@/components/Layout.jsx';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useVehicleControl } from '@/hooks/useVehicleControl.js';
import VehicleFormModal from '@/components/VehicleFormModal.jsx';
import DeleteConfirmationModal from '@/components/DeleteConfirmationModal.jsx';
import pb from '@/lib/pocketbaseClient.js';

const VehicleControlPage = () => {
  const navigate = useNavigate();
  const { getVehicles, createVehicle, updateVehicle, deleteVehicle, loading, isTech } = useVehicleControl();
  
  const [vehicles, setVehicles] = useState([]);
  const [filteredVehicles, setFilteredVehicles] = useState([]);
  const [stats, setStats] = useState({ total: 0, disponible: 0, uso: 0, mantenimiento: 0, inactivo: 0 });
  
  const [filters, setFilters] = useState({ estado: 'todos', sucursal: 'todas', search: '' });
  const [sucursales, setSucursales] = useState([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState(null);

  const loadData = async () => {
    const res = await getVehicles();
    if (res.success) {
      setVehicles(res.data);
      applyLocalFilters(res.data, filters);
      calculateStats(res.data);
    }
  };

  useEffect(() => {
    loadData();
    pb.collection('sucursales').getFullList({ filter: 'activa = true', sort: 'nombre', requestKey: 'vc-suc' })
      .then(setSucursales).catch(() => setSucursales([]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    applyLocalFilters(vehicles, filters);
  }, [filters, vehicles]);

  const calculateStats = (data) => {
    const s = { total: data.length, disponible: 0, uso: 0, mantenimiento: 0, inactivo: 0 };
    data.forEach(v => {
      if (v.estado === 'activo') s.disponible++;
      else if (v.estado === 'en_uso') s.uso++;
      else if (v.estado === 'en_mantenimiento') s.mantenimiento++;
      else s.inactivo++;
    });
    setStats(s);
  };

  const applyLocalFilters = (data, f) => {
    let filtered = data;
    if (f.estado !== 'todos') filtered = filtered.filter(v => v.estado === f.estado);
    if (f.sucursal !== 'todas') filtered = filtered.filter(v => v.sucursal_id === f.sucursal);
    if (f.search) {
      const q = f.search.toLowerCase();
      filtered = filtered.filter(v => 
        v.patente?.toLowerCase().includes(q) || 
        v.marca?.toLowerCase().includes(q) || 
        v.modelo?.toLowerCase().includes(q)
      );
    }
    setFilteredVehicles(filtered);
  };

  const handleCreate = () => {
    setSelectedVehicle(null);
    setIsFormOpen(true);
  };

  const handleEdit = (e, v) => {
    e.stopPropagation();
    setSelectedVehicle(v);
    setIsFormOpen(true);
  };

  const handleDeletePrompt = (e, v) => {
    e.stopPropagation();
    setSelectedVehicle(v);
    setIsDeleteOpen(true);
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'activo': return <Badge className="badge-vehicle-disponible">Disponible</Badge>;
      case 'en_uso': return <Badge className="badge-vehicle-uso">En Uso</Badge>;
      case 'en_mantenimiento': return <Badge className="badge-vehicle-mantenimiento">Taller</Badge>;
      default: return <Badge className="badge-vehicle-inactivo">Fuera Servicio</Badge>;
    }
  };

  return (
    <Layout>
      <Helmet><title>Control Vehicular</title></Helmet>
      
      <div className="content-container py-8 space-y-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">Flota Vehicular</h1>
            <p className="text-muted-foreground mt-1">Gestión y control de vehículos, mantenimientos y combustible.</p>
          </div>
          {!isTech && (
            <Button onClick={handleCreate} className="bg-primary hover:bg-primary/90 font-bold gap-2">
              <Plus className="h-4 w-4" /> Nuevo Vehículo
            </Button>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card className="p-4 flex flex-col justify-center items-start shadow-sm border bg-card">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Flota Total</span>
            <div className="flex items-center gap-2"><Car className="h-5 w-5 text-foreground/50"/> <span className="text-2xl font-black">{stats.total}</span></div>
          </Card>
          <Card className="p-4 flex flex-col justify-center items-start shadow-sm border bg-emerald-50 dark:bg-emerald-950/20 border-emerald-100 dark:border-emerald-900/30 text-emerald-800 dark:text-emerald-300">
            <span className="text-xs font-bold uppercase tracking-wider mb-1 opacity-80">Disponibles</span>
            <div className="flex items-center gap-2"><CheckCircle className="h-5 w-5"/> <span className="text-2xl font-black">{stats.disponible}</span></div>
          </Card>
          <Card className="p-4 flex flex-col justify-center items-start shadow-sm border bg-blue-50 dark:bg-blue-950/20 border-blue-100 dark:border-blue-900/30 text-blue-800 dark:text-blue-300">
            <span className="text-xs font-bold uppercase tracking-wider mb-1 opacity-80">En Uso</span>
            <div className="flex items-center gap-2"><CarFront className="h-5 w-5"/> <span className="text-2xl font-black">{stats.uso}</span></div>
          </Card>
          <Card className="p-4 flex flex-col justify-center items-start shadow-sm border bg-orange-50 dark:bg-orange-950/20 border-orange-100 dark:border-orange-900/30 text-orange-800 dark:text-orange-300">
            <span className="text-xs font-bold uppercase tracking-wider mb-1 opacity-80">En Taller</span>
            <div className="flex items-center gap-2"><Wrench className="h-5 w-5"/> <span className="text-2xl font-black">{stats.mantenimiento}</span></div>
          </Card>
          <Card className="p-4 flex flex-col justify-center items-start shadow-sm border bg-red-50 dark:bg-red-950/20 border-red-100 dark:border-red-900/30 text-red-800 dark:text-red-300">
            <span className="text-xs font-bold uppercase tracking-wider mb-1 opacity-80">Baja / Fuera</span>
            <div className="flex items-center gap-2"><AlertCircle className="h-5 w-5"/> <span className="text-2xl font-black">{stats.inactivo}</span></div>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 bg-muted/30 p-4 rounded-xl border">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Buscar por placa, marca o modelo..." 
              className="pl-9 bg-background"
              value={filters.search}
              onChange={(e) => setFilters(prev => ({...prev, search: e.target.value}))}
            />
          </div>
          <Select value={filters.estado} onValueChange={(val) => setFilters(prev => ({...prev, estado: val}))}>
            <SelectTrigger className="w-full sm:w-[180px] bg-background">
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos los estados</SelectItem>
              <SelectItem value="activo">Disponible</SelectItem>
              <SelectItem value="en_uso">En Uso</SelectItem>
              <SelectItem value="en_mantenimiento">Mantenimiento</SelectItem>
              <SelectItem value="inactivo">Fuera Servicio</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filters.sucursal} onValueChange={(val) => setFilters(prev => ({...prev, sucursal: val}))}>
            <SelectTrigger className="w-full sm:w-[180px] bg-background">
              <SelectValue placeholder="Sucursal" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todas">Todas las sucursales</SelectItem>
              {sucursales.map(s => <SelectItem key={s.id} value={s.id}>{s.nombre}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        <Card className="border shadow-sm overflow-hidden rounded-xl">
          <div className="overflow-x-auto w-full">
            <table className="w-full text-sm text-left">
              <thead className="bg-muted/50 text-muted-foreground font-bold uppercase tracking-wider text-xs border-b">
                <tr>
                  <th className="px-5 py-4">Patente / Placa</th>
                  <th className="px-5 py-4">Vehículo</th>
                  <th className="px-5 py-4">Sucursal</th>
                  <th className="px-5 py-4">Estado</th>
                  <th className="px-5 py-4 text-right">Odómetro</th>
                  {!isTech && <th className="px-5 py-4 text-right">Acciones</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loading ? (
                  Array.from({length: 3}).map((_, i) => (
                    <tr key={i}><td colSpan="6" className="p-4"><Skeleton className="h-8 w-full" /></td></tr>
                  ))
                ) : filteredVehicles.map(v => (
                  <tr key={v.id} className="interactive-card hover:bg-muted/30" onClick={() => navigate(`/vehicle-control/${v.id}`)}>
                    <td className="px-5 py-4 font-black text-lg tracking-wider">{v.patente}</td>
                    <td className="px-5 py-4 font-medium text-muted-foreground">
                      <span className="text-foreground">{v.marca}</span> {v.modelo} {v.anio ? `(${v.anio})` : ''}
                    </td>
                    <td className="px-5 py-4 font-medium">{sucursales.find(s => s.id === v.sucursal_id)?.nombre || v.sucursal_id || '—'}</td>
                    <td className="px-5 py-4">{getStatusBadge(v.estado)}</td>
                    <td className="px-5 py-4 text-right font-mono font-medium">{v.kilometraje_actual?.toLocaleString() || 0} km</td>
                    {!isTech && (
                      <td className="px-5 py-4 text-right">
                        <div className="flex justify-end gap-2" onClick={e => e.stopPropagation()}>
                          <Button variant="outline" size="sm" onClick={(e) => handleEdit(e, v)}>Editar</Button>
                          <Button variant="ghost" size="sm" className="text-destructive hover:bg-destructive/10" onClick={(e) => handleDeletePrompt(e, v)}>Eliminar</Button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
                {!loading && filteredVehicles.length === 0 && (
                  <tr><td colSpan="6" className="text-center py-12 text-muted-foreground font-medium">No se encontraron vehículos.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      <VehicleFormModal 
        isOpen={isFormOpen} 
        onClose={() => setIsFormOpen(false)} 
        onSave={async (data, id, oldData) => {
          if (id) await updateVehicle(id, data, oldData);
          else await createVehicle(data);
          loadData();
        }}
        initialData={selectedVehicle}
      />

      <DeleteConfirmationModal
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={async () => {
          await deleteVehicle(selectedVehicle.id);
          loadData();
          setIsDeleteOpen(false);
        }}
        title="Eliminar Vehículo"
        description="Esta acción eliminará el vehículo y no se puede deshacer. (No se recomienda si tiene historial)"
        itemName={selectedVehicle?.patente}
      />
    </Layout>
  );
};

export default VehicleControlPage;