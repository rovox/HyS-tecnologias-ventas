import React, { useState, useEffect } from 'react';
import Layout from '@/components/Layout.jsx';
import { Helmet } from 'react-helmet';
import pb from '@/lib/pocketbaseClient.js';
import { useAuth } from '@/contexts/AuthContext.jsx';
import { MessageSquare, ThumbsUp, ThumbsDown, Minus, Clock, Image as ImageIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';

const ActivityModule = () => {
  const { currentUser } = useAuth();
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('all');
  
  const [newComment, setNewComment] = useState('');
  const [newType, setNewType] = useState('trabajo');
  const [newSentiment, setNewSentiment] = useState('neutral');
  const [submitting, setSubmitting] = useState(false);

  const fetchActivities = async () => {
    try {
      const filter = filterType === 'all' ? '' : `tipo = "${filterType}"`;
      const records = await pb.collection('activity').getList(1, 50, {
        sort: '-created',
        filter,
        $autoCancel: false
      });
      setActivities(records.items);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActivities();
    
    const subscribe = async () => {
      await pb.collection('activity').subscribe('*', (e) => {
        if (e.action === 'create') {
          if (filterType === 'all' || e.record.tipo === filterType) {
            setActivities(prev => [e.record, ...prev].slice(0, 50));
          }
        }
      });
    };
    subscribe();

    return () => {
      pb.collection('activity').unsubscribe('*');
    };
  }, [filterType]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    
    setSubmitting(true);
    try {
      await pb.collection('activity').create({
        tipo: newType,
        usuario: currentUser.name,
        comentario: newComment,
        sentimiento: newSentiment,
        hora: new Date().toISOString()
      }, { $autoCancel: false });
      
      setNewComment('');
      setNewSentiment('neutral');
      toast.success('Publicación creada exitosamente');
    } catch (err) {
      toast.error('Error al publicar');
    } finally {
      setSubmitting(false);
    }
  };

  const getSentimentBadge = (sentiment) => {
    if (sentiment === 'positivo') return <span className="flex items-center gap-1 text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md"><ThumbsUp className="h-3 w-3" /> Positivo</span>;
    if (sentiment === 'negativo') return <span className="flex items-center gap-1 text-xs font-medium text-rose-600 bg-rose-50 px-2 py-1 rounded-md"><ThumbsDown className="h-3 w-3" /> Negativo</span>;
    return <span className="flex items-center gap-1 text-xs font-medium text-slate-600 bg-slate-50 px-2 py-1 rounded-md"><Minus className="h-3 w-3" /> Neutral</span>;
  };

  return (
    <Layout>
      <Helmet>
        <title>Actividad Interna - H&S Tecnologías</title>
      </Helmet>
      
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-primary">Muro de Actividad</h1>
            <p className="text-muted-foreground">Comunicación interna, reportes y observaciones</p>
          </div>
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-[180px] bg-background">
              <SelectValue placeholder="Filtrar por tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los tipos</SelectItem>
              <SelectItem value="trabajo">Trabajos</SelectItem>
              <SelectItem value="relevamiento">Relevamientos</SelectItem>
              <SelectItem value="proyecto">Proyectos</SelectItem>
              <SelectItem value="pedido">Pedidos</SelectItem>
              <SelectItem value="campana">Campañas</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Card className="border shadow-sm bg-card">
          <CardContent className="p-4 sm:p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="flex flex-wrap gap-4">
                <Select value={newType} onValueChange={setNewType}>
                  <SelectTrigger className="w-[160px] bg-muted/50">
                    <SelectValue placeholder="Relacionar con..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="trabajo">Trabajo</SelectItem>
                    <SelectItem value="relevamiento">Relevamiento</SelectItem>
                    <SelectItem value="proyecto">Proyecto</SelectItem>
                    <SelectItem value="pedido">Pedido</SelectItem>
                    <SelectItem value="campana">Campaña</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={newSentiment} onValueChange={setNewSentiment}>
                  <SelectTrigger className="w-[140px] bg-muted/50">
                    <SelectValue placeholder="Sentimiento" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="positivo">Positivo</SelectItem>
                    <SelectItem value="neutral">Neutral</SelectItem>
                    <SelectItem value="negativo">Negativo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-4">
                <Input 
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Escribe tu observación o actualización..."
                  className="flex-1 bg-background"
                />
                <Button type="submit" disabled={submitting || !newComment.trim()} className="bg-primary hover:bg-primary/90">
                  {submitting ? 'Publicando...' : 'Publicar'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <div className="space-y-4">
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-32 w-full rounded-xl" />
            ))
          ) : activities.length > 0 ? (
            activities.map(act => (
              <Card key={act.id} className="overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                <div className="p-5 flex gap-4">
                  <div className="h-12 w-12 bg-secondary/20 rounded-full flex items-center justify-center text-secondary-foreground font-bold uppercase shrink-0 text-lg">
                    {act.usuario?.substring(0, 2)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-foreground text-base">{act.usuario}</span>
                        <span className="text-muted-foreground text-sm">en</span>
                        <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-primary/10 text-primary capitalize">
                          {act.tipo}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        {getSentimentBadge(act.sentimiento)}
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="h-3.5 w-3.5" />
                          {format(new Date(act.created), "d MMM, HH:mm", { locale: es })}
                        </div>
                      </div>
                    </div>
                    <p className="text-foreground/90 whitespace-pre-wrap text-[15px] leading-relaxed">{act.comentario}</p>
                  </div>
                </div>
              </Card>
            ))
          ) : (
            <div className="text-center py-16 px-4 bg-background border rounded-2xl border-dashed">
              <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
              <h3 className="text-xl font-medium text-foreground">Aún no hay actividad</h3>
              <p className="text-muted-foreground mt-1">Sé el primero en compartir una actualización.</p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default ActivityModule;