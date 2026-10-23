import { Suspense, lazy, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FileStack, FolderKanban, HandCoins, Pencil, Plus, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Layout from '@/components/Layout.jsx';
import { useAuth } from '@/contexts/AuthContext.jsx';
import { Chatter } from '@/features/activity';
import { ControlPanel, Field, FieldGrid, FormView, ListView } from '@/shared/views';
import { formatBs, formatDay } from '@/shared/lib/format.js';
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
    cell: (p) => (p.garantiaHasta ? <span className={p.garantiaVigente ? 'inline-flex items-center gap-1 text-secondary' : 'text-muted-foreground line-through'}>{p.garantiaVigente && <ShieldCheck className="h-4 w-4" />}{formatDay(p.garantiaHasta)}</span> : `${p.garantiaMeses} meses desde la entrega`),
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
const quoteColumns = [
  { key: 'numero', header: 'Cotización', cell: (q) => <div><p className="font-medium">{q.numero}</p><p className="text-xs text-muted-foreground">{q.titulo}</p></div> },
  { key: 'categoria', header: 'Categoría', cell: (q) => q.categoria?.label },
  { key: 'estado', header: 'Estado', cell: (q) => (q.eliminadaAt ? 'Eliminada' : STATE[q.estado]) },
  { key: 'fecha', header: 'Fecha', cell: (q) => formatDay(q.createdAt) },
  { key: 'monto', header: 'Monto', align: 'right', cell: (q) => formatBs(q.monto) },
];
const paymentColumns = [
  { key: 'fecha', header: 'Fecha', cell: (m) => formatDay(m.fecha) },
  { key: 'concepto', header: 'Concepto', cell: (m) => CONCEPTO[m.concepto] || m.concepto },
  { key: 'origen', header: 'De', cell: (m) => m.project?.codigo || m.schedule?.descripcionTrabajo || '—' },
  { key: 'estado', header: 'Estado', cell: (m) => STATE[m.estado] },
  { key: 'monto', header: 'Monto', align: 'right', cell: (m) => formatBs(m.monto), total: sum('monto') },
];
const visitColumns = [
  { key: 'fecha', header: 'Fecha', cell: (r) => formatDay(r.fecha) },
  { key: 'lugar', header: 'Lugar', cell: (r) => r.lugar || '—' },
  { key: 'tipo', header: 'Tipo', cell: (r) => r.tipoVisita },
  { key: 'estado', header: 'Estado', cell: (r) => r.estado },
];

const FIELDS = { nombre: 'Nombre', tipo: 'Rubro', contacto: 'Contacto', telefono: 'Teléfono', email: 'Correo', direccion: 'Dirección', sucursalId: 'Sucursal', observaciones: 'Observaciones' };

/** One client: what was contracted, what it owes, warranties, quotations, payments and visits. */
export default function ClientDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isVentasLevel } = useAuth();
  const commercial = isVentasLevel();
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
          commercial && (
            <>
              <Button size="sm" onClick={() => setDialog('cotizacion')}><Plus /> Nueva cotización</Button>
              <Button size="sm" variant="outline" onClick={() => setDialog('editar')}><Pencil /> Editar</Button>
            </>
          )
        }
        smartButtons={[
          { key: 'cotizaciones', icon: FileStack, label: 'Cotizaciones', value: client.cotizaciones.length, ...(commercial ? { to: `/quotations?vista=cerradas&q=${encodeURIComponent(client.nombre)}` } : {}) },
          { key: 'proyectos', icon: FolderKanban, label: `Proyectos · ${client.proyectosEnCurso} en curso`, value: client.proyectos.length, ...(commercial ? { to: `/projects?q=${encodeURIComponent(client.nombre)}` } : {}) },
          { key: 'garantia', icon: ShieldCheck, label: 'En garantía', value: enGarantia },
          { key: 'saldo', icon: HandCoins, label: 'Saldo pendiente', value: formatBs(client.saldoPendiente) },
        ]}
        subtitle={client.tipo || 'Cliente'}
        title={client.nombre}
        badge={client.servicioEnCurso ? <span className="rounded bg-primary/10 px-2 py-0.5 text-sm text-primary">Servicio en curso</span> : null}
        chatter={<Chatter entity="client" id={client.id} fieldLabels={FIELDS} />}
      >
        <FieldGrid>
          <Field label="Contacto">{client.contacto || null}</Field>
          <Field label="Teléfono">{client.telefono || null}</Field>
          <Field label="Correo">{client.email || null}</Field>
          <Field label="Dirección">{client.direccion || null}</Field>
          <Field label="Sucursal">{client.sucursal?.nombre}</Field>
          <Field label="Total contratado">{formatBs(client.totalContratado)}</Field>
          {client.observaciones && <Field label="Observaciones">{client.observaciones}</Field>}
        </FieldGrid>
        <Tabs defaultValue="proyectos">
          <TabsList className="flex-wrap">
            <TabsTrigger value="proyectos">Proyectos y garantías ({client.proyectos.length})</TabsTrigger>
            <TabsTrigger value="trabajos">Trabajos ({client.trabajos.length})</TabsTrigger>
            <TabsTrigger value="cotizaciones">Cotizaciones ({client.cotizaciones.length})</TabsTrigger>
            <TabsTrigger value="cobros">Cobros ({client.cobros.length})</TabsTrigger>
            <TabsTrigger value="relevamientos">Relevamientos ({client.relevamientos.length})</TabsTrigger>
          </TabsList>
          <TabsContent value="proyectos">
            <ListView columns={projectColumns} rows={client.proyectos} empty="Sin proyectos" onRowClick={commercial ? (p) => navigate(`/projects/${p.id}`) : undefined} />
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
            <ListView columns={visitColumns} rows={client.relevamientos} empty="Sin relevamientos" />
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
