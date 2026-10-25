import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { CalendarDays, CalendarRange, ChevronLeft, ChevronRight, List, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Layout from '@/components/Layout.jsx';
import { useAuth } from '@/contexts/AuthContext.jsx';
import { ControlPanel, ListView, StatusBadge, useListControls } from '@/shared/views';
import { downloadCsv } from '@/shared/lib/csv.js';
import { formatBs, formatDay } from '@/shared/lib/format.js';
import { useDocumentTitle } from '@/shared/lib/useDocumentTitle.js';
import { useIsPhone } from '@/shared/lib/useIsPhone.js';
import { useJobs } from '../api.js';
import { DIVISION, JOB_STATE } from '../constants.js';
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

const listColumns = [
  { key: 'fecha', header: 'Fecha', cell: (j) => `${formatDay(j.fechaProgramada)}${j.horario ? ` · ${j.horario}` : ''}` },
  { key: 'cliente', header: 'Cliente', cell: (j) => <div><p className="font-medium">{j.cliente?.nombre}</p><p className="text-xs text-muted-foreground">{j.descripcionTrabajo}</p></div> },
  { key: 'categoria', header: 'Categoría', cell: (j) => <DivisionTag id={j.categoriaId} /> },
  { key: 'tecnico', header: 'Técnico', cell: (j) => j.tecnico?.name || 'Sin asignar' },
  { key: 'origen', header: 'Origen', cell: (j) => j.project?.codigo || 'Trabajo suelto' },
  { key: 'estado', header: 'Estado', cell: (j) => <StatusBadge entity="job" state={j.estado} /> },
  { key: 'saldo', header: 'Saldo', align: 'right', cell: (j) => (j.projectId ? '—' : formatBs(j.saldo)) },
];

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
  const [openId, setOpenId] = useState(null);
  const [creating, setCreating] = useState(false);
  useDocumentTitle('Cronograma');

  const days = view === 'mes' ? monthGrid(anchor) : weekDays(weekStart(anchor));
  const from = days[0];
  const to = days[days.length - 1];
  const { data: jobs = [], isLoading } = useJobs(from, to);

  const filters = useMemo(
    () => [
      { key: 'mios', label: 'Mis trabajos', section: 'Responsable', test: (j) => j.tecnicoId === currentUser?.id || j.vendedorId === currentUser?.id },
      { key: 'sin_tecnico', label: 'Sin técnico', section: 'Responsable', test: (j) => !j.tecnicoId },
      ...Object.entries(DIVISION).map(([id, d]) => ({ key: id, label: d.short, section: 'Categoría', test: (j) => j.categoriaId === id })),
      ...Object.entries(JOB_STATE).map(([id, s]) => ({ key: id, label: s.label, section: 'Estado', test: (j) => j.estado === id })),
    ],
    [currentUser],
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
              <Button onClick={() => setCreating(true)}>
                <Plus /> Nuevo trabajo
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
        <StateLegend />
        {view === 'semana' && <WeekView days={days} jobsByDay={jobsByDay} onOpen={(j) => setOpenId(j.id)} phone={phone} />}
        {view === 'mes' && <MonthView grid={days} month={anchor} jobsByDay={jobsByDay} onOpen={(j) => setOpenId(j.id)} onShowWeek={(day) => go({ view: 'semana', dia: day })} />}
        {view === 'lista' && (
          <ListView columns={listColumns} rows={rows} groups={groups} loading={isLoading} onRowClick={(j) => setOpenId(j.id)} empty="No hay trabajos en estas fechas" />
        )}
      </div>
      <JobDetailSheet jobId={openId} onClose={() => setOpenId(null)} />
      <JobFormDialog open={creating} onOpenChange={setCreating} day={anchor} onCreated={(job) => job?.id && setOpenId(job.id)} />
    </Layout>
  );
}
