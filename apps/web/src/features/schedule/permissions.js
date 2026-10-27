// What each role may do with a job (the API checks the same in common/policy): shown in the panel so nobody has to
// guess, and buttons a role cannot use are not shown.
import { ROLES } from '@/constants/roles.js';

/**
 * commercial = Gerencia (Administración, Contabilidad) or Ventas. A técnico works only on his own jobs: he starts and
 * finishes them, registers payments and the material he uses (on a project job), and writes notes.
 */
export function jobPermissions(job, user, commercial) {
  const own = user?.role === ROLES.TEC && job?.tecnicoId === user?.id;
  const open = job && !['terminado', 'cancelado'].includes(job.estado);
  return {
    changeState: Boolean(open && (commercial || own)),
    cancel: Boolean(open && commercial),
    edit: Boolean(open && commercial),
    assign: Boolean(open && commercial),
    collect: Boolean(job && job.estado !== 'cancelado' && (job.projectId || Number(job.monto) > 0) && (commercial || own)),
    material: Boolean(job?.projectId && job.estado !== 'cancelado' && (commercial || own)),
    notes: Boolean(commercial || own),
  };
}

/** "Puedes: iniciar, terminar, registrar cobro…" in words, from jobPermissions. */
export function describePermissions(can, estado) {
  const list = [
    can.changeState && (estado === 'programado' ? 'iniciar' : 'terminar'),
    can.cancel && 'cancelar',
    can.edit && 'cambiar fecha, horario y datos',
    can.assign && 'asignar técnico',
    can.collect && 'registrar cobro',
    can.material && 'registrar material usado',
    can.notes && 'escribir notas',
  ].filter(Boolean);
  return list.length ? `Puedes: ${list.join(', ')}.` : 'Solo lectura: este trabajo no es tuyo o ya está cerrado.';
}
