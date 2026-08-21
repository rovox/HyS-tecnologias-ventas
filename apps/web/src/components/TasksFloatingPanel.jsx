import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CalendarDays,
  CheckCircle2,
  CircleDot,
  Clock3,
  ListTodo,
  PlayCircle,
  Plus,
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext.jsx';
import { canAccessTasks } from '@/config/nav.js';
import { tasksService } from '@/services/tasks/index.js';
import quotationsService from '@/services/quotations/index.js';
import { schedulesService } from '@/services/schedules/index.js';
import { Button } from '@/components/ui/button.jsx';
import { Badge } from '@/components/ui/badge.jsx';
import { Input } from '@/components/ui/input.jsx';
import { Textarea } from '@/components/ui/textarea.jsx';
import { Label } from '@/components/ui/label.jsx';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select.jsx';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog.jsx';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet.jsx';

const TABS = [
  { id: 'pendiente', label: 'Pendientes', icon: CircleDot },
  { id: 'en_proceso', label: 'En proceso', icon: PlayCircle },
  { id: 'completada', label: 'Hechas', icon: CheckCircle2 },
];

const emptyForm = () => ({
  titulo: '',
  descripcion: '',
  prioridad: 'media',
  plazo: '',
  horario: '',
  cotizacionId: '',
  scheduleId: '',
});

function TaskCard({ task, onOpen, onAdvance }) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onOpen(task)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onOpen(task);
        }
      }}
      className="w-full text-left rounded-xl border border-border bg-card p-3 hover:bg-muted/40 transition-colors min-w-0 cursor-pointer"
    >
      <div className="flex items-start justify-between gap-2">
        <p className="font-semibold text-sm text-foreground truncate">{task.titulo}</p>
        <Badge variant="outline" className="shrink-0 text-[10px] capitalize">{task.estado.replace('_', ' ')}</Badge>
      </div>
      {task.descripcion ? (
        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{task.descripcion}</p>
      ) : null}
      <div className="flex flex-wrap gap-1.5 mt-2 text-[11px] text-muted-foreground">
        {task.creador_nombre || task.creador?.name ? (
          <span>Creó: {task.creador_nombre || task.creador?.name}</span>
        ) : null}
        {task.plazo ? <span>· {String(task.plazo).slice(0, 10)}{task.horario ? ` ${task.horario}` : ''}</span> : null}
      </div>
      {task.estado !== 'completada' && onAdvance ? (
        <div className="mt-2" onClick={(e) => e.stopPropagation()}>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 text-xs"
            onClick={() => onAdvance(task)}
          >
            {task.estado === 'pendiente' ? 'Pasar a proceso' : 'Completar'}
          </Button>
        </div>
      ) : null}
    </div>
  );
}

/** Botón flotante + panel de tareas (fuera del sidebar). */
const TasksFloatingPanel = () => {
  const { userRole, currentUser } = useAuth();
  const navigate = useNavigate();
  const allowed = canAccessTasks(userRole);

  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState('pendiente');
  const [rows, setRows] = useState([]);
  const [quotes, setQuotes] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [detail, setDetail] = useState(null);

  const load = useCallback(async () => {
    try {
      const [tasks, q, s] = await Promise.all([
        tasksService.getAll(),
        quotationsService.getAll().catch(() => []),
        schedulesService.getAll().catch(() => []),
      ]);
      setRows(tasks || []);
      setQuotes(q || []);
      setJobs(Array.isArray(s) ? s : []);
    } catch {
      setRows([]);
    }
  }, []);

  useEffect(() => {
    if (!allowed) return undefined;
    load();
    const onRefresh = () => load();
    window.addEventListener('hs-tasks-refresh', onRefresh);
    return () => window.removeEventListener('hs-tasks-refresh', onRefresh);
  }, [allowed, load]);

  useEffect(() => {
    if (open) load();
  }, [open, load]);

  const counts = useMemo(() => ({
    pendiente: rows.filter((r) => r.estado === 'pendiente').length,
    en_proceso: rows.filter((r) => r.estado === 'en_proceso').length,
    completada: rows.filter((r) => r.estado === 'completada').length,
  }), [rows]);

  const filtered = rows.filter((r) => r.estado === tab);
  const openCount = counts.pendiente + counts.en_proceso;

  if (!allowed) return null;

  const create = async (e) => {
    e.preventDefault();
    if (!form.titulo.trim()) return toast.error('Escribe un título');
    setSaving(true);
    try {
      const quote = quotes.find((q) => q.id === form.cotizacionId);
      const job = jobs.find((j) => j.id === form.scheduleId);
      await tasksService.create({
        titulo: form.titulo.trim(),
        descripcion: form.descripcion,
        prioridad: form.prioridad,
        plazo: form.plazo || null,
        horario: form.horario || null,
        cotizacionId: form.cotizacionId || null,
        cotizacion_numero: quote?.numero || '',
        scheduleId: form.scheduleId || null,
        schedule_label: job?.descripcion_trabajo || job?.cliente || '',
        sucursalId: currentUser?.sucursalId || currentUser?.department,
      });
      setForm(emptyForm());
      setShowCreate(false);
      toast.success('Tarea creada');
      await load();
      window.dispatchEvent(new Event('hs-tasks-refresh'));
    } catch {
      toast.error('No se pudo crear');
    } finally {
      setSaving(false);
    }
  };

  const advance = async (task) => {
    const next = task.estado === 'pendiente' ? 'en_proceso' : 'completada';
    try {
      await tasksService.update(task.id, { estado: next });
      toast.success(next === 'completada' ? 'Completada. Se oculta a las 24 h.' : 'En proceso');
      await load();
      window.dispatchEvent(new Event('hs-tasks-refresh'));
    } catch {
      toast.error('No se pudo actualizar');
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed z-[45] bottom-5 right-4 lg:bottom-8 lg:right-8 min-h-14 min-w-14 rounded-full bg-secondary text-secondary-foreground shadow-lg flex items-center justify-center gap-2 px-4 hover:opacity-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        aria-label="Abrir tareas"
      >
        <ListTodo className="h-5 w-5 shrink-0" />
        <span className="hidden sm:inline text-sm font-semibold">Tareas</span>
        {openCount > 0 ? (
          <span className="absolute -top-1 -right-1 h-5 min-w-5 px-1 rounded-full bg-primary text-primary-foreground text-[11px] font-bold flex items-center justify-center">
            {openCount}
          </span>
        ) : null}
      </button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="right" className="w-full sm:max-w-md p-0 flex flex-col gap-0">
          <SheetHeader className="px-4 py-3 border-b shrink-0 text-left space-y-1">
            <SheetTitle className="text-base font-semibold">Tareas</SheetTitle>
            <p className="text-xs text-muted-foreground font-normal">
              Pendientes, en proceso y recientes. No se borran.
            </p>
          </SheetHeader>

          <div className="flex gap-1 p-2 border-b shrink-0">
            {TABS.map((item) => {
              const Icon = item.icon;
              const active = tab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setTab(item.id)}
                  className={`flex-1 min-h-10 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 px-1 ${
                    active ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'
                  }`}
                >
                  <Icon className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">{item.label}</span>
                  <span className="tabular-nums opacity-80">{counts[item.id]}</span>
                </button>
              );
            })}
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-3 min-h-0">
            <div className="flex gap-2">
              <Button type="button" variant="action" size="sm" className="min-h-10 flex-1" onClick={() => setShowCreate((v) => !v)}>
                <Plus className="h-4 w-4" /> Nueva
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="min-h-10"
                onClick={() => { setOpen(false); navigate('/schedule'); }}
              >
                <CalendarDays className="h-4 w-4" /> Cronograma
              </Button>
            </div>

            {showCreate ? (
              <form onSubmit={create} className="rounded-xl border border-border bg-muted/20 p-3 space-y-2">
                <Input
                  className="min-h-10"
                  placeholder="Título *"
                  value={form.titulo}
                  onChange={(e) => setForm({ ...form, titulo: e.target.value })}
                />
                <Textarea
                  placeholder="Detalle (opcional)"
                  rows={2}
                  value={form.descripcion}
                  onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
                />
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label className="text-[11px]">Plazo</Label>
                    <Input type="date" className="min-h-10" value={form.plazo} onChange={(e) => setForm({ ...form, plazo: e.target.value })} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[11px]">Horario</Label>
                    <Input type="time" className="min-h-10" value={form.horario} onChange={(e) => setForm({ ...form, horario: e.target.value })} />
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-[11px]">Cotización (opcional)</Label>
                  <Select value={form.cotizacionId || 'none'} onValueChange={(v) => setForm({ ...form, cotizacionId: v === 'none' ? '' : v })}>
                    <SelectTrigger className="min-h-10"><SelectValue placeholder="Ninguna" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Ninguna</SelectItem>
                      {quotes.slice(0, 40).map((q) => (
                        <SelectItem key={q.id} value={q.id}>{q.numero} · {q.titulo}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-[11px]">Venta / trabajo (opcional)</Label>
                  <Select value={form.scheduleId || 'none'} onValueChange={(v) => setForm({ ...form, scheduleId: v === 'none' ? '' : v })}>
                    <SelectTrigger className="min-h-10"><SelectValue placeholder="Ninguno" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Ninguno</SelectItem>
                      {jobs.slice(0, 40).map((j) => (
                        <SelectItem key={j.id} value={j.id}>
                          {(j.cliente || j.descripcion_trabajo || j.id).slice(0, 48)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button type="submit" variant="action" disabled={saving} className="w-full min-h-10">
                  Crear tarea
                </Button>
              </form>
            ) : null}

            {filtered.length === 0 ? (
              <p className="text-sm text-muted-foreground py-6 text-center">Sin tareas en esta vista.</p>
            ) : (
              filtered.map((task) => (
                <TaskCard key={task.id} task={task} onOpen={setDetail} onAdvance={advance} />
              ))
            )}
          </div>
        </SheetContent>
      </Sheet>

      <Dialog open={Boolean(detail)} onOpenChange={(v) => !v && setDetail(null)}>
        <DialogContent className="max-w-md w-[calc(100%-1.5rem)]">
          <DialogTitle className="text-base font-semibold pr-6">{detail?.titulo}</DialogTitle>
          {detail ? (
            <div className="space-y-3 text-sm">
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline" className="capitalize">{detail.estado.replace('_', ' ')}</Badge>
                <Badge variant="secondary">{detail.prioridad}</Badge>
              </div>
              {detail.descripcion ? <p className="text-muted-foreground">{detail.descripcion}</p> : null}
              <ul className="space-y-1.5 text-xs text-muted-foreground">
                <li>Creó: <span className="text-foreground font-medium">{detail.creador_nombre || detail.creador?.name || '—'}</span></li>
                {(detail.asignado_nombre || detail.asignado?.name) ? (
                  <li>Asignado: <span className="text-foreground font-medium">{detail.asignado_nombre || detail.asignado?.name}</span></li>
                ) : null}
                {detail.plazo ? (
                  <li className="flex items-center gap-1">
                    <Clock3 className="h-3.5 w-3.5" />
                    Plazo {String(detail.plazo).slice(0, 10)}
                    {detail.horario ? ` · ${detail.horario}` : ''}
                  </li>
                ) : null}
                {(detail.cotizacion_numero || detail.cotizacionId) ? (
                  <li>Cotización: {detail.cotizacion_numero || detail.cotizacionId}</li>
                ) : null}
                {(detail.schedule_label || detail.scheduleId) ? (
                  <li>Venta/trabajo: {detail.schedule_label || detail.scheduleId}</li>
                ) : null}
              </ul>
              {detail.estado !== 'completada' ? (
                <Button type="button" className="w-full min-h-11" onClick={() => { advance(detail); setDetail(null); }}>
                  {detail.estado === 'pendiente' ? 'Pasar a en proceso' : 'Marcar completada'}
                </Button>
              ) : null}
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default TasksFloatingPanel;
