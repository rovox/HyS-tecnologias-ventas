import React, { useState, useEffect, useCallback } from 'react';
import Layout from '@/components/Layout.jsx';
import { Helmet } from 'react-helmet';
import { BookOpen, Download, Search, Calculator, ArrowRight, Plus } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext.jsx';
import { useNavigate } from 'react-router-dom';
import quotationsService from '@/services/quotations/index.js';
import clientsService from '@/services/clients/index.js';
import categoriesService from '@/services/categories/index.js';
import authService from '@/services/auth/index.js';
import {
  QUOTATION_FLOW,
  QUOTATION_MAIN_CATEGORIES,
  QUOTATION_STATUS_LABEL,
  QUOTATION_STATUS_CLASS,
  formatQuotationTitle,
} from '@/mocks/quotations.js';
import { ROLES } from '@/mocks/users.js';
import { canWriteQuotations } from '@/config/nav.js';
import NewQuotationForm from '@/components/NewQuotationForm.jsx';

const QuotationsLibraryPage = () => {
  const { currentUser, userRole } = useAuth();
  const navigate = useNavigate();

  const [quotations, setQuotations] = useState([]);
  const [clients, setClients] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [categories, setCategories] = useState(QUOTATION_MAIN_CATEGORIES);
  const [loading, setLoading] = useState(true);
  const [selectedCat, setSelectedCat] = useState('all');
  const [search, setSearch] = useState('');
  const [commercialOpen, setCommercialOpen] = useState(false);
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [newCategoryLabel, setNewCategoryLabel] = useState('');
  const [savingCategory, setSavingCategory] = useState(false);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [quotes, cli, usersRes, cats] = await Promise.all([
        quotationsService.getAll(),
        clientsService.getAll(),
        authService.listUsers().catch(() => []),
        categoriesService.getAll().catch(() => QUOTATION_MAIN_CATEGORIES),
      ]);
      setQuotations(quotes);
      setClients(cli);
      setVendors((usersRes || []).filter((u) => u.role === ROLES.VENTAS || u.role === ROLES.ADMIN));
      setCategories((cats || []).length ? cats : QUOTATION_MAIN_CATEGORIES);
    } catch {
      toast.error('Error al cargar cotizaciones');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const filteredQuotes = quotations.filter((quote) => {
    const matchCat = selectedCat === 'all'
      || quote.categoria === selectedCat
      || quote.categoria_id === selectedCat;
    const matchSearch = `${quote.titulo || ''} ${quote.numero || ''} ${quote.cliente_nombre || ''}`.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  const createCategory = async (e) => {
    e.preventDefault();
    setSavingCategory(true);
    try {
      const created = await categoriesService.create(newCategoryLabel);
      setCategories((prev) => {
        const next = [...prev.filter((row) => row.id !== created.id), created];
        return next.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0) || String(a.label).localeCompare(String(b.label)));
      });
      setSelectedCat(created.label);
      setNewCategoryLabel('');
      setCategoryOpen(false);
      toast.success(`Categoría «${created.label}» creada`);
    } catch (err) {
      toast.error(err.message || 'No se pudo crear la categoría');
    } finally {
      setSavingCategory(false);
    }
  };
  const handleDownload = async (quote) => {
    try {
      await quotationsService.openAttachment(quote);
    } catch (err) {
      toast.error(err.message || 'No hay archivo adjunto');
    }
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
      toast.success(result.alreadyConverted ? 'La venta ya existía' : `Trabajo ${result.schedule.id} creado`);
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
        {(quote.archivo || quote.archivo_pdf_url) && (
          <Button size="sm" variant="outline" onClick={() => handleDownload(quote)}>
            <Download className="h-3.5 w-3.5 mr-1" /> PDF
          </Button>
        )}
        {next.map((estado) => (
          <Button key={estado} size="sm" variant="secondary" className="font-semibold" onClick={() => changeStatus(quote, estado)}>
            {QUOTATION_STATUS_LABEL[estado]}
          </Button>
        ))}
        {quote.estado === 'aceptado' && (
          <Button size="sm" variant="action" className="font-semibold" onClick={() => convertQuote(quote)}>
            Crear venta / trabajo <ArrowRight className="h-3.5 w-3.5 ml-1" />
          </Button>
        )}
        {quote.schedule_id && (
          <Button size="sm" variant="outline" onClick={() => navigate('/schedule')}>Ver cronograma</Button>
        )}
      </div>
    );
  };

  return (
    <Layout>
      <Helmet>
        <title>Cotizaciones - H&S Tecnologías</title>
        <meta name="description" content="Registro de cotizaciones comerciales" />
      </Helmet>

      <div className="content-container space-y-6 py-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-[32px] font-bold tracking-tight text-foreground">Cotizaciones</h1>
            <p className="text-muted-foreground mt-1">
              Registro comercial: borrador, enviado, aceptado o rechazado. Los registros no se eliminan.
            </p>
          </div>
          {canWriteQuotations(userRole) && (
            <Button variant="action" onClick={() => setCommercialOpen(true)} className="gap-2 min-h-11">
              <Calculator className="h-4 w-4" /> Nueva cotización
            </Button>
          )}
        </div>

        <Card className="p-4 shadow-sm flex flex-col gap-4 border">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Buscar código, título o cliente..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
          </div>
          <div className="flex overflow-x-auto gap-2 pb-1 items-center">
            <Button size="sm" variant={selectedCat === 'all' ? 'default' : 'outline'} className="whitespace-nowrap font-semibold" onClick={() => setSelectedCat('all')}>Todas</Button>
            {categories.map((row) => (
              <Button
                key={row.id}
                size="sm"
                variant={selectedCat === row.label || selectedCat === row.id ? 'default' : 'outline'}
                className="whitespace-nowrap font-semibold"
                onClick={() => setSelectedCat(row.label)}
              >
                {row.label}
              </Button>
            ))}
            {canWriteQuotations(userRole) && (
              <Button
                size="sm"
                variant="outline"
                className="whitespace-nowrap font-semibold shrink-0 gap-1"
                onClick={() => setCategoryOpen(true)}
                aria-label="Nueva categoría"
              >
                <Plus className="h-3.5 w-3.5" />
                Categoría
              </Button>
            )}
          </div>
        </Card>

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
                  <Badge className={`text-[10px] font-bold shrink-0 ${QUOTATION_STATUS_CLASS[quote.estado] || ''}`}>
                    {QUOTATION_STATUS_LABEL[quote.estado] || quote.estado}
                  </Badge>
                </div>
                <p className="text-lg font-bold tabular-nums">Bs {Number(quote.total || 0).toLocaleString('es-BO')}</p>
                <QuoteActions quote={quote} />
              </Card>
            )) : (
              <div className="py-16 text-center">
                <BookOpen className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
                <h3 className="text-xl font-bold">No se encontraron resultados</h3>
              </div>
            )}
        </div>

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
                      Bs {Number(quote.total || 0).toLocaleString('es-BO')}
                    </td>
                    <td className="table-cell">
                      <Badge className={`text-[10px] font-bold ${QUOTATION_STATUS_CLASS[quote.estado] || ''}`}>
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
        categories={categories}
        currentUser={currentUser}
        onSaved={fetchAll}
        onClientCreated={(created) => {
          if (created) setClients((prev) => [created, ...prev.filter((c) => c.id !== created.id)]);
        }}
      />

      <Dialog open={categoryOpen} onOpenChange={setCategoryOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Nueva categoría</DialogTitle>
          </DialogHeader>
          <form onSubmit={createCategory} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="new-cat">Nombre</Label>
              <Input
                id="new-cat"
                value={newCategoryLabel}
                onChange={(e) => setNewCategoryLabel(e.target.value)}
                placeholder="Ej. Mantenimiento"
                autoFocus
                required
                minLength={2}
              />
            </div>
            <DialogFooter className="gap-2">
              <Button type="button" variant="outline" onClick={() => setCategoryOpen(false)}>Cancelar</Button>
              <Button type="submit" variant="action" disabled={savingCategory}>
                {savingCategory ? 'Guardando…' : 'Crear'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </Layout>
  );
};

export default QuotationsLibraryPage;
