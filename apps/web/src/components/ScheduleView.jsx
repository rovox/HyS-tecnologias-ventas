import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button.jsx';
import { Plus } from 'lucide-react';
import { format, addMonths, addDays, startOfWeek, endOfWeek } from 'date-fns';
import { es } from 'date-fns/locale';
import { Skeleton } from '@/components/ui/skeleton.jsx';
import { toast } from 'sonner';
import { cn } from '@/lib/utils.js';
import { useAuth } from '@/contexts/AuthContext.jsx';
import { useTecnicosList } from '@/hooks/useTecnicosList.js';
import { useSchedules } from '@/hooks/useSchedules.js';
import { tasksService } from '@/services/tasks/index.js';
import quotationsService from '@/services/quotations/index.js';
import { surveysService } from '@/services/surveys/index.js';
import authService from '@/services/auth/index.js';
import { ROLES } from '@/mocks/users.js';
import ScheduleFormModal from './ScheduleFormModal.jsx';
import ScheduleWeeklyView from './ScheduleWeeklyView.jsx';
import ScheduleMonthlyView from './ScheduleMonthlyView.jsx';
import CronogramaQuickModal from './CronogramaQuickModal.jsx';

const ScheduleView = ({ types = [], title, embedded = false }) => {
  const { userRole } = useAuth();
  const { tecnicos } = useTecnicosList();
  const { getSchedules, rescheduleWork } = useSchedules();
  const canCreate = userRole === ROLES.ADMIN || userRole === ROLES.VENTAS || userRole === ROLES.TEC;
  
  const [viewMode, setViewMode] = useState('weekly');
  const [currentDate, setCurrentDate] = useState(new Date());
  
  const [schedules, setSchedules] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [quotations, setQuotations] = useState([]);
  const [visits, setVisits] = useState([]);
  const [usersMap, setUsersMap] = useState({});
  const [tecnicosMap, setTecnicosMap] = useState({});
  const [loading, setLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingJob, setEditingJob] = useState(null);
  const [quickDay, setQuickDay] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const users = await authService.listUsers();
        const map = {};
        (users || []).forEach((u) => { map[u.id] = u.name; });
        setUsersMap(map);
      } catch (err) {
        console.warn('Failed to fetch users map:', err);
      }
    };
    fetchUsers();
  }, []);

  useEffect(() => {
    if (tecnicos.length > 0) {
      const map = {};
      tecnicos.forEach(t => map[t.id] = t.nombre);
      setTecnicosMap(map);
    }
  }, [tecnicos]);

  const loadSchedules = async () => {
    setLoading(true);
    const [data, taskRows, quoteRows, visitRows] = await Promise.all([
      getSchedules(),
      tasksService.getAll().catch(() => []),
      quotationsService.getAll().catch(() => []),
      surveysService.getAll().catch(() => []),
    ]);
    const filteredData = types.length > 0 
      ? data.filter(s => types.includes(s.tipo_trabajo) || s.tipo_entrada === 'asistencia' || s.tipo_entrada === 'relevamiento')
      : data;
    setSchedules(filteredData);
    setTasks((taskRows || []).filter((t) => t.plazo && t.estado !== 'completada'));
    setQuotations(quoteRows || []);
    setVisits(visitRows || []);
    setLoading(false);
    setRefreshKey(prev => prev + 1);
  };

  useEffect(() => {
    loadSchedules();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [types.join(',')]);

  const handleDateChange = async (jobId, newDate) => {
    try {
      await rescheduleWork(jobId, newDate);
      toast.success('Trabajo reprogramado correctamente');
      loadSchedules();
    } catch (error) {
      toast.error(error.message || 'Error al reprogramar el trabajo');
    }
  };

  const handleOpenCreate = (dateStr, quoteId) => {
    const seed = {};
    if (dateStr) seed.fecha_programada = dateStr;
    if (quoteId) seed.quotation_id = quoteId;
    setEditingJob(Object.keys(seed).length ? seed : null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (job) => {
    setEditingJob(job);
    setIsModalOpen(true);
  };

  const handlePrev = () => {
    setCurrentDate(prev => viewMode === 'weekly' ? addDays(prev, -7) : addMonths(prev, -1));
  };

  const handleNext = () => {
    setCurrentDate(prev => viewMode === 'weekly' ? addDays(prev, 7) : addMonths(prev, 1));
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const getDateDisplay = () => {
    if (viewMode === 'weekly') {
      const wStart = startOfWeek(currentDate, { weekStartsOn: 1 });
      const wEnd = endOfWeek(currentDate, { weekStartsOn: 1 });
      const month = format(wStart, 'MMMM', { locale: es });
      const year = format(wStart, 'yyyy');
      return `Semana del ${format(wStart, 'd')} al ${format(wEnd, 'd')} de ${month} de ${year}`;
    }
    return format(currentDate, "MMMM 'de' yyyy", { locale: es }).replace(/^\w/, (c) => c.toUpperCase());
  };

  return (
    <div className={cn(
      'space-y-4 flex flex-col relative w-full max-w-full overflow-x-hidden',
      embedded ? 'min-h-[28rem]' : 'min-h-[calc(100vh-120px)] lg:h-[calc(100vh-120px)] space-y-6',
    )}>
      <div className="flex flex-col xl:flex-row items-start xl:items-center justify-between gap-3 shrink-0 w-full">
        <div>
          <h2 className={cn(
            'font-extrabold tracking-tight text-foreground break-words w-full',
            embedded ? 'text-lg sm:text-xl' : 'text-2xl sm:text-3xl',
          )}>{title}</h2>
          <p className="text-muted-foreground font-medium mt-0.5 capitalize text-sm">{getDateDisplay()}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full xl:w-auto">
          <div className="flex bg-muted/50 p-1 rounded-lg border border-border">
            <Button variant="ghost" size="sm" className={`px-3 sm:px-4 rounded-md font-bold ${viewMode === 'weekly' ? 'bg-background shadow-sm' : ''}`} onClick={() => setViewMode('weekly')}>Semanal</Button>
            <Button variant="ghost" size="sm" className={`px-3 sm:px-4 rounded-md font-bold ${viewMode === 'monthly' ? 'bg-background shadow-sm' : ''}`} onClick={() => setViewMode('monthly')}>Mensual</Button>
          </div>
          
          <div className="flex flex-wrap items-center gap-1">
            <Button variant="outline" size="sm" onClick={handlePrev} className="font-bold">{viewMode === 'weekly' ? 'Semana anterior' : 'Mes anterior'}</Button>
            <Button variant="outline" size="sm" onClick={handleToday} className="font-bold px-4">{viewMode === 'weekly' ? 'Semana actual' : 'Mes actual'}</Button>
            <Button variant="outline" size="sm" onClick={handleNext} className="font-bold">{viewMode === 'weekly' ? 'Semana siguiente' : 'Mes siguiente'}</Button>
          </div>
          
          {canCreate && (
            <Button className="ml-auto xl:ml-2 gap-2 bg-primary text-primary-foreground font-bold shadow-md hover:bg-primary/90" onClick={() => handleOpenCreate()}>
              <Plus className="h-4 w-4" /> Nuevo Trabajo
            </Button>
          )}
        </div>
      </div>

      <div className={cn(
        'flex-1 min-h-0 w-full relative bg-card border border-border rounded-2xl shadow-sm overflow-hidden flex flex-col',
        embedded ? 'min-h-[22rem] max-h-[32rem]' : '',
      )}>
        {loading ? (
          <div className="p-8 w-full h-full flex flex-col gap-4">
            <Skeleton className="h-10 w-1/3" />
            <div className="grid grid-cols-1 gap-4 h-full">
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full rounded-xl" />
              ))}
            </div>
          </div>
        ) : (
          viewMode === 'weekly' ? (
            <ScheduleWeeklyView 
              currentDate={currentDate} 
              onJobClick={handleOpenEdit} 
              usersMap={usersMap}
              tecnicosMap={tecnicosMap}
              refreshKey={refreshKey}
              tasks={tasks}
              quotations={quotations}
              visits={visits}
              onDayAdd={canCreate ? (day) => setQuickDay(day) : undefined}
            />
          ) : (
            <ScheduleMonthlyView 
              schedules={schedules} 
              currentDate={currentDate} 
              onJobClick={handleOpenEdit} 
              onDateChange={handleDateChange}
              usersMap={usersMap}
              tecnicosMap={tecnicosMap}
            />
          )
        )}
      </div>

      {canCreate && (
        <ScheduleFormModal 
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSave={loadSchedules}
          initialData={editingJob}
        />
      )}
      {canCreate && (
        <CronogramaQuickModal
          open={Boolean(quickDay)}
          onOpenChange={(next) => { if (!next) setQuickDay(null); }}
          date={quickDay}
          quotations={quotations}
          visits={visits}
          onWork={(day, quoteId) => handleOpenCreate(day, quoteId)}
          onSaved={loadSchedules}
        />
      )}
    </div>
  );
};

export default ScheduleView;