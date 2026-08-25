import React, { useCallback, useEffect, useState } from 'react';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { Plus, UserPlus, Hand } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import tasksService from '@/services/tasks/index.js';
import quotationsService from '@/services/quotations/index.js';
import { deadlineTone, deadlineLabel, deadlineChipClass } from '@/lib/deadline.js';
import { QUOTATION_MAIN_CATEGORIES } from '@/mocks/quotations.js';
import QuotationTaskCreateModal from '@/components/QuotationTaskCreateModal.jsx';

function assignmentLabel(task) {
  if (!task.asignadoId) return 'Disponible';
  if (task.estado === 'en_proceso') return 'En proceso';
  return 'Asignada';
}

function formatCreated(value) {
  if (!value) return '—';
  try {
    const raw = String(value).replace(' ', 'T');
    const d = parseISO(raw.length <= 10 ? `${raw}T00:00:00` : raw);
    if (Number.isNaN(d.getTime())) return String(value).slice(0, 16);
    return format(d, "d MMM yyyy HH:mm", { locale: es });
  } catch {
    return String(value).slice(0, 16);
  }
}

function formatPlazo(value) {
  if (!value) return null;
  try {
    const d = parseISO(String(value).slice(0, 10));
    if (Number.isNaN(d.getTime())) return String(value).slice(0, 10);
    return `vence ${format(d, 'd MMM', { locale: es })}`;
  } catch {
    return String(value).slice(0, 10);
  }
}

const PRIORIDAD_CLASS = {
  alta: 'bg-destructive/10 text-destructive border-destructive/30',
  media: 'bg-amber-50 text-amber-800 border-amber-200',
  baja: 'bg-muted text-muted-foreground border-border',
};

export default function QuotationTasksBand({
  quotations = [],
  categories = QUOTATION_MAIN_CATEGORIES,
  clients = [],
  vendors = [],
  currentUser,
  onRefresh,
  onOpenQuote,
}) {
  const [openCreate, setOpenCreate] = useState(false);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [designatingId, setDesignatingId] = useState(null);
  const [motivoDraft, setMotivoDraft] = useState({});

  const loadTasks = useCallback(async () => {
    try {
      const rows = await tasksService.getAll({ tipo: 'cotizacion' });
      setTasks(rows.filter((t) => t.estado !== 'completada'));
    } catch {
      setTasks([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTasks();
    const timer = setInterval(loadTasks, 10_000);
    return () => clearInterval(timer);
  }, [loadTasks]);

  const refreshAll = async () => {
    await loadTasks();
    if (onRefresh) await onRefresh();
  };

  const resolveQuote = (task) => {
    if (!task.cotizacionId) return null;
    return quotations.find((q) => q.id === task.cotizacionId) || null;
  };

  const openDraft = async (task, e) => {
    e?.stopPropagation?.();
    if (!onOpenQuote || !task.cotizacionId) return;
    let quote = resolveQuote(task);
    if (!quote) {
      try {
        quote = await quotationsService.getById(task.cotizacionId);
      } catch { /* ignore */ }
    }
    if (!quote) {
      quote = {
        id: task.cotizacionId,
        numero: task.cotizacion_numero || '',
        titulo: task.titulo,
        estado: 'borrador',
        observacion: task.descripcion || '',
        plazo_final: task.plazo || null,
      };
    }
    onOpenQuote(quote);
  };

  const handleClaim = async (task, e) => {
    e.stopPropagation();
    try {
      await tasksService.claim(task.id);
      toast.success('Te hiciste cargo');
      await refreshAll();
    } catch (err) {
      if (err.status === 409) {
        toast.error(err.message || 'Ya tiene encargado');
        await loadTasks();
        return;
      }
      toast.error(err.message || 'No se pudo reclamar');
    }
  };

  const handleDesignate = async (task, userId, e) => {
    e?.stopPropagation?.();
    const vendor = vendors.find((u) => u.id === userId);
    if (!vendor) return;
    try {
      await tasksService.update(task.id, {
        asignadoId: vendor.id,
        asignado_nombre: vendor.name,
        asignadoPorId: currentUser?.id,
      });
      toast.success(`Asignada a ${vendor.name}`);
      setDesignatingId(null);
      await refreshAll();
    } catch (err) {
      toast.error(err.message || 'No se pudo designar');
    }
  };

  const handlePriority = async (task, prioridad, e) => {
    e?.stopPropagation?.();
    if (prioridad === 'alta' && !(task.prioridadMotivo || motivoDraft[task.id])) {
      toast.error('Indica el motivo de prioridad alta');
      setMotivoDraft((prev) => ({ ...prev, [task.id]: prev[task.id] || '' }));
      return;
    }
    try {
      await tasksService.update(task.id, {
        prioridad,
        prioridadMotivo: prioridad === 'alta'
          ? (motivoDraft[task.id] || task.prioridadMotivo || '').trim()
          : null,
      });
      await loadTasks();
    } catch (err) {
      toast.error(err.message || 'No se pudo cambiar prioridad');
    }
  };

  const handleAdvance = async (task, e) => {
    e.stopPropagation();
    const next = task.estado === 'pendiente' ? 'en_proceso' : 'completada';
    try {
      await tasksService.update(task.id, { estado: next });
      toast.success(next === 'completada' ? 'Tarea completada' : 'En proceso');
      await refreshAll();
    } catch (err) {
      toast.error(err.message || 'No se pudo actualizar estado');
    }
  };

  return (
    <div className="rounded-2xl border border-dashed border-border border-l-4 border-l-primary/50 bg-muted/40 px-3 py-2.5 space-y-2">
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <h3 className="text-xs font-semibold text-foreground tracking-tight">Tareas de cotización</h3>
          <p className="text-[10px] text-muted-foreground">
            {loading ? '…' : `${tasks.length} pendiente${tasks.length === 1 ? '' : 's'}`}
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-8 text-xs shrink-0 border-primary/40 text-primary hover:bg-primary/5"
          onClick={() => setOpenCreate(true)}
        >
          <Plus className="h-3.5 w-3.5 mr-1" />
          Nueva tarea
        </Button>
      </div>

      <div className="space-y-1 max-h-52 overflow-y-auto pr-0.5">
        {!loading && tasks.length === 0 ? (
          <p className="text-[11px] text-muted-foreground py-1">Sin tareas pendientes.</p>
        ) : tasks.map((task) => {
          const tone = task.plazo ? deadlineTone(task.plazo) : 'none';
          const estadoPool = assignmentLabel(task);
          const plazoTxt = formatPlazo(task.plazo);
          const showMotivo = task.prioridad === 'alta' || motivoDraft[task.id] !== undefined;

          return (
            <div
              key={task.id}
              role="button"
              tabIndex={0}
              onClick={(e) => openDraft(task, e)}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') openDraft(task, e); }}
              className="flex flex-col gap-1.5 rounded-md border border-border/80 bg-card px-2 py-1.5 text-[11px] cursor-pointer hover:border-primary/40 transition-colors"
            >
              <div className="flex items-start gap-2">
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-foreground line-clamp-2" title={task.descripcion || task.titulo}>
                    {task.descripcion || task.titulo}
                  </p>
                  <p className="text-[10px] text-muted-foreground truncate mt-0.5">
                    {task.cotizacion_numero ? <span className="font-mono">{task.cotizacion_numero} · </span> : null}
                    Creó {task.creador_nombre || '—'} · {formatCreated(task.created)}
                    {plazoTxt ? ` · ${plazoTxt}` : ''}
                    {tone !== 'none' && tone !== 'ok' ? (
                      <span className={`ml-1 inline-flex px-1 rounded border ${deadlineChipClass(tone)}`}>
                        {deadlineLabel(tone)}
                      </span>
                    ) : null}
                  </p>
                </div>
                <Badge variant="outline" className="shrink-0 text-[10px] capitalize">
                  {estadoPool}
                </Badge>
              </div>

              <div className="flex flex-wrap items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                <Select
                  value={task.prioridad || 'media'}
                  onValueChange={(v) => handlePriority(task, v)}
                >
                  <SelectTrigger className={`h-7 w-[5.5rem] text-[10px] border ${PRIORIDAD_CLASS[task.prioridad] || ''}`}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="baja">Baja</SelectItem>
                    <SelectItem value="media">Media</SelectItem>
                    <SelectItem value="alta">Alta</SelectItem>
                  </SelectContent>
                </Select>

                {showMotivo && (
                  <Input
                    className="h-7 w-36 text-[10px]"
                    placeholder="Motivo alta"
                    value={motivoDraft[task.id] ?? task.prioridadMotivo ?? ''}
                    onChange={(e) => setMotivoDraft((prev) => ({ ...prev, [task.id]: e.target.value }))}
                    onBlur={() => {
                      const val = (motivoDraft[task.id] ?? '').trim();
                      if (task.prioridad === 'alta' && val && val !== (task.prioridadMotivo || '')) {
                        tasksService.update(task.id, { prioridadMotivo: val }).then(loadTasks).catch(() => {});
                      }
                    }}
                  />
                )}

                {task.asignadoId ? (
                  <span className="inline-flex items-center px-1.5 h-7 rounded border border-border bg-muted/50 text-[10px] truncate max-w-[8rem]">
                    {task.asignado_nombre || 'Asignada'}
                  </span>
                ) : (
                  <span className="inline-flex items-center px-1.5 h-7 rounded border border-primary/30 bg-primary/5 text-primary text-[10px]">
                    Disponible
                  </span>
                )}

                {!task.asignadoId && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-7 px-2 text-[10px]"
                    onClick={(e) => handleClaim(task, e)}
                  >
                    <Hand className="h-3 w-3 mr-1" />
                    Hacerme cargo
                  </Button>
                )}

                {designatingId === task.id ? (
                  <Select onValueChange={(v) => handleDesignate(task, v)}>
                    <SelectTrigger className="h-7 w-36 text-[10px]">
                      <SelectValue placeholder="Elegir…" />
                    </SelectTrigger>
                    <SelectContent>
                      {vendors.map((u) => (
                        <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 text-[10px]"
                    onClick={(e) => { e.stopPropagation(); setDesignatingId(task.id); }}
                  >
                    <UserPlus className="h-3 w-3 mr-1" />
                    Designar
                  </Button>
                )}

                {task.estado !== 'completada' && (
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    className="h-7 px-2 text-[10px] ml-auto"
                    onClick={(e) => handleAdvance(task, e)}
                  >
                    {task.estado === 'pendiente' ? 'A proceso' : 'Completar'}
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <QuotationTaskCreateModal
        open={openCreate}
        onOpenChange={setOpenCreate}
        categories={categories}
        clients={clients}
        vendors={vendors}
        currentUser={currentUser}
        onPublished={refreshAll}
      />
    </div>
  );
}
