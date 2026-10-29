import { useAuth } from '@/contexts/AuthContext.jsx';
import { useConfirm } from '@/shared/views';
import { formatBs, formatBusinessDay } from '@/shared/lib/format.js';
import { notify } from '@/shared/lib/notify.js';
import { useCashBoxes, useMovementAction, useMovementImpact } from '../api.js';
import { CONCEPTO_LABEL, TIPO_LABEL } from '../constants.js';

/** Quick reasons for "Observar" (✗): the author fixes it and it comes back to the inbox. */
const OBSERVE_REASONS = ['Monto incorrecto', 'Falta comprobante', 'Concepto incorrecto', 'Duplicado', 'No llegó a la caja'];

/** "campo: valor" of a movement, shown in every confirmation so it is clear what is being touched. */
function movementDetails(m) {
  return [
    ['Movimiento', `${TIPO_LABEL[m.tipo]}: ${CONCEPTO_LABEL[m.concepto] || m.concepto}`],
    ['Monto', formatBs(m.monto)],
    ['Fecha', formatBusinessDay(m.fecha)],
    ['Proyecto', m.project ? `${m.project.codigo} — ${m.project.titulo}` : null],
    ['Trabajo', !m.project ? m.schedule?.descripcionTrabajo : null],
    ['Cliente', m.cliente?.nombre],
    ['Registró', m.registradoPor?.name],
    ['Tiene el dinero', m.tipo === 'ingreso' && m.estado === 'por_validar' ? m.recibidoPor?.name : null],
    ['Caja', m.caja?.nombre],
    ['Nota', m.nota],
  ];
}

/** The API's impact rows as sentences ("La Caja Central baja de Bs 5.200 a Bs 4.700"). */
export function impactText(efectos = []) {
  return efectos.map((e) => {
    const change = `de ${formatBs(e.antes)} a ${formatBs(e.despues)}`;
    if (e.tipo === 'caja') return `${e.caja} ${e.despues >= e.antes ? 'sube' : 'baja'} ${change}`;
    if (e.tipo === 'saldo') return `${e.de || 'El proyecto'}: lo que se debe pasa ${change}`;
    return `${e.de || 'El proyecto'}: el costo pasa ${change}`;
  });
}

/**
 * Every action on a movement, the same in the inbox (✓ ✗), the row menu and the side panel. Gerencia and
 * Contabilidad manage money; the author may correct or annul it while it waits.
 */
export function useMovementActions({ onEdit, onChooseBox } = {}) {
  const { currentUser, canManageMoney } = useAuth();
  const confirm = useConfirm();
  const action = useMovementAction();
  const impact = useMovementImpact();
  const { data: boxes = [] } = useCashBoxes();
  const manager = canManageMoney();

  // A movement that already names its box (a QR cobro into the primary or secondary QR) is validated there; otherwise the branch's.
  const suggestedBox = (m) => boxes.find((b) => b.id === m.caja?.id) || boxes.find((b) => b.sucursalId === m.sucursal?.id) || boxes[0];

  const run = async (m, key, body, done) => {
    try {
      const saved = await action.mutateAsync({ id: m.id, action: key, ...body });
      return saved && done?.(saved);
    } catch {
      /* shown by the query client */
    }
  };

  /** ✓ one click: into the branch's box; the notice offers to change the box. */
  const validate = (m) => {
    const box = suggestedBox(m);
    if (!box) return notify.error('No hay cajas activas');
    return run(m, 'validar', { cajaId: box.id }, () =>
      notify.success(`Validado en ${box.nombre}`, {
        description: `${CONCEPTO_LABEL[m.concepto] || m.concepto} de ${formatBs(m.monto)}`,
        action: onEdit ? { label: 'Cambiar caja', onClick: () => onEdit({ ...m, estado: 'validado', caja: box }) } : undefined,
      }),
    );
  };

  const observe = async (m) => {
    const { ok, reason } = await confirm({
      title: `¿Observar ${CONCEPTO_LABEL[m.concepto] || m.concepto} de ${formatBs(m.monto)}?`,
      description: `No cuenta como validado y vuelve a ${m.registradoPor?.name || 'quien lo registró'} para que lo corrija.`,
      details: movementDetails(m),
      reason: 'Qué hay que corregir',
      reasonOptions: OBSERVE_REASONS,
      confirmLabel: 'Observar',
      destructive: true,
    });
    if (ok) await run(m, 'observar', { motivo: reason }, () => notify.success('Observado: vuelve a quien lo registró'));
  };

  const annul = async (m) => {
    let effect = ['Deja de contar en saldos, costos y cajas.'];
    if (manager) {
      try {
        const { efectos } = await impact(m.id, 'anular');
        if (efectos.length) effect = impactText(efectos);
      } catch {
        /* shown by the query client; the generic effect stays */
      }
    }
    const { ok, reason } = await confirm({
      title: `¿Anular ${CONCEPTO_LABEL[m.concepto] || m.concepto} de ${formatBs(m.monto)}?`,
      description: m.estado === 'validado' ? 'Está validado: sale de su caja. No se puede deshacer.' : 'No se puede deshacer.',
      details: movementDetails(m),
      effect,
      reason: 'Motivo de la anulación',
      confirmLabel: 'Anular',
      destructive: true,
    });
    if (ok) await run(m, 'anular', { motivo: reason }, () => notify.success('Movimiento anulado'));
  };

  const refund = async (m) => {
    const { ok } = await confirm({
      title: `¿Marcar como reembolsado a ${m.registradoPor?.name}?`,
      description: 'El empleado ya recibió el dinero que puso.',
      details: movementDetails(m),
      confirmLabel: 'Reembolsado',
      tone: 'success',
    });
    if (ok) await run(m, 'reembolsar', {}, () => notify.success('Reembolso registrado'));
  };

  /** What this user may do with this movement right now (the API checks the same). */
  const allowed = (m) => {
    const own = m.registradoPor?.id === currentUser?.id;
    const next = m.transicionesValidas || [];
    return {
      validate: manager && next.includes('validado'),
      observe: manager && next.includes('observado'),
      edit: manager ? m.estado !== 'anulado' : own && ['por_validar', 'observado'].includes(m.estado),
      annul: next.includes('anulado') && (manager || (own && m.estado !== 'validado')),
      refund: manager && m.reembolsoPendiente && m.estado === 'validado',
    };
  };

  return { allowed, validate, chooseBox: onChooseBox, observe, annul, refund, edit: onEdit, busy: action.isPending };
}
