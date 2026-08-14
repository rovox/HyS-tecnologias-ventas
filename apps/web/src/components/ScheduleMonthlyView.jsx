import React from 'react';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isSameDay, parseISO } from 'date-fns';

const parseJobDate = (dateStr) => {
  if (!dateStr) return null;
  const clean = String(dateStr).split(' ')[0].split('T')[0];
  return parseISO(clean);
};
import { es } from 'date-fns/locale';
import { User, Wrench } from 'lucide-react';
import { Badge } from '@/components/ui/badge.jsx';

const ScheduleMonthlyView = ({ schedules, currentDate, onJobClick, onDateChange, usersMap, tecnicosMap }) => {
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });

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
          const isCurrentMonth = isSameMonth(day, monthStart);
          const isToday = isSameDay(day, new Date());

          return (
            <div 
              key={day.toISOString()}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, day)}
              className={`bg-background flex flex-col p-1.5 sm:p-2 transition-colors relative ${!isCurrentMonth ? 'bg-muted/30' : ''}`}
            >
              <div className={`text-right text-xs font-bold mb-1.5 p-0.5 rounded ${isToday ? 'text-primary bg-primary/10 inline-block ml-auto px-2' : 'text-foreground/60'}`}>
                {format(day, 'd')}
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
                        {job.estado.replace('_', ' ')}
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