import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { CalendarClock, FileText, HandCoins, Pencil, Plus, User, Wrench } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Layout from '@/components/Layout.jsx';
import { Chatter } from '@/features/activity';
import { ControlPanel, Field, FieldGrid, FormView, ListView, StatusBadge, StatusBar } from '@/shared/views';
import { formatBs, formatDay } from '@/shared/lib/format.js';
import { useDocumentTitle } from '@/shared/lib/useDocumentTitle.js';
import { useProject } from '../api.js';
import { PAYMENT_TYPE, PROJECT_FIELDS, PROJECT_TRANSITION, formatProjectValue, projectStages } from '../constants.js';
import { CollectedBar, ProjectStateBadge } from '../components/ProjectStateBadge.jsx';
import { EditProjectDialog } from '../components/EditProjectDialog.jsx';
import { JobDialog } from '../components/JobDialog.jsx';
import { PaymentDialog } from '../components/PaymentDialog.jsx';
import { useProjectActions } from '../components/useProjectActions.js';

const jobColumns = [
  { key: 'trabajo', header: 'Trabajo', cell: (t) => t.descripcionTrabajo },
  { key: 'fecha', header: 'Fecha', cell: (t) => `${formatDay(t.fechaProgramada)}${t.horario ? `, ${t.horario}` : ''}` },
  { key: 'tecnico', header: 'Técnico', cell: (t) => t.tecnico?.name || 'Sin asignar' },
  { key: 'estado', header: 'Estado', cell: (t) => <StatusBadge entity="job" state={t.estado} /> },
];

const total = (rows) => formatBs(rows.reduce((s, m) => s + Number(m.monto), 0));

const materialColumns = [
  { key: 'fecha', header: 'Fecha', cell: (m) => formatDay(m.fecha) },
  { key: 'producto', header: 'Producto', cell: (m) => <div><p className="font-medium">{m.producto.nombre}</p><p className="text-xs text-muted-foreground">{m.producto.codigo}</p></div> },
  { key: 'cantidad', header: 'Cantidad', align: 'right', cell: (m) => `${Number(m.cantidad)} ${m.producto.unidad}` },
  { key: 'costo', header: 'Costo', align: 'right', cell: (m) => formatBs(Number(m.cantidad) * Number(m.costoUnitario)) },
];
const movementColumns = [
  { key: 'fecha', header: 'Fecha', cell: (m) => formatDay(m.fecha) },
  { key: 'concepto', header: 'Concepto', cell: (m) => PAYMENT_TYPE[m.concepto] || m.concepto },
  { key: 'metodo', header: 'Método', cell: (m) => m.metodo || '—' },
  { key: 'por', header: 'Registró', cell: (m) => m.registradoPor?.name || '—' },
  { key: 'estado', header: 'Estado', cell: (m) => <StatusBadge entity="movement" state={m.estado} /> },
  { key: 'nota', header: 'Nota', cell: (m) => m.nota || '—' },
  { key: 'monto', header: 'Monto', align: 'right', cell: (m) => formatBs(m.monto), total },
];

export default function ProjectDetailPage() {
  const { id } = useParams();
  const { data: project, isLoading } = useProject(id);
  const actions = useProjectActions();
  const [dialog, setDialog] = useState(null);
  useDocumentTitle(project?.codigo || 'Proyecto');

  if (isLoading || !project) {
    return (
      <Layout>
        <div className="mx-auto max-w-6xl space-y-4 p-6">
          <Skeleton className="h-10 w-1/3" />
          <Skeleton className="h-64 w-full" />
        </div>
      </Layout>
    );
  }

  const open = !['cerrado', 'anulado'].includes(project.estado);
  const close = () => setDialog(null);

  return (
    <Layout>
      <ControlPanel breadcrumbs={[{ label: 'Proyectos', to: '/projects' }, { label: project.codigo }]} />
      <FormView
        actions={
          <>
            {open && (
              <Button size="sm" onClick={() => setDialog('pago')}>
                <HandCoins /> Registrar cobro
              </Button>
            )}
            {open && (
              <Button size="sm" variant="outline" onClick={() => setDialog('trabajo')}>
                <Plus /> Nuevo trabajo
              </Button>
            )}
            {project.transicionesValidas.map((estado) => (
              <Button key={estado} size="sm" variant={estado === 'anulado' ? 'ghost' : 'outline'} className={estado === 'anulado' ? 'text-destructive' : ''} disabled={actions.busy} onClick={() => actions.changeStatus(project, estado)}>
                {PROJECT_TRANSITION[estado](project).label}
              </Button>
            ))}
            {open && (
              <Button size="sm" variant="ghost" onClick={() => setDialog('editar')}>
                <Pencil /> Editar
              </Button>
            )}
          </>
        }
        statusBar={<StatusBar entity="project" stages={projectStages(project.estado)} current={project.estado} allowed={project.transicionesValidas} onSelect={(estado) => actions.changeStatus(project, estado)} />}
        smartButtons={[
          { key: 'cotizacion', icon: FileText, label: 'Cotización', value: project.quotation.numero, to: `/quotations/${project.quotation.id}` },
          { key: 'cliente', icon: User, label: 'Cliente', value: project.cliente.nombre, to: `/clientes/${project.cliente.id}` },
          { key: 'trabajos', icon: Wrench, label: 'Trabajos', value: project.trabajos.length, to: '/schedule' },
          { key: 'cobrado', icon: HandCoins, label: `Cobrado (${project.pctCobrado} %)`, value: formatBs(project.cobrado) },
        ]}
        subtitle={project.codigo}
        title={project.titulo}
        badge={<ProjectStateBadge project={project} className="text-sm" />}
        chatter={<Chatter entity="project" id={project.id} fieldLabels={PROJECT_FIELDS} formatValue={formatProjectValue} />}
      >
        {project.estado === 'anulado' && (
          <div className="rounded-md border border-destructive/40 bg-destructive/5 p-3 text-sm">Anulado. Motivo: {project.motivoAnulacion}</div>
        )}
        <FieldGrid>
          <Field label="Monto oficial"><span className="font-semibold">{formatBs(project.montoOficial)}</span></Field>
          <Field label="Saldo pendiente">
            <span className={project.saldo > 0 ? 'font-semibold text-destructive' : 'font-semibold'}>{formatBs(project.saldo)}</span>
          </Field>
          <Field label="Cobrado"><div className="flex items-center gap-3">{formatBs(project.cobrado)} <CollectedBar pct={project.pctCobrado} /></div></Field>
          <Field label="Por validar">{formatBs(project.porValidar)}</Field>
          <Field label="Costo (gastos + material)">{formatBs(project.costo)}{project.costoMaterial > 0 && <span className="ml-2 text-xs text-muted-foreground">(material: {formatBs(project.costoMaterial)})</span>}</Field>
          <Field label="Margen">
            <span className={project.margen < 0 ? 'font-semibold text-destructive' : 'font-semibold'}>{formatBs(project.margen)}</span>
          </Field>
          {project.adicionales > 0 && <Field label="Adicionales cobrados">{formatBs(project.adicionales)}</Field>}
          <Field label="Categoría">{project.categoria.label}</Field>
          <Field label="Sucursal">{project.sucursal.nombre}</Field>
          <Field label="Responsable">{project.responsable?.name}</Field>
          <Field label="Garantía">
            {project.garantiaHasta ? (
              <span className="inline-flex items-center gap-1">
                <CalendarClock className="h-4 w-4" /> hasta {formatDay(project.garantiaHasta)} {project.garantiaVigente ? '' : '(vencida)'}
              </span>
            ) : (
              `${project.garantiaMeses} meses desde la entrega`
            )}
          </Field>
        </FieldGrid>
        <Tabs defaultValue="trabajos">
          <TabsList>
            <TabsTrigger value="trabajos">Trabajos ({project.trabajos.length})</TabsTrigger>
            <TabsTrigger value="cobros">Cobros ({project.cobros.length})</TabsTrigger>
            <TabsTrigger value="gastos">Gastos ({project.gastos.length})</TabsTrigger>
            <TabsTrigger value="material">Material ({project.material.length})</TabsTrigger>
          </TabsList>
          <TabsContent value="trabajos">
            <ListView columns={jobColumns} rows={project.trabajos} empty="Sin trabajos" />
          </TabsContent>
          <TabsContent value="cobros">
            <ListView columns={movementColumns} rows={project.cobros} empty="Sin cobros registrados" />
          </TabsContent>
          <TabsContent value="gastos">
            <ListView columns={movementColumns} rows={project.gastos} empty="Sin gastos: regístralos en Finanzas › Registrar gasto, eligiendo este proyecto" />
          </TabsContent>
          <TabsContent value="material">
            <ListView columns={materialColumns} rows={project.material} empty="Sin material: llega al entregar un pedido interno de un trabajo del proyecto, o con Inventario › Salida a proyecto" />
          </TabsContent>
        </Tabs>
      </FormView>
      <PaymentDialog project={project} open={dialog === 'pago'} onOpenChange={(o) => !o && close()} />
      <JobDialog project={project} open={dialog === 'trabajo'} onOpenChange={(o) => !o && close()} />
      <EditProjectDialog project={project} open={dialog === 'editar'} onOpenChange={(o) => !o && close()} />
    </Layout>
  );
}
