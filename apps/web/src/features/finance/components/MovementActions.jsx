import { Check, MoreHorizontal, Pencil, Trash2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { RowQuickActions } from '@/shared/views';

/**
 * Actions of a movement row, as icons first (FIN-06): ✓ validates into the branch's box (green), the pencil edits, the
 * red bin annuls with a reason (nothing is deleted: it stays crossed out). `quick` (rendición inbox): ✓, ✗ observes
 * with a reason, pencil. The ⋯ menu keeps the rest. `actions` comes from useMovementActions.
 */
export function MovementActions({ movement: m, actions, quick = false }) {
  const can = actions.allowed(m);
  const editLabel = m.estado === 'validado' ? 'Editar (queda en el historial)' : 'Corregir';
  const icons = [
    { key: 'ok', icon: Check, label: 'Validar en la caja de la sucursal', tone: 'success', hidden: !can.validate, disabled: actions.busy, onClick: () => actions.validate(m) },
    quick && { key: 'no', icon: X, label: 'Observar: no es correcto', tone: 'danger', hidden: !can.observe, disabled: actions.busy, onClick: () => actions.observe(m) },
    { key: 'edit', icon: Pencil, label: editLabel, hidden: !can.edit, onClick: () => actions.edit(m) },
    !quick && { key: 'annul', icon: Trash2, label: 'Anular (pide motivo)', tone: 'danger', hidden: !can.annul, disabled: actions.busy, onClick: () => actions.annul(m) },
  ].filter(Boolean);
  const menu = [
    can.validate && { key: 'box', label: 'Validar en otra caja…', run: () => actions.chooseBox(m) },
    !quick && can.observe && { key: 'observe', label: 'Observar…', run: () => actions.observe(m) },
    can.refund && { key: 'refund', label: 'Marcar reembolsado', run: () => actions.refund(m) },
    quick && can.annul && { key: 'annul', label: 'Anular…', destructive: true, run: () => actions.annul(m) },
  ].filter(Boolean);
  if (!menu.length && icons.every((i) => i.hidden)) return null;

  return (
    <RowQuickActions actions={icons}>
      {menu.length > 0 && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 min-h-8 w-8 min-w-8" aria-label="Más acciones del movimiento">
              <MoreHorizontal />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {menu.map((item, i) => (
              <span key={item.key}>
                {item.destructive && i > 0 && <DropdownMenuSeparator />}
                <DropdownMenuItem className={item.destructive ? 'text-danger-fg' : ''} onSelect={item.run}>
                  {item.label}
                </DropdownMenuItem>
              </span>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </RowQuickActions>
  );
}
