import React, { useState, useEffect } from 'react';
import Layout from '@/components/Layout.jsx';
import { Helmet } from 'react-helmet';
import pb from '@/lib/pocketbaseClient.js';
import { Wrench, Plus, Laptop, Server, Router, Printer, X, Image as ImageIcon, MapPin, Calendar as CalIcon, Edit2, Trash2, Loader2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Skeleton } from '@/components/ui/skeleton';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext.jsx';
import DeleteConfirmationModal from '@/components/DeleteConfirmationModal.jsx';

const MaintenancePage = () => {
  const { currentUser, isAdmin } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState(null);

  // Modals
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    tipo_equipo: 'laptop', cliente_sucursal: '', problema: '', fecha: format(new Date(), 'yyyy-MM-dd'), observaciones: '', estado: 'Pendiente'
  });
  const [files, setFiles] = useState([]);
  const [previewUrls, setPreviewUrls] = useState([]);

  const fetchMaintenance = async () => {
    setLoading(true);
    try {
      const records = await pb.collection('maintenance').getFullList({
        sort: '-fecha',
        $autoCancel: false
      });
      setItems(records);
    } catch (err) {
      console.error(err);
      toast.error('Error al cargar mantenimientos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMaintenance();
  }, []);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Pendiente': return <Badge variant="outline" className="bg-orange-100 text-orange-800 border-orange-200 uppercase tracking-wider text-[10px] font-bold px-2">Pendiente</Badge>;
      case 'En proceso': return <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-200 uppercase tracking-wider text-[10px] font-bold px-2">En proceso</Badge>;
      case 'Completado': return <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200 uppercase tracking-wider text-[10px] font-bold px-2">Completado</Badge>;
      default: return <Badge variant="outline" className="uppercase tracking-wider text-[10px] font-bold px-2">{status}</Badge>;
    }
  };

  const getDeviceIcon = (tipo) => {
    switch (tipo?.toLowerCase()) {
      case 'laptop': return <Laptop className="h-5 w-5 text-primary" />;
      case 'servidor': return <Server className="h-5 w-5 text-primary" />;
      case 'router':
      case 'switch': return <Router className="h-5 w-5 text-primary" />;
      case 'impresora': return <Printer className="h-5 w-5 text-primary" />;
      default: return <Wrench className="h-5 w-5 text-primary" />;
    }
  };

  const openCreateModal = () => {
    setFormData({ tipo_equipo: 'laptop', cliente_sucursal: '', problema: '', fecha: format(new Date(), 'yyyy-MM-dd'), observaciones: '', estado: 'Pendiente' });
    setFiles([]);
    setPreviewUrls([]);
    setSelectedItem(null);
    setIsFormOpen(true);
  };

  const openEditModal = (item) => {
    setFormData({
      tipo_equipo: item.tipo_equipo || 'laptop',
      cliente_sucursal: item.cliente_sucursal || '',
      problema: item.problema || '',
      fecha: item.fecha ? item.fecha.split(' ')[0] : format(new Date(), 'yyyy-MM-dd'),
      observaciones: item.observaciones || '',
      estado: item.estado || 'Pendiente'
    });
    setFiles([]);
    setPreviewUrls([]);
    setSelectedItem(item);
    setIsFormOpen(true);
  };

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    setFiles(prev => [...prev, ...selectedFiles]);
    const newPreviews = selectedFiles.map(file => URL.createObjectURL(file));
    setPreviewUrls(prev => [...prev, ...newPreviews]);
  };

  const removeFile = (index) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
    URL.revokeObjectURL(previewUrls[index]);
    setPreviewUrls(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.cliente_sucursal || !formData.problema || !formData.fecha) return toast.error('Completa los campos requeridos');
    
    setIsSubmitting(true);
    try {
      const data = new FormData();
      Object.keys(formData).forEach(key => data.append(key, formData[key]));
      files.forEach(f => data.append('fotografias', f));
      
      if (selectedItem) {
        data.append('updated_by', currentUser.name);
        await pb.collection('maintenance').update(selectedItem.id, data, { $autoCancel: false });
        toast.success('Mantenimiento actualizado');
      } else {
        data.append('created_by', currentUser.name);
        await pb.collection('maintenance').create(data, { $autoCancel: false });
        toast.success('Mantenimiento registrado');
      }
      setIsFormOpen(false);
      fetchMaintenance();
    } catch (err) {
      toast.error('Error al guardar mantenimiento');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedItem) return;
    try {
      await pb.collection('maintenance').delete(selectedItem.id, { $autoCancel: false });
      toast.success('Mantenimiento eliminado');
      setIsDeleteOpen(false);
      setSelectedItem(null);
      fetchMaintenance();
    } catch (err) {
      toast.error('Error al eliminar');
    }
  };

  return (
    <Layout>
      <Helmet>
        <title>Mantenimientos Internos - H&S Tecnologías</title>
      </Helmet>
      
      <div className="content-container space-y-6 py-6 pb-20 w-full max-w-none">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 w-full">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-primary">Mantenimientos</h1>
            <p className="text-muted-foreground mt-1 font-medium">Control y reparación de equipos en laboratorio</p>
          </div>
          <Button onClick={openCreateModal} className="gap-2 bg-primary hover:bg-primary/90 rounded-lg font-bold">
            <Plus className="h-4 w-4" /> Nuevo Ingreso
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-4 gap-6 w-full">
          {loading ? (
             Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-56 w-full rounded-2xl" />)
          ) : items.length > 0 ? (
            items.map(item => (
              <Card 
                key={item.id} 
                className="interactive-card flex flex-col h-full border bg-card rounded-2xl overflow-hidden w-full"
              >
                <div className="p-5 flex-1 bg-card w-full cursor-pointer" onClick={() => setSelectedItem(item)}>
                  <div className="flex justify-between items-start mb-4 w-full">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="p-3 bg-primary/10 rounded-xl shadow-sm shrink-0">
                        {getDeviceIcon(item.tipo_equipo)}
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-foreground capitalize truncate w-full">{item.tipo_equipo}</p>
                        <p className="text-xs font-medium text-muted-foreground flex items-center gap-1 truncate w-full"><MapPin className="h-3 w-3 shrink-0"/>{item.cliente_sucursal}</p>
                      </div>
                    </div>
                    {getStatusBadge(item.estado)}
                  </div>
                  
                  <div className="mt-4 w-full">
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Falla Reportada</p>
                    <p className="text-sm text-foreground/90 line-clamp-3 bg-muted/40 p-3 rounded-xl border w-full break-words">{item.problema}</p>
                  </div>
                </div>

                <div className="px-5 py-3 border-t bg-muted/20 flex items-center justify-between text-xs text-muted-foreground font-medium w-full">
                  <span className="flex items-center gap-1.5"><CalIcon className="h-3.5 w-3.5"/>{format(new Date(item.fecha), "dd MMM yyyy", { locale: es })}</span>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-blue-600 hover:bg-blue-50" onClick={(e) => { e.stopPropagation(); openEditModal(item); }}>
                      <Edit2 className="h-3 w-3" />
                    </Button>
                    {isAdmin() && (
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-red-600 hover:bg-red-50" onClick={(e) => { e.stopPropagation(); setSelectedItem(item); setIsDeleteOpen(true); }}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            ))
          ) : (
             <div className="col-span-full py-16 text-center border-2 border-dashed rounded-2xl bg-card w-full">
               <Wrench className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
               <h3 className="text-xl font-bold text-foreground">No hay mantenimientos activos</h3>
               <p className="text-muted-foreground mt-1 font-medium">Registra un equipo que requiera atención.</p>
             </div>
          )}
        </div>
      </div>

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>{selectedItem ? 'Editar Mantenimiento' : 'Nuevo Mantenimiento'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-bold">Tipo de Equipo *</label>
                <Select value={formData.tipo_equipo} onValueChange={v => setFormData({...formData, tipo_equipo: v})}>
                  <SelectTrigger className="bg-background"><SelectValue/></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="laptop">Laptop</SelectItem>
                    <SelectItem value="impresora">Impresora</SelectItem>
                    <SelectItem value="UPS">UPS</SelectItem>
                    <SelectItem value="router">Router</SelectItem>
                    <SelectItem value="switch">Switch</SelectItem>
                    <SelectItem value="servidor">Servidor</SelectItem>
                    <SelectItem value="otros">Otros</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold">Fecha *</label>
                <Input type="date" required value={formData.fecha} onChange={e => setFormData({...formData, fecha: e.target.value})} className="bg-background"/>
              </div>
              <div className="space-y-2 col-span-2">
                <label className="text-sm font-bold">Cliente / Sucursal *</label>
                <Input required value={formData.cliente_sucursal} onChange={e => setFormData({...formData, cliente_sucursal: e.target.value})} className="bg-background"/>
              </div>
              <div className="space-y-2 col-span-2">
                <label className="text-sm font-bold">Problema Reportado *</label>
                <Textarea required value={formData.problema} onChange={e => setFormData({...formData, problema: e.target.value})} className="bg-background resize-none"/>
              </div>
              <div className="space-y-2 col-span-2">
                <label className="text-sm font-bold">Observaciones / Diagnóstico</label>
                <Textarea value={formData.observaciones} onChange={e => setFormData({...formData, observaciones: e.target.value})} className="bg-background resize-none"/>
              </div>
              <div className="space-y-2 col-span-2">
                <label className="text-sm font-bold">Estado</label>
                <Select value={formData.estado} onValueChange={v => setFormData({...formData, estado: v})}>
                  <SelectTrigger className="bg-background"><SelectValue/></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Pendiente">Pendiente</SelectItem>
                    <SelectItem value="En proceso">En proceso</SelectItem>
                    <SelectItem value="Completado">Completado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2 col-span-2">
                <label className="text-sm font-bold">Evidencia Fotográfica</label>
                {previewUrls.length > 0 && (
                  <div className="flex gap-2 overflow-x-auto py-2">
                    {previewUrls.map((url, idx) => (
                      <div key={idx} className="relative h-16 w-16 shrink-0 rounded-lg overflow-hidden border">
                        <img src={url} alt="Preview" className="w-full h-full object-cover" />
                        <button type="button" onClick={() => removeFile(idx)} className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-1 hover:bg-black"><X className="h-3 w-3" /></button>
                      </div>
                    ))}
                  </div>
                )}
                <label className="cursor-pointer inline-flex items-center gap-2 text-sm font-bold text-primary hover:text-primary/80 bg-primary/10 px-4 py-2 rounded-lg">
                  <ImageIcon className="h-4 w-4" /> Adjuntar Fotos
                  <input type="file" accept="image/*" multiple className="hidden" onChange={handleFileChange} />
                </label>
              </div>
            </div>
            <DialogFooter className="mt-6">
              <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)}>Cancelar</Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin"/>} Guardar
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <DeleteConfirmationModal
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDelete}
        itemName={`Mantenimiento de ${selectedItem?.tipo_equipo}`}
        isDeleting={false}
      />
    </Layout>
  );
};

export default MaintenancePage;