import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext.jsx';
import { ControlPanel, ListView, RowQuickActions, StatusBadge, ToneTag, useListControls } from '@/shared/views';
import { STATUS } from '@/shared/lib/status.js';
import { downloadCsv } from '@/shared/lib/csv.js';
import { formatBs, formatDay } from '@/shared/lib/format.js';
import { useOrders } from '../api.js';
import { OrderFormDialog } from './OrderFormDialog.jsx';
import { TRANSITION, destinationText, useOrderActions } from './useOrderActions.js';

const PRIORITY_TONE = { Urgente: 'danger', Alta: 'warning', Normal: 'neutral', Baja: 'neutral' };
const OPEN = ['solicitado', 'aprobado', 'en_preparación', 'listo_para_entrega'];
const today = () => new Date().toLocaleDateString('en-CA', { timeZone: 'America/La_Paz' });
const late = (o) => OPEN.includes(o.estado) && o.fechaEntregaEstimada && String(o.fechaEntregaEstimada).slice(0, 10) < today();

export function PriorityTag({ prioridad }) {
  return (
    <ToneTag tone={PRIORITY_TONE[prioridad] || 'neutral'} icon={prioridad === 'Urgente' ? AlertTriangle : undefined}>
      {prioridad}
    </ToneTag>
  );
}

/**
 * Pedidos internos as a tab of Inventario: who asked, for whom, where it goes and its state; the next step is a
 * button in the row (Aprobar, Preparar, Entregar…), the record page has the rest and the history.
 */
export function OrdersView({ tabs }) {
  const navigate = useNavigate();
  const { isVentasLevel } = useAuth();
  const manage = isVentasLevel();
  const { data: orders = [], isLoading } = useOrders();
  const actions = useOrderActions();
  const [creating, setCreating] = useState(false);

  const filters = useMemo(
    () => [
      { key: 'abiertos', label: 'Abiertos', section: 'Estado', count: orders.filter((o) => OPEN.includes(o.estado)).length, tone: 'info', test: (o) => OPEN.includes(o.estado) },
      ...Object.entries(STATUS.order).map(([key, s]) => ({ key, label: s.label, section: 'Estado', count: orders.filter((o) => o.estado === key).length, test: (o) => o.estado === key })),
      { key: 'atrasados', label: 'Atrasados', section: 'Fecha', tone: 'danger', count: orders.filter(late).length, test: late },
      { key: 'trabajo', label: 'Para un trabajo', section: 'Destino', test: (o) => o.destino?.tipo === 'trabajo' },
      { key: 'sucursal', label: 'Para una sucursal', section: 'Destino', test: (o) => o.destino?.tipo === 'sucursal' },
    ],
    [orders],
  );
  const { rows, groups, panel } = useListControls(orders, {
    filters,
    groupOptions: [
      { key: 'estado', label: 'Estado', of: (o) => STATUS.order[o.estado]?.label },
      { key: 'recibe', label: 'Lo recibe', of: (o) => o.responsable?.name },
      { key: 'origen', label: 'Sale de', of: (o) => o.sucursalOrigen?.nombre },
    ],
    searchText: (o) => `${o.codigo} ${destinationText(o)} ${o.solicitante?.name} ${o.responsable?.name} ${o.items.map((i) => i.materialNombre).join(' ')}`,
  });

  const quick = (o) =>
    manage && (
      <RowQuickActions
        actions={o.transicionesValidas
          .filter((e) => e !== 'cancelado')
          .map((estado) => ({ key: estado, icon: TRANSITION[estado].icon, label: TRANSITION[estado].label, tone: TRANSITION[estado].tone, disabled: actions.busy, onClick: () => actions.change(o, estado) }))}
      />
    );

  const columns = [
    { key: 'codigo', header: 'Pedido', cell: (o) => <div><p className="font-semibold text-primary">{o.codigo}</p><p className="text-xs text-muted-foreground">{formatDay(o.createdAt)}</p></div> },
    { key: 'estado', header: 'Estado', cell: (o) => <StatusBadge entity="order" state={o.estado} /> },
    { key: 'destino', header: 'Destino', cell: (o) => <span className="line-clamp-2">{destinationText(o)}</span> },
    { key: 'personas', header: 'Lo pide / lo recibe', cell: (o) => <div className="text-sm"><p>{o.solicitante?.name}</p><p className="text-xs text-muted-foreground">para {o.responsable?.name}</p></div> },
    { key: 'items', header: 'Ítems', cell: (o) => <div><p className="line-clamp-1">{o.items.map((i) => i.materialNombre).join(', ')}</p><p className="text-xs text-muted-foreground">{o.items.length} ítem(s), {formatBs(o.costoTotal)}</p></div> },
    { key: 'prioridad', header: 'Prioridad', cell: (o) => <PriorityTag prioridad={o.prioridad} /> },
    { key: 'fecha', header: 'Se necesita', cell: (o) => (o.fechaEntregaEstimada ? <span className={late(o) ? 'font-semibold text-danger-fg' : ''}>{formatDay(o.fechaEntregaEstimada)}{late(o) ? ' (atrasado)' : ''}</span> : '—') },
    { key: 'acciones', header: '', cell: quick },
  ];
  const csv = [
    { header: 'Pedido', value: (o) => o.codigo },
    { header: 'Estado', value: (o) => STATUS.order[o.estado]?.label },
    { header: 'Destino', value: destinationText },
    { header: 'Lo pide', value: (o) => o.solicitante?.name },
    { header: 'Lo recibe', value: (o) => o.responsable?.name },
    { header: 'Ítems', value: (o) => o.items.map((i) => `${i.cantidad} ${i.unidad} ${i.materialNombre}`).join('; ') },
    { header: 'Total Bs', value: (o) => Number(o.costoTotal).toFixed(2) },
  ];

  return (
    <>
      {tabs}
      <ControlPanel
        breadcrumbs={[{ label: 'Inventario' }, { label: 'Pedidos internos' }]}
        actions={manage && <Button onClick={() => setCreating(true)}><Plus /> Nuevo pedido</Button>}
        searchPlaceholder="Buscar por código, cliente, material, persona…"
        {...panel}
        onExport={() => downloadCsv('pedidos-internos.csv', csv, rows)}
        meta={`${rows.length} pedidos`}
      />
      <div className="px-4 py-4 sm:px-6">
        <ListView
          columns={columns}
          rows={rows}
          groups={groups}
          loading={isLoading}
          tone={(o) => (late(o) ? 'danger' : o.estado === 'solicitado' ? 'warning' : undefined)}
          onRowClick={(o) => navigate(`/inventario/pedidos/${o.id}`)}
          empty="No hay pedidos con estos filtros"
          renderCard={(o) => (
            <div className="space-y-1 text-sm">
              <div className="flex items-center justify-between gap-2">
                <span className="font-semibold text-primary">{o.codigo}</span>
                <StatusBadge entity="order" state={o.estado} />
              </div>
              <p className="line-clamp-2">{destinationText(o)}</p>
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs text-muted-foreground">Para {o.responsable?.name}, {o.items.length} ítem(s)</span>
                {quick(o)}
              </div>
            </div>
          )}
        />
      </div>
      <OrderFormDialog open={creating} onOpenChange={setCreating} onSaved={(o) => o?.id && navigate(`/inventario/pedidos/${o.id}`)} />
    </>
  );
}
