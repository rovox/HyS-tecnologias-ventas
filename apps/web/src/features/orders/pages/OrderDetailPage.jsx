import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Boxes, FolderKanban, MessageSquare, Pencil, Wrench } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import Layout from '@/components/Layout.jsx';
import { useAuth } from '@/contexts/AuthContext.jsx';
import { Chatter } from '@/features/activity';
import { useSucursales, useUserDirectory } from '@/features/catalogs';
import { ControlPanel, Field, FieldGrid, FormView, ListView, StatusBadge, StatusBar, ToneTag } from '@/shared/views';
import { STATUS } from '@/shared/lib/status.js';
import { formatBs, formatDateTime, formatDay } from '@/shared/lib/format.js';
import { notify } from '@/shared/lib/notify.js';
import { useDocumentTitle } from '@/shared/lib/useDocumentTitle.js';
import { useAddOrderComment, useOrder } from '../api.js';
import { OrderFormDialog } from '../components/OrderFormDialog.jsx';
import { PriorityTag } from '../components/OrdersView.jsx';
import { TRANSITION, destinationText, useOrderActions } from '../components/useOrderActions.js';

const MAIN = ['solicitado', 'aprobado', 'en_preparación', 'listo_para_entrega', 'entregado'];
const stages = (estado) => (MAIN.includes(estado) ? MAIN : [...MAIN.slice(0, 1), estado]).map((key) => ({ key, label: STATUS.order[key].label }));

/** Field names of the API → labels in the history; ids are shown as names. */
const ORDER_FIELDS = {
  estado: 'Estado',
  prioridad: 'Prioridad',
  responsableId: 'Lo recibe',
  sucursalOrigenId: 'Sale de',
  sucursalDestinoId: 'Sucursal de destino',
  fechaEntregaEstimada: 'Se necesita el',
  fechaEntregaReal: 'Entregado el',
  entregadoPorId: 'Entregó',
  observaciones: 'Observaciones',
};

const itemColumns = [
  {
    key: 'material',
    header: 'Material',
    cell: (i) => (
      <div>
        <p className="font-medium">{i.materialNombre}</p>
        {i.productoId ? <ToneTag tone="info" icon={Boxes}>Del inventario: mueve stock</ToneTag> : <span className="text-xs text-muted-foreground">Texto libre (no mueve stock)</span>}
      </div>
    ),
  },
  { key: 'cantidad', header: 'Cantidad', align: 'right', cell: (i) => `${i.cantidad} ${i.unidad}` },
  { key: 'costo', header: 'Costo unitario', align: 'right', cell: (i) => (i.costoUnitario == null ? '—' : formatBs(i.costoUnitario)) },
  { key: 'total', header: 'Total', align: 'right', cell: (i) => formatBs(i.costoTotal), total: (rows) => formatBs(rows.reduce((s, i) => s + i.costoTotal, 0)) },
  { key: 'obs', header: 'Observación', cell: (i) => i.observaciones || '—' },
];

const moveColumns = [
  { key: 'fecha', header: 'Fecha', cell: (m) => formatDay(m.fecha) },
  { key: 'producto', header: 'Producto', cell: (m) => `${m.producto.nombre} (${m.producto.codigo})` },
  { key: 'tipo', header: 'Movimiento', cell: (m) => (m.tipo === 'transferencia' ? 'Transferencia' : 'Salida a proyecto') },
  { key: 'cantidad', header: 'Cantidad', align: 'right', cell: (m) => `${Number(m.cantidad)} ${m.producto.unidad}` },
];

/** One internal order: where it goes, who asked and who receives it, its items, comments and full history. */
export default function OrderDetailPage() {
  const { id } = useParams();
  const { data: order, isLoading } = useOrder(id);
  const { isVentasLevel } = useAuth();
  const manage = isVentasLevel();
  const actions = useOrderActions();
  const comment = useAddOrderComment();
  const { data: people = [] } = useUserDirectory();
  const { data: sucursales = [] } = useSucursales();
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState('');
  useDocumentTitle(order?.codigo || 'Pedido interno');

  if (isLoading || !order) {
    return (
      <Layout>
        <div className="mx-auto max-w-6xl space-y-4 p-6">
          <Skeleton className="h-10 w-1/3" />
          <Skeleton className="h-64 w-full" />
        </div>
      </Layout>
    );
  }

  const job = order.destino?.tipo === 'trabajo' ? order.destino.trabajo : null;
  const editable = manage && !['entregado', 'rechazado', 'cancelado'].includes(order.estado);
  const nameOf = (userId) => people.find((p) => p.id === userId)?.name;
  const formatValue = (field, value) => {
    if (field === 'estado') return STATUS.order[value]?.label;
    if (field === 'responsableId' || field === 'entregadoPorId') return nameOf(value);
    if (field === 'sucursalOrigenId' || field === 'sucursalDestinoId') return sucursales.find((s) => s.id === value)?.nombre;
    return undefined;
  };

  async function addComment(e) {
    e.preventDefault();
    if (!text.trim()) return;
    try {
      await comment.mutateAsync({ id: order.id, contenido: text.trim() });
      setText('');
      notify.success('Comentario agregado');
    } catch {
      /* shown by the query client */
    }
  }

  return (
    <Layout>
      <ControlPanel breadcrumbs={[{ label: 'Inventario', to: '/inventario' }, { label: 'Pedidos internos', to: '/inventario?vista=pedidos' }, { label: order.codigo }]} />
      <FormView
        actions={
          manage && (
            <>
              {order.transicionesValidas.map((estado) => {
                const t = TRANSITION[estado];
                const Icon = t.icon;
                return (
                  <Button key={estado} size="sm" variant={t.tone === 'success' ? 'success' : t.tone === 'danger' ? 'outline' : 'default'} className={t.tone === 'danger' ? 'text-danger-fg' : ''} disabled={actions.busy} onClick={() => actions.change(order, estado)}>
                    <Icon /> {t.label}
                  </Button>
                );
              })}
              {editable && (
                <Button size="sm" variant="ghost" onClick={() => setEditing(true)}>
                  <Pencil /> Editar
                </Button>
              )}
            </>
          )
        }
        statusBar={<StatusBar entity="order" stages={stages(order.estado)} current={order.estado} allowed={manage ? order.transicionesValidas.filter((e) => MAIN.includes(e)) : []} onSelect={(estado) => actions.change(order, estado)} />}
        smartButtons={[
          ...(job?.project ? [{ key: 'proyecto', icon: FolderKanban, label: 'Proyecto', value: job.project.codigo, to: `/projects/${job.project.id}` }] : []),
          ...(job ? [{ key: 'trabajo', icon: Wrench, label: 'Trabajo', value: formatDay(job.fechaProgramada), to: `/schedule?dia=${String(job.fechaProgramada).slice(0, 10)}` }] : []),
          { key: 'stock', icon: Boxes, label: 'Movimientos de stock', value: order.movimientos.length },
          { key: 'comentarios', icon: MessageSquare, label: 'Comentarios', value: order.comentarios.length },
        ]}
        title={order.codigo}
        badge={<StatusBadge entity="order" state={order.estado} className="text-sm" />}
        chatter={<Chatter entity="pedido_interno" id={order.id} fieldLabels={ORDER_FIELDS} formatValue={formatValue} />}
      >
        <FieldGrid>
          <Field label="Destino">{destinationText(order)}</Field>
          <Field label="Sale de">{order.sucursalOrigen?.nombre}</Field>
          <Field label="Lo pide">{order.solicitante?.name}</Field>
          <Field label="Lo recibe">{order.responsable?.name}</Field>
          <Field label="Prioridad"><PriorityTag prioridad={order.prioridad} /></Field>
          <Field label="Se necesita el">{order.fechaEntregaEstimada ? formatDay(order.fechaEntregaEstimada) : '—'}</Field>
          {order.estado === 'entregado' && <Field label="Entregado">{`${order.entregadoPor?.name || '—'}, ${order.fechaEntregaReal ? formatDateTime(order.fechaEntregaReal) : ''}`}</Field>}
          {job?.project && <Field label="Proyecto"><Link className="text-primary hover:underline" to={`/projects/${job.project.id}`}>{job.project.codigo}</Link></Field>}
          <Field label="Observaciones">{order.observaciones || '—'}</Field>
        </FieldGrid>

        <section className="space-y-2">
          <h2 className="text-sm font-semibold">Ítems</h2>
          <ListView columns={itemColumns} rows={order.items} empty="Sin ítems" />
        </section>

        {order.movimientos.length > 0 && (
          <section className="space-y-2">
            <h2 className="text-sm font-semibold">Stock movido al entregar</h2>
            <ListView columns={moveColumns} rows={order.movimientos} />
          </section>
        )}

        <section className="space-y-2" aria-label="Comentarios">
          <h2 className="text-sm font-semibold">Comentarios</h2>
          {order.comentarios.length === 0 && <p className="text-sm text-muted-foreground">Sin comentarios.</p>}
          <ol className="space-y-2">
            {order.comentarios.map((c) => (
              <li key={c.id} className="rounded-md border border-border bg-muted/40 p-3 text-sm">
                <p className="text-xs text-muted-foreground">
                  <span className="font-semibold text-foreground">{c.autor?.name}</span>, {formatDateTime(c.createdAt)}
                </p>
                <p className="mt-1 whitespace-pre-wrap">{c.contenido}</p>
              </li>
            ))}
          </ol>
          {manage && (
            <form onSubmit={addComment} className="space-y-2">
              <Textarea rows={2} value={text} onChange={(e) => setText(e.target.value)} placeholder="Escribe un comentario para el equipo…" aria-label="Nuevo comentario" />
              <Button type="submit" size="sm" variant="outline" disabled={!text.trim() || comment.isPending}>Comentar</Button>
            </form>
          )}
        </section>
      </FormView>
      <OrderFormDialog open={editing} onOpenChange={setEditing} pedidoId={order.id} />
    </Layout>
  );
}
