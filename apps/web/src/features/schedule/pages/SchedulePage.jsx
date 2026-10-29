import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { CalendarDays, CalendarRange, Check, ChevronLeft, ChevronRight, List, Play, Plus, UserX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Layout from '@/components/Layout.jsx';
import { useAuth } from '@/contexts/AuthContext.jsx';
import { cn } from '@/lib/utils';
import { ControlPanel, ListView, StatusBadge, useListControls } from '@/shared/views';
import { downloadCsv } from '@/shared/lib/csv.js';
import { formatBs, formatDay } from '@/shared/lib/format.js';
import { useDocumentTitle } from '@/shared/lib/useDocumentTitle.js';
import { useIsPhone } from '@/shared/lib/useIsPhone.js';
import { useJobs } from '../api.js';
import { DIVISION, JOB_STATE, STATE_TABS } from '../constants.js';
import { jobPermissions } from '../permissions.js';
import { useJobState } from '../components/useJobState.js';
import { addDays, addMonths, jobDay, monthGrid, monthLabel, rangeLabel, today, weekDays, weekStart } from '../dates.js';
import { DivisionTag, StateLegend } from '../components/JobChip.jsx';
import { JobDetailSheet } from '../components/JobDetailSheet.jsx';
import { JobFormDialog } from '../components/JobFormDialog.jsx';
import { MonthView } from '../components/MonthView.jsx';
import { WeekView } from '../components/WeekView.jsx';

const VIEWS = [
  { key: 'semana', label: 'Semana', icon: CalendarRange },
  { key: 'mes', label: 'Mes', icon: CalendarDays },
  { key: 'lista', label: 'Lista', icon: List },
];

/** An open job nobody will attend: shown in red everywhere. */
const unassigned = (j) => !j.tecnicoId && ['programado', 'en_proceso'].includes(j.estado);

const listColumns = [
  { key: 'fecha', header: 'Fecha', cell: (j) => `${formatDay(j.fechaProgramada)}${j.horario ? `, ${j.horario}` : ''}` },
  { key: 'cliente', header: 'Cliente', cell: (j) => <div><p className="font-medium">{j.cliente?.nombre}</p><p className="text-xs text-muted-foreground">{j.descripcionTrabajo}</p></div> },
  { key: 'categoria', header: 'Categoría', cell: (j) => <DivisionTag id={j.categoriaId} /> },
  { key: 'tecnico', header: 'Técnico', cell: (j) => (j.tecnico?.name || <span className={unassigned(j) ? 'font-semibold text-danger-fg' : ''}>Sin asignar</span>) },
  { key: 'origen', header: 'Origen', cell: (j) => j.project?.codigo || 'Trabajo suelto' },
  { key: 'estado', header: 'Estado', cell: (j) => <StatusBadge entity="job" state={j.estado} /> },
  { key: 'saldo', header: 'Saldo', align: 'right', cell: (j) => (j.projectId ? '—' : formatBs(j.saldo)) },
];

/** The next step of a job as a button in its row (SCH-04): Iniciar, or Terminar in green. */
function QuickCell({ quick }) {
  if (!quick) return null;
  const finish = quick.estado === 'terminado';
  return (
    <div className="flex justify-end" onClick={(e) => e.stopPropagation()}>
      <Button size="sm" variant={finish ? 'success' : 'outline'} className="h-8" disabled={quick.busy} onClick={quick.run}>
        {finish ? <Check /> : <Play />} {quick.label}
      </Button>
    </div>
  );
}

const csv = [
  { header: 'Fecha', value: jobDay },
  { header: 'Horario', value: (j) => j.horario },
  { header: 'Cliente', value: (j) => j.cliente?.nombre },
  { header: 'Trabajo', value: (j) => j.descripcionTrabajo },
  { header: 'Categoría', value: (j) => j.categoria?.label },
  { header: 'Técnico', value: (j) => j.tecnico?.name },
  { header: 'Proyecto', value: (j) => j.project?.codigo },
  { header: 'Estado', value: (j) => j.estado },
];

/** The cronograma everyone can read: who goes where, when, and what state the job is in. */
export default function SchedulePage() {
  const { currentUser, isVentasLevel } = useAuth();
  const commercial = isVentasLevel();
  const phone = useIsPhone();
  const [params, setParams] = useSearchParams();
  const view = VIEWS.some((v) => v.key === params.get('view')) ? params.get('view') : 'semana';
  const anchor = params.get('dia') || today();
  const stateTab = STATE_TABS.find((t) => t.key === params.get('estado')) || STATE_TABS[0];
  const [openId, setOpenId] = useState(null);
  const [creating, setCreating] = useState(null);
  const jobState = useJobState();
  useDocumentTitle('Cronograma');
  // "Programar trabajo" from the dashboard opens the form at once.
  useEffect(() => {
    if (params.get('programar') !== '1') return;
    setCreating(today());
    setParams((p) => { const n = new URLSearchParams(p); n.delete('programar'); return n; }, { replace: true });
  }, [params, setParams]);

  const days = view === 'mes' ? monthGrid(anchor) : weekDays(weekStart(anchor));
  const from = days[0];
  const to = days[days.length - 1];
  const { data: inRange = [], isLoading } = useJobs(from, to);
  // The main filter (SCH-04): only the jobs of one state (Activos = to do and in progress, by default).
  const countOf = (tab) => (tab.states ? inRange.filter((j) => tab.states.includes(j.estado)).length : inRange.length);
  const jobs = useMemo(() => (stateTab.states ? inRange.filter((j) => stateTab.states.includes(j.estado)) : inRange), [inRange, stateTab]);
  /** Iniciar / Terminar on the card or row, for whoever may do it (the técnico on his own jobs). */
  const quickOf = (job) => {
    const action = jobPermissions(job, currentUser, commercial).changeState && jobState.next(job);
    return action ? { label: action.label, estado: action.estado, busy: jobState.busy, run: () => jobState.run(job, action) } : null;
  };

  const filters = useMemo(
    () => [
      { key: 'mios', label: 'Mis trabajos', section: 'Responsable', test: (j) => j.tecnicoId === currentUser?.id || j.vendedorId === currentUser?.id },
      { key: 'sin_tecnico', label: 'Sin técnico', section: 'Responsable', tone: 'danger', count: jobs.filter(unassigned).length, test: unassigned },
      ...Object.entries(DIVISION).map(([id, d]) => ({ key: id, label: d.short, section: 'Categoría', test: (j) => j.categoriaId === id })),
    ],
    [currentUser, jobs],
  );
  const { rows, groups, panel } = useListControls(jobs, {
    filters,
    groupOptions: [
      { key: 'tecnico', label: 'Técnico', of: (j) => j.tecnico?.name || 'Sin asignar' },
      { key: 'categoria', label: 'Categoría', of: (j) => j.categoria?.label },
      { key: 'estado', label: 'Estado', of: (j) => JOB_STATE[j.estado]?.label },
    ],
    searchText: (j) => `${j.cliente?.nombre || ''} ${j.descripcionTrabajo} ${j.tecnico?.name || ''} ${j.project?.codigo || ''} ${j.lugar}`,
  });

  const jobsByDay = useMemo(() => {
    const map = new Map();
    for (const job of rows) {
      const day = jobDay(job);
      if (!map.has(day)) map.set(day, []);
      map.get(day).push(job);
    }
    for (const list of map.values()) list.sort((a, b) => (a.horario || '').localeCompare(b.horario || ''));
    return map;
  }, [rows]);

  const missing = jobs.filter(unassigned).length;
  const showingMissing = panel.activeFilters.includes('sin_tecnico');

  const go = (patch) => setParams((p) => { const n = new URLSearchParams(p); for (const [k, v] of Object.entries(patch)) n.set(k, v); return n; }, { replace: true });
  const step = (n) => go({ dia: view === 'mes' ? addMonths(anchor, n) : addDays(weekStart(anchor), 7 * n) });
  const title = view === 'mes' ? monthLabel(anchor) : rangeLabel(from, to);

  return (
    <Layout>
      <ControlPanel
        breadcrumbs={[{ label: 'Cronograma' }, { label: title }]}
        actions={
          <>
            {commercial && (
              <Button onClick={() => setCreating(anchor)}>
                <Plus /> Programar trabajo
              </Button>
            )}
            <div className="flex items-center gap-1">
              <Button variant="outline" size="icon" aria-label="Anterior" onClick={() => step(-1)}><ChevronLeft /></Button>
              <Button variant="outline" onClick={() => go({ dia: today() })}>Hoy</Button>
              <Button variant="outline" size="icon" aria-label="Siguiente" onClick={() => step(1)}><ChevronRight /></Button>
            </div>
          </>
        }
        searchPlaceholder="Buscar cliente, trabajo, técnico…"
        {...panel}
        views={VIEWS}
        view={view}
        onViewChange={(v) => go({ view: v })}
        onExport={() => downloadCsv(`cronograma-${from}.csv`, csv, rows)}
        meta={`${rows.length} trabajos`}
      />
      <div className="space-y-3 px-4 py-4 sm:px-6">
        <nav className="flex flex-wrap gap-1.5" aria-label="Estado de los trabajos">
          {STATE_TABS.map((tab) => {
            const active = tab.key === stateTab.key;
            const tone = tab.states?.length === 1 ? JOB_STATE[tab.states[0]] : null;
            return (
              <button
                key={tab.key}
                type="button"
                aria-pressed={active}
                onClick={() => go({ estado: tab.key })}
                className={cn(
                  'inline-flex min-h-10 items-center gap-1.5 rounded-md border px-3 text-sm font-semibold',
                  active ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-card text-foreground hover:bg-muted',
                )}
              >
                {tone && <tone.icon className="h-4 w-4" aria-hidden />}
                {tab.label}
                <span className={cn('rounded-full px-1.5 text-xs', active ? 'bg-primary-foreground/20' : 'bg-muted')}>{countOf(tab)}</span>
              </button>
            );
          })}
        </nav>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <StateLegend />
          {(missing > 0 || showingMissing) && (
            <button
              type="button"
              aria-pressed={showingMissing}
              onClick={() => panel.onToggleFilter('sin_tecnico')}
              className={cn('inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs font-semibold', showingMissing ? 'border-danger bg-danger text-danger-foreground' : 'border-danger-border bg-danger-soft text-danger-fg hover:bg-danger hover:text-danger-foreground')}
            >
              <UserX className="h-3.5 w-3.5" /> {showingMissing ? 'Ver todos' : `Sin técnico (${missing})`}
            </button>
          )}
        </div>
        {view === 'semana' && <WeekView days={days} jobsByDay={jobsByDay} onOpen={(j) => setOpenId(j.id)} phone={phone} quickOf={quickOf} onCreate={commercial ? setCreating : undefined} />}
        {view === 'mes' && <MonthView grid={days} month={anchor} jobsByDay={jobsByDay} onOpen={(j) => setOpenId(j.id)} onShowWeek={(day) => go({ view: 'semana', dia: day })} onCreate={commercial ? setCreating : undefined} />}
        {view === 'lista' && (
          <ListView id="cronograma" columns={[...listColumns, { key: 'accion', header: '', cell: (j) => <QuickCell quick={quickOf(j)} /> }]} rows={rows} groups={groups} loading={isLoading} tone={(j) => (unassigned(j) ? 'danger' : undefined)} onRowClick={(j) => setOpenId(j.id)} empty={`No hay trabajos ${stateTab.key === 'todos' ? '' : `${stateTab.label.toLowerCase()} `}en estas fechas`} />
        )}
      </div>
      <JobDetailSheet jobId={openId} onClose={() => setOpenId(null)} />
      <JobFormDialog open={Boolean(creating)} onOpenChange={(o) => !o && setCreating(null)} day={creating || anchor} onCreated={(job) => job?.id && setOpenId(job.id)} />
    </Layout>
  );
}
