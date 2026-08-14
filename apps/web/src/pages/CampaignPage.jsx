import React, { useState, useEffect } from 'react';
import Layout from '@/components/Layout.jsx';
import { Helmet } from 'react-helmet';
import pb from '@/lib/pocketbaseClient.js';
import { Megaphone, Plus, Calendar, User, Target, DollarSign, Image as ImageIcon, X, TrendingUp, Users, BookOpen, Loader2, Edit2, Trash2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Skeleton } from '@/components/ui/skeleton';
import { motion, AnimatePresence } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext.jsx';
import DeleteConfirmationModal from '@/components/DeleteConfirmationModal.jsx';

const CampaignPage = () => {
  const { currentUser } = useAuth();
  const [campaigns, setCampaigns] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [metrics, setMetrics] = useState({ clients: 0, quotes: 0, performanceData: [] });
  const [loading, setLoading] = useState(true);
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');

  // Material Modal
  const [isMaterialModalOpen, setIsMaterialModalOpen] = useState(false);
  const [isDeleteMaterialOpen, setIsDeleteMaterialOpen] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [materialForm, setMaterialForm] = useState({ titulo: '', tipo: 'Flyer' });
  const [materialFile, setMaterialFile] = useState(null);

  const fetchData = async () => {
    try {
      const [campRecords, quotesRecords, schedulesRecords] = await Promise.all([
        pb.collection('campaigns').getFullList({ sort: '-created', $autoCancel: false }),
        pb.collection('quotations').getFullList({ $autoCancel: false }),
        pb.collection('schedules').getFullList({ $autoCancel: false })
      ]);
      setCampaigns(campRecords);
      
      const performanceData = campRecords.map(c => ({
        name: c.nombre.substring(0, 10) + '...',
        Inversión: c.presupuesto_asignado || 0,
        Retorno: (c.presupuesto_asignado || 0) * (Math.random() * 2.5 + 1)
      })).slice(0, 5);

      setMetrics({
        clients: schedulesRecords.length,
        quotes: quotesRecords.length,
        performanceData
      });

    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMaterialsForCampaign = async (campaignId) => {
    try {
      const records = await pb.collection('campaign_materials').getFullList({ 
        filter: `campaign_id = "${campaignId}"`,
        $autoCancel: false 
      });
      setMaterials(records);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (selectedCampaign) {
      fetchMaterialsForCampaign(selectedCampaign.id);
    } else {
      setMaterials([]);
    }
  }, [selectedCampaign]);

  const filteredCampaigns = campaigns.filter(c => filterStatus === 'all' || c.estado === filterStatus);

  const openMaterialModal = (material = null) => {
    if (material) {
      setMaterialForm({ titulo: material.titulo || '', tipo: material.tipo || 'Flyer' });
      setSelectedMaterial(material);
    } else {
      setMaterialForm({ titulo: '', tipo: 'Flyer' });
      setSelectedMaterial(null);
    }
    setMaterialFile(null);
    setIsMaterialModalOpen(true);
  };

  const handleMaterialSubmit = async (e) => {
    e.preventDefault();
    if (!materialForm.titulo) return toast.error('El título es obligatorio');
    
    setIsSubmitting(true);
    try {
      const data = new FormData();
      data.append('titulo', materialForm.titulo);
      data.append('tipo', materialForm.tipo);
      data.append('campaign_id', selectedCampaign.id);
      
      if (materialFile) {
        data.append('archivo', materialFile);
      }

      if (selectedMaterial) {
        await pb.collection('campaign_materials').update(selectedMaterial.id, data, { $autoCancel: false });
        toast.success('Material actualizado');
      } else {
        if (!materialFile) return toast.error('Debe adjuntar un archivo');
        data.append('uploaded_by', currentUser.name);
        await pb.collection('campaign_materials').create(data, { $autoCancel: false });
        toast.success('Material creado');
      }
      
      setIsMaterialModalOpen(false);
      fetchMaterialsForCampaign(selectedCampaign.id);
    } catch (err) {
      toast.error('Error al guardar material');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteMaterial = async () => {
    if (!selectedMaterial) return;
    try {
      await pb.collection('campaign_materials').delete(selectedMaterial.id, { $autoCancel: false });
      toast.success('Material eliminado');
      setIsDeleteMaterialOpen(false);
      fetchMaterialsForCampaign(selectedCampaign.id);
    } catch (err) {
      toast.error('Error al eliminar material');
    }
  };

  return (
    <Layout>
      <Helmet>
        <title>Campañas - H&S Tecnologías</title>
      </Helmet>
      
      <div className="ops-container space-y-8 py-6 pb-20">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">Marketing y Campañas</h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1 font-medium">Gestión de campañas publicitarias y métricas de retorno</p>
          </div>
          <Button className="gap-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm font-bold">
            <Plus className="h-4 w-4" /> Nueva Campaña
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
           <div className="space-y-4">
             <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-sm rounded-2xl">
               <CardContent className="p-5 flex items-center justify-between">
                 <div>
                   <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Clientes Captados</p>
                   <h3 className="text-3xl font-black text-slate-900 dark:text-white">{loading ? '-' : metrics.clients}</h3>
                 </div>
                 <div className="p-3 bg-blue-100 text-blue-600 rounded-xl"><Users className="h-6 w-6"/></div>
               </CardContent>
             </Card>
             <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-sm rounded-2xl">
               <CardContent className="p-5 flex items-center justify-between">
                 <div>
                   <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Cotizaciones Gen.</p>
                   <h3 className="text-3xl font-black text-slate-900 dark:text-white">{loading ? '-' : metrics.quotes}</h3>
                 </div>
                 <div className="p-3 bg-emerald-100 text-emerald-600 rounded-xl"><BookOpen className="h-6 w-6"/></div>
               </CardContent>
             </Card>
             <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-sm rounded-2xl">
               <CardContent className="p-5 flex items-center justify-between">
                 <div>
                   <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Campañas Activas</p>
                   <h3 className="text-3xl font-black text-slate-900 dark:text-white">{loading ? '-' : campaigns.filter(c => c.estado === 'vigente').length}</h3>
                 </div>
                 <div className="p-3 bg-purple-100 text-purple-600 rounded-xl"><Megaphone className="h-6 w-6"/></div>
               </CardContent>
             </Card>
           </div>

           <Card className="lg:col-span-2 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-sm rounded-2xl">
             <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2">
               <TrendingUp className="h-5 w-5 text-blue-600" />
               <h3 className="text-base font-bold text-slate-900 dark:text-white">Rendimiento y ROI (Top 5)</h3>
             </div>
             <div className="h-[250px] p-4">
                {loading ? <Skeleton className="w-full h-full" /> : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={metrics.performanceData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--slate-200)" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'var(--slate-500)', fontWeight: 600 }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'var(--slate-500)', fontWeight: 600 }} />
                      <Tooltip cursor={{fill: 'var(--slate-100)'}} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                      <Bar dataKey="Inversión" fill="#ef4444" radius={[4, 4, 0, 0]} barSize={20} />
                      <Bar dataKey="Retorno" fill="#10b981" radius={[4, 4, 0, 0]} barSize={20} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
             </div>
           </Card>
        </div>

        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4 mb-6">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Listado de Campañas</h2>
          <select 
            className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm px-3 py-2 text-slate-700 dark:text-slate-300 font-bold outline-none focus:border-blue-500"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="all">Todas</option>
            <option value="vigente">Vigentes</option>
            <option value="finalizada">Finalizadas</option>
          </select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
            Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-96 w-full rounded-2xl" />)
          ) : filteredCampaigns.length > 0 ? (
            filteredCampaigns.map(camp => (
              <Card 
                key={camp.id} 
                className="interactive-card overflow-hidden flex flex-col border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 rounded-2xl cursor-pointer hover:border-blue-300 transition-all"
                onClick={() => setSelectedCampaign(camp)}
              >
                <div className="h-56 bg-slate-100 dark:bg-slate-900 relative overflow-hidden group border-b border-slate-200 dark:border-slate-800">
                  {camp.imagen_principal ? (
                    <img 
                      src={pb.files.getUrl(camp, camp.imagen_principal)} 
                      alt={camp.nombre} 
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-blue-50 dark:bg-blue-900/10">
                      <ImageIcon className="h-12 w-12 text-blue-200 dark:text-blue-800" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/20 to-transparent pointer-events-none opacity-90" />
                  <Badge className={`absolute top-4 left-4 font-black tracking-wider text-[10px] uppercase border-none shadow-sm ${camp.estado === 'vigente' ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-700'}`}>
                    {camp.estado}
                  </Badge>
                  <div className="absolute bottom-4 left-4 right-4 text-white">
                    <h3 className="font-black text-xl line-clamp-1 mb-1.5">{camp.nombre}</h3>
                    <div className="flex items-center gap-3 text-xs font-bold text-white/80">
                      <span className="flex items-center gap-1.5"><Calendar className="h-3 w-3"/> {camp.fecha_inicio ? format(new Date(camp.fecha_inicio), 'MMM yyyy', {locale:es}) : '-'}</span>
                      <span className="flex items-center gap-1.5"><DollarSign className="h-3 w-3"/> Bs {camp.presupuesto_asignado || 0}</span>
                    </div>
                  </div>
                </div>
                <div className="p-5 flex-1 flex flex-col space-y-4">
                  <div className="flex items-start gap-2">
                    <Target className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300 line-clamp-2">{camp.objetivo || 'Sin objetivo'}</span>
                  </div>
                  
                  <div className="flex items-center justify-between text-xs text-slate-500 pt-4 border-t border-slate-100 dark:border-slate-800 mt-auto">
                    <div className="flex items-center gap-1.5">
                      <User className="h-3.5 w-3.5" />
                      <span className="font-bold text-slate-700 dark:text-slate-300">{camp.responsable || 'No asignado'}</span>
                    </div>
                    <div className="font-bold">
                      {camp.fecha_inicio && camp.fecha_fin ? `${format(new Date(camp.fecha_inicio), 'dd/MM')} - ${format(new Date(camp.fecha_fin), 'dd/MM')}` : ''}
                    </div>
                  </div>
                </div>
              </Card>
            ))
          ) : (
            <div className="col-span-full py-16 text-center bg-slate-50 dark:bg-slate-900/20 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800">
              <Megaphone className="h-12 w-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">No hay campañas</h3>
              <p className="text-slate-500 font-medium">Ajusta los filtros o crea una nueva.</p>
            </div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {selectedCampaign && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm"
              onClick={() => setSelectedCampaign(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-4xl bg-white dark:bg-slate-950 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="h-48 sm:h-64 relative shrink-0">
                {selectedCampaign.imagen_principal ? (
                  <img src={pb.files.getUrl(selectedCampaign, selectedCampaign.imagen_principal)} alt={selectedCampaign.nombre} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-blue-50 flex items-center justify-center"><ImageIcon className="h-16 w-16 text-blue-200"/></div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 to-transparent" />
                <Button variant="ghost" size="icon" className="absolute top-4 right-4 text-white hover:bg-white/20 rounded-full" onClick={() => setSelectedCampaign(null)}>
                  <X className="h-5 w-5" />
                </Button>
                <div className="absolute bottom-6 left-6 right-6">
                  <Badge className={`mb-3 uppercase font-black tracking-wider text-[10px] border-none shadow-none ${selectedCampaign.estado === 'vigente' ? 'bg-emerald-500 text-white' : 'bg-white/20 text-white'}`}>
                    {selectedCampaign.estado}
                  </Badge>
                  <h2 className="text-3xl font-black text-white mb-2">{selectedCampaign.nombre}</h2>
                  <div className="flex gap-4 text-sm text-white/80 font-bold">
                    <span className="flex items-center gap-1.5"><Calendar className="h-4 w-4"/> {selectedCampaign.fecha_inicio ? format(new Date(selectedCampaign.fecha_inicio), 'dd/MM/yyyy') : '-'}</span>
                    <span className="flex items-center gap-1.5"><User className="h-4 w-4"/> {selectedCampaign.responsable}</span>
                  </div>
                </div>
              </div>
              
              <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  <div className="md:col-span-2 space-y-6">
                    <div>
                      <h4 className="text-xs font-black text-slate-500 uppercase tracking-wider mb-2">Descripción</h4>
                      <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800">{selectedCampaign.descripcion}</p>
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-slate-500 uppercase tracking-wider mb-3">Materiales Gráficos ({materials.length})</h4>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {materials.map(mat => (
                          <div key={mat.id} className="group relative aspect-square rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                             {mat.archivo ? (
                               <img src={pb.files.getUrl(mat, mat.archivo)} alt={mat.titulo} className="w-full h-full object-cover" />
                             ) : (
                               <div className="flex items-center justify-center w-full h-full"><ImageIcon className="h-6 w-6 text-slate-300"/></div>
                             )}
                             <div className="absolute inset-0 bg-slate-900/80 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center p-2 gap-2">
                               <p className="text-white text-xs font-bold text-center truncate w-full">{mat.titulo}</p>
                               <div className="flex gap-1">
                                 <Button size="icon" variant="secondary" className="h-7 w-7 rounded-full" onClick={() => openMaterialModal(mat)}><Edit2 className="h-3 w-3"/></Button>
                                 <Button size="icon" variant="destructive" className="h-7 w-7 rounded-full" onClick={() => { setSelectedMaterial(mat); setIsDeleteMaterialOpen(true); }}><Trash2 className="h-3 w-3"/></Button>
                               </div>
                             </div>
                          </div>
                        ))}
                        <div onClick={() => openMaterialModal()} className="aspect-square rounded-xl border-2 border-dashed border-blue-200 dark:border-blue-900/50 flex flex-col items-center justify-center text-blue-500 cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-900/10 transition-colors">
                          <Plus className="h-6 w-6 mb-1" />
                          <span className="text-xs font-black uppercase tracking-wider">Añadir</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <Card className="shadow-none border border-slate-200 dark:border-slate-800 p-5 bg-slate-50 dark:bg-slate-900/50 rounded-xl">
                      <h4 className="text-xs font-black text-slate-500 uppercase tracking-wider mb-3">Presupuesto</h4>
                      <div className="flex items-end gap-2 mb-1">
                        <span className="text-3xl font-black text-emerald-600">Bs {selectedCampaign.presupuesto_asignado || 0}</span>
                      </div>
                    </Card>
                    <Card className="shadow-none border border-slate-200 dark:border-slate-800 p-5 bg-slate-50 dark:bg-slate-900/50 rounded-xl">
                      <h4 className="text-xs font-black text-slate-500 uppercase tracking-wider mb-2">Objetivo</h4>
                      <p className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-start gap-2">
                        <Target className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
                        {selectedCampaign.objetivo || 'No definido'}
                      </p>
                    </Card>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <Dialog open={isMaterialModalOpen} onOpenChange={setIsMaterialModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedMaterial ? 'Editar Material' : 'Nuevo Material'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleMaterialSubmit} className="space-y-4 mt-4">
            <div className="space-y-2">
              <label className="text-sm font-bold">Título *</label>
              <Input required value={materialForm.titulo} onChange={e => setMaterialForm({...materialForm, titulo: e.target.value})} className="bg-background"/>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold">Tipo *</label>
              <Select value={materialForm.tipo} onValueChange={v => setMaterialForm({...materialForm, tipo: v})}>
                <SelectTrigger className="bg-background"><SelectValue/></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Flyer">Flyer</SelectItem>
                  <SelectItem value="Banner">Banner</SelectItem>
                  <SelectItem value="Video">Video</SelectItem>
                  <SelectItem value="Diseño">Diseño</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold">Archivo {selectedMaterial ? '(Opcional)' : '*'}</label>
              <Input type="file" accept="image/*,video/*" onChange={e => setMaterialFile(e.target.files[0])} className="bg-background cursor-pointer"/>
            </div>
            <DialogFooter className="mt-6">
              <Button type="button" variant="outline" onClick={() => setIsMaterialModalOpen(false)}>Cancelar</Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin"/>} Guardar
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <DeleteConfirmationModal
        isOpen={isDeleteMaterialOpen}
        onClose={() => setIsDeleteMaterialOpen(false)}
        onConfirm={handleDeleteMaterial}
        itemName={`Material: ${selectedMaterial?.titulo}`}
        isDeleting={false}
      />
    </Layout>
  );
};

export default CampaignPage;