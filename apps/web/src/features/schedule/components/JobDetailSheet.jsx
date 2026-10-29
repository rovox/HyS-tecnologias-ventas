import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, HandCoins, Info, Package, Pencil, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/contexts/AuthContext.jsx';
import { Chatter } from '@/features/activity';
import { useUserDirectory } from '@/features/catalogs';
import { Field, FieldGrid, LocationLink, Money, SearchSelect, StatusBadge } from '@/shared/views';
import { cn } from '@/lib/utils';
import { formatBs, formatDay } from '@/shared/lib/format.js';
import { notify } from '@/shared/lib/notify.js';
import { useJob, useUpdateJob } from '../api.js';
import { DivisionTag } from './JobChip.jsx';
import { JobFormDialog } from './JobFormDialog.jsx';
import { DIVISION, JOB_ACTIONS, JOB_FIELDS, JOB_STATE } from '../constants.js';
import { describePermissions, jobPermissions } from '../permissions.js';
import { MaterialDialog } from './MaterialDialog.jsx';
import { useJobState } from './useJobState.js';
import { ROLES } from '@/constants/roles.js';
import { IncomeDialog } from '@/features/finance';

const TECNICO = ROLES.TEC;

/** Everything about one job in a side panel, the same from the week, month and list views. */
export function JobDetailSheet({ jobId, onClose }) {
  const { currentUser, isVentasLevel, readsAll } = useAuth();
  const commercial = isVentasLevel();
  const { data: job, isLoading } = useJob(jobId);
  const { data: users = [] } = useUserDirectory();
  const update = useUpdateJob();
  const jobState = useJobState();
  const [paying, setPaying] = useState(false);
  const [usingMaterial, setUsingMaterial] = useState(false);
  const [editing, setEditing] = useState(false);
  const [notes, setNotes] = useState('');
  useEffect(() => {
    if (job) setNotes(job.observaciones || '');
  }, [job]);

  const save = (data, message) => update.mutateAsync({ id: job.id, ...data }).then(() => notify.success(message), () => null);
  const tecnicos = users.filter((u) => u.role === TECNICO).map((u) => ({ value: u.id, label: u.name }));
  const nameOf = (id) => users.find((u) => u.id === id)?.name;
  const formatValue = (field, value) => {
    if (field === 'estado') return JOB_STATE[value]?.label;
    if (field === 'tecnicoId' || field === 'vendedorId') return value ? nameOf(value) : 'Sin asignar';
    if (field === 'categoriaId') return DIVISION[value]?.short;
    return undefined;
  };

  const can = jobPermissions(job, currentUser, commercial);
  const actions = (JOB_ACTIONS[job?.estado] || []).filter((a) => (a.destructive ? can.cancel : can.changeState));

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
              {actions.map((action) => (
                <Button
                  key={action.estado}
                  size="sm"
                  variant={action.destructive ? 'ghost' : action.estado === 'terminado' ? 'success' : 'default'}
                  className={action.destructive ? 'text-danger-fg' : ''}
                  disabled={jobState.busy}
                  onClick={() => jobState.run(job, action)}
                >
                  {action.estado === 'terminado' && <Check />}
                  {action.estado === 'en_proceso' && <Play />}
                  {action.label}
                </Button>
              ))}
              {can.collect && (
                <Button size="sm" variant="outline" onClick={() => setPaying(true)}>
                  <HandCoins /> Registrar cobro
                </Button>
              )}
              {can.material && (
                <Button size="sm" variant="outline" onClick={() => setUsingMaterial(true)}>
                  <Package /> Registrar material
                </Button>
              )}
              {can.edit && (
                <Button size="sm" variant="outline" onClick={() => setEditing(true)}>
                  <Pencil /> Editar trabajo
                </Button>
              )}
            </div>
            <p className="flex items-start gap-1.5 rounded-md bg-muted/60 px-2 py-1.5 text-xs text-muted-foreground">
              <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" /> {describePermissions(can, job.estado)}
            </p>

            <FieldGrid className="sm:grid-cols-1">
              <Field label="Fecha">{formatDay(job.fechaProgramada)}</Field>
              <Field label="Horario">{job.horario || 'Sin horario'}</Field>
              <Field label={<span className={cn(!job.tecnicoId && 'font-semibold text-danger-fg')}>Técnico</span>}>
                {can.assign ? (
                  <SearchSelect
                    value={job.tecnicoId || ''}
                    onChange={(tecnicoId) => save({ tecnicoId }, tecnicoId ? `Asignado a ${nameOf(tecnicoId)}` : 'Técnico quitado')}
                    placeholder="Asignar técnico"
                    emptyOption={job.tecnicoId ? 'Quitar técnico' : undefined}
                    searchPlaceholder="Buscar técnico…"
                    disabled={update.isPending}
                    invalid={!job.tecnicoId}
                    className={cn(!job.tecnicoId && 'font-semibold text-danger-fg')}
                    options={tecnicos}
                  />
                ) : (
                  <span className={cn(!job.tecnicoId && 'font-semibold text-danger-fg')}>{job.tecnico?.name || 'Sin asignar'}</span>
                )}
              </Field>
              <Field label="Lugar">
                <LocationLink address={job.lugar} link={job.mapsLink} />
              </Field>
              {job.project ? (
                <>
                <Field label="Proyecto">
                  {readsAll() ? <Link className="text-primary hover:underline" to={`/projects/${job.project.id}`}>{job.project.codigo}</Link> : job.project.codigo}
                  <span className="block text-xs text-muted-foreground">Los cobros van al proyecto</span>
                </Field>
                <Field label="Saldo del proyecto">
                  <Money value={job.project.saldo} kind="owed" />
                  <span className="block text-xs text-muted-foreground">{job.project.pctCobrado}% cobrado</span>
                </Field>
                </>
              ) : (
                Number(job.monto) > 0 && (
                  <>
                    <Field label="Monto">{formatBs(job.monto)}</Field>
                    <Field label="Cobrado"><Money value={job.adelanto} /></Field>
                    <Field label="Saldo"><Money value={job.saldo} kind="owed" /></Field>
                  </>
                )
              )}
              {job.vendedor && <Field label="Vendedor">{job.vendedor.name}</Field>}
            </FieldGrid>

            <section className="space-y-2">
              <h3 className="text-sm font-semibold">Notas</h3>
              <Textarea rows={3} value={notes} readOnly={!can.notes} onChange={(e) => setNotes(e.target.value)} placeholder="Qué se hizo, qué falta…" />
              {can.notes && (
                <Button size="sm" variant="outline" disabled={notes === (job.observaciones || '') || update.isPending} onClick={() => save({ observaciones: notes }, 'Notas guardadas')}>
                  Guardar notas
                </Button>
              )}
            </section>

            <Chatter entity="schedule" id={job.id} fieldLabels={JOB_FIELDS} formatValue={formatValue} />
            <JobFormDialog open={editing} onOpenChange={setEditing} job={job} />
            {job.projectId && <MaterialDialog job={job} open={usingMaterial} onOpenChange={setUsingMaterial} />}
            <IncomeDialog
              target={{
                kind: 'job',
                id: job.id,
                title: job.project ? `el proyecto ${job.project.codigo}` : job.cliente?.nombre,
                saldo: job.project ? job.project.saldo : Number(job.saldo),
                cobrado: job.project ? job.project.cobrado : Number(job.adelanto),
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
