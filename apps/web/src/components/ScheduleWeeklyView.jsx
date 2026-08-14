import React, { useState, useEffect, useCallback } from 'react';
import { format, addDays, startOfWeek, endOfWeek, parseISO, isWithinInterval } from 'date-fns';
import { es } from 'date-fns/locale';
import { User, Wrench, MapPin, DollarSign, Briefcase, Loader2, CheckCircle2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge.jsx';
import { cn } from '@/lib/utils.js';
import { useSchedules, calculateBalance } from '@/hooks/useSchedules.js';
import { toast } from 'sonner';
import pb from '@/lib/pocketbaseClient.js';
import WorkDetailModal from '@/components/WorkDetailModal.jsx';

const ScheduleWeeklyView = ({ currentDate, onJobClick, usersMap, tecnicosMap, refreshKey }) => {
  const { getSchedules, rescheduleWork } = useSchedules();
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [draggedJobId, setDraggedJobId] = useState(null);

  const [selectedWorkId, setSelectedWorkId] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  const fetchWeeklySchedules = useCallback(async () => {
    setLoading(true);
    try {
      const allSchedules = await getSchedules();
      
      const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
      const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });
      
      const filtered = allSchedules.filter(s => {
        if (!s.fecha_programada) return false;
        const jobDate = s.fecha_programada.includes('T') || s.fecha_programada.includes(' ') 
          ? parseISO(s.fecha_programada.replace(' ', 'T')) 
          : parseISO(s.fecha_programada);
          
        return isWithinInterval(jobDate, { start: weekStart, end: weekEnd });
      });
      
      setSchedules(filtered);
    } catch (err) {
      console.error("Failed to fetch schedules for week:", err);
      toast.error("Error al cargar los trabajos de la semana");
    } finally {
      setLoading(false);
    }
  }, [getSchedules, currentDate]);

  useEffect(() => {
    fetchWeeklySchedules();
  }, [fetchWeeklySchedules, refreshKey]);

  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const days = Array.from({ length: 7 }).map((_, i) => addDays(weekStart, i));

  const handleDragStart = (e, job) => {
    e.dataTransfer.setData('jobId', job.id);
    e.dataTransfer.effectAllowed = 'move';
    setDraggedJobId(job.id);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    e.currentTarget.classList.add('bg-accent/40', 'ring-2', 'ring-primary/50');
  };

  const handleDragLeave = (e) => {
    e.currentTarget.classList.remove('bg-accent/40', 'ring-2', 'ring-primary/50');
  };

  const handleDrop = async (e, targetDate) => {
    e.preventDefault();
    e.currentTarget.classList.remove('bg-accent/40', 'ring-2', 'ring-primary/50');
    setDraggedJobId(null);
    
    const jobId = e.dataTransfer.getData('jobId');
    if (!jobId) return;

    const newDateStr = format(targetDate, 'yyyy-MM-dd');
    const job = schedules.find(s => s.id === jobId);
    
    if (job && job.fecha_programada === newDateStr) return;

    try {
      await rescheduleWork(jobId, newDateStr);
      toast.success('Trabajo reprogramado correctamente');
      handleWorkUpdated(jobId);
    } catch (err) {
      // Error handled in hook
    }
  };

  const getDynamicStyles = (status) => {
    switch (status) {
      case 'completado': 
        return 'bg-green-50/80 border-l-green-500 text-green-900 dark:bg-green-950/30 dark:border-l-green-600 dark:text-green-300';
      case 'en_proceso': 
        return 'bg-orange-50/80 border-l-orange-500 text-orange-900 dark:bg-amber-950/30 dark:border-l-amber-500 dark:text-amber-300';
      case 'cancelado': 
        return 'bg-gray-50/80 border-l-gray-400 text-gray-600 dark:bg-gray-800 dark:border-l-gray-500 dark:text-gray-300 opacity-80';
      case 'programado': 
      default: 
        return 'bg-blue-50/80 border-l-blue-500 text-blue-900 dark:bg-slate-900 dark:border-l-blue-500 dark:text-blue-300';
    }
  };

  const isSameDayLocal = (dateStr, targetDate) => {
    if (!dateStr) return false;
    const parsedDate = dateStr.includes('T') || dateStr.includes(' ') 
      ? parseISO(dateStr.replace(' ', 'T')) 
      : parseISO(dateStr);
    return format(parsedDate, 'yyyy-MM-dd') === format(targetDate, 'yyyy-MM-dd');
  };

  const handleCardClick = (job) => {
    setSelectedWorkId(job.id);
    setIsDetailModalOpen(true);
  };

  // Improved callback that directly replaces data without DB fetch if updatedData is provided
  const handleWorkUpdated = async (workId, updatedData = null) => {
    try {
      let dataToMerge = updatedData;

      if (!dataToMerge) {
        // Fallback to fetch if not explicitly provided
        dataToMerge = await pb.collection('schedules').getOne(workId, { $autoCancel: false });
      }

      setSchedules(prev => prev.map(s => {
        if (s.id === workId) {
          const mergedData = { ...s, ...dataToMerge };
          const { saldo, estado_pago } = calculateBalance(mergedData);
          
          mergedData.saldo = saldo;
          mergedData.estado_pago = estado_pago;

          // Preserve expansions and fallbacks if it was freshly fetched
          if (!updatedData) {
            const clientData = mergedData.expand?.cliente_id || null;
            const fallbackLocation = clientData?.direccion?.trim() ? clientData.direccion : 'Sin ubicación';
            const finalLugar = mergedData.lugar?.trim() ? mergedData.lugar : fallbackLocation;
            const dateStr = mergedData.fecha_programada ? mergedData.fecha_programada.split(' ')[0] : '';
            
            mergedData.cliente_id = mergedData.cliente_id;
            mergedData.cliente_nombre = clientData?.nombre || mergedData.cliente || 'Sin cliente';
            mergedData.tipo_trabajo = mergedData.type;
            mergedData.lugar = finalLugar;
            mergedData.fecha_programada = dateStr;
            mergedData.vendedor_id = mergedData.vendedor_responsable_id;
            mergedData.tecnico_id = mergedData.tecnico_responsable_id;
            mergedData.costo_total = mergedData.monto || 0;
            mergedData.adelanto = mergedData.adelanto || 0;
            mergedData.clientData = clientData;
          }

          return mergedData;
        }
        return s;
      }));
    } catch (err) {
      console.error("Error updating single work in view:", err);
      if (err?.status === 404) {
        setSchedules(prev => prev.filter(s => s.id !== workId));
      }
    }
  };

  if (loading && schedules.length === 0) {
    return (
      <div className="flex-1 w-full h-full flex items-center justify-center bg-slate-50/50 dark:bg-slate-900/20 rounded-2xl">
        <Loader2 className="h-8 w-8 animate-spin text-primary/50" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-slate-50/50 dark:bg-slate-900/20">
      {schedules.length === 0 && !loading && (
        <div className="flex items-center justify-center p-4 bg-muted/40 border-b border-border text-sm font-medium text-muted-foreground">
          No hay trabajos programados para esta semana
        </div>
      )}
      
      <div className="flex gap-3 sm:gap-4 overflow-x-auto pb-4 custom-scrollbar flex-1 min-h-0 w-full p-3 sm:p-6 snap-x snap-mandatory sm:snap-none">
        {days.map(day => {
          const daySchedules = schedules.filter(s => isSameDayLocal(s.fecha_programada, day));
          const isToday = format(new Date(), 'yyyy-MM-dd') === format(day, 'yyyy-MM-dd');

          return (
            <div 
              key={day.toISOString()} 
              className={cn(
                "flex-1 w-[85vw] min-w-[85vw] sm:w-auto sm:min-w-[320px] md:min-w-[350px] flex flex-col rounded-2xl p-3 sm:p-4 border overflow-hidden transition-colors snap-start",
                isToday ? "bg-card border-primary/40 shadow-md ring-1 ring-primary/20" : "bg-card border-border shadow-sm"
              )}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, day)}
            >
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-border shrink-0 w-full pointer-events-none">
                <span className={cn("font-bold capitalize", isToday ? "text-primary text-lg" : "text-foreground")}>
                  {format(day, 'EEEE', { locale: es })}
                </span>
                <span className={cn(
                  "text-xs font-bold px-2 py-1 rounded-md tracking-wide", 
                  isToday ? "bg-primary text-primary-foreground shadow-sm" : "bg-muted text-muted-foreground"
                )}>
                  {format(day, 'dd/MM')}
                </span>
              </div>

              <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 space-y-3 min-h-0 w-full">
                {daySchedules.length > 0 ? (
                  daySchedules.map(job => {
                    const isProject = job.tipo_trabajo === 'proyectos';
                    const isDragging = draggedJobId === job.id;
                    const dynamicStyles = getDynamicStyles(job.estado);
                    
                    const costoTotal = job.costo_total || job.monto || 0;
                    const adelantoRecibido = job.adelanto || 0;
                    const saldoMostrar = job.saldo || 0;

                    return (
                      <div 
                        key={job.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, job)}
                        onDragEnd={() => setDraggedJobId(null)}
                        onClick={() => handleCardClick(job)}
                        className={cn(
                          "p-3.5 rounded-xl border text-sm cursor-grab active:cursor-grabbing hover:-translate-y-0.5 hover:shadow-md transition-all shadow-sm flex flex-col gap-2 w-full border-l-4",
                          dynamicStyles,
                          isDragging ? "opacity-40 scale-95" : "opacity-100"
                        )}
                      >
                        <div className="flex justify-between items-start gap-2">
                          <div className="font-extrabold line-clamp-1 break-words leading-tight" title={job.cliente_nombre}>{job.cliente_nombre}</div>
                          <Badge variant="outline" className="uppercase text-[9px] font-extrabold shadow-none shrink-0 bg-transparent opacity-70 border-current mix-blend-multiply dark:mix-blend-screen">
                            {isProject ? 'Proyecto' : 'Seg. Electrónica'}
                          </Badge>
                        </div>
                        
                        <div className="flex flex-col gap-1.5 mt-1 opacity-90">
                          <div className="flex items-center gap-1.5 text-xs min-w-0">
                            <MapPin className="h-3.5 w-3.5 shrink-0 opacity-70" />
                            <span className="truncate font-medium" title={job.lugar}>{job.lugar}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-xs min-w-0">
                            <User className="h-3.5 w-3.5 shrink-0 opacity-70" />
                            <span className="truncate font-medium">{job.vendedor_nombre || usersMap[job.vendedor_id] || usersMap[job.vendedor_responsable_id] || 'Sin asignar'}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-xs min-w-0">
                            <Wrench className="h-3.5 w-3.5 shrink-0 opacity-70" />
                            <span className="truncate font-medium">{tecnicosMap[job.tecnico_id] || 'Sin asignar'}</span>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2 mt-1 pt-2 border-t border-current/10 opacity-90">
                          <div>
                            <div className="text-[10px] font-bold uppercase tracking-wider opacity-80">Costo total</div>
                            <div className="font-black flex items-center tabular-nums text-xs mt-0.5">
                              <DollarSign className="h-3 w-3"/>{costoTotal.toFixed(2)}
                            </div>
                          </div>
                          <div>
                            <div className="text-[10px] font-bold uppercase tracking-wider opacity-80">Adelanto</div>
                            <div className="font-black flex items-center tabular-nums text-xs mt-0.5 text-emerald-600 dark:text-emerald-400 mix-blend-multiply dark:mix-blend-screen">
                              <DollarSign className="h-3 w-3"/>{adelantoRecibido.toFixed(2)}
                            </div>
                          </div>
                          <div className="col-span-2 border-t-2 border-current/20 pt-2 mt-1 flex justify-between items-center">
                            <div className="text-[10px] font-bold uppercase tracking-wider opacity-80">Saldo pendiente</div>
                            <div className="font-black flex items-center tabular-nums text-sm">
                              <DollarSign className="h-3.5 w-3.5"/>{saldoMostrar.toFixed(2)}
                            </div>
                          </div>
                          <div className="col-span-2 flex justify-end mt-1">
                            {job.estado_pago === 'Pagado' ? (
                              <Badge variant="outline" className="bg-emerald-100 text-emerald-800 border-emerald-200 shadow-none text-[10px] uppercase tracking-wider font-bold">
                                Pagado
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="bg-orange-100 text-orange-800 border-orange-200 shadow-none text-[10px] uppercase tracking-wider font-bold">
                                Pendiente
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="flex flex-col items-center justify-center p-6 text-center h-28 border border-dashed border-border rounded-xl bg-muted/10 w-full pointer-events-none">
                    <Briefcase className="h-6 w-6 text-muted-foreground/30 mb-2" />
                    <p className="text-xs font-medium text-muted-foreground">Sin trabajos</p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <WorkDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        workId={selectedWorkId}
        onEdit={(workObj) => { setIsDetailModalOpen(false); onJobClick(workObj); }}
        onWorkUpdated={handleWorkUpdated}
        onWorkDeleted={(deletedId) => setSchedules(prev => prev.filter(s => s.id !== deletedId))}
      />
    </div>
  );
};

export default ScheduleWeeklyView;