import { Ban, Check, Pencil, Undo2, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import { Chatter } from '@/features/activity';
import { useUserDirectory } from '@/features/catalogs';
import { Field, FieldGrid, Money, StatusBadge } from '@/shared/views';
import { formatBs, formatDateTime, formatDay } from '@/shared/lib/format.js';
import { useCashBoxes, useMovement } from '../api.js';
import { CONCEPTO_LABEL, ESTADO, MOVEMENT_FIELDS, TIPO_LABEL, sign } from '../constants.js';

/** Everything about one movement: what it is, who holds the money, what can be done now, and its history. */
export function MovementSheet({ movementId, actions, onClose }) {
  const { data: m, isLoading } = useMovement(movementId);
  const { data: boxes = [] } = useCashBoxes();
  const { data: people = [] } = useUserDirectory();
  const can = m ? actions.allowed(m) : {};
  const formatValue = (field, value) => {
    if (field === 'estado') return ESTADO[value]?.label;
    if (field === 'concepto') return CONCEPTO_LABEL[value];
    if (field === 'monto' && value != null) return formatBs(value);
    if (field === 'cajaId') return boxes.find((b) => b.id === value)?.nombre;
    if (field === 'recibidoPorId') return people.find((p) => p.id === value)?.name;
    return undefined;
  };

  return (
    <Sheet open={Boolean(movementId)} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="w-full space-y-4 sm:max-w-lg">
        {isLoading || !m ? (
          <Skeleton className="h-64 w-full" />
        ) : (
          <>
            <SheetHeader>
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge entity="movement" state={m.estado} />
                <span className="text-xs text-muted-foreground">{TIPO_LABEL[m.tipo]}</span>
              </div>
              <SheetTitle className="flex items-baseline justify-between gap-2">
                <span>{CONCEPTO_LABEL[m.concepto] || m.concepto}</span>
                <Money value={m.monto} kind={sign(m) > 0 ? 'in' : sign(m) < 0 ? 'out' : 'plain'} className="text-xl" />
              </SheetTitle>
              <SheetDescription>{m.nota || 'Sin nota'}</SheetDescription>
            </SheetHeader>

            {m.motivo && ['observado', 'anulado'].includes(m.estado) && (
              <p className={m.estado === 'observado' ? 'rounded-md border border-danger-border bg-danger-soft p-3 text-sm text-danger-fg' : 'rounded-md border border-border bg-muted p-3 text-sm'}>
                <strong>{m.estado === 'observado' ? 'Observado' : 'Anulado'}:</strong> {m.motivo}
              </p>
            )}

            <div className="flex flex-wrap gap-2">
              {can.validate && (
                <Button size="sm" variant="success" disabled={actions.busy} onClick={() => actions.validate(m)}>
                  <Check /> Validar
                </Button>
              )}
              {can.validate && (
                <Button size="sm" variant="outline" onClick={() => actions.chooseBox(m)}>
                  Validar en otra caja…
                </Button>
              )}
              {can.observe && (
                <Button size="sm" variant="outline" className="text-danger-fg" onClick={() => actions.observe(m)}>
                  <X /> Observar
                </Button>
              )}
              {can.edit && (
                <Button size="sm" variant="outline" onClick={() => actions.edit(m)}>
                  <Pencil /> {m.estado === 'validado' ? 'Editar' : 'Corregir'}
                </Button>
              )}
              {can.refund && (
                <Button size="sm" variant="outline" onClick={() => actions.refund(m)}>
                  <Undo2 /> Marcar reembolsado
                </Button>
              )}
              {can.annul && (
                <Button size="sm" variant="ghost" className="text-danger-fg" onClick={() => actions.annul(m)}>
                  <Ban /> Anular
                </Button>
              )}
            </div>

            <FieldGrid className="sm:grid-cols-1">
              <Field label="Fecha">{formatDay(m.fecha)}</Field>
              {m.project && (
                <Field label="Proyecto">
                  <Link className="text-primary hover:underline" to={`/projects/${m.project.id}`}>{m.project.codigo}</Link> — {m.project.titulo}
                </Field>
              )}
              {!m.project && m.schedule && <Field label="Trabajo">{m.schedule.descripcionTrabajo}</Field>}
              {m.cliente && <Field label="Cliente">{m.cliente.nombre}</Field>}
              <Field label="Método">{m.metodo || '—'}</Field>
              <Field label="Registró">{m.registradoPor?.name}</Field>
              {m.tipo === 'ingreso' && (
                <Field label={m.estado === 'por_validar' ? 'Tiene el dinero' : 'Lo recibió'}>
                  <span className={m.estado === 'por_validar' ? 'font-semibold text-warning-fg' : ''}>{m.recibidoPor?.name || '—'}</span>
                </Field>
              )}
              {m.tipo === 'egreso' && <Field label="Pagó">{m.pagadoPor === 'empleado' ? `${m.registradoPor?.name} (empleado)${m.reembolsoPendiente ? ': reembolso pendiente' : ''}` : 'La empresa'}</Field>}
              <Field label={m.tipo === 'transferencia' ? 'Cajas' : 'Caja'}>
                {m.tipo === 'transferencia' ? `${m.caja?.nombre || '—'} → ${m.cajaDestino?.nombre || '—'}` : m.caja?.nombre || 'Aún en ninguna caja'}
              </Field>
              {m.validadoPor && <Field label="Validó">{`${m.validadoPor.name}, ${formatDateTime(m.validadoAt)}`}</Field>}
              <Field label="Sucursal">{m.sucursal?.nombre}</Field>
            </FieldGrid>

            <Chatter entity="movement" id={m.id} fieldLabels={MOVEMENT_FIELDS} formatValue={formatValue} />
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
