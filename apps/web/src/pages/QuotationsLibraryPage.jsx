import React, { useState, useEffect, useCallback } from 'react';
import Layout from '@/components/Layout.jsx';
import { Helmet } from 'react-helmet';
import { BookOpen, UploadCloud, Download, Search, Loader2, Plus, Pencil, Trash2, Settings, X, ArrowRight, Calculator } from 'lucide-react';
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
import {
  QUOTATION_FLOW,
  QUOTATION_MAIN_CATEGORIES,
  QUOTATION_STATUS_LABEL,
  QUOTATION_STATUS_CLASS,
  formatQuotationTitle,
} from '@/mocks/quotations.js';
import pb from '@/lib/pocketbaseClient.js';
import { ROLES } from '@/mocks/users.js';
import NewQuotationForm from '@/components/NewQuotationForm.jsx';

const QuotationsLibraryPage = () => {
  const { currentUser, isAdmin } = useAuth();
  const admin = isAdmin();
  const navigate = useNavigate();

  const [quotations, setQuotations] = useState([]);
  const [categories, setCategories] = useState([]);
  const [clients, setClients] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCat, setSelectedCat] = useState('all');
  const [kindFilter, setKindFilter] = useState('commercial');
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

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [quotes, cats, cli, usersRes] = await Promise.all([
        quotationsService.getAll(),
        quotationsService.getCategories(),
        clientsService.getAll(),
        pb.collection('users').getFullList({ $autoCancel: false }).catch(() => []),
      ]);
      setQuotations(quotes);
      setCategories(cats);
      setClients(cli);
      setVendors((usersRes || []).filter((u) => u.role === ROLES.VENTAS || u.role === ROLES.ADMIN));
    } catch {
      toast.error('Error al cargar cotizaciones');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const categoryChips = kindFilter === 'library'
    ? categories.map((c) => c.nombre)
    : QUOTATION_MAIN_CATEGORIES.map((c) => c.label);

  const filteredQuotes = quotations.filter((quote) => {
    const matchCat = selectedCat === 'all' || quote.categoria === selectedCat;
    const matchKind = kindFilter === 'all' || quote.kind === kindFilter || (kindFilter === 'library' && quote.kind !== 'commercial');
    const matchSearch = `${quote.titulo || ''} ${quote.numero || ''} ${quote.cliente_nombre || ''}`.toLowerCase().includes(search.toLowerCase());
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

  const changeStatus = async (quote, estado) => {
    try {
      await quotationsService.updateStatus(quote.id, estado);
      toast.success(`Estado: ${QUOTATION_STATUS_LABEL[estado]}`);
      fetchAll();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const convertQuote = async (quote) => {
    try {
      const result = await quotationsService.convertToSchedule(quote.id, {
        sucursal_id: quote.sucursal_id || clients.find((row) => row.id === quote.cliente_id)?.sucursal_id,
        vendedor_responsable_id: quote.vendedor_id || currentUser?.id,
      });
      toast.success(result.alreadyConverted ? 'Ya estaba convertida' : `Trabajo ${result.schedule.id} creado`);
      fetchAll();
      navigate('/schedule');
    } catch (err) {
      toast.error(err.message);
    }
  };

  const QuoteActions = ({ quote }) => {
    const next = QUOTATION_FLOW[quote.estado] || [];
    return (
      <div className="flex flex-wrap gap-2">
        {(quote.archivo || quote.imagen_preview) && (
          <Button size="sm" variant="outline" onClick={() => handleDownload(quote)}>
            <Download className="h-3.5 w-3.5 mr-1" /> Adjuntos
          </Button>
        )}
        {quote.kind === 'commercial' && next.map((estado) => (
          <Button key={estado} size="sm" variant="secondary" className="font-semibold" onClick={() => changeStatus(quote, estado)}>
            {QUOTATION_STATUS_LABEL[estado]}
          </Button>
        ))}
        {quote.estado === 'aceptada' && (
          <Button size="sm" variant="action" className="font-semibold" onClick={() => convertQuote(quote)}>
            Crear venta / trabajo <ArrowRight className="h-3.5 w-3.5 ml-1" />
          </Button>
        )}
        {quote.estado === 'convertida' && quote.schedule_id && (
          <Button size="sm" variant="outline" onClick={() => navigate('/schedule')}>Ver cronograma</Button>
        )}
        {admin && (
          <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => handleDelete(quote)}><Trash2 className="h-4 w-4" /></Button>
        )}
        {quote.kind !== 'commercial' && admin && (
          <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => openUpload(quote)}><Pencil className="h-4 w-4" /></Button>
        )}
      </div>
    );
  };

  return (
    <Layout>
      <Helmet>
        <title>Cotizaciones - H&S Tecnologías</title>
        <meta name="description" content="Registro de cotizaciones comerciales enviadas al cliente" />
      </Helmet>

      <div className="content-container space-y-6 py-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-[32px] font-bold tracking-tight text-foreground">Cotizaciones</h1>
            <p className="text-muted-foreground mt-1">
              Registro de cotizaciones ya enviadas al cliente. El detalle vive en los adjuntos.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {admin && kindFilter === 'library' && (
              <Button variant="outline" className="font-semibold gap-2" onClick={() => setShowCatMgr(true)}>
                <Settings className="h-4 w-4" /> Categorías
              </Button>
            )}
            <Button variant="outline" onClick={() => openUpload()} className="gap-2 font-semibold">
              <UploadCloud className="h-4 w-4" /> Subir documento
            </Button>
            <Button variant="action" onClick={() => setCommercialOpen(true)} className="gap-2">
              <Calculator className="h-4 w-4" /> Nueva cotización
            </Button>
          </div>
        </div>

        <Card className="p-4 shadow-sm flex flex-col gap-4 border">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Buscar código, título o cliente..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
            </div>
            <div className="flex gap-2">
              {[['commercial', 'Comerciales'], ['library', 'Biblioteca'], ['all', 'Todas']].map(([id, label]) => (
                <Button key={id} size="sm" variant={kindFilter === id ? 'default' : 'outline'} className="font-semibold" onClick={() => { setKindFilter(id); setSelectedCat('all'); }}>{label}</Button>
              ))}
            </div>
          </div>
          <div className="flex overflow-x-auto gap-2 pb-1">
            <Button size="sm" variant={selectedCat === 'all' ? 'default' : 'outline'} className="whitespace-nowrap font-semibold" onClick={() => setSelectedCat('all')}>Todas</Button>
            {categoryChips.map((name) => (
              <Button key={name} size="sm" variant={selectedCat === name ? 'default' : 'outline'} className="whitespace-nowrap font-semibold" onClick={() => setSelectedCat(name)}>{name}</Button>
            ))}
          </div>
        </Card>

        {/* Mobile cards */}
        <div className="grid grid-cols-1 gap-4 lg:hidden">
          {loading ? Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-48 w-full rounded-2xl" />)
            : filteredQuotes.length > 0 ? filteredQuotes.map((quote) => (
              <Card key={quote.id} className="p-4 border shadow-sm flex flex-col gap-3 rounded-2xl">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-base font-bold tracking-tight truncate">{formatQuotationTitle(quote)}</p>
                    {quote.cliente_nombre && <p className="text-sm font-medium text-muted-foreground truncate">{quote.cliente_nombre}</p>}
                    <p className="text-xs text-muted-foreground mt-1">
                      {[quote.categoria, quote.subcategoria, quote.sucursal_nombre].filter(Boolean).join(' · ')}
                    </p>
                  </div>
                  <Badge className={`text-[10px] font-bold shrink-0 ${QUOTATION_STATUS_CLASS[quote.estado] || QUOTATION_STATUS_CLASS.documento}`}>
                    {QUOTATION_STATUS_LABEL[quote.estado] || quote.estado}
                  </Badge>
                </div>
                {quote.kind === 'commercial' && (
                  <p className="text-lg font-bold tabular-nums">Bs {Number(quote.total || 0).toLocaleString('es-BO')}</p>
                )}
                <QuoteActions quote={quote} />
              </Card>
            )) : (
              <div className="py-16 text-center">
                <BookOpen className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
                <h3 className="text-xl font-bold">No se encontraron resultados</h3>
              </div>
            )}
        </div>

        {/* Desktop table — uses full 12-col width */}
        <div className="hidden lg:block table-container">
          {loading ? <Skeleton className="h-64 w-full" /> : filteredQuotes.length === 0 ? (
            <div className="py-16 text-center">
              <BookOpen className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
              <h3 className="text-xl font-bold">No se encontraron resultados</h3>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="table-header h-14">
                  <th className="table-cell">Código / título</th>
                  <th className="table-cell">Cliente</th>
                  <th className="table-cell">Categoría</th>
                  <th className="table-cell">Sucursal</th>
                  <th className="table-cell text-right">Monto</th>
                  <th className="table-cell">Estado</th>
                  <th className="table-cell">Vendedor</th>
                  <th className="table-cell">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredQuotes.map((quote) => (
                  <tr key={quote.id} className="table-row h-14">
                    <td className="table-cell font-semibold max-w-[280px]">
                      <div className="truncate">{formatQuotationTitle(quote)}</div>
                      <div className="text-[11px] text-muted-foreground font-normal">
                        {quote.created ? format(new Date(String(quote.created).replace(' ', 'T')), 'dd MMM yyyy', { locale: es }) : ''}
                      </div>
                    </td>
                    <td className="table-cell font-medium">{quote.cliente_nombre || '—'}</td>
                    <td className="table-cell text-muted-foreground">
                      {[quote.categoria, quote.subcategoria].filter(Boolean).join(' · ') || '—'}
                    </td>
                    <td className="table-cell">{quote.sucursal_nombre || '—'}</td>
                    <td className="table-cell text-right tabular-nums font-semibold">
                      {quote.kind === 'commercial' ? `Bs ${Number(quote.total || 0).toLocaleString('es-BO')}` : '—'}
                    </td>
                    <td className="table-cell">
                      <Badge className={`text-[10px] font-bold ${QUOTATION_STATUS_CLASS[quote.estado] || QUOTATION_STATUS_CLASS.documento}`}>
                        {QUOTATION_STATUS_LABEL[quote.estado] || quote.estado}
                      </Badge>
                    </td>
                    <td className="table-cell text-xs text-muted-foreground">
                      {quote.vendedores?.length
                        ? quote.vendedores.map((v) => `${v.nombre} (${v.comision_pct}%)`).join(', ')
                        : quote.vendedor_nombre || '—'}
                    </td>
                    <td className="table-cell"><QuoteActions quote={quote} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <NewQuotationForm
        open={commercialOpen}
        onOpenChange={setCommercialOpen}
        quotations={quotations}
        clients={clients}
        vendors={vendors}
        currentUser={currentUser}
        onSaved={fetchAll}
        onClientCreated={(created) => {
          if (created) setClients((prev) => [created, ...prev.filter((c) => c.id !== created.id)]);
        }}
      />

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
              <Button onClick={createCat} className="font-semibold shrink-0"><Plus className="h-4 w-4 mr-1" /> Crear</Button>
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
