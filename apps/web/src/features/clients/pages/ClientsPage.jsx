import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Layout from '@/components/Layout.jsx';
import { useAuth } from '@/contexts/AuthContext.jsx';
import { useSucursales } from '@/features/catalogs';
import { ControlPanel, ListView, Money, useListControls } from '@/shared/views';
import { downloadCsv } from '@/shared/lib/csv.js';
import { formatBs } from '@/shared/lib/format.js';
import { useDocumentTitle } from '@/shared/lib/useDocumentTitle.js';
import { useClientsOverview } from '../api.js';
import { ClientFormDialog } from '../components/ClientFormDialog.jsx';

const owed = (rows) => formatBs(rows.reduce((s, c) => s + c.saldoPendiente, 0));

const columns = [
  { key: 'nombre', header: 'Cliente', cell: (c) => <div><p className="font-medium">{c.nombre}</p>{c.tipo && <p className="text-xs text-muted-foreground">{c.tipo}</p>}</div> },
  { key: 'contacto', header: 'Contacto', cell: (c) => <div><p>{c.contacto || '—'}</p>{c.telefono && <p className="text-xs text-muted-foreground">{c.telefono}</p>}</div> },
  { key: 'sucursal', header: 'Sucursal', cell: (c) => c.sucursal?.nombre },
  { key: 'curso', header: 'En curso', cell: (c) => (c.proyectosEnCurso + c.trabajosEnCurso ? `${c.proyectosEnCurso} proyectos, ${c.trabajosEnCurso} trabajos` : '—') },
  { key: 'saldo', header: 'Saldo pendiente', align: 'right', cell: (c) => <Money value={c.saldoPendiente} kind="owed" />, total: owed },
];

const csv = [
  { header: 'Cliente', value: (c) => c.nombre },
  { header: 'Rubro', value: (c) => c.tipo },
  { header: 'Contacto', value: (c) => c.contacto },
  { header: 'Teléfono', value: (c) => c.telefono },
  { header: 'Correo', value: (c) => c.email },
  { header: 'Sucursal', value: (c) => c.sucursal?.nombre },
  { header: 'Saldo pendiente Bs', value: (c) => c.saldoPendiente.toFixed(2) },
];

/** Clients without tags: who owes what and who has work in course are filters, not labels. */
export default function ClientsPage() {
  const navigate = useNavigate();
  const { isVentasLevel } = useAuth();
  const { data: clients = [], isLoading } = useClientsOverview();
  const { data: sucursales = [] } = useSucursales();
  const [creating, setCreating] = useState(false);
  useDocumentTitle('Clientes');

  const filters = useMemo(
    () => [
      { key: 'en_curso', label: 'Con servicio en curso', section: 'Servicio', test: (c) => c.servicioEnCurso },
      { key: 'con_saldo', label: 'Con saldo pendiente', section: 'Dinero', test: (c) => c.saldoPendiente > 0 },
      ...sucursales.map((s) => ({ key: s.id, label: s.nombre, section: 'Sucursal', test: (c) => c.sucursalId === s.id })),
    ],
    [sucursales],
  );
  const { rows, groups, panel } = useListControls(clients, {
    filters,
    groupOptions: [
      { key: 'sucursal', label: 'Sucursal', of: (c) => c.sucursal?.nombre },
      { key: 'rubro', label: 'Rubro', of: (c) => c.tipo },
    ],
    searchText: (c) => `${c.nombre} ${c.contacto} ${c.telefono} ${c.email} ${c.tipo}`,
  });

  return (
    <Layout>
      <ControlPanel
        breadcrumbs={[{ label: 'Clientes' }]}
        actions={isVentasLevel() && <Button onClick={() => setCreating(true)}><Plus /> Nuevo cliente</Button>}
        searchPlaceholder="Buscar por nombre, contacto, teléfono…"
        {...panel}
        onExport={() => downloadCsv('clientes.csv', csv, rows)}
        meta={`${rows.length} clientes`}
      />
      <div className="px-4 py-4 sm:px-6">
        <ListView
          id="clientes"
          columns={columns}
          rows={rows}
          groups={groups}
          loading={isLoading}
          onRowClick={(c) => navigate(`/clientes/${c.id}`)}
          empty="No hay clientes con estos filtros"
          renderCard={(c) => (
            <div className="flex items-start justify-between gap-2 text-sm">
              <div className="min-w-0">
                <p className="font-medium">{c.nombre}</p>
                <p className="text-xs text-muted-foreground">{[c.contacto, c.telefono].filter(Boolean).join(', ') || c.sucursal?.nombre}</p>
              </div>
              {c.saldoPendiente > 0 && <Money className="shrink-0" value={c.saldoPendiente} kind="owed" />}
            </div>
          )}
        />
      </div>
      <ClientFormDialog open={creating} onOpenChange={setCreating} onSaved={(c) => c?.id && navigate(`/clientes/${c.id}`)} />
    </Layout>
  );
}
