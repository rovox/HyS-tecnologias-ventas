import { MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useAuth } from '@/contexts/AuthContext.jsx';
import { useConfirm } from '@/shared/views';
import { notify } from '@/shared/lib/notify.js';
import { useMovementAction } from '../api.js';

const PROMPTS = {
  observar: { title: '¿Observar el movimiento?', description: 'Vuelve a quien lo registró para que lo corrija.', confirmLabel: 'Observar', reason: 'Qué hay que corregir', done: 'Movimiento observado' },
  anular: { title: '¿Anular el movimiento?', description: 'Deja de contar en saldos y cajas.', confirmLabel: 'Anular', destructive: true, reason: 'Motivo de la anulación', done: 'Movimiento anulado' },
  revertir: { title: '¿Revertir el movimiento validado?', description: 'Se registra el movimiento inverso, validado en la misma caja.', confirmLabel: 'Revertir', destructive: true, reason: 'Motivo del reverso', done: 'Movimiento revertido' },
  reembolsar: { title: '¿Marcar como reembolsado?', description: 'El empleado ya recibió el dinero que puso.', confirmLabel: 'Reembolsado', done: 'Reembolso registrado' },
};

/** Row menu: only what this movement and this user allow. Validating opens the box picker (`onValidate`). */
export function MovementActions({ movement: m, onValidate, onEdit }) {
  const { currentUser, canManageMoney } = useAuth();
  const confirm = useConfirm();
  const action = useMovementAction();
  const admin = canManageMoney();
  const own = m.registradoPor?.id === currentUser?.id;
  const allowed = m.transicionesValidas;

  const items = [
    admin && allowed.includes('validado') && { key: 'validar', label: 'Validar…', run: () => onValidate(m) },
    admin && allowed.includes('observado') && { key: 'observar', label: 'Observar' },
    (admin || own) && ['por_validar', 'observado'].includes(m.estado) && { key: 'corregir', label: 'Corregir', run: () => onEdit(m) },
    (admin || own) && allowed.includes('anulado') && { key: 'anular', label: 'Anular', destructive: true },
    admin && m.estado === 'validado' && !m.reversaDeId && { key: 'revertir', label: 'Revertir', destructive: true },
    admin && m.reembolsoPendiente && m.estado === 'validado' && { key: 'reembolsar', label: 'Marcar reembolsado' },
  ].filter(Boolean);
  if (!items.length) return null;

  async function run(key) {
    const prompt = PROMPTS[key];
    const { ok, reason } = await confirm(prompt);
    if (!ok) return;
    try {
      await action.mutateAsync({ id: m.id, action: key, ...(reason ? { motivo: reason } : {}) });
      notify.success(prompt.done);
    } catch {
      /* shown by the query client */
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Acciones del movimiento" onClick={(e) => e.stopPropagation()}>
          <MoreHorizontal />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {items.map((item) => (
          <DropdownMenuItem key={item.key} className={item.destructive ? 'text-destructive' : ''} onSelect={() => (item.run ? item.run() : run(item.key))}>
            {item.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
