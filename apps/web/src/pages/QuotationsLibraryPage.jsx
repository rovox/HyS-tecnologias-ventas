import React, { useState, useEffect, useCallback } from 'react';
import Layout from '@/components/Layout.jsx';
import { Helmet } from 'react-helmet';
import pb from '@/lib/pocketbaseClient.js';
import { BookOpen, UploadCloud, FileText, Download, Search, Loader2, Plus, Pencil, Trash2, Settings, X } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext.jsx';

const QuotationsLibraryPage = () => {
  const { currentUser, isAdmin } = useAuth();
  const admin = isAdmin();

  const [quotations, setQuotations] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCat, setSelectedCat] = useState('all');
  const [search, setSearch] = useState('');

  // Upload modal
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({ titulo: '', categoria: '', observacion: '' });
  const [file, setFile] = useState(null);
  const [editTarget, setEditTarget] = useState(null);

  // Category manager
  const [showCatMgr, setShowCatMgr] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [editCat, setEditCat] = useState(null);
  const [deleteCatTarget, setDeleteCatTarget] = useState(null);

  const fetchCategories = useCallback(async () => {
    try {
      const res = await pb.collection('quotation_categories').getFullList({ sort: 'orden,nombre', requestKey: 'qcat-list' });
      setCategories(res);
    } catch { setCategories([]); }
  }, []);

  const fetchQuotes = useCallback(async () => {
    setLoading(true);
    try {
      const records = await pb.collection('quotations').getFullList({ sort: '-created', requestKey: 'quot-list' });
      setQuotations(records);
    } catch {
      toast.error('Error al cargar cotizaciones');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
    fetchQuotes();
  }, [fetchCategories, fetchQuotes]);

  const filteredQuotes = quotations.filter(q => {
    const matchCat = selectedCat === 'all' || q.categoria === selectedCat;
    const matchSearch = (q.titulo || '').toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  const openUpload = (quote = null) => {
    if (quote) {
      setEditTarget(quote);
      setFormData({ titulo: quote.titulo || '', categoria: quote.categoria || '', observacion: quote.observacion || '' });
    } else {
      setEditTarget(null);
      setFormData({ titulo: '', categoria: categories[0]?.nombre || '', observacion: '' });
    }
    setFile(null);
    setIsUploadOpen(true);
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!formData.titulo) return toast.error('El título es obligatorio');
    if (!editTarget && !file) return toast.error('Debes adjuntar un archivo');
    setIsSubmitting(true);
    try {
      const data = new FormData();
      data.append('titulo', formData.titulo);
      data.append('categoria', formData.categoria);
      data.append('observacion', formData.observacion || '');
      data.append('uploaded_by', currentUser?.name || '');
      if (file) data.append('archivo', file);
      if (editTarget) {
        await pb.collection('quotations').update(editTarget.id, data, { requestKey: 'quot-update' });
        toast.success('Cotización actualizada');
      } else {
        await pb.collection('quotations').create(data, { requestKey: 'quot-create' });
        toast.success('Cotización subida correctamente');
      }
      setIsUploadOpen(false);
      fetchQuotes();
    } catch { toast.error('Error al guardar cotización'); }
    finally { setIsSubmitting(false); }
  };

  const handleDelete = async (quote) => {
    if (!confirm(`¿Eliminar "${quote.titulo}"?`)) return;
    try {
      await pb.collection('quotations').delete(quote.id, { requestKey: `quot-del-${quote.id}` });
      toast.success('Cotización eliminada');
      fetchQuotes();
    } catch { toast.error('Error al eliminar'); }
  };

  const handleDownload = (quote) => {
    if (!quote.archivo) return toast.error('No hay archivo adjunto');
    window.open(pb.files.getUrl(quote, quote.archivo), '_blank');
  };

  // Category CRUD
  const createCat = async () => {
    if (!newCatName.trim()) return;
    try {
      await pb.collection('quotation_categories').create({ nombre: newCatName.trim(), orden: categories.length + 1 }, { requestKey: 'qcat-create' });
      setNewCatName('');
      fetchCategories();
      toast.success('Categoría creada');
    } catch { toast.error('Error al crear categoría'); }
  };

  const saveCat = async () => {
    if (!editCat?.nombre?.trim()) return;
    try {
      await pb.collection('quotation_categories').update(editCat.id, { nombre: editCat.nombre }, { requestKey: `qcat-upd-${editCat.id}` });
      setEditCat(null);
      fetchCategories();
      toast.success('Categoría actualizada');
    } catch { toast.error('Error al actualizar categoría'); }
  };

  const deleteCat = async () => {
    if (!deleteCatTarget) return;
    try {
      await pb.collection('quotation_categories').delete(deleteCatTarget.id, { requestKey: `qcat-del-${deleteCatTarget.id}` });
      setDeleteCatTarget(null);
      fetchCategories();
      if (selectedCat === deleteCatTarget.nombre) setSelectedCat('all');
      toast.success('Categoría eliminada');
    } catch { toast.error('Error al eliminar categoría'); }
  };

  return (
    <Layout>
      <Helmet>
        <title>Biblioteca de Cotizaciones - H&S Tecnologías</title>
        <meta name="description" content="Documentos técnicos y cotizaciones de referencia" />
      </Helmet>

      <div className="content-container space-y-6 py-6 w-full max-w-none">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-foreground">Biblioteca de Cotizaciones</h1>
            <p className="text-muted-foreground font-medium">Documentos técnicos y cotizaciones de referencia</p>
          </div>
          <div className="flex gap-2">
            {admin && (
              <Button variant="outline" className="font-bold gap-2" onClick={() => setShowCatMgr(true)}>
                <Settings className="h-4 w-4" /> Categorías
              </Button>
            )}
            <Button onClick={() => openUpload()} className="gap-2 font-bold">
              <UploadCloud className="h-4 w-4" /> Subir Cotización
            </Button>
          </div>
        </div>

        {/* Filters */}
        <Card className="p-4 shadow-sm flex flex-col md:flex-row gap-4 border">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Buscar por título..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
          </div>
          <div className="flex overflow-x-auto gap-2 pb-1 custom-scrollbar">
            <Button size="sm" variant={selectedCat === 'all' ? 'default' : 'outline'} className="whitespace-nowrap font-bold" onClick={() => setSelectedCat('all')}>
              Todas
            </Button>
            {categories.map(cat => (
              <Button key={cat.id} size="sm" variant={selectedCat === cat.nombre ? 'default' : 'outline'} className="whitespace-nowrap font-bold" onClick={() => setSelectedCat(cat.nombre)}>
                {cat.nombre}
              </Button>
            ))}
          </div>
        </Card>

        {/* Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4 md:gap-6">
          {loading ? (
            Array.from({ length: 10 }).map((_, i) => <Skeleton key={i} className="aspect-[3/4] w-full rounded-xl" />)
          ) : filteredQuotes.length > 0 ? (
            filteredQuotes.map(quote => (
              <Card key={quote.id} className="overflow-hidden flex flex-col group border shadow-sm hover:shadow-lg transition-all duration-300">
                <div className="aspect-[4/3] bg-muted relative border-b overflow-hidden">
                  {quote.imagen_preview ? (
                    <img src={pb.files.getUrl(quote, quote.imagen_preview)} alt={quote.titulo} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-background/50">
                      <FileText className="h-16 w-16 text-muted-foreground/30" />
                    </div>
                  )}
                  <div className="absolute top-2 left-2">
                    <Badge className="text-[10px] font-bold bg-background/90 text-foreground border">{quote.categoria || 'Sin categoría'}</Badge>
                  </div>
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <Button size="icon" variant="secondary" className="h-9 w-9 rounded-full" onClick={() => handleDownload(quote)} title="Descargar">
                      <Download className="h-4 w-4" />
                    </Button>
                    {admin && (
                      <>
                        <Button size="icon" variant="secondary" className="h-9 w-9 rounded-full" onClick={() => openUpload(quote)} title="Editar">
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="destructive" className="h-9 w-9 rounded-full" onClick={() => handleDelete(quote)} title="Eliminar">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
                <div className="p-3 flex flex-col flex-1">
                  <h3 className="font-bold text-sm leading-snug line-clamp-2 flex-1" title={quote.titulo}>{quote.titulo}</h3>
                  {quote.observacion && <p className="text-xs text-muted-foreground line-clamp-1 mt-1">{quote.observacion}</p>}
                  <div className="mt-2 pt-2 border-t text-[11px] text-muted-foreground flex justify-between items-center font-medium">
                    <span className="truncate pr-2">{quote.uploaded_by || 'Sistema'}</span>
                    <span className="shrink-0">{format(new Date(quote.created), 'dd MMM yyyy', { locale: es })}</span>
                  </div>
                </div>
              </Card>
            ))
          ) : (
            <div className="col-span-full py-20 text-center">
              <BookOpen className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
              <h3 className="text-xl font-bold">No se encontraron resultados</h3>
              <p className="text-muted-foreground mt-1 font-medium">Ajusta los filtros o sube una cotización.</p>
            </div>
          )}
        </div>
      </div>

      {/* Upload / Edit Modal */}
      <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editTarget ? 'Editar Cotización' : 'Subir Cotización'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpload} className="space-y-4 mt-2">
            <div className="space-y-1.5">
              <label className="text-sm font-bold">Título *</label>
              <Input required value={formData.titulo} onChange={e => setFormData({ ...formData, titulo: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-bold">Categoría *</label>
              <Select value={formData.categoria} onValueChange={v => setFormData({ ...formData, categoria: v })}>
                <SelectTrigger><SelectValue placeholder="Seleccionar categoría" /></SelectTrigger>
                <SelectContent>
                  {categories.map(c => <SelectItem key={c.id} value={c.nombre}>{c.nombre}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-bold">Observación (opcional)</label>
              <Textarea value={formData.observacion} onChange={e => setFormData({ ...formData, observacion: e.target.value })} rows={2} placeholder="Descripción breve del documento..." />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-bold">Archivo {editTarget ? '(dejar vacío para mantener actual)' : '*'}</label>
              <Input type="file" accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg" onChange={e => setFile(e.target.files[0])} className="cursor-pointer" />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsUploadOpen(false)}>Cancelar</Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {editTarget ? 'Guardar cambios' : 'Subir archivo'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Category Manager Modal */}
      {admin && (
        <Dialog open={showCatMgr} onOpenChange={setShowCatMgr}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2"><Settings className="h-5 w-5" /> Administrar Categorías</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-2">
              {/* Add new */}
              <div className="flex gap-2">
                <Input placeholder="Nueva categoría..." value={newCatName} onChange={e => setNewCatName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), createCat())} />
                <Button onClick={createCat} className="font-bold shrink-0"><Plus className="h-4 w-4 mr-1" /> Crear</Button>
              </div>
              {/* List */}
              <div className="space-y-2 max-h-80 overflow-y-auto custom-scrollbar">
                {categories.map(cat => (
                  <div key={cat.id} className="flex items-center gap-2 p-2 rounded-lg border bg-card">
                    {editCat?.id === cat.id ? (
                      <>
                        <Input className="flex-1 h-8" value={editCat.nombre} onChange={e => setEditCat({ ...editCat, nombre: e.target.value })}
                          onKeyDown={e => e.key === 'Enter' && saveCat()} autoFocus />
                        <Button size="sm" className="h-8 font-bold" onClick={saveCat}>Guardar</Button>
                        <Button size="sm" variant="ghost" className="h-8" onClick={() => setEditCat(null)}><X className="h-3.5 w-3.5" /></Button>
                      </>
                    ) : (
                      <>
                        <span className="flex-1 font-medium text-sm">{cat.nombre}</span>
                        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setEditCat({ ...cat })}><Pencil className="h-3.5 w-3.5" /></Button>
                        <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => setDeleteCatTarget(cat)}><Trash2 className="h-3.5 w-3.5" /></Button>
                      </>
                    )}
                  </div>
                ))}
                {categories.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">Sin categorías. Crea una arriba.</p>}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Delete category confirmation */}
      {deleteCatTarget && (
        <Dialog open onOpenChange={() => setDeleteCatTarget(null)}>
          <DialogContent className="max-w-sm">
            <DialogHeader><DialogTitle className="text-destructive">Eliminar categoría</DialogTitle></DialogHeader>
            <p className="text-sm text-muted-foreground">¿Eliminar la categoría <strong>{deleteCatTarget.nombre}</strong>? Las cotizaciones con esta categoría no se eliminarán pero quedarán sin categoría.</p>
            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setDeleteCatTarget(null)}>Cancelar</Button>
              <Button variant="destructive" onClick={deleteCat}>Eliminar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </Layout>
  );
};

export default QuotationsLibraryPage;
