import React from 'react';
import { format, isSameDay, compareAsc } from 'date-fns';
import { es } from 'date-fns/locale';
import { User, Wrench, MapPin, Calendar as CalIcon } from 'lucide-react';
import { Badge } from '@/components/ui/badge.jsx';

const ScheduleBoard = ({ schedules, onJobClick, usersMap, tecnicosMap }) => {
  // Group schedules by day
  const grouped = schedules.reduce((acc, job) => {
    const dateStr = format(new Date(job.fecha_programada), 'yyyy-MM-dd');
    if (!acc[dateStr]) acc[dateStr] = [];
    acc[dateStr].push(job);
    return acc;
  }, {});

  const sortedDates = Object.keys(grouped).sort((a, b) => compareAsc(new Date(a), new Date(b)));

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
    <div className="flex flex-col gap-6 overflow-y-auto custom-scrollbar h-full w-full pr-2 pb-10">
      {sortedDates.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 bg-muted/20 border border-dashed border-border rounded-2xl text-muted-foreground w-full">
          <CalIcon className="h-10 w-10 mb-4 opacity-50" />
          <p className="font-bold text-lg">No hay trabajos programados para este periodo.</p>
        </div>
      ) : (
        sortedDates.map(dateStr => {
          // Adjust date to prevent timezone shift rendering the wrong day
          const date = new Date(dateStr + 'T12:00:00Z');
          const jobs = grouped[dateStr];
          const isToday = isSameDay(date, new Date());

          return (
            <div key={dateStr} className="space-y-3 relative w-full">
              <div className="sticky top-0 bg-background/95 backdrop-blur-sm z-10 py-2 border-b border-border flex items-center gap-3">
                <h3 className={`text-lg font-black capitalize ${isToday ? 'text-primary' : 'text-foreground'}`}>
                  {format(date, "EEEE, d 'de' MMMM", { locale: es })}
                </h3>
                {isToday && <Badge className="bg-primary shadow-sm font-bold">Hoy</Badge>}
                <Badge variant="outline" className="ml-auto bg-muted">{jobs.length} trabajo(s)</Badge>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 w-full">
                {jobs.map(job => (
                  <div 
                    key={job.id}
                    onClick={() => onJobClick(job)}
                    className="bg-card border border-border p-4 rounded-xl cursor-pointer hover:shadow-md hover:-translate-y-1 hover:border-primary transition-all flex flex-col gap-3 shadow-sm w-full"
                  >
                    <div className="flex justify-between items-start gap-3 w-full">
                      <div className="flex flex-col gap-1">
                        <h4 className="font-bold text-foreground text-base leading-tight">{job.cliente_nombre || job.cliente}</h4>
                        {job.tipo_entrada && job.tipo_entrada !== 'trabajo' && (
                          <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded self-start ${job.tipo_entrada === 'asistencia' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}>
                            {job.tipo_entrada === 'asistencia' ? 'Asistencia' : 'Relevamiento'}
                          </span>
                        )}
                      </div>
                      <Badge className={`text-[10px] uppercase font-bold shrink-0 shadow-none ${getStatusColor(job.estado)}`}>
                        {job.estado.replace('_', ' ')}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <MapPin className="h-4 w-4 shrink-0 text-orange-500" />
                      <span className="truncate">{job.lugar}</span>
                    </div>

                    <p className="text-sm text-foreground/80 line-clamp-2 my-1 bg-muted/30 p-2 rounded-lg">{job.descripcion_trabajo}</p>

                    <div className="mt-auto pt-3 border-t border-border flex flex-col sm:flex-row sm:items-center justify-between gap-2 w-full">
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <User className="h-3.5 w-3.5 shrink-0 text-purple-500" />
                        <span className="truncate font-medium max-w-[120px]">{job.vendedor_nombre || usersMap[job.vendedor_responsable_id] || 'Sin asignar'}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Wrench className="h-3.5 w-3.5 shrink-0 text-blue-500" />
                        <span className="truncate font-medium max-w-[120px]">{tecnicosMap[job.tecnico_responsable_id] || 'Sin asignar'}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
};

export default ScheduleBoard;