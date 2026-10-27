import { Suspense, lazy, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { FileStack, FolderKanban, HandCoins, Pencil, Plus, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Layout from '@/components/Layout.jsx';
import { useAuth } from '@/contexts/AuthContext.jsx';
import { Chatter } from '@/features/activity';
import { ControlPanel, Field, FieldGrid, FormView, ListView, LocationLink, StatusBadge, ToneTag } from '@/shared/views';
import { formatBs, formatDay, formatBusinessDay } from '@/shared/lib/format.js';
import { useDocumentTitle } from '@/shared/lib/useDocumentTitle.js';
import { useClientSummary } from '../api.js';
import { ClientFormDialog } from '../components/ClientFormDialog.jsx';

// The quotation form is loaded only when someone starts a quotation from here.
const QuotationFormDialog = lazy(() => import('@/features/quotations').then((m) => ({ default: m.QuotationFormDialog })));

const STATE = {
  planificado: 'Planificado', en_ejecucion: 'En ejecución', entregado: 'Entregado', cerrado: 'Cerrado', anulado: 'Anulado',
  programado: 'Programado', en_proceso: 'En proceso', terminado: 'Terminado', cancelado: 'Cancelado',
  borrador: 'Borrador', enviado: 'Enviada', aprobado: 'Aprobada', rechazado: 'Rechazada', vencido: 'Vencida',
  por_validar: 'Por validar', validado: 'Validado', observado: 'Observado',
};
const CONCEPTO = { adelanto: 'Adelanto', cobro: 'Cobro', adicional: 'Adicional' };
const sum = (key) => (rows) => formatBs(rows.reduce((s, r) => s + Number(r[key]), 0));
const money = (v, red) => <span className={red && Number(v) > 0 ? 'font-medium text-destructive' : ''}>{formatBs(v)}</span>;

const projectColumns = [
  { key: 'codigo', header: 'Proyecto', cell: (p) => <div><p className="font-medium">{p.codigo}</p><p className="text-xs text-muted-foreground">{p.titulo}</p></div> },
  { key: 'categoria', header: 'Categoría', cell: (p) => p.categoria?.label },
  { key: 'estado', header: 'Estado', cell: (p) => STATE[p.estado] },
  {
    key: 'garantia',
    header: 'Garantía',
    cell: (p) => (p.garantiaHasta ? <span className={p.garantiaVigente ? 'inline-flex items-center gap-1 font-medium text-success-fg' : 'text-muted-foreground line-through'}>{p.garantiaVigente && <ShieldCheck className="h-4 w-4" />}{formatDay(p.garantiaHasta)}</span> : `${p.garantiaMeses} meses desde la entrega`),
  },
  { key: 'monto', header: 'Monto', align: 'right', cell: (p) => formatBs(p.monto), total: sum('monto') },
  { key: 'saldo', header: 'Saldo', align: 'right', cell: (p) => money(p.saldo, true), total: sum('saldo') },
];
const jobColumns = [
  { key: 'fecha', header: 'Fecha', cell: (j) => formatDay(j.fechaProgramada) },
  { key: 'trabajo', header: 'Trabajo', cell: (j) => j.descripcionTrabajo },
  { key: 'estado', header: 'Estado', cell: (j) => STATE[j.estado] },
  { key: 'monto', header: 'Monto', align: 'right', cell: (j) => formatBs(j.monto), total: sum('monto') },
  { key: 'saldo', header: 'Saldo', align: 'right', cell: (j) => money(j.saldo, true), total: sum('saldo') },
];
const equipmentColumns = [
  { key: 'producto', header: 'Equipo', cell: (e) => <div><p className="font-medium">{e.producto.nombre}</p><p className="text-xs text-muted-foreground">{e.producto.codigo}{e.producto.marca ? `, marca ${e.producto.marca}` : ''}</p></div> },
  { key: 'cantidad', header: 'Cantidad', align: 'right', cell: (e) => Number(e.cantidad) },
  { key: 'proyecto', header: 'Proyecto', cell: (e) => e.proyecto?.codigo },
  { key: 'fecha', header: 'Entregado', cell: (e) => formatDay(e.fecha) },
  {
    key: 'garantia',
    header: 'Garantía',
    cell: (e) => (e.garantiaHasta ? <span className={e.garantiaVigente ? 'inline-flex items-center gap-1 font-medium text-success-fg' : 'text-muted-foreground line-through'}>{e.garantiaVigente && <ShieldCheck className="h-4 w-4" />}{formatDay(e.garantiaHasta)}</span> : 'desde la entrega del proyecto'),
  },
];
const quoteColumns = [
  { key: 'numero', header: 'Cotización', cell: (q) => <div><p className="font-medium">{q.numero}</p><p className="text-xs text-muted-foreground">{q.titulo}</p></div> },
  { key: 'categoria', header: 'Categoría', cell: (q) => q.categoria?.label },
  { key: 'estado', header: 'Estado', cell: (q) => (q.eliminadaAt ? 'Eliminada' : STATE[q.estado]) },
  { key: 'fecha', header: 'Fecha', cell: (q) => formatDay(q.createdAt) },
  { key: 'monto', header: 'Monto', align: 'right', cell: (q) => formatBs(q.monto) },
];
const paymentColumns = [
  { key: 'fecha', header: 'Fecha', cell: (m) => formatBusinessDay(m.fecha) },
  { key: 'concepto', header: 'Concepto', cell: (m) => CONCEPTO[m.concepto] || m.concepto },
  { key: 'origen', header: 'De', cell: (m) => m.project?.codigo || m.schedule?.descripcionTrabajo || '—' },
  { key: 'estado', header: 'Estado', cell: (m) => STATE[m.estado] },
  { key: 'monto', header: 'Monto', align: 'right', cell: (m) => formatBs(m.monto), total: sum('monto') },
];
const visitColumns = [
  { key: 'fecha', header: 'Fecha', cell: (r) => formatDay(r.fecha) },
  { key: 'tipo', header: 'Tipo', cell: (r) => (r.tipoVisita === 'asistencia' ? 'Asistencia' : 'Relevamiento') },
  { key: 'motivo', header: 'Motivo', cell: (r) => <span className="line-clamp-1">{r.motivo || r.necesidadCliente || r.lugar || '—'}</span> },
  { key: 'estado', header: 'Estado', cell: (r) => <StatusBadge entity="visit" state={r.estado} /> },
];

const FIELDS = { nombre: 'Nombre', tipo: 'Rubro', contacto: 'Contacto', telefono: 'Teléfono', email: 'Correo', direccion: 'Dirección', mapsLink: 'Link de ubicación', sucursalId: 'Sucursal', observaciones: 'Observaciones' };

/** One client: what was contracted, what it owes, warranties, quotations, payments and visits. */
export default function ClientDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { readsAll, isVentasLevel } = useAuth();
  const commercial = readsAll();
  const { data: client, isLoading } = useClientSummary(id);
  const [dialog, setDialog] = useState(null);
  useDocumentTitle(client?.nombre || 'Cliente');

  if (isLoading || !client) {
    return (
      <Layout>
        <div className="mx-auto max-w-6xl space-y-4 p-6"><Skeleton className="h-10 w-1/3" /><Skeleton className="h-64 w-full" /></div>
      </Layout>
    );
  }

  const enGarantia = client.proyectos.filter((p) => p.garantiaVigente).length;
  return (
    <Layout>
      <ControlPanel breadcrumbs={[{ label: 'Clientes', to: '/clientes' }, { label: client.nombre }]} />
      <FormView
        actions={
          isVentasLevel() && (
            <>
              <Button size="sm" onClick={() => setDialog('cotizacion')}><Plus /> Nueva cotización</Button>
              <Button size="sm" variant="outline" onClick={() => setDialog('editar')}><Pencil /> Editar</Button>
            </>
          )
        }
        smartButtons={[
          { key: 'cotizaciones', icon: FileStack, label: 'Cotizaciones', value: client.cotizaciones.length, ...(commercial ? { to: `/quotations?vista=cerradas&q=${encodeURIComponent(client.nombre)}` } : {}) },
          { key: 'proyectos', icon: FolderKanban, label: `Proyectos (${client.proyectosEnCurso} en curso)`, value: client.proyectos.length, ...(commercial ? { to: `/projects?q=${encodeURIComponent(client.nombre)}` } : {}) },
          { key: 'garantia', icon: ShieldCheck, label: 'En garantía', value: enGarantia },
          { key: 'saldo', icon: HandCoins, label: 'Saldo pendiente', value: formatBs(client.saldoPendiente) },
        ]}
        subtitle={client.tipo || 'Cliente'}
        title={client.nombre}
        badge={client.servicioEnCurso ? <ToneTag tone="progress" className="text-sm">Servicio en curso</ToneTag> : null}
        chatter={<Chatter entity="client" id={client.id} fieldLabels={FIELDS} />}
      >
        <FieldGrid>
          <Field label="Contacto">{client.contacto || null}</Field>
          <Field label="Teléfono">{client.telefono || null}</Field>
          <Field label="Correo">{client.email || null}</Field>
          <Field label="Dirección">{client.direccion || client.mapsLink ? <LocationLink address={client.direccion} link={client.mapsLink} /> : null}</Field>
          <Field label="Sucursal">{client.sucursal?.nombre}</Field>
          <Field label="Total contratado">{formatBs(client.totalContratado)}</Field>
          {client.observaciones && <Field label="Observaciones">{client.observaciones}</Field>}
        </FieldGrid>
        <Tabs defaultValue="proyectos">
          <TabsList className="flex-wrap">
            <TabsTrigger value="proyectos">Proyectos y garantías ({client.proyectos.length})</TabsTrigger>
            <TabsTrigger value="equipos">Equipos ({client.equipos.length})</TabsTrigger>
            <TabsTrigger value="trabajos">Trabajos ({client.trabajos.length})</TabsTrigger>
            <TabsTrigger value="cotizaciones">Cotizaciones ({client.cotizaciones.length})</TabsTrigger>
            <TabsTrigger value="cobros">Cobros ({client.cobros.length})</TabsTrigger>
            <TabsTrigger value="relevamientos">Relevamientos ({client.relevamientos.length})</TabsTrigger>
          </TabsList>
          <TabsContent value="proyectos">
            <ListView columns={projectColumns} rows={client.proyectos} empty="Sin proyectos" onRowClick={commercial ? (p) => navigate(`/projects/${p.id}`) : undefined} />
          </TabsContent>
          <TabsContent value="equipos">
            <ListView columns={equipmentColumns} rows={client.equipos} empty="Sin equipos entregados por pedidos internos" />
          </TabsContent>
          <TabsContent value="trabajos">
            <ListView columns={jobColumns} rows={client.trabajos} empty="Sin trabajos sueltos" />
          </TabsContent>
          <TabsContent value="cotizaciones">
            <ListView columns={quoteColumns} rows={client.cotizaciones} empty="Sin cotizaciones" onRowClick={commercial ? (q) => navigate(`/quotations/${q.id}`) : undefined} />
          </TabsContent>
          <TabsContent value="cobros">
            <ListView columns={paymentColumns} rows={client.cobros} empty="Sin cobros" />
          </TabsContent>
          <TabsContent value="relevamientos">
            <div className="mb-2 flex justify-end">
              <Link className="text-sm text-primary hover:underline" to={`/surveys?cliente=${client.id}`}>Ver y registrar visitas de este cliente</Link>
            </div>
            <ListView columns={visitColumns} rows={client.relevamientos} onRowClick={(r) => navigate(`/surveys?cliente=${client.id}&visita=${r.id}`)} empty="Sin relevamientos" />
          </TabsContent>
        </Tabs>
      </FormView>
      <ClientFormDialog open={dialog === 'editar'} onOpenChange={(o) => !o && setDialog(null)} client={client} />
      {dialog === 'cotizacion' && (
        <Suspense fallback={null}>
          <QuotationFormDialog open onOpenChange={(o) => !o && setDialog(null)} prefill={{ clienteId: client.id }} onSaved={(q) => q?.id && navigate(`/quotations/${q.id}`)} />
        </Suspense>
      )}
    </Layout>
  );
}
