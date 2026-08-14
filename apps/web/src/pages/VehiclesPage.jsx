import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import pb from '@/lib/pocketbaseClient.js';
import { useAuth } from '@/contexts/AuthContext.jsx';
import Layout from '@/components/Layout.jsx';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Truck, Plus, Search, FilterX, Eye, Edit2, Trash2, Gauge, User, MapPin } from 'lucide-react';
import { toast } from 'sonner';
import { useVehicleControl } from '@/hooks/useVehicleControl.js';
import VehicleFormModal from '@/components/VehicleFormModal.jsx';
import DeleteConfirmationModal from '@/components/DeleteConfirmationModal.jsx';

const VehiclesPage = () => {
  const { isAdmin } = useAuth();
  const { fetchVehicles, createVehicle, updateVehicle, deleteVehicle } = useVehicleControl();
  
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [usersMap, setUsersMap] = useState({});
  const [branches, setBranches] = useState([]);
  const [users, setUsers] = useState([]);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('todos');
  const [branchFilter, setBranchFilter] = useState('todas');
  const [userFilter, setUserFilter] = useState('todos');

  // Modals
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [vehRes, usersRes, branchesRes] = await Promise.all([
        fetchVehicles({ estado: statusFilter, sucursal: branchFilter, responsable: userFilter, search }),
        pb.collection('users').getFullList({ $autoCancel: false }).catch(() => []),
        pb.collection('branch_goals').getFullList({ $autoCancel: false }).catch(() => [])
      ]);

      if (vehRes.success) setVehicles(vehRes.data);
      
      const uMap = usersRes.reduce((acc, u) => ({ ...acc, [u.id]: u }), {});
      setUsersMap(uMap);
      setUsers(usersRes);
      setBranches(branchesRes);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Implement debounce for search
    const timer = setTimeout(() => {
      loadData();
    }, 300);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, statusFilter, branchFilter, userFilter]);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'activo': return <span className="badge-success text-[10px] px-2 py-0.5 rounded uppercase font-bold tracking-wide">Activo</span>;
      case 'en_mantenimiento': return <span className="badge-warning text-[10px] px-2 py-0.5 rounded uppercase font-bold tracking-wide">En Taller</span>;
      default: return <span className="badge-muted text-[10px] px-2 py-0.5 rounded uppercase font-bold tracking-wide">Inactivo</span>;
    }
  };

  const handleSaveVehicle = async (data, id) => {
    if (id) {
      return await updateVehicle(id, data, selectedVehicle);
    } else {
      return await createVehicle(data);
    }
  };

  const handleDelete = async () => {
    const res = await deleteVehicle(selectedVehicle.id);
    if (res.success) {
      toast.success('Vehículo eliminado');
      loadData();
    } else {
      toast.error('Error al eliminar');
    }
  };

  return (
    <Layout>
      <Helmet>
        <title>Control Vehicular - H&S</title>
      </Helmet>
      
      <div className="content-container space-y-6 py-6 pb-20 w-full max-w-none">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 w-full">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-3">
              <Truck className="h-8 w-8 text-primary" /> Control Vehicular
            </h1>
            <p className="text-muted-foreground mt-1 font-medium">Gestión de flota, mantenimientos y combustible</p>
          </div>
          {isAdmin() && (
            <Button onClick={() => { setSelectedVehicle(null); setIsFormOpen(true); }} className="gap-2 shadow-sm">
              <Plus className="h-4 w-4" /> Nuevo Vehículo
            </Button>
          )}
        </div>

        <Card className="p-4 shadow-sm border bg-card w-full">
          <div className="flex flex-col md:flex-row gap-4 w-full">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Buscar por placa, marca o modelo..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex flex-col sm:flex-row gap-4">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-[150px]">
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos los estados</SelectItem>
                  <SelectItem value="activo">Activos</SelectItem>
                  <SelectItem value="en_mantenimiento">En Mantenimiento</SelectItem>
                  <SelectItem value="inactivo">Inactivos</SelectItem>
                </SelectContent>
              </Select>
              <Select value={branchFilter} onValueChange={setBranchFilter}>
                <SelectTrigger className="w-full sm:w-[150px]">
                  <SelectValue placeholder="Sucursal" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todas">Todas las sucursales</SelectItem>
                  <SelectItem value="Central">Central</SelectItem>
                  {branches.map(b => <SelectItem key={b.id} value={b.branch_name}>{b.branch_name}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={userFilter} onValueChange={setUserFilter}>
                <SelectTrigger className="w-full sm:w-[150px]">
                  <SelectValue placeholder="Responsable" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="none">Sin asignar</SelectItem>
                  {users.map(u => <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>)}
                </SelectContent>
              </Select>
              {(search || statusFilter !== 'todos' || branchFilter !== 'todas' || userFilter !== 'todos') && (
                <Button variant="ghost" size="icon" onClick={() => { setSearch(''); setStatusFilter('todos'); setBranchFilter('todas'); setUserFilter('todos'); }} className="shrink-0 text-muted-foreground">
                  <FilterX className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 w-full">
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-56 w-full rounded-2xl" />)
          ) : vehicles.length > 0 ? (
            vehicles.map(v => (
              <Card key={v.id} className="overflow-hidden flex flex-col h-full border bg-card shadow-sm hover:shadow-md hover:border-primary/30 transition-all rounded-2xl">
                <div className="p-5 flex justify-between items-start border-b bg-muted/20">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-xl bg-primary/10 text-primary">
                      <Truck className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="font-black text-xl leading-none uppercase mb-1">{v.patente}</h3>
                      <div className="flex items-center gap-2">
                        {getStatusBadge(v.estado)}
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="p-5 flex-1 space-y-4">
                  <div>
                    <p className="text-sm font-bold text-foreground">{v.marca} {v.modelo} <span className="text-muted-foreground font-normal">({v.anio})</span></p>
                    <p className="text-xs text-muted-foreground capitalize">{v.tipo}</p>
                  </div>
                  
                  <div className="space-y-2 pt-2 border-t">
                    <div className="flex items-center gap-2 text-sm">
                      <User className="h-4 w-4 text-muted-foreground shrink-0"/>
                      <span className="truncate">{usersMap[v.responsable_id]?.name || 'Sin asignar'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="h-4 w-4 text-muted-foreground shrink-0"/>
                      <span className="truncate">{v.sucursal_id || 'Sin sucursal'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Gauge className="h-4 w-4 text-muted-foreground shrink-0"/>
                      <span className="font-mono font-medium">{v.kilometraje_actual?.toLocaleString()} km</span>
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-muted/10 border-t flex justify-end gap-1">
                  <Link to={`/vehicles/${v.id}`}>
                    <Button variant="ghost" size="sm" className="h-8 text-primary font-bold">
                      <Eye className="h-4 w-4 mr-1" /> Ver Detalle
                    </Button>
                  </Link>
                  {isAdmin() && (
                    <>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" onClick={() => { setSelectedVehicle(v); setIsFormOpen(true); }}>
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => { setSelectedVehicle(v); setIsDeleteOpen(true); }}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                </div>
              </Card>
            ))
          ) : (
            <div className="col-span-full py-16 text-center border-2 border-dashed rounded-2xl bg-muted/20">
              <Truck className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-foreground">No hay vehículos registrados</h3>
              <p className="text-muted-foreground mt-1 font-medium">Ajusta los filtros o registra uno nuevo.</p>
            </div>
          )}
        </div>
      </div>

      <VehicleFormModal 
        isOpen={isFormOpen}
        onClose={() => { setIsFormOpen(false); loadData(); }}
        onSave={handleSaveVehicle}
        initialData={selectedVehicle}
        branches={branches}
        users={users}
      />

      <DeleteConfirmationModal 
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDelete}
        title="Eliminar Vehículo"
        description="¿Estás seguro de eliminar este vehículo? Perderás todo el historial vinculado."
        itemName={selectedVehicle?.patente}
      />
    </Layout>
  );
};

export default VehiclesPage;