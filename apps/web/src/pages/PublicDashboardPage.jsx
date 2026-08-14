import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import pb from '@/lib/pocketbaseClient.js';
import { Calendar, ClipboardList, ShieldCheck, Clock, MapPin, ArrowRight, Activity, Camera } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { format, addDays, startOfToday, isSameDay } from 'date-fns';
import { es } from 'date-fns/locale';
import { Link } from 'react-router-dom';

const PublicDashboardPage = () => {
  const [schedules, setSchedules] = useState([]);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  const today = startOfToday();
  const tomorrow = addDays(today, 1);
  const dayAfter = addDays(today, 2);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const todayStr = format(today, 'yyyy-MM-dd');
        const endDateStr = format(addDays(today, 3), 'yyyy-MM-dd');
        
        const [scheds, acts] = await Promise.all([
          pb.collection('schedules').getFullList({ 
            filter: `(type = "seguridad" || type = "proyectos") && fecha_programada >= "${todayStr}" && fecha_programada < "${endDateStr}"`,
            sort: 'fecha_programada',
            $autoCancel: false 
          }),
          pb.collection('activity').getList(1, 5, { 
            sort: '-created',
            $autoCancel: false 
          })
        ]);

        setSchedules(scheds);
        setActivities(acts.items);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const getSchedulesForDay = (date) => {
    return schedules.filter(s => isSameDay(new Date(s.fecha_programada), date));
  };

  const renderScheduleColumn = (date, title) => {
    const daySchedules = getSchedulesForDay(date);
    
    return (
      <div className="flex flex-col flex-1 min-w-[300px]">
        <div className="bg-muted px-4 py-3 rounded-t-2xl border-b border-border mb-4 flex items-center justify-between">
          <h3 className="font-bold text-foreground">{title}</h3>
          <span className="text-xs font-semibold px-2 py-1 rounded bg-background shadow-sm text-muted-foreground">
            {format(date, 'dd MMM', { locale: es })}
          </span>
        </div>
        
        <div className="space-y-4 flex-1">
          {loading ? (
            Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-40 w-full rounded-xl" />)
          ) : daySchedules.length > 0 ? (
            daySchedules.map(job => (
              <Card key={job.id} className="overflow-hidden border shadow-sm hover:shadow-md transition-shadow">
                <div className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <Badge variant="outline" className={`capitalize ${job.type === 'seguridad' ? 'bg-primary/10 text-primary border-primary/20' : 'bg-secondary/20 text-secondary-foreground border-secondary/30'}`}>
                      {job.type}
                    </Badge>
                    <span className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" /> {job.estado.replace('_', ' ')}
                    </span>
                  </div>
                  <h4 className="font-bold text-base mb-1">{job.cliente}</h4>
                  <div className="flex items-center text-xs text-muted-foreground gap-1.5 mb-2">
                    <MapPin className="h-3.5 w-3.5" />
                    <span className="truncate">{job.lugar}</span>
                  </div>
                  <p className="text-sm line-clamp-2 text-foreground/80 mb-3 bg-muted/50 p-2 rounded-lg">{job.descripcion_trabajo}</p>
                  
                  <div className="flex justify-between items-center text-xs border-t pt-2 mt-auto">
                    <span className="font-semibold text-muted-foreground">Asignado: {job.created_by || 'Equipo'}</span>
                  </div>
                </div>
              </Card>
            ))
          ) : (
            <div className="h-32 flex flex-col items-center justify-center p-4 text-center bg-card rounded-xl border border-dashed">
              <Calendar className="h-6 w-6 text-muted-foreground/30 mb-2" />
              <p className="text-sm text-muted-foreground">Sin operaciones programadas</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-muted/20 pb-12">
      <Helmet>
        <title>Portal Público - H&S Tecnologías</title>
      </Helmet>

      <header className="bg-primary text-primary-foreground py-4 px-6 shadow-md relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1500469835612-bbdd7aa966e7?q=80&w=1200&auto=format&fit=crop')] opacity-10 bg-cover bg-center mix-blend-overlay"></div>
        <div className="max-w-7xl mx-auto flex justify-between items-center relative z-10">
          <div className="flex items-center gap-3">
            <ShieldCheck className="h-8 w-8 text-secondary" />
            <div>
              <h1 className="text-xl font-bold tracking-tight">H&S Tecnologías</h1>
              <p className="text-xs text-primary-foreground/80 italic font-medium">"Somos familia, somos H&S"</p>
            </div>
          </div>
          <Link to="/login">
            <Button variant="secondary" size="sm" className="font-semibold bg-secondary text-secondary-foreground hover:bg-secondary/90">
              Ingreso Personal
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4 md:p-6 lg:py-8 space-y-8">
        {/* Quick Indicators */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-card border shadow-sm">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="p-4 bg-primary/10 rounded-2xl text-primary">
                <Calendar className="h-8 w-8" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Operaciones Hoy</p>
                <h3 className="text-3xl font-bold text-foreground">{loading ? '-' : getSchedulesForDay(today).length}</h3>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card border shadow-sm">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="p-4 bg-secondary/20 rounded-2xl text-secondary-foreground">
                <Activity className="h-8 w-8" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Actividades Recientes</p>
                <h3 className="text-3xl font-bold text-foreground">{loading ? '-' : activities.length}</h3>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card border shadow-sm">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="p-4 bg-orange-500/10 rounded-2xl text-orange-600">
                <Camera className="h-8 w-8" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">En Ejecución</p>
                <h3 className="text-3xl font-bold text-foreground">Sistemas Activos</h3>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Combined Schedule View */}
        <section>
          <div className="mb-6 flex items-center gap-2">
            <ShieldCheck className="h-6 w-6 text-primary" />
            <h2 className="text-2xl font-bold tracking-tight">Panel de Operaciones: Seguridad y Proyectos</h2>
          </div>
          
          <div className="flex flex-col md:flex-row gap-6 overflow-x-auto custom-scrollbar pb-4">
            {renderScheduleColumn(today, "Hoy")}
            {renderScheduleColumn(tomorrow, "Mañana")}
            {renderScheduleColumn(dayAfter, "Pasado Mañana")}
          </div>
        </section>

        {/* Bottom Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Activity Feed */}
          <Card className="shadow-sm border">
            <CardHeader className="border-b bg-muted/20">
              <CardTitle className="text-lg flex items-center gap-2">
                <ClipboardList className="h-5 w-5 text-primary" />
                Bitácora Reciente
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-6">
                {loading ? (
                  Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)
                ) : activities.length > 0 ? (
                  activities.map(act => (
                    <div key={act.id} className="relative pl-6 border-l-2 border-muted pb-2 last:pb-0 last:border-transparent">
                      <div className="absolute -left-[9px] top-0 h-4 w-4 rounded-full bg-background border-2 border-primary"></div>
                      <p className="text-sm font-medium text-foreground">
                        <span className="font-bold">{act.usuario}</span> reportó en <span className="capitalize text-primary font-semibold">{act.tipo}</span>
                      </p>
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2 bg-muted/30 p-2 rounded">{act.comentario}</p>
                      <p className="text-xs text-muted-foreground/60 mt-2">
                        {format(new Date(act.created), "d MMM, HH:mm", { locale: es })}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">Sin actividad reciente.</p>
                )}
              </div>
            </CardContent>
          </Card>
          
          {/* Photos (Mock section utilizing layout request) */}
          <Card className="shadow-sm border overflow-hidden">
            <CardHeader className="border-b bg-muted/20">
              <CardTitle className="text-lg flex items-center gap-2">
                <Camera className="h-5 w-5 text-primary" />
                Galería de Campo
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
               <div className="grid grid-cols-2 gap-3">
                 <img src="https://images.unsplash.com/photo-1500469835612-bbdd7aa966e7?q=80&w=400&auto=format&fit=crop" alt="Proyecto" className="rounded-xl w-full h-32 object-cover" />
                 <img src="https://images.unsplash.com/photo-1539954307203-e9ab36ee577a?q=80&w=400&auto=format&fit=crop" alt="Operación" className="rounded-xl w-full h-32 object-cover" />
                 <img src="https://images.unsplash.com/photo-1493882552576-fce827c6161e?q=80&w=400&auto=format&fit=crop" alt="Equipo" className="rounded-xl w-full h-32 object-cover col-span-2" />
               </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default PublicDashboardPage;