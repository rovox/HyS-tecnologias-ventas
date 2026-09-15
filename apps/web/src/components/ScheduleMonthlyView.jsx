import React from 'react';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isSameDay, parseISO, isBefore, startOfDay } from 'date-fns';
import { es } from 'date-fns/locale';
import { User, Wrench, ClipboardCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge.jsx';

const parseJobDate = (dateStr) => {
  if (!dateStr) return null;
  const clean = String(dateStr).split(' ')[0].split('T')[0];
  return parseISO(clean);
};

const PENDING_VISIT = new Set(['programado', 'en_camino', 'en_atencion', 'pendiente']);

const ScheduleMonthlyView = ({ schedules, visits = [], currentDate, onJobClick, onDateChange, usersMap, tecnicosMap }) => {
  const navigate = useNavigate();
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const today = startOfDay(new Date());

  const days = eachDayOfInterval({ start: startDate, end: endDate });

  const handleDragStart = (e, job) => {
    e.dataTransfer.setData('jobId', job.id);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e, targetDate) => {
    e.preventDefault();
    const jobId = e.dataTransfer.getData('jobId');
    if (jobId) {
      onDateChange(jobId, format(targetDate, 'yyyy-MM-dd'));
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'terminado': return 'bg-emerald-500 text-white border-transparent';
      case 'completado': return 'bg-teal-500 text-white border-transparent';
      case 'por_culminar': return 'bg-amber-500 text-white border-transparent';
      case 'en_proceso': return 'bg-blue-500 text-white border-transparent';
      case 'cancelado': return 'bg-rose-400 text-white border-transparent';
      default: return 'bg-slate-200 text-slate-700 border-transparent dark:bg-slate-800 dark:text-slate-300';
    }
  };

  return (
    <div className="flex flex-col h-full min-h-0 bg-card border-t border-border shadow-sm overflow-hidden w-full">
      <div className="grid grid-cols-7 border-b border-border bg-muted/50 shrink-0">
        {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map(day => (
          <div key={day} className="py-2.5 text-center text-xs font-extrabold text-muted-foreground uppercase tracking-wider">
            {day}
          </div>
        ))}
      </div>
      
      <div className="flex-1 grid grid-cols-7 auto-rows-[minmax(120px,1fr)] overflow-y-auto custom-scrollbar bg-border gap-px">
        {days.map(day => {
          const daySchedules = schedules.filter(s => {
            const jd = parseJobDate(s.fecha_programada);
            return jd && isSameDay(jd, day);
          });
          const dayVisitsPending = (visits || []).filter((v) => {
            const jd = parseJobDate(v.fecha || v.fecha_programada);
            if (!jd || !isSameDay(jd, day)) return false;
            const est = v.estado || 'programado';
            return PENDING_VISIT.has(est);
          });
          const isCurrentMonth = isSameMonth(day, monthStart);
          const isToday = isSameDay(day, new Date());
          const isPast = isBefore(startOfDay(day), today);

          return (
            <div 
              key={day.toISOString()}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, day)}
              className={`bg-background flex flex-col p-1.5 sm:p-2 transition-colors relative ${!isCurrentMonth ? 'bg-muted/30' : ''} ${isPast && isCurrentMonth ? 'opacity-90' : ''}`}
            >
              <div className="flex items-center justify-between gap-1 mb-1.5">
                <div className="flex items-center gap-1 min-w-0">
                  {daySchedules.length > 0 && (
                    <span className={`text-[10px] font-extrabold tabular-nums px-1.5 py-0.5 rounded-md ${isPast ? 'bg-muted text-muted-foreground' : 'bg-primary/15 text-primary'}`}>
                      {daySchedules.length}
                    </span>
                  )}
                  {dayVisitsPending.length > 0 && (
                    <button
                      type="button"
                      title={`${dayVisitsPending.length} visita(s) pendiente(s)`}
                      className="inline-flex items-center gap-0.5 text-amber-700 bg-amber-100 border border-amber-200 rounded-md px-1 py-0.5 hover:bg-amber-200/80"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/surveys?fecha=${format(day, 'yyyy-MM-dd')}`);
                      }}
                    >
                      <ClipboardCheck className="h-3 w-3" />
                      <span className="text-[9px] font-bold tabular-nums">{dayVisitsPending.length}</span>
                    </button>
                  )}
                </div>
                <div className={`text-right text-xs font-bold p-0.5 rounded ${isToday ? 'text-primary bg-primary/10 px-2' : isPast ? 'text-muted-foreground' : 'text-foreground/60'}`}>
                  {format(day, 'd')}
                </div>
              </div>
              
              <div className="flex-1 flex flex-col gap-1.5 overflow-y-auto custom-scrollbar min-h-0">
                {daySchedules.map(job => {
                  const isProject = job.tipo_trabajo === 'proyectos';
                  return (
                    <div 
                      key={job.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, job)}
                      onClick={() => onJobClick(job)}
                      className={`p-1.5 sm:p-2 rounded-lg border text-xs cursor-grab active:cursor-grabbing hover:shadow-md transition-all flex flex-col gap-1 shadow-sm border-l-2 ${isProject ? 'border-l-red-500 bg-red-500/5 hover:border-red-400' : 'border-l-blue-500 bg-card border-border hover:border-blue-400'}`}
                    >
                      <div className="font-bold text-foreground truncate" title={job.cliente_nombre}>{job.cliente_nombre}</div>
                      
                      <div className="text-muted-foreground text-[10px] leading-tight truncate" title={job.lugar}>
                        {job.lugar}
                      </div>
                      
                      <div className="hidden xl:flex flex-col gap-0.5 mt-0.5 border-t border-border/50 pt-1">
                        <div className="flex items-center gap-1 text-[10px] text-muted-foreground truncate">
                          <User className="h-3 w-3 shrink-0 text-purple-500" />
                          <span className="truncate font-medium">{job.vendedor_nombre || usersMap[job.vendedor_id] || usersMap[job.vendedor_responsable_id] || 'Sin asignar'}</span>
                        </div>
                        <div className="flex items-center gap-1 text-[10px] text-muted-foreground truncate">
                          <Wrench className="h-3 w-3 shrink-0 text-blue-500" />
                          <span className="truncate font-medium">{tecnicosMap[job.tecnico_id] || 'Sin asignar'}</span>
                        </div>
                      </div>
                      
                      <Badge className={`mt-0.5 text-[9px] uppercase font-bold px-1 py-0 truncate justify-center shadow-none ${getStatusColor(job.estado)}`}>
                        {String(job.estado || '').replace('_', ' ')}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ScheduleMonthlyView;
