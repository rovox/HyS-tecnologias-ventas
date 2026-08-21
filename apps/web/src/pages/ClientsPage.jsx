import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout.jsx';
import { Card } from '@/components/ui/card.jsx';
import { Button } from '@/components/ui/button.jsx';
import { Input } from '@/components/ui/input.jsx';
import { Badge } from '@/components/ui/badge.jsx';
import { Skeleton } from '@/components/ui/skeleton.jsx';
import { Search, Plus, Edit2, Eye, Building2, Phone, Mail } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext.jsx';
import { useClients } from '@/hooks/useClients.js';
import { canWriteClients } from '@/config/nav.js';
import ClientFormModal from '@/components/ClientFormModal.jsx';
import { Checkbox } from '@/components/ui/checkbox';

function fmtDate(value) {
  if (!value) return '';
  try {
    const d = new Date(String(value).includes('T') || String(value).includes(' ') ? value : `${value}T12:00:00`);
    if (Number.isNaN(d.getTime())) return String(value).slice(0, 10);
    return d.toLocaleDateString('es-BO', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch {
    return String(value).slice(0, 10);
  }
}

const ClientsPage = () => {
  const { userRole } = useAuth();
  const navigate = useNavigate();
  const { getClients } = useClients();

  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeOnly, setActiveOnly] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);

  const canEdit = canWriteClients(userRole);

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

  const q = search.trim().toLowerCase();
  const filteredClients = clients.filter((c) => {
    if (activeOnly && !c.esActivo) return false;
    if (!q) return true;
    return [c.nombre, c.telefono, c.email, c.contacto]
      .some((v) => String(v || '').toLowerCase().includes(q));
  });

  return (
    <Layout>
      <Helmet><title>Directorio de Clientes - H&S</title></Helmet>

      <div className="content-container py-6 pb-24 space-y-5">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-foreground flex items-center gap-2">
              <Building2 className="h-6 w-6 text-primary shrink-0" /> Directorio de clientes
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Datos generales y actividad. No se eliminan clientes del directorio.
            </p>
          </div>
          {canEdit && (
            <Button
              onClick={() => { setSelectedClient(null); setIsFormOpen(true); }}
              className="font-semibold min-h-11 shrink-0"
            >
              <Plus className="h-4 w-4 mr-2" /> Nuevo cliente
            </Button>
          )}
        </div>

        <Card className="border rounded-2xl shadow-sm overflow-hidden">
          <div className="p-3 sm:p-4 border-b bg-muted/20 flex flex-col sm:flex-row gap-3 sm:items-center">
            <div className="relative w-full sm:max-w-md min-w-0">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre, teléfono o correo…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 bg-background min-h-11"
              />
            </div>
            <label className="flex items-center gap-2 text-sm font-medium min-h-11 shrink-0">
              <Checkbox checked={activeOnly} onCheckedChange={(v) => setActiveOnly(Boolean(v))} />
              Solo activos
            </label>
          </div>

          <div className="divide-y">
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="p-4"><Skeleton className="h-16 w-full" /></div>
              ))
            ) : filteredClients.length === 0 ? (
              <p className="p-10 text-center text-sm text-muted-foreground">
                No hay clientes que coincidan con la búsqueda.
              </p>
            ) : filteredClients.map((c) => (
              <div
                key={c.id}
                className="p-3 sm:p-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between hover:bg-muted/20 transition-colors min-w-0"
              >
                <div className="min-w-0 flex-1 space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      className="text-left text-sm sm:text-base font-semibold text-foreground hover:text-primary truncate max-w-full"
                      onClick={() => navigate(`/clientes/${c.id}`)}
                    >
                      {c.nombre}
                    </button>
                    <Badge
                      variant={c.esActivo ? 'secondary' : 'outline'}
                      className="text-[10px] font-semibold shrink-0"
                    >
                      {c.esActivo ? 'Activo' : 'Inactivo'}
                    </Badge>
                  </div>

                  <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
                    {c.contacto ? <span className="font-medium text-foreground/80">{c.contacto}</span> : null}
                    {c.telefono ? (
                      <span className="inline-flex items-center gap-1"><Phone className="h-3 w-3" />{c.telefono}</span>
                    ) : null}
                    {c.email ? (
                      <span className="inline-flex items-center gap-1 truncate max-w-[14rem]">
                        <Mail className="h-3 w-3 shrink-0" />{c.email}
                      </span>
                    ) : null}
                  </div>

                  <div className="text-xs text-muted-foreground leading-relaxed">
                    <span className="font-semibold text-foreground/80">Actividad:</span>{' '}
                    {c.cotizacionesCount || 0} cotiz. · {c.trabajosEnProceso || 0} trabajos en proceso · {c.tareasCount || 0} tareas
                    {c.lastActivityAt ? (
                      <span className="block sm:inline sm:before:content-['·_']"> última {fmtDate(c.lastActivityAt)}</span>
                    ) : null}
                  </div>

                  {(c.tareasRecientes || []).length > 0 ? (
                    <ul className="text-[11px] text-muted-foreground space-y-0.5 pt-0.5">
                      {c.tareasRecientes.map((t) => (
                        <li key={t.id} className="truncate">
                          <span className="capitalize">{t.estado.replace('_', ' ')}</span>
                          {' · '}{t.titulo}
                          {t.at ? ` · ${fmtDate(t.at)}` : ''}
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </div>

                <div className="flex gap-2 shrink-0 self-stretch sm:self-start">
                  <Button
                    variant="outline"
                    size="sm"
                    className="min-h-10 flex-1 sm:flex-none"
                    onClick={() => navigate(`/clientes/${c.id}`)}
                    title="Ver actividad"
                  >
                    <Eye className="h-4 w-4 mr-1.5" /> Ver
                  </Button>
                  {canEdit && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="min-h-10"
                      onClick={() => { setSelectedClient(c); setIsFormOpen(true); }}
                      title="Editar datos"
                    >
                      <Edit2 className="h-4 w-4 mr-1.5" /> Editar
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <ClientFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSuccess={loadData}
        initialData={selectedClient}
      />
    </Layout>
  );
};

export default ClientsPage;
