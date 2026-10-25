import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { HandCoins } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/contexts/AuthContext.jsx';
import { Chatter } from '@/features/activity';
import { useUserDirectory } from '@/features/catalogs';
import { Field, FieldGrid, LocationLink, SearchSelect, StatusBadge, useConfirm } from '@/shared/views';
import { formatBs, formatDay } from '@/shared/lib/format.js';
import { notify } from '@/shared/lib/notify.js';
import { useJob, useUpdateJob } from '../api.js';
import { DivisionTag } from './JobChip.jsx';
import { JOB_ACTIONS, JOB_FIELDS, JOB_STATE, formatJobValue } from '../constants.js';
import { jobDay } from '../dates.js';
import { ROLES } from '@/constants/roles.js';
import { IncomeDialog } from '@/features/finance';
import { useProject } from '@/features/projects';

const TECNICO = ROLES.TEC;

/** Everything about one job in a side panel, the same from the week, month and list views. */
export function JobDetailSheet({ jobId, onClose }) {
  const { isVentasLevel, readsAll } = useAuth();
  const commercial = isVentasLevel();
  const { data: job, isLoading } = useJob(jobId);
  const { data: project } = useProject(job?.projectId, Boolean(job?.projectId) && readsAll());
  const { data: users = [] } = useUserDirectory();
  const update = useUpdateJob();
  const confirm = useConfirm();
  const [paying, setPaying] = useState(false);
  const [plan, setPlan] = useState({ fecha: '', horario: '', tecnicoId: '' });
  const [notes, setNotes] = useState('');
  useEffect(() => {
    if (job) {
      setPlan({ fecha: jobDay(job), horario: job.horario || '', tecnicoId: job.tecnicoId || '' });
      setNotes(job.observaciones || '');
    }
  }, [job]);

  const save = (data, message) => update.mutateAsync({ id: job.id, ...data }).then(() => notify.success(message), () => null);

  async function changeState(action) {
    const { ok, reason } = await confirm({ title: action.confirm, description: `${job.cliente?.nombre} · ${job.descripcionTrabajo}`, confirmLabel: action.label, destructive: action.destructive, reason: action.reason });
    if (!ok) return;
    const note = reason ? `${job.observaciones ? `${job.observaciones}\n` : ''}Cancelado: ${reason}` : undefined;
    save({ estado: action.estado, ...(note ? { observaciones: note } : {}) }, `Trabajo ${JOB_STATE[action.estado].label.toLowerCase()}`);
  }

  const open = job && !['terminado', 'cancelado'].includes(job.estado);
  const planChanged = job && (plan.fecha !== jobDay(job) || plan.horario !== (job.horario || '') || plan.tecnicoId !== (job.tecnicoId || ''));

  return (
    <Sheet open={Boolean(jobId)} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="w-full space-y-4 sm:max-w-lg">
        {isLoading || !job ? (
          <Skeleton className="h-64 w-full" />
        ) : (
          <>
            <SheetHeader>
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <StatusBadge entity="job" state={job.estado} />
                <DivisionTag id={job.categoriaId} label={job.categoria?.label} />
              </div>
              <SheetTitle>{job.cliente?.nombre}</SheetTitle>
              <SheetDescription>{job.descripcionTrabajo}</SheetDescription>
            </SheetHeader>

            <div className="flex flex-wrap gap-2">
              {(JOB_ACTIONS[job.estado] || []).map((action) => (
                <Button key={action.estado} size="sm" variant={action.destructive ? 'ghost' : 'default'} className={action.destructive ? 'text-destructive' : ''} disabled={update.isPending} onClick={() => changeState(action)}>
                  {action.label}
                </Button>
              ))}
              {job.estado !== 'cancelado' && (job.projectId || Number(job.monto) > 0) && (
                <Button size="sm" variant="outline" onClick={() => setPaying(true)}>
                  <HandCoins /> Registrar cobro
                </Button>
              )}
            </div>

            <FieldGrid className="sm:grid-cols-1">
              <Field label="Fecha">{formatDay(job.fechaProgramada)}{job.horario ? ` · ${job.horario}` : ''}</Field>
              <Field label="Técnico">{job.tecnico?.name || 'Sin asignar'}</Field>
              <Field label="Lugar">
                <LocationLink address={job.lugar} link={job.mapsLink} />
              </Field>
              {job.project ? (
                <Field label="Proyecto">
                  {readsAll() ? <Link className="text-primary hover:underline" to={`/projects/${job.project.id}`}>{job.project.codigo}</Link> : job.project.codigo}
                  <span className="text-xs text-muted-foreground"> · el dinero es del proyecto</span>
                </Field>
              ) : (
                Number(job.monto) > 0 && (
                  <>
                    <Field label="Monto">{formatBs(job.monto)}</Field>
                    <Field label="Cobrado / saldo">
                      {formatBs(job.adelanto)} · <span className={Number(job.saldo) > 0 ? 'font-medium text-destructive' : ''}>{formatBs(job.saldo)}</span>
                    </Field>
                  </>
                )
              )}
              {job.vendedor && <Field label="Vendedor">{job.vendedor.name}</Field>}
            </FieldGrid>

            {open && commercial && (
              <section className="space-y-2 rounded-md border border-border p-3">
                <h3 className="text-sm font-semibold">Reprogramar o asignar</h3>
                <div className="grid grid-cols-2 gap-2">
                  <Input type="date" aria-label="Fecha" value={plan.fecha} onChange={(e) => setPlan({ ...plan, fecha: e.target.value })} />
                  <Input placeholder="09:00–12:00" aria-label="Horario" value={plan.horario} onChange={(e) => setPlan({ ...plan, horario: e.target.value })} />
                </div>
                <SearchSelect
                  value={plan.tecnicoId}
                  onChange={(tecnicoId) => setPlan({ ...plan, tecnicoId })}
                  emptyOption="Sin asignar"
                  searchPlaceholder="Buscar técnico…"
                  options={users.filter((u) => u.role === TECNICO).map((u) => ({ value: u.id, label: u.name }))}
                />
                <Button size="sm" disabled={!planChanged || update.isPending} onClick={() => save({ fechaProgramada: plan.fecha, horario: plan.horario, tecnicoId: plan.tecnicoId }, 'Trabajo reprogramado')}>
                  Guardar
                </Button>
              </section>
            )}

            <section className="space-y-2">
              <h3 className="text-sm font-semibold">Notas</h3>
              <Textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Qué se hizo, qué falta, material usado…" />
              <Button size="sm" variant="outline" disabled={notes === (job.observaciones || '') || update.isPending} onClick={() => save({ observaciones: notes }, 'Notas guardadas')}>
                Guardar notas
              </Button>
            </section>

            <Chatter entity="schedule" id={job.id} fieldLabels={JOB_FIELDS} formatValue={formatJobValue} />
            <IncomeDialog
              target={{
                kind: 'job',
                id: job.id,
                title: job.project ? `el proyecto ${job.project.codigo}` : job.cliente?.nombre,
                saldo: job.projectId ? project?.saldo : Number(job.saldo),
                cobrado: job.projectId ? project?.cobrado : Number(job.adelanto),
              }}
              open={paying}
              onOpenChange={setPaying}
            />
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
