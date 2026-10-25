import { Ban, Check, PackageCheck, Play, Truck, X } from 'lucide-react';
import { useConfirm } from '@/shared/views';
import { formatBs, formatDay } from '@/shared/lib/format.js';
import { notify } from '@/shared/lib/notify.js';
import { useOrderStatus } from '../api.js';

/** Each transition the API may allow: button label, icon, tone and what the confirmation explains. */
export const TRANSITION = {
  aprobado: { label: 'Aprobar', icon: Check, tone: 'success', done: 'Pedido aprobado' },
  rechazado: { label: 'Rechazar', icon: X, tone: 'danger', reason: 'Por qué se rechaza', done: 'Pedido rechazado' },
  'en_preparación': { label: 'Preparar', icon: Play, tone: 'info', done: 'Pedido en preparación' },
  listo_para_entrega: { label: 'Listo para entregar', icon: Truck, tone: 'info', done: 'Listo para entregar' },
  entregado: { label: 'Entregar', icon: PackageCheck, tone: 'success', done: 'Pedido entregado: el stock se movió' },
  cancelado: { label: 'Cancelar pedido', icon: Ban, tone: 'danger', reason: 'Por qué se cancela', done: 'Pedido cancelado' },
};

/** Where an order goes, in words. */
export function destinationText(o) {
  if (o.destino?.tipo === 'trabajo') {
    const t = o.destino.trabajo;
    if (!t) return 'Trabajo';
    return `${t.cliente?.nombre || 'Sin cliente'}: ${t.descripcionTrabajo}${t.project ? ` (proyecto ${t.project.codigo})` : ''}`;
  }
  return o.destino?.sucursal ? `Sucursal ${o.destino.sucursal.nombre}` : '—';
}

function details(o) {
  return [
    ['Pedido', o.codigo],
    ['Destino', destinationText(o)],
    ['Sale de', o.sucursalOrigen?.nombre],
    ['Lo pide', o.solicitante?.name],
    ['Lo recibe', o.responsable?.name],
    ['Se necesita el', o.fechaEntregaEstimada ? formatDay(o.fechaEntregaEstimada) : null],
    ['Ítems', `${o.items.length} (${formatBs(o.costoTotal)})`],
  ];
}

/** What delivering does to the stock: only catalog items move; free text moves nothing. */
function deliveryEffect(o) {
  const catalog = o.items.filter((i) => i.productoId);
  const to = o.destino?.tipo === 'trabajo' ? (o.destino.trabajo?.project ? `al proyecto ${o.destino.trabajo.project.codigo}` : 'al trabajo') : `a ${o.destino?.sucursal?.nombre || 'la sucursal de destino'}`;
  const lines = catalog.map((i) => `Salen ${i.cantidad} ${i.unidad} de ${i.materialNombre} de ${o.sucursalOrigen?.nombre || 'origen'} ${to}`);
  if (catalog.length < o.items.length) lines.push(`${o.items.length - catalog.length} ítem(s) de texto libre no mueven stock`);
  return lines;
}

/** Changes the state of an order after a confirmation that says what it is and what will happen. */
export function useOrderActions() {
  const confirm = useConfirm();
  const status = useOrderStatus();

  const change = async (order, estado) => {
    const t = TRANSITION[estado];
    const { ok, reason } = await confirm({
      title: `¿${t.label} ${order.codigo}?`,
      details: details(order),
      effect: estado === 'entregado' ? deliveryEffect(order) : undefined,
      reason: t.reason,
      confirmLabel: t.label,
      destructive: t.tone === 'danger',
      tone: t.tone === 'success' ? 'success' : undefined,
    });
    if (!ok) return;
    try {
      await status.mutateAsync({ id: order.id, estado, ...(reason ? { observacion: reason } : {}) });
      notify.success(t.done);
    } catch {
      /* shown by the query client */
    }
  };

  return { change, busy: status.isPending };
}
