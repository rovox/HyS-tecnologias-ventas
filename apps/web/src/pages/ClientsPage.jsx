import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout.jsx';
import { Card } from '@/components/ui/card.jsx';
import { Button } from '@/components/ui/button.jsx';
import { Input } from '@/components/ui/input.jsx';
import { Badge } from '@/components/ui/badge.jsx';
import { Skeleton } from '@/components/ui/skeleton.jsx';
import { Users, Search, Plus, Edit2, Trash2, Eye, Loader2, Building2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext.jsx';
import { useClients } from '@/hooks/useClients.js';
import ClientFormModal from '@/components/ClientFormModal.jsx';
import DeleteConfirmationModal from '@/components/DeleteConfirmationModal.jsx';
import { toast } from 'sonner';

const ClientsPage = () => {
  const { isAdmin, isVentas, isContadora } = useAuth();
  const navigate = useNavigate();
  const { getClients, deleteClient } = useClients();

  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);

  const canEdit = isAdmin() || isVentas() || isContadora();

  const loadData = async () => {
    setLoading(true);
    const data = await getClients();
    setClients(data);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredClients = clients.filter(c => 
    c.nombre?.toLowerCase().includes(search.toLowerCase()) || 
    c.tipo?.toLowerCase().includes(search.toLowerCase())
  );

  const handleOpenCreate = () => {
    setSelectedClient(null);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (client) => {
    setSelectedClient(client);
    setIsFormOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedClient) return;
    const success = await deleteClient(selectedClient.id);
    if (success) {
      toast.success('Cliente eliminado');
      setIsDeleteOpen(false);
      loadData();
    }
  };

  return (
    <Layout>
      <Helmet><title>Directorio de Clientes - H&S</title></Helmet>
      
      <div className="content-container py-6 pb-24 space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-3">
              <Building2 className="h-8 w-8 text-primary" /> Clientes y Proyectos
            </h1>
            <p className="text-muted-foreground mt-1 font-medium">Gestión de empresas, clientes y consolidado financiero.</p>
          </div>
          {canEdit && (
            <Button onClick={handleOpenCreate} className="font-bold shadow-md"><Plus className="h-4 w-4 mr-2"/> Nuevo Cliente</Button>
          )}
        </div>

        <Card className="border rounded-2xl shadow-sm overflow-hidden flex flex-col">
          <div className="p-4 border-b bg-muted/20">
            <div className="relative w-full max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Buscar por nombre o tipo..." 
                value={search} onChange={(e) => setSearch(e.target.value)}
                className="pl-9 bg-background shadow-sm"
              />
            </div>
          </div>

          <div className="overflow-x-auto w-full">
            <table className="w-full text-sm text-left whitespace-nowrap">
              <thead className="bg-muted/50 text-muted-foreground font-bold uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="px-6 py-4">Cliente</th>
                  <th className="px-6 py-4">Contacto</th>
                  <th className="px-6 py-4">Tipo</th>
                  <th className="px-6 py-4 text-right">Monto Total</th>
                  <th className="px-6 py-4 text-right">Saldo Pend.</th>
                  <th className="px-6 py-4 text-center">Trabajos</th>
                  <th className="px-6 py-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y bg-card">
                {loading ? (
                  Array.from({length: 5}).map((_, i) => (
                    <tr key={i}><td colSpan="7" className="px-6 py-4"><Skeleton className="h-8 w-full"/></td></tr>
                  ))
                ) : filteredClients.length > 0 ? (
                  filteredClients.map(c => (
                    <tr key={c.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-6 py-4 font-extrabold text-foreground cursor-pointer hover:text-primary" onClick={() => navigate(`/clientes/${c.id}`)}>
                        {c.nombre}
                      </td>
                      <td className="px-6 py-4 font-medium text-muted-foreground">
                        {c.contacto || c.telefono || 'Sin contacto'}
                      </td>
                      <td className="px-6 py-4">
                        <Badge className={`uppercase text-[9px] font-bold shadow-none tracking-wider ${
                          c.tipo === 'Proyecto' ? 'bg-[hsl(var(--project-bg))] text-[hsl(var(--project-fg))]' : 'bg-[hsl(var(--security-bg))] text-[hsl(var(--security-fg))]'
                        }`}>
                          {c.tipo}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-right font-medium tabular-nums">${(c.monto_total || 0).toFixed(2)}</td>
                      <td className="px-6 py-4 text-right font-black tabular-nums text-destructive">${(c.saldo_total || 0).toFixed(2)}</td>
                      <td className="px-6 py-4 text-center font-bold text-muted-foreground">{c.cantidad_trabajos || 0}</td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" onClick={() => navigate(`/clientes/${c.id}`)} className="text-primary hover:bg-primary/10 h-8 w-8" title="Ver Detalles">
                            <Eye className="h-4 w-4"/>
                          </Button>
                          {canEdit && (
                            <Button variant="ghost" size="icon" onClick={() => handleOpenEdit(c)} className="text-foreground hover:bg-muted h-8 w-8" title="Editar">
                              <Edit2 className="h-4 w-4"/>
                            </Button>
                          )}
                          {isAdmin() && (
                            <Button variant="ghost" size="icon" onClick={() => { setSelectedClient(c); setIsDeleteOpen(true); }} className="text-destructive hover:bg-destructive/10 h-8 w-8" title="Eliminar">
                              <Trash2 className="h-4 w-4"/>
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr><td colSpan="7" className="px-6 py-16 text-center text-muted-foreground font-medium">No se encontraron clientes que coincidan con la búsqueda.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      <ClientFormModal 
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSuccess={loadData}
        initialData={selectedClient}
      />

      <DeleteConfirmationModal
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDeleteConfirm}
        itemName={`Cliente: ${selectedClient?.nombre}`}
        isDeleting={false}
      />
    </Layout>
  );
};

export default ClientsPage;