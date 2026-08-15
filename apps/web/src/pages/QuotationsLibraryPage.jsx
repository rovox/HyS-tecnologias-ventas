import React, { useState, useEffect, useCallback } from 'react';
import Layout from '@/components/Layout.jsx';
import { Helmet } from 'react-helmet';
import { BookOpen, UploadCloud, FileText, Download, Search, Loader2, Plus, Pencil, Trash2, Settings, X, ArrowRight, Calculator } from 'lucide-react';
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
import { useNavigate } from 'react-router-dom';
import quotationsService from '@/services/quotations/index.js';
import clientsService from '@/services/clients/index.js';
import { QUOTATION_FLOW } from '@/mocks/quotations.js';
import pb from '@/lib/pocketbaseClient.js';

const STATUS_LABEL = {
  borrador: 'Borrador',
  enviada: 'Enviada',
  aceptada: 'Aceptada',
  rechazada: 'Rechazada',
  convertida: 'Convertida',
  documento: 'Biblioteca',
};

const STATUS_CLASS = {
  borrador: 'bg-slate-100 text-slate-700',
  enviada: 'bg-blue-100 text-blue-700',
  aceptada: 'bg-emerald-100 text-emerald-800',
  rechazada: 'bg-red-100 text-red-700',
  convertida: 'bg-violet-100 text-violet-800',
  documento: 'bg-muted text-muted-foreground',
};

const emptyItem = () => ({ descripcion: '', cantidad: 1, precio_unitario: 0 });

const QuotationsLibraryPage = () => {
  const { currentUser, isAdmin } = useAuth();
  const admin = isAdmin();
  const navigate = useNavigate();

  const [quotations, setQuotations] = useState([]);
  const [categories, setCategories] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCat, setSelectedCat] = useState('all');
  const [kindFilter, setKindFilter] = useState('all');
  const [search, setSearch] = useState('');

  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({ titulo: '', categoria: '', observacion: '' });
  const [file, setFile] = useState(null);
  const [editTarget, setEditTarget] = useState(null);

  const [showCatMgr, setShowCatMgr] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [editCat, setEditCat] = useState(null);
  const [deleteCatTarget, setDeleteCatTarget] = useState(null);

  const [commercialOpen, setCommercialOpen] = useState(false);
  const [commercial, setCommercial] = useState({
    titulo: '',
    categoria: '',
    cliente_id: '',
    observacion: '',
    items: [emptyItem()],
  });
  const [savingCommercial, setSavingCommercial] = useState(false);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [quotes, cats, cli] = await Promise.all([
        quotationsService.getAll(),
        quotationsService.getCategories(),
        clientsService.getAll(),
      ]);
      setQuotations(quotes);
      setCategories(cats);
      setClients(cli);
    } catch {
      toast.error('Error al cargar cotizaciones');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const filteredQuotes = quotations.filter((quote) => {
    const matchCat = selectedCat === 'all' || quote.categoria === selectedCat;
    const matchKind = kindFilter === 'all' || quote.kind === kindFilter || (kindFilter === 'library' && quote.kind !== 'commercial');
    const matchSearch = `${quote.titulo || ''} ${quote.numero || ''}`.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchKind && matchSearch;
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
      const payload = {
        ...formData,
        kind: 'library',
        estado: 'documento',
        uploaded_by: currentUser?.name || '',
        archivo: file?.name || editTarget?.archivo || '',
      };
      if (editTarget) await quotationsService.update(editTarget.id, payload);
      else await quotationsService.create(payload);
      toast.success(editTarget ? 'Documento actualizado' : 'Documento de biblioteca guardado');
      setIsUploadOpen(false);
      fetchAll();
    } catch {
      toast.error('Error al guardar cotización');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (quote) => {
    if (!confirm(`¿Eliminar "${quote.titulo}"?`)) return;
    try {
      await quotationsService.delete(quote.id);
      toast.success('Cotización eliminada');
      fetchAll();
    } catch {
      toast.error('Error al eliminar');
    }
  };

  const handleDownload = (quote) => {
    if (!quote.archivo) return toast.error('No hay archivo adjunto (POC: placeholder)');
    window.open(pb.files.getUrl(quote, quote.archivo), '_blank');
  };

  const createCat = async () => {
    if (!newCatName.trim()) return;
    try {
      await quotationsService.createCategory({ nombre: newCatName.trim(), orden: categories.length + 1 });
      setNewCatName('');
      fetchAll();
      toast.success('Categoría creada');
    } catch { toast.error('Error al crear categoría'); }
  };

  const saveCat = async () => {
    if (!editCat?.nombre?.trim()) return;
    try {
      await quotationsService.updateCategory(editCat.id, { nombre: editCat.nombre });
      setEditCat(null);
      fetchAll();
      toast.success('Categoría actualizada');
    } catch { toast.error('Error al actualizar categoría'); }
  };

  const deleteCat = async () => {
    if (!deleteCatTarget) return;
    try {
      await quotationsService.deleteCategory(deleteCatTarget.id);
      setDeleteCatTarget(null);
      fetchAll();
      if (selectedCat === deleteCatTarget.nombre) setSelectedCat('all');
      toast.success('Categoría eliminada');
    } catch { toast.error('Error al eliminar categoría'); }
  };

  const commercialTotal = commercial.items.reduce((sum, item) => sum + (Number(item.cantidad) || 0) * (Number(item.precio_unitario) || 0), 0);

  const saveCommercial = async (e) => {
    e.preventDefault();
    if (!commercial.titulo) return toast.error('El título es obligatorio');
    if (!commercial.cliente_id) return toast.error('Selecciona un cliente');
    setSavingCommercial(true);
    try {
      const client = clients.find((row) => row.id === commercial.cliente_id);
      await quotationsService.create({
        kind: 'commercial',
        titulo: commercial.titulo,
        categoria: commercial.categoria || categories[0]?.nombre || '',
        cliente_id: commercial.cliente_id,
        cliente_nombre: client?.nombre || '',
        observacion: commercial.observacion,
        items: commercial.items,
        vendedor_id: currentUser?.id,
        vendedor_nombre: currentUser?.name,
        uploaded_by: currentUser?.name,
        estado: 'borrador',
      });
      toast.success('Cotización comercial creada (POC)');
      setCommercialOpen(false);
      setCommercial({ titulo: '', categoria: categories[0]?.nombre || '', cliente_id: '', observacion: '', items: [emptyItem()] });
      fetchAll();
    } catch (err) {
      toast.error(err.message || 'Error al guardar');
    } finally {
      setSavingCommercial(false);
    }
  };

  const changeStatus = async (quote, estado) => {
    try {
      await quotationsService.updateStatus(quote.id, estado);
      toast.success(`Estado: ${STATUS_LABEL[estado]}`);
      fetchAll();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const convertQuote = async (quote) => {
    try {
      const result = await quotationsService.convertToSchedule(quote.id, {
        sucursal_id: clients.find((row) => row.id === quote.cliente_id)?.sucursal_id,
        vendedor_responsable_id: currentUser?.id,
      });
      toast.success(result.alreadyConverted ? 'Ya estaba convertida' : `Trabajo ${result.schedule.id} creado`);
      fetchAll();
      navigate('/schedule');
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <Layout>
      <Helmet>
        <title>Cotizaciones - H&S Tecnologías</title>
        <meta name="description" content="Biblioteca de documentos y cotizaciones comerciales POC" />
      </Helmet>

      <div className="content-container space-y-6 py-6 w-full max-w-none">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-foreground">Cotizaciones</h1>
            <p className="text-muted-foreground font-medium">
              Biblioteca de documentos (existente) + flujo comercial simulado (POC)
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {admin && (
              <Button variant="outline" className="font-bold gap-2" onClick={() => setShowCatMgr(true)}>
                <Settings className="h-4 w-4" /> Categorías
              </Button>
            )}
            <Button variant="outline" onClick={() => openUpload()} className="gap-2 font-bold">
              <UploadCloud className="h-4 w-4" /> Subir documento
            </Button>
            <Button onClick={() => {
              setCommercial({ titulo: '', categoria: categories[0]?.nombre || '', cliente_id: '', observacion: '', items: [emptyItem()] });
              setCommercialOpen(true);
            }} className="gap-2 font-bold">
              <Calculator className="h-4 w-4" /> Nueva cotización
            </Button>
          </div>
        </div>

        <Card className="p-4 shadow-sm flex flex-col gap-4 border">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Buscar título o número..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
            </div>
            <div className="flex gap-2">
              {[['all', 'Todas'], ['commercial', 'Comerciales'], ['library', 'Biblioteca']].map(([id, label]) => (
                <Button key={id} size="sm" variant={kindFilter === id ? 'default' : 'outline'} className="font-bold" onClick={() => setKindFilter(id)}>{label}</Button>
              ))}
            </div>
          </div>
          <div className="flex overflow-x-auto gap-2 pb-1">
            <Button size="sm" variant={selectedCat === 'all' ? 'default' : 'outline'} className="whitespace-nowrap font-bold" onClick={() => setSelectedCat('all')}>Todas</Button>
            {categories.map((cat) => (
              <Button key={cat.id} size="sm" variant={selectedCat === cat.nombre ? 'default' : 'outline'} className="whitespace-nowrap font-bold" onClick={() => setSelectedCat(cat.nombre)}>{cat.nombre}</Button>
            ))}
          </div>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {loading ? Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-56 w-full rounded-xl" />)
            : filteredQuotes.length > 0 ? filteredQuotes.map((quote) => {
              const next = QUOTATION_FLOW[quote.estado] || [];
              return (
                <Card key={quote.id} className="p-4 border shadow-sm flex flex-col gap-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-[11px] font-bold text-muted-foreground">{quote.numero || 'Documento'}</p>
                      <h3 className="font-bold leading-snug">{quote.titulo}</h3>
                      <p className="text-xs text-muted-foreground mt-1">{quote.cliente_nombre || quote.categoria}</p>
                    </div>
                    <Badge className={`text-[10px] font-bold ${STATUS_CLASS[quote.estado] || STATUS_CLASS.documento}`}>{STATUS_LABEL[quote.estado] || quote.estado}</Badge>
                  </div>
                  {quote.kind === 'commercial' && (
                    <p className="text-lg font-black tabular-nums">Bs {Number(quote.total || 0).toLocaleString('es-BO')}</p>
                  )}
                  {quote.observacion && <p className="text-xs text-muted-foreground line-clamp-2">{quote.observacion}</p>}
                  <div className="flex flex-wrap gap-2 mt-auto pt-2 border-t">
                    {quote.archivo && (
                      <Button size="sm" variant="outline" onClick={() => handleDownload(quote)}><Download className="h-3.5 w-3.5 mr-1" /> Ver</Button>
                    )}
                    {quote.kind === 'commercial' && next.map((estado) => (
                      <Button key={estado} size="sm" variant="secondary" className="font-bold" onClick={() => changeStatus(quote, estado)}>
                        {STATUS_LABEL[estado]}
                      </Button>
                    ))}
                    {quote.estado === 'aceptada' && (
                      <Button size="sm" className="font-bold" onClick={() => convertQuote(quote)}>
                        Convertir a trabajo <ArrowRight className="h-3.5 w-3.5 ml-1" />
                      </Button>
                    )}
                    {quote.estado === 'convertida' && quote.schedule_id && (
                      <Button size="sm" variant="outline" onClick={() => navigate('/schedule')}>Ver cronograma</Button>
                    )}
                    {admin && (
                      <Button size="icon" variant="ghost" className="h-8 w-8 ml-auto text-destructive" onClick={() => handleDelete(quote)}><Trash2 className="h-4 w-4" /></Button>
                    )}
                    {quote.kind !== 'commercial' && admin && (
                      <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => openUpload(quote)}><Pencil className="h-4 w-4" /></Button>
                    )}
                  </div>
                  <p className="text-[11px] text-muted-foreground">{quote.uploaded_by} · {quote.created ? format(new Date(String(quote.created).replace(' ', 'T')), 'dd MMM yyyy', { locale: es }) : ''}</p>
                </Card>
              );
            }) : (
              <div className="col-span-full py-20 text-center">
                <BookOpen className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
                <h3 className="text-xl font-bold">No se encontraron resultados</h3>
              </div>
            )}
        </div>
      </div>

      <Dialog open={commercialOpen} onOpenChange={setCommercialOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Nueva cotización comercial (POC)</DialogTitle>
          </DialogHeader>
          <form onSubmit={saveCommercial} className="space-y-4">
            <p className="text-xs text-muted-foreground">Extensión de demostración. El producto original era una biblioteca de archivos.</p>
            <Input required placeholder="Título" value={commercial.titulo} onChange={(e) => setCommercial({ ...commercial, titulo: e.target.value })} />
            <div className="grid grid-cols-2 gap-3">
              <Select value={commercial.cliente_id} onValueChange={(v) => setCommercial({ ...commercial, cliente_id: v })}>
                <SelectTrigger><SelectValue placeholder="Cliente" /></SelectTrigger>
                <SelectContent>
                  {clients.map((client) => <SelectItem key={client.id} value={client.id}>{client.nombre}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={commercial.categoria} onValueChange={(v) => setCommercial({ ...commercial, categoria: v })}>
                <SelectTrigger><SelectValue placeholder="Categoría" /></SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => <SelectItem key={cat.id} value={cat.nombre}>{cat.nombre}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              {commercial.items.map((item, index) => (
                <div key={index} className="grid grid-cols-12 gap-2">
                  <Input className="col-span-6" placeholder="Ítem" value={item.descripcion} onChange={(e) => {
                    const items = [...commercial.items];
                    items[index] = { ...item, descripcion: e.target.value };
                    setCommercial({ ...commercial, items });
                  }} />
                  <Input className="col-span-2" type="number" min="1" value={item.cantidad} onChange={(e) => {
                    const items = [...commercial.items];
                    items[index] = { ...item, cantidad: Number(e.target.value) };
                    setCommercial({ ...commercial, items });
                  }} />
                  <Input className="col-span-3" type="number" min="0" value={item.precio_unitario} onChange={(e) => {
                    const items = [...commercial.items];
                    items[index] = { ...item, precio_unitario: Number(e.target.value) };
                    setCommercial({ ...commercial, items });
                  }} />
                  <Button type="button" variant="ghost" className="col-span-1" onClick={() => setCommercial({ ...commercial, items: commercial.items.filter((_, i) => i !== index) })}><X className="h-4 w-4" /></Button>
                </div>
              ))}
              <Button type="button" variant="outline" size="sm" onClick={() => setCommercial({ ...commercial, items: [...commercial.items, emptyItem()] })}>
                <Plus className="h-4 w-4 mr-1" /> Ítem
              </Button>
            </div>
            <Textarea placeholder="Observaciones" value={commercial.observacion} onChange={(e) => setCommercial({ ...commercial, observacion: e.target.value })} />
            <p className="text-right font-black">Total Bs {commercialTotal.toLocaleString('es-BO')}</p>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setCommercialOpen(false)}>Cancelar</Button>
              <Button type="submit" disabled={savingCommercial}>{savingCommercial && <Loader2 className="h-4 w-4 mr-2 animate-spin" />} Guardar borrador</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editTarget ? 'Editar documento' : 'Subir documento de biblioteca'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpload} className="space-y-4 mt-2">
            <Input required value={formData.titulo} onChange={(e) => setFormData({ ...formData, titulo: e.target.value })} placeholder="Título" />
            <Select value={formData.categoria} onValueChange={(v) => setFormData({ ...formData, categoria: v })}>
              <SelectTrigger><SelectValue placeholder="Categoría" /></SelectTrigger>
              <SelectContent>
                {categories.map((c) => <SelectItem key={c.id} value={c.nombre}>{c.nombre}</SelectItem>)}
              </SelectContent>
            </Select>
            <Textarea value={formData.observacion} onChange={(e) => setFormData({ ...formData, observacion: e.target.value })} rows={2} />
            <Input type="file" onChange={(e) => setFile(e.target.files[0])} className="cursor-pointer" />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsUploadOpen(false)}>Cancelar</Button>
              <Button type="submit" disabled={isSubmitting}>{isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />} Guardar</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {admin && (
        <Dialog open={showCatMgr} onOpenChange={setShowCatMgr}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Administrar Categorías</DialogTitle>
            </DialogHeader>
            <div className="flex gap-2">
              <Input placeholder="Nueva categoría..." value={newCatName} onChange={(e) => setNewCatName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), createCat())} />
              <Button onClick={createCat} className="font-bold shrink-0"><Plus className="h-4 w-4 mr-1" /> Crear</Button>
            </div>
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {categories.map((cat) => (
                <div key={cat.id} className="flex items-center gap-2 p-2 rounded-lg border">
                  {editCat?.id === cat.id ? (
                    <>
                      <Input className="flex-1 h-8" value={editCat.nombre} onChange={(e) => setEditCat({ ...editCat, nombre: e.target.value })} />
                      <Button size="sm" onClick={saveCat}>Guardar</Button>
                      <Button size="sm" variant="ghost" onClick={() => setEditCat(null)}><X className="h-3.5 w-3.5" /></Button>
                    </>
                  ) : (
                    <>
                      <span className="flex-1 text-sm font-medium">{cat.nombre}</span>
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setEditCat({ ...cat })}><Pencil className="h-3.5 w-3.5" /></Button>
                      <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => setDeleteCatTarget(cat)}><Trash2 className="h-3.5 w-3.5" /></Button>
                    </>
                  )}
                </div>
              ))}
            </div>
          </DialogContent>
        </Dialog>
      )}

      {deleteCatTarget && (
        <Dialog open onOpenChange={() => setDeleteCatTarget(null)}>
          <DialogContent className="max-w-sm">
            <DialogHeader><DialogTitle className="text-destructive">Eliminar categoría</DialogTitle></DialogHeader>
            <p className="text-sm">¿Eliminar <strong>{deleteCatTarget.nombre}</strong>?</p>
            <DialogFooter>
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
