import React, { useEffect, useState } from 'react';
import { X, FileStack, ClipboardCheck, ListTodo, MessagesSquare, CalendarDays } from 'lucide-react';
import { Button } from '@/components/ui/button.jsx';
import { Badge } from '@/components/ui/badge.jsx';
import ScheduleView from '@/components/ScheduleView.jsx';
import { reportsService } from '@/services/reports/index.js';

const ICONS = {
  cotizacion: FileStack,
  relevamiento: ClipboardCheck,
  tarea: ListTodo,
  venta: FileStack,
};

/**
 * Overlay de cronograma + foro bajo el header.
 * El botón Actividad del header sigue visible para abrir/cerrar.
 */
const ActivityOverlay = ({ open, onClose }) => {
  const [events, setEvents] = useState([]);

  useEffect(() => {
    if (!open) return undefined;
    let alive = true;
    reportsService.getFeed()
      .then((rows) => { if (alive) setEvents(rows || []); })
      .catch(() => { if (alive) setEvents([]); });
    return () => { alive = false; };
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-x-0 top-16 bottom-0 z-40 flex flex-col lg:left-[260px]"
      role="dialog"
      aria-modal="true"
      aria-label="Cronograma y actividad"
    >
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden border-t border-border bg-background shadow-xl">
        <div className="shrink-0 flex items-center justify-between gap-3 border-b bg-muted/30 px-4 py-2.5">
          <div className="min-w-0">
            <h2 className="text-sm sm:text-base font-semibold tracking-tight flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-primary shrink-0" />
              Cronograma y actividad
            </h2>
            <p className="text-[11px] text-muted-foreground mt-0.5 truncate">
              Pulsa Actividad otra vez o Esc para volver a la vista anterior.
            </p>
          </div>
          <Button type="button" variant="ghost" size="icon" className="min-h-10 min-w-10 shrink-0" onClick={onClose} aria-label="Cerrar">
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4 pb-28 space-y-6 md:px-8">
          <ScheduleView
            types={['seguridad', 'proyectos']}
            title="Cronograma"
            embedded
          />

          <section className="border border-border/70 shadow-sm rounded-xl overflow-hidden bg-card">
            <div className="border-b border-border/60 px-4 py-3">
              <h3 className="text-sm font-semibold flex items-center gap-2">
                <MessagesSquare className="h-4 w-4 text-primary" />
                Foro de actividad
              </h3>
              <p className="text-xs text-muted-foreground mt-1">
                Cotizaciones, relevamientos, ventas y tareas recientes de tu alcance.
              </p>
            </div>
            <div className="p-3 sm:p-4 space-y-2">
              {events.length === 0 ? (
                <p className="text-sm text-muted-foreground py-6 text-center">Sin actividad reciente.</p>
              ) : events.map((event) => {
                const Icon = ICONS[event.type] || FileStack;
                return (
                  <div
                    key={`${event.type}-${event.id}`}
                    className="flex gap-3 items-start rounded-lg border border-border/60 bg-card px-3 py-2.5"
                  >
                    <div className="h-9 w-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold text-sm truncate">{event.titulo}</p>
                        <Badge variant="outline" className="capitalize text-[10px]">{event.type}</Badge>
                      </div>
                      {event.detalle ? (
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{event.detalle}</p>
                      ) : null}
                      <p className="text-[11px] text-muted-foreground mt-1">
                        {event.at ? new Date(event.at).toLocaleString('es-BO') : ''}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default ActivityOverlay;
