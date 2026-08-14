import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import pb from '@/lib/pocketbaseClient.js';
import { useAuth } from '@/contexts/AuthContext.jsx';
import Layout from '@/components/Layout.jsx';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Megaphone, Plus, Trash2, Edit2, Calendar, DollarSign, BarChart3, Image as ImageIcon, Video, FileText, File, Loader2, TrendingUp, Users, Briefcase, Radio } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';

const MATERIAL_TYPES = ['Flyer', 'Banner', 'Video', 'Diseño', 'Documento', 'Texto'];
const CANALES = ['Facebook', 'TikTok', 'WhatsApp', 'Volantes', 'Referidos', 'Otro'];
const STATUS_LABELS = { active: 'En ejecución', planning: 'Planificada', paused: 'Pausada', completed: 'Finalizada' };
const STATUS_COLORS = {
  active: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  planning: 'bg-blue-100 text-blue-800 border-blue-200',
  paused: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  completed: 'bg-slate-100 text-slate-600 border-slate-200',
};

const EMPTY_CAMPAIGN = {
  id: '', name: '', budget: '', start_date: '', end_date: '',
  status: 'active', canal: '', sucursal_nombre: '', responsible: '',
  interesados: '', clientes_generados: '', trabajos_cerrados: '', gasto_real: '',
};

const MarketingPage = () => {
  const { currentUser, isAdmin } = useAuth();
  const admin = isAdmin();
  const [campaigns, setCampaigns] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [sucursales, setSucursales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCampaign, setSelectedCampaign] = useState(null);

  const [isCampaignModalOpen, setIsCampaignModalOpen] = useState(false);
  const [campaignForm, setCampaignForm] = useState(EMPTY_CAMPAIGN);
  const [isCampaignSubmitting, setIsCampaignSubmitting] = useState(false);

  const [isMaterialModalOpen, setIsMaterialModalOpen] = useState(false);
  const [materialForm, setMaterialForm] = useState({ id: '', titulo: '', tipo: 'Flyer', archivo: null });
  const [isMaterialSubmitting, setIsMaterialSubmitting] = useState(false);

  useEffect(() => {
    fetchCampaigns();
    pb.collection('sucursales').getFullList({ filter: 'activa = true', sort: 'nombre', requestKey: 'mkt-suc' })
      .then(r => setSucursales(r)).catch(() => {});
  }, []);

  const fetchCampaigns = async () => {
    setLoading(true);
    try {
      const records = await pb.collection('campaigns_new').getFullList({ sort: '-created', requestKey: 'mkt-camps' });
      setCampaigns(records);
      if (records.length > 0 && !selectedCampaign) handleSelectCampaign(records[0]);
    } catch (e) {
      toast.error('Error al cargar campañas.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectCampaign = async (campaign) => {
    setSelectedCampaign(campaign);
    try {
      const mats = await pb.collection('campaign_materials').getFullList({
        filter: `campaign_id = "${campaign.id}"`,
        sort: '-created',
        requestKey: 'mkt-mats',
      });
      setMaterials(mats);
    } catch (e) {
      setMaterials([]);
    }
  };

  const openCampaignModal = (camp = null) => {
    if (camp) {
      setCampaignForm({
        id: camp.id,
        name: camp.name || '',
        budget: camp.budget || '',
        start_date: camp.start_date ? String(camp.start_date).split(' ')[0].split('T')[0] : '',
        end_date: camp.end_date ? String(camp.end_date).split(' ')[0].split('T')[0] : '',
        status: camp.status || 'active',
        canal: camp.canal || '',
        sucursal_nombre: camp.sucursal_nombre || '',
        responsible: camp.responsible || '',
        interesados: camp.interesados || '',
        clientes_generados: camp.clientes_generados || '',
        trabajos_cerrados: camp.trabajos_cerrados || '',
        gasto_real: camp.gasto_real || '',
      });
    } else {
      setCampaignForm({ ...EMPTY_CAMPAIGN, responsible: currentUser?.name || '' });
    }
    setIsCampaignModalOpen(true);
  };

  const saveCampaign = async (e) => {
    e.preventDefault();
    if (!campaignForm.name) return toast.error('El nombre es requerido.');
    setIsCampaignSubmitting(true);
    try {
      const data = {
        name: campaignForm.name,
        budget: Number(campaignForm.budget) || 0,
        start_date: campaignForm.start_date ? new Date(campaignForm.start_date).toISOString() : null,
        end_date: campaignForm.end_date ? new Date(campaignForm.end_date).toISOString() : null,
        status: campaignForm.status,
        canal: campaignForm.canal || '',
        sucursal_nombre: campaignForm.sucursal_nombre || '',
        responsible: campaignForm.responsible || currentUser?.name || '',
        interesados: Number(campaignForm.interesados) || 0,
        clientes_generados: Number(campaignForm.clientes_generados) || 0,
        trabajos_cerrados: Number(campaignForm.trabajos_cerrados) || 0,
        gasto_real: Number(campaignForm.gasto_real) || 0,
        created_by: currentUser?.id || '',
      };
      if (campaignForm.id) {
        const updated = await pb.collection('campaigns_new').update(campaignForm.id, data, { requestKey: 'mkt-save' });
        toast.success('Campaña actualizada');
        setSelectedCampaign(updated);
      } else {
        await pb.collection('campaigns_new').create(data, { requestKey: 'mkt-create' });
        toast.success('Campaña creada');
      }
      setIsCampaignModalOpen(false);
      fetchCampaigns();
    } catch (e) {
      toast.error('Error al guardar campaña.');
    } finally {
      setIsCampaignSubmitting(false);
    }
  };

  const deleteCampaign = async (id) => {
    if (!window.confirm('¿Eliminar esta campaña y sus materiales?')) return;
    try {
      await pb.collection('campaigns_new').delete(id, { requestKey: 'mkt-del' });
      toast.success('Campaña eliminada');
      if (selectedCampaign?.id === id) { setSelectedCampaign(null); setMaterials([]); }
      fetchCampaigns();
    } catch (e) {
      toast.error('Error al eliminar campaña.');
    }
  };

  const openMaterialModal = (mat = null) => {
    if (mat) {
      setMaterialForm({ id: mat.id, titulo: mat.titulo, tipo: mat.tipo, archivo: null });
    } else {
      setMaterialForm({ id: '', titulo: '', tipo: 'Flyer', archivo: null });
    }
    setIsMaterialModalOpen(true);
  };

  const saveMaterial = async (e) => {
    e.preventDefault();
    if (!materialForm.titulo || !selectedCampaign) return toast.error('Completa los datos requeridos.');
    if (!materialForm.id && !materialForm.archivo) return toast.error('Debes subir un archivo.');
    setIsMaterialSubmitting(true);
    try {
      const fd = new FormData();
      fd.append('campaign_id', selectedCampaign.id);
      fd.append('titulo', materialForm.titulo);
      fd.append('tipo', materialForm.tipo);
      fd.append('uploaded_by', currentUser?.name || '');
      if (materialForm.archivo) fd.append('archivo', materialForm.archivo);
      if (materialForm.id) {
        await pb.collection('campaign_materials').update(materialForm.id, fd, { requestKey: 'mkt-mat-upd' });
        toast.success('Material actualizado');
      } else {
        await pb.collection('campaign_materials').create(fd, { requestKey: 'mkt-mat-cre' });
        toast.success('Material agregado');
      }
      setIsMaterialModalOpen(false);
      handleSelectCampaign(selectedCampaign);
    } catch (e) {
      toast.error('Error al guardar material.');
    } finally {
      setIsMaterialSubmitting(false);
    }
  };

  const deleteMaterial = async (id) => {
    if (!window.confirm('¿Eliminar este material?')) return;
    try {
      await pb.collection('campaign_materials').delete(id, { requestKey: 'mkt-mat-del' });
      toast.success('Material eliminado');
      handleSelectCampaign(selectedCampaign);
    } catch (e) {
      toast.error('Error al eliminar material.');
    }
  };

  const getFileIcon = (tipo) => {
    switch (tipo) {
      case 'Video': return <Video className="h-10 w-10 text-rose-500" />;
      case 'Documento': case 'Texto': return <FileText className="h-10 w-10 text-blue-500" />;
      default: return <ImageIcon className="h-10 w-10 text-emerald-500" />;
    }
  };

  const cf = (k, v) => setCampaignForm(prev => ({ ...prev, [k]: v }));

  return (
    <Layout>
      <Helmet><title>Marketing - H&S Tecnologías</title><meta name="description" content="Hub de marketing, campañas y materiales" /></Helmet>
      <div className="content-container py-6 pb-20 max-w-7xl mx-auto h-[calc(100vh-64px)] flex flex-col">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 shrink-0">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-3">
              <Megaphone className="h-8 w-8 text-primary" /> Hub de Marketing
            </h1>
            <p className="text-muted-foreground mt-1 font-medium">Gestión de campañas, resultados y recursos gráficos</p>
          </div>
          <Button onClick={() => openCampaignModal()} className="font-bold gap-2">
            <Plus className="h-4 w-4" /> Nueva Campaña
          </Button>
        </div>

        <div className="flex flex-col lg:flex-row gap-6 flex-1 min-h-0">
          {/* Left: Campaign list */}
          <Card className="w-full lg:w-1/3 flex flex-col border rounded-2xl shadow-sm overflow-hidden h-full">
            <CardHeader className="bg-muted/20 border-b pb-4 shrink-0">
              <CardTitle className="text-lg">Campañas</CardTitle>
            </CardHeader>
            <CardContent className="p-0 overflow-y-auto custom-scrollbar flex-1">
              {loading ? (
                <div className="p-4 space-y-3">
                  <Skeleton className="h-20 w-full rounded-xl" />
                  <Skeleton className="h-20 w-full rounded-xl" />
                </div>
              ) : campaigns.length > 0 ? (
                <div className="divide-y divide-border">
                  {campaigns.map(camp => (
                    <div key={camp.id} onClick={() => handleSelectCampaign(camp)}
                      className={`p-4 cursor-pointer transition-colors hover:bg-muted/50 ${selectedCampaign?.id === camp.id ? 'bg-primary/5 border-l-4 border-l-primary' : 'border-l-4 border-l-transparent'}`}>
                      <div className="flex justify-between items-start mb-1.5">
                        <h3 className="font-extrabold text-foreground truncate pr-2">{camp.name}</h3>
                        <Badge className={`text-[10px] uppercase font-bold tracking-wider border ${STATUS_COLORS[camp.status] || ''}`}>
                          {STATUS_LABELS[camp.status] || camp.status}
                        </Badge>
                      </div>
                      <div className="flex flex-wrap gap-3 text-xs font-medium text-muted-foreground">
                        {camp.canal && <span className="flex items-center gap-1"><Radio className="h-3 w-3" /> {camp.canal}</span>}
                        <span className="flex items-center gap-1"><DollarSign className="h-3 w-3" /> {camp.budget?.toLocaleString() || '0'}</span>
                        {camp.start_date && <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> {format(new Date(camp.start_date), 'MMM yy', { locale: es })}</span>}
                      </div>
                      {/* Mini results */}
                      {(camp.interesados > 0 || camp.clientes_generados > 0) && (
                        <div className="flex gap-3 mt-1.5 text-xs">
                          {camp.interesados > 0 && <span className="text-blue-600 font-bold">{camp.interesados} interesados</span>}
                          {camp.clientes_generados > 0 && <span className="text-green-600 font-bold">{camp.clientes_generados} clientes</span>}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center text-muted-foreground font-medium flex flex-col items-center">
                  <BarChart3 className="h-8 w-8 mb-2 opacity-50" />
                  No hay campañas registradas
                </div>
              )}
            </CardContent>
          </Card>

          {/* Right: Campaign detail */}
          <Card className="w-full lg:w-2/3 flex flex-col border rounded-2xl shadow-sm overflow-hidden h-full">
            {selectedCampaign ? (
              <>
                <CardHeader className="bg-card border-b p-6 shrink-0 flex flex-row justify-between items-start">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start gap-3 mb-2">
                      <h2 className="text-2xl font-black text-foreground">{selectedCampaign.name}</h2>
                      <Badge className={`text-[10px] uppercase tracking-wider border shrink-0 ${STATUS_COLORS[selectedCampaign.status] || ''}`}>
                        {STATUS_LABELS[selectedCampaign.status] || selectedCampaign.status}
                      </Badge>
                    </div>
                    <div className="flex flex-wrap gap-3 text-sm font-medium text-muted-foreground">
                      {selectedCampaign.canal && <span className="flex items-center gap-1.5"><Radio className="h-4 w-4" /> {selectedCampaign.canal}</span>}
                      <span className="flex items-center gap-1.5"><DollarSign className="h-4 w-4" /> Presupuesto: ${selectedCampaign.budget?.toLocaleString() || '0'}</span>
                      {selectedCampaign.start_date && (
                        <span className="flex items-center gap-1.5"><Calendar className="h-4 w-4" />
                          {format(new Date(selectedCampaign.start_date), 'dd MMM yy', { locale: es })} →{' '}
                          {selectedCampaign.end_date ? format(new Date(selectedCampaign.end_date), 'dd MMM yy', { locale: es }) : '—'}
                        </span>
                      )}
                      {selectedCampaign.responsible && <span>Resp: {selectedCampaign.responsible}</span>}
                      {selectedCampaign.sucursal_nombre && <span>Sucursal: {selectedCampaign.sucursal_nombre}</span>}
                    </div>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <Button variant="outline" size="icon" onClick={() => openCampaignModal(selectedCampaign)}><Edit2 className="h-4 w-4" /></Button>
                    {admin && <Button variant="outline" size="icon" onClick={() => deleteCampaign(selectedCampaign.id)} className="text-destructive hover:bg-destructive/10"><Trash2 className="h-4 w-4" /></Button>}
                  </div>
                </CardHeader>

                {/* Results KPIs */}
                {(selectedCampaign.interesados > 0 || selectedCampaign.clientes_generados > 0 || selectedCampaign.trabajos_cerrados > 0 || selectedCampaign.gasto_real > 0) && (
                  <div className="p-4 border-b bg-muted/10 shrink-0">
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-3">Resultados</p>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div className="text-center bg-card rounded-xl p-3 border">
                        <p className="text-2xl font-black text-blue-600">{selectedCampaign.interesados || 0}</p>
                        <p className="text-xs text-muted-foreground font-semibold mt-0.5">Interesados</p>
                      </div>
                      <div className="text-center bg-card rounded-xl p-3 border">
                        <p className="text-2xl font-black text-green-600">{selectedCampaign.clientes_generados || 0}</p>
                        <p className="text-xs text-muted-foreground font-semibold mt-0.5">Clientes generados</p>
                      </div>
                      <div className="text-center bg-card rounded-xl p-3 border">
                        <p className="text-2xl font-black text-primary">{selectedCampaign.trabajos_cerrados || 0}</p>
                        <p className="text-xs text-muted-foreground font-semibold mt-0.5">Trabajos cerrados</p>
                      </div>
                      <div className="text-center bg-card rounded-xl p-3 border">
                        <p className="text-2xl font-black text-orange-600">${(selectedCampaign.gasto_real || 0).toLocaleString()}</p>
                        <p className="text-xs text-muted-foreground font-semibold mt-0.5">Gasto real</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Materials */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-6 bg-card">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-bold text-foreground">Archivos de Campaña <span className="text-primary text-sm">({materials.length})</span></h3>
                    <Button onClick={() => openMaterialModal()} size="sm" className="font-bold"><Plus className="h-4 w-4 mr-2" /> Subir Material</Button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                    {materials.map(mat => (
                      <div key={mat.id} className="border border-border rounded-xl p-4 flex flex-col items-center text-center group hover:border-primary/50 transition-colors bg-background shadow-sm">
                        <div className="mb-3 bg-muted/50 p-4 rounded-full group-hover:scale-110 transition-transform">
                          {getFileIcon(mat.tipo)}
                        </div>
                        <h4 className="font-bold text-sm text-foreground line-clamp-2 mb-1">{mat.titulo}</h4>
                        <Badge variant="outline" className="text-[10px] mb-4 shadow-none">{mat.tipo}</Badge>
                        <div className="flex gap-2 mt-auto w-full pt-4 border-t border-border">
                          {mat.archivo && (
                            <Button variant="outline" size="sm" className="flex-1 text-xs font-bold" onClick={() => window.open(pb.files.getUrl(mat, mat.archivo), '_blank')}>
                              Ver
                            </Button>
                          )}
                          {admin && <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => deleteMaterial(mat.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>}
                        </div>
                      </div>
                    ))}
                    {materials.length === 0 && (
                      <div className="col-span-full py-12 text-center border border-dashed border-border rounded-xl bg-muted/20">
                        <ImageIcon className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
                        <p className="font-bold text-muted-foreground">Sin materiales adjuntos</p>
                        <p className="text-sm text-muted-foreground">Sube banners, videos o flyers para esta campaña.</p>
                      </div>
                    )}
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-muted-foreground font-medium flex-col p-8">
                <Megaphone className="h-12 w-12 mb-4 opacity-20" />
                <p>Selecciona una campaña para ver detalles y recursos</p>
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* Campaign Form Modal */}
      <Dialog open={isCampaignModalOpen} onOpenChange={setIsCampaignModalOpen}>
        <DialogContent className="sm:max-w-lg bg-background max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="font-extrabold">{campaignForm.id ? 'Editar Campaña' : 'Nueva Campaña'}</DialogTitle></DialogHeader>
          <form onSubmit={saveCampaign} className="space-y-4 mt-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1 sm:col-span-2">
                <Label>Nombre de Campaña *</Label>
                <Input required value={campaignForm.name} onChange={e => cf('name', e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label>Estado</Label>
                <Select value={campaignForm.status} onValueChange={v => cf('status', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="planning">Planificada</SelectItem>
                    <SelectItem value="active">En ejecución</SelectItem>
                    <SelectItem value="paused">Pausada</SelectItem>
                    <SelectItem value="completed">Finalizada</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Canal</Label>
                <Select value={campaignForm.canal || 'none'} onValueChange={v => cf('canal', v === 'none' ? '' : v)}>
                  <SelectTrigger><SelectValue placeholder="Seleccionar canal" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sin especificar</SelectItem>
                    {CANALES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Responsable</Label>
                <Input value={campaignForm.responsible} onChange={e => cf('responsible', e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label>Sucursal</Label>
                <Select value={campaignForm.sucursal_nombre || 'none'} onValueChange={v => cf('sucursal_nombre', v === 'none' ? '' : v)}>
                  <SelectTrigger><SelectValue placeholder="Todas las sucursales" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Todas</SelectItem>
                    {sucursales.map(s => <SelectItem key={s.id} value={s.nombre}>{s.nombre}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Presupuesto estimado (Bs)</Label>
                <Input type="number" value={campaignForm.budget} onChange={e => cf('budget', e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label>Gasto real (Bs)</Label>
                <Input type="number" value={campaignForm.gasto_real} onChange={e => cf('gasto_real', e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label>Fecha Inicio</Label>
                <Input type="date" value={campaignForm.start_date} onChange={e => cf('start_date', e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label>Fecha Fin</Label>
                <Input type="date" value={campaignForm.end_date} onChange={e => cf('end_date', e.target.value)} />
              </div>
            </div>
            <div className="border-t pt-4">
              <p className="text-sm font-bold text-muted-foreground mb-3">Resultados de la campaña</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <Label>Interesados</Label>
                  <Input type="number" min={0} value={campaignForm.interesados} onChange={e => cf('interesados', e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label>Clientes generados</Label>
                  <Input type="number" min={0} value={campaignForm.clientes_generados} onChange={e => cf('clientes_generados', e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label>Trabajos cerrados</Label>
                  <Input type="number" min={0} value={campaignForm.trabajos_cerrados} onChange={e => cf('trabajos_cerrados', e.target.value)} />
                </div>
              </div>
            </div>
            <DialogFooter className="mt-4 pt-4 border-t">
              <Button type="button" variant="outline" onClick={() => setIsCampaignModalOpen(false)}>Cancelar</Button>
              <Button type="submit" disabled={isCampaignSubmitting} className="font-bold">
                {isCampaignSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : 'Guardar Campaña'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Material Form Modal */}
      <Dialog open={isMaterialModalOpen} onOpenChange={setIsMaterialModalOpen}>
        <DialogContent className="sm:max-w-md bg-background">
          <DialogHeader><DialogTitle className="font-extrabold">{materialForm.id ? 'Editar Material' : 'Subir Material'}</DialogTitle></DialogHeader>
          <form onSubmit={saveMaterial} className="space-y-4 mt-4">
            <div className="space-y-1">
              <Label>Título / Referencia *</Label>
              <Input required value={materialForm.titulo} onChange={e => setMaterialForm(p => ({ ...p, titulo: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <Label>Tipo de Material *</Label>
              <Select value={materialForm.tipo} onValueChange={v => setMaterialForm(p => ({ ...p, tipo: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {MATERIAL_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Archivo adjunto {!materialForm.id && '*'}</Label>
              <Input type="file" onChange={e => setMaterialForm(p => ({ ...p, archivo: e.target.files[0] }))} className="cursor-pointer" />
              {materialForm.id && <p className="text-xs text-muted-foreground">Sube uno nuevo solo si deseas reemplazar el actual.</p>}
            </div>
            <DialogFooter className="mt-4 pt-4 border-t">
              <Button type="button" variant="outline" onClick={() => setIsMaterialModalOpen(false)}>Cancelar</Button>
              <Button type="submit" disabled={isMaterialSubmitting} className="font-bold">
                {isMaterialSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : 'Guardar Material'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </Layout>
  );
};

export default MarketingPage;
