import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Layout from '@/components/Layout.jsx';
import { Helmet } from 'react-helmet';
import { BookOpen, Download, Search, Calculator, ArrowRight, Settings, UserRound, Upload, AlertTriangle, MoreHorizontal, Trash2 } from 'lucide-react';
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
  QUOTATION_STATUSES,
  QUOTATION_STATUS_LABEL,
  QUOTATION_STATUS_CLASS,
  formatQuotationTitle,
} from '@/mocks/quotations.js';
import { ROLES } from '@/mocks/users.js';
import { canWriteQuotations, canEditQuotationsView } from '@/config/nav.js';
import { isMockMode } from '@/api/http.js';
import NewQuotationForm from '@/components/NewQuotationForm.jsx';
import QuoteEncargadoDialog from '@/components/QuoteEncargadoDialog.jsx';
import QuotationTasksBand from '@/components/QuotationTasksBand.jsx';
import QuotationJobsBlock from '@/components/QuotationJobsBlock.jsx';
import RowActions from '@/components/RowActions.jsx';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu.jsx';
import schedulesService from '@/services/schedules/index.js';
import { deadlineChipClass, deadlineLabel, deadlineTone } from '@/lib/deadline.js';

const QuotationsLibraryPage = () => {
  const { currentUser, userRole } = useAuth();
  const navigate = useNavigate();

  const [quotations, setQuotations] = useState([]);
  const [clients, setClients] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [categories, setCategories] = useState(QUOTATION_MAIN_CATEGORIES);
  const [loading, setLoading] = useState(true);
  const [selectedCat, setSelectedCat] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [search, setSearch] = useState('');
  const [commercialOpen, setCommercialOpen] = useState(false);
  const [editQuote, setEditQuote] = useState(null);
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [encargadoQuote, setEncargadoQuote] = useState(null);
  const [newCategoryLabel, setNewCategoryLabel] = useState('');
  const [savingCategory, setSavingCategory] = useState(false);
  const [jobsByQuote, setJobsByQuote] = useState({});

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [quotes, cli, usersRes, cats, allJobs] = await Promise.all([
        quotationsService.getAll(),
        clientsService.getAll(),
        authService.listUsers().catch(() => []),
        categoriesService.getAll().catch(() => QUOTATION_MAIN_CATEGORIES),
        schedulesService.getAll().catch(() => []),
      ]);
      setQuotations(quotes);
      setClients(cli);
      setVendors((usersRes || []).filter((u) => u.role === ROLES.VENTAS || u.role === ROLES.ADMIN));
      setCategories((cats || []).length ? cats : QUOTATION_MAIN_CATEGORIES);
      const grouped = {};
      (allJobs || []).forEach((job) => {
        const qid = job.quotation_id || job.quotationId;
        if (!qid) return;
        if (!grouped[qid]) grouped[qid] = [];
        grouped[qid].push(job);
      });
      setJobsByQuote(grouped);
    } catch {
      toast.error('Error al cargar cotizaciones');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const pseudoCats = useMemo(
    () => categories.filter(
      (c) => !c.builtin && !QUOTATION_MAIN_CATEGORIES.some((m) => m.id === c.id),
    ),
    [categories],
  );

  const filteredQuotes = quotations.filter((quote) => {
    let matchCat = selectedCat === 'all';
    if (!matchCat) {
      const mainCat = QUOTATION_MAIN_CATEGORIES.find(
        (m) => m.id === selectedCat || m.label === selectedCat,
      );
      const pseudo = pseudoCats.find(
        (p) => p.id === selectedCat || p.label === selectedCat,
      );
      if (mainCat) {
        matchCat = quote.categoria_id === mainCat.id || quote.categoria === mainCat.label;
      } else if (pseudo) {
        matchCat = quote.subcategoria === pseudo.label;
      } else {
        matchCat = quote.categoria_id === selectedCat
          || quote.categoria === selectedCat
          || quote.subcategoria === selectedCat;
      }
    }
    const matchSearch = `${quote.titulo || ''} ${quote.numero || ''} ${quote.cliente_nombre || ''}`.toLowerCase().includes(search.toLowerCase());
    const matchStatus = selectedStatus === 'all' || quote.estado === selectedStatus;
    return matchCat && matchSearch && matchStatus;
  });

  const createCategory = async (e) => {
    e.preventDefault();
    setSavingCategory(true);
    try {
      const created = await categoriesService.create(newCategoryLabel);
      setCategories(await categoriesService.getAll());
      setSelectedCat(created.id);
      setNewCategoryLabel('');
      toast.success(isMockMode
        ? `Filtro «${created.label}» añadido (solo en este navegador)`
        : `Filtro «${created.label}» guardado`);
    } catch (err) {
      toast.error(err.message || 'No se pudo crear la categoría');
    } finally {
      setSavingCategory(false);
    }
  };

  const removeCategory = async (row, e) => {
    e.stopPropagation();
    if (row.builtin) {
      toast.error('Las categorías base no se pueden eliminar');
      return;
    }
    try {
      await categoriesService.remove(row.id);
      setCategories(await categoriesService.getAll());
      if (selectedCat === row.id || selectedCat === row.label) setSelectedCat('all');
      toast.success(`Filtro «${row.label}» eliminado`);
    } catch (err) {
      toast.error(err.message || 'No se pudo eliminar');
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

  const attachDraftPdf = async (quote, file) => {
    if (!file) return;
    try {
      await quotationsService.attachFile(quote.id, file);
      toast.success('PDF adjuntado al borrador');
      fetchAll();
    } catch (err) {
      toast.error(err.message || 'No se pudo adjuntar el PDF');
    }
  };

  const openEditQuote = (quote) => {
    setEditQuote(quote);
    setCommercialOpen(true);
  };

  const QuoteActions = ({ quote, compact = false }) => {
    const next = QUOTATION_FLOW[quote.estado] || [];
    const canWrite = canWriteQuotations(userRole);
    const canEdit = canEditQuotationsView(userRole);
    const hasPdf = Boolean(quote.archivo || quote.archivo_pdf_url);
    const quoteJobs = jobsByQuote[quote.id] || [];
    const showJobs = quoteJobs.length > 0 || quote.estado === 'aceptado';

    if (compact) {
      return (
        <div className="flex flex-col gap-1.5 items-end">
          <div className="flex items-center gap-1 shrink-0">
            {canEdit && (
              <RowActions
                onEdit={() => openEditQuote(quote)}
                canEdit
                editLabel="Editar"
                editTitle="Editar cotización"
                className="gap-1 [&_button]:min-h-8 [&_button]:h-8 [&_button]:px-2 [&_button]:text-xs"
              />
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button type="button" variant="outline" size="sm" className="h-8 px-2 text-xs font-semibold">
                  <MoreHorizontal className="h-3.5 w-3.5 mr-1" /> Más
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                {hasPdf && (
                  <DropdownMenuItem onClick={() => handleDownload(quote)}>
                    <Download className="h-3.5 w-3.5" /> Ver PDF
                  </DropdownMenuItem>
                )}
                {canWrite && quote.estado === 'borrador' && !hasPdf && (
                  <DropdownMenuItem asChild>
                    <label className="cursor-pointer">
                      <Upload className="h-3.5 w-3.5" /> Adjuntar PDF
                      <input
                        type="file"
                        accept=".pdf,application/pdf"
                        className="sr-only"
                        onChange={(e) => attachDraftPdf(quote, e.target.files?.[0])}
                      />
                    </label>
                  </DropdownMenuItem>
                )}
                {canEdit && (
                  <DropdownMenuItem onClick={() => setEncargadoQuote(quote)}>
                    <UserRound className="h-3.5 w-3.5" /> Encargado
                  </DropdownMenuItem>
                )}
                {next.length > 0 && <DropdownMenuSeparator />}
                {next.map((estado) => (
                  <DropdownMenuItem key={estado} onClick={() => changeStatus(quote, estado)}>
                    {QUOTATION_STATUS_LABEL[estado]}
                  </DropdownMenuItem>
                ))}
                {quote.estado === 'aceptado' && (
                  <DropdownMenuItem onClick={() => convertQuote(quote)}>
                    <ArrowRight className="h-3.5 w-3.5" /> Crear venta / trabajo
                  </DropdownMenuItem>
                )}
                {quote.schedule_id && (
                  <DropdownMenuItem onClick={() => navigate('/schedule')}>
                    Ver cronograma
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          {showJobs && (
            <QuotationJobsBlock quotationId={quote.id} jobs={quoteJobs} onRefresh={fetchAll} />
          )}
        </div>
      );
    }

    return (
      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap gap-2">
          {hasPdf && (
            <Button size="sm" variant="outline" onClick={() => handleDownload(quote)}>
              <Download className="h-3.5 w-3.5 mr-1" /> PDF
            </Button>
          )}
          {canEdit && (
            <RowActions
              onEdit={() => openEditQuote(quote)}
              canEdit
              editLabel="Editar"
              editTitle="Editar cotización"
            />
          )}
          {canWrite && quote.estado === 'borrador' && !hasPdf && (
            <label className="inline-flex">
              <input
                type="file"
                accept=".pdf,application/pdf"
                className="sr-only"
                onChange={(e) => attachDraftPdf(quote, e.target.files?.[0])}
              />
              <span className="inline-flex items-center justify-center h-8 px-3 rounded-md border border-input bg-background text-xs font-semibold cursor-pointer hover:bg-muted">
                <Upload className="h-3.5 w-3.5 mr-1" /> Adjuntar PDF
              </span>
            </label>
          )}
          {canEdit && (
            <Button size="sm" variant="outline" onClick={() => setEncargadoQuote(quote)}>
              <UserRound className="h-3.5 w-3.5 mr-1" /> Encargado
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
        {showJobs && (
          <QuotationJobsBlock quotationId={quote.id} jobs={quoteJobs} onRefresh={fetchAll} />
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
            <Button variant="action" onClick={() => { setEditQuote(null); setCommercialOpen(true); }} className="gap-2 min-h-11">
              <Calculator className="h-4 w-4" /> Nueva cotización
            </Button>
          )}
        </div>

        {canEditQuotationsView(userRole) && (
          <QuotationTasksBand
            quotations={quotations}
            categories={QUOTATION_MAIN_CATEGORIES}
            clients={clients}
            vendors={vendors}
            currentUser={currentUser}
            onRefresh={fetchAll}
            onOpenQuote={openEditQuote}
          />
        )}

        <Card className="p-4 shadow-sm flex flex-col gap-4 border">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Buscar código, título o cliente..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
          </div>
          <div className="flex overflow-x-auto gap-2 pb-1 items-center">
            <Button size="sm" variant={selectedCat === 'all' ? 'secondary' : 'outline'} className="whitespace-nowrap font-semibold" onClick={() => setSelectedCat('all')}>Todas</Button>
            {QUOTATION_MAIN_CATEGORIES.map((row) => (
              <Button
                key={row.id}
                size="sm"
                variant={selectedCat === row.id || selectedCat === row.label ? 'secondary' : 'outline'}
                className="whitespace-nowrap font-semibold"
                onClick={() => setSelectedCat(row.id)}
              >
                {row.label}
              </Button>
            ))}
            {pseudoCats.map((row) => (
              <Button
                key={row.id}
                size="sm"
                variant={selectedCat === row.id || selectedCat === row.label ? 'secondary' : 'outline'}
                className="whitespace-nowrap font-semibold"
                onClick={() => setSelectedCat(row.id)}
              >
                {row.label}
              </Button>
            ))}
            {canEditQuotationsView(userRole) && (
              <Button
                size="sm"
                variant="outline"
                className="whitespace-nowrap font-semibold shrink-0 h-8 w-8 p-0"
                onClick={() => setCategoryOpen(true)}
                aria-label="Gestionar subcategorías"
                title="Accesos rápidos / subcategorías"
              >
                <Settings className="h-4 w-4" />
              </Button>
            )}
          </div>
          <div className="flex overflow-x-auto gap-2 pb-1 items-center">
            <Button
              size="sm"
              variant={selectedStatus === 'all' ? 'default' : 'outline'}
              className={`whitespace-nowrap font-semibold${selectedStatus === 'all' ? ' bg-primary' : ''}`}
              onClick={() => setSelectedStatus('all')}
            >
              Todos los estados
            </Button>
            {QUOTATION_STATUSES.map((estado) => (
              <Button
                key={estado}
                size="sm"
                variant={selectedStatus === estado ? 'default' : 'outline'}
                className={`whitespace-nowrap font-semibold${selectedStatus === estado ? ' bg-primary' : ''}`}
                onClick={() => setSelectedStatus(estado)}
              >
                {QUOTATION_STATUS_LABEL[estado]}
              </Button>
            ))}
          </div>
        </Card>

        <div className="grid grid-cols-1 gap-4 lg:hidden">
          {loading ? Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-48 w-full rounded-2xl" />)
            : filteredQuotes.length > 0 ? filteredQuotes.map((quote) => (
              <Card key={quote.id} className={`p-4 border shadow-sm flex flex-col gap-3 rounded-2xl ${quote.estado === 'borrador' ? 'border-dashed border-slate-400 bg-slate-50/80' : ''}`}>
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-base font-bold tracking-tight truncate">{formatQuotationTitle(quote)}</p>
                    {quote.cliente_nombre && <p className="text-sm font-medium text-muted-foreground truncate">{quote.cliente_nombre}</p>}
                    <p className="text-xs text-muted-foreground mt-1">
                      {[quote.categoria, quote.subcategoria, quote.sucursal_nombre].filter(Boolean).join(' · ')}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Encargado: {quote.vendedores?.length
                        ? quote.vendedores.map((v) => v.nombre).join(', ')
                        : quote.vendedor_nombre || '—'}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <Badge className={`text-[10px] font-bold ${QUOTATION_STATUS_CLASS[quote.estado] || ''}`}>
                      {QUOTATION_STATUS_LABEL[quote.estado] || quote.estado}
                    </Badge>
                    {quote.tiene_licitacion ? <Badge variant="outline" className="text-[10px]">Con licitación</Badge> : null}
                    {deadlineTone(quote.plazo_final) !== 'none' && deadlineTone(quote.plazo_final) !== 'ok' ? (
                      <Badge className={`text-[10px] font-bold gap-1 ${deadlineChipClass(deadlineTone(quote.plazo_final))}`}>
                        <AlertTriangle className="h-3 w-3" />
                        {deadlineLabel(deadlineTone(quote.plazo_final))}
                      </Badge>
                    ) : null}
                  </div>
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

        <div className="hidden lg:block">
          {loading ? <Skeleton className="h-64 w-full rounded-2xl" /> : filteredQuotes.length === 0 ? (
            <div className="py-16 text-center">
              <BookOpen className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
              <h3 className="text-xl font-bold">No se encontraron resultados</h3>
            </div>
          ) : (
            <div className="data-table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Código / título</th>
                    <th>Cliente</th>
                    <th>Categoría</th>
                    <th>Sucursal</th>
                    <th className="text-right">Monto</th>
                    <th>Estado</th>
                    <th>Encargado</th>
                    <th className="col-sticky text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredQuotes.map((quote) => {
                    const titleText = quote.titulo || 'Sin título';
                    const metaParts = [
                      quote.numero,
                      quote.created ? format(new Date(String(quote.created).replace(' ', 'T')), 'dd MMM yyyy', { locale: es }) : '',
                      quote.tiene_licitacion ? 'Con licitación' : '',
                    ].filter(Boolean);
                    return (
                      <tr key={quote.id} className={quote.estado === 'borrador' ? 'bg-slate-50/80' : ''}>
                        <td className="max-w-[14rem]">
                          <span className="cell-title" title={titleText}>{titleText}</span>
                          {metaParts.length > 0 && (
                            <span className="cell-meta">{metaParts.join(' · ')}</span>
                          )}
                        </td>
                        <td className="font-medium max-w-[10rem] truncate" title={quote.cliente_nombre || ''}>
                          {quote.cliente_nombre || '—'}
                        </td>
                        <td className="text-muted-foreground max-w-[9rem]">
                          <span className="truncate block" title={quote.subcategoria || quote.categoria || ''}>
                            {quote.categoria || '—'}
                          </span>
                        </td>
                        <td className="max-w-[8rem] truncate">{quote.sucursal_nombre || '—'}</td>
                        <td className="text-right tabular-nums font-semibold whitespace-nowrap">
                          Bs {Number(quote.total || 0).toLocaleString('es-BO')}
                        </td>
                        <td>
                          <div className="flex flex-col items-start gap-1">
                            <Badge className={`text-[10px] font-bold ${QUOTATION_STATUS_CLASS[quote.estado] || ''}`}>
                              {QUOTATION_STATUS_LABEL[quote.estado] || quote.estado}
                            </Badge>
                            {deadlineTone(quote.plazo_final) !== 'none' && deadlineTone(quote.plazo_final) !== 'ok' ? (
                              <Badge className={`text-[10px] font-bold gap-1 ${deadlineChipClass(deadlineTone(quote.plazo_final))}`}>
                                <AlertTriangle className="h-3 w-3" />
                                {deadlineLabel(deadlineTone(quote.plazo_final))}
                              </Badge>
                            ) : null}
                          </div>
                        </td>
                        <td className="text-muted-foreground max-w-[9rem] truncate" title={
                          quote.vendedores?.length
                            ? quote.vendedores.map((v) => `${v.nombre} (${v.comision_pct}%)`).join(', ')
                            : quote.vendedor_nombre || ''
                        }>
                          {quote.vendedores?.length
                            ? quote.vendedores.map((v) => v.nombre).join(', ')
                            : quote.vendedor_nombre || '—'}
                        </td>
                        <td className="col-sticky text-right">
                          <QuoteActions quote={quote} compact />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <NewQuotationForm
        open={commercialOpen}
        onOpenChange={(open) => {
          setCommercialOpen(open);
          if (!open) setEditQuote(null);
        }}
        editQuote={editQuote}
        quotations={quotations}
        clients={clients}
        vendors={vendors}
        categories={QUOTATION_MAIN_CATEGORIES}
        pseudoCategories={pseudoCats}
        currentUser={currentUser}
        onSaved={fetchAll}
        onClientCreated={(created) => {
          if (created) setClients((prev) => [created, ...prev.filter((c) => c.id !== created.id)]);
        }}
      />

      <QuoteEncargadoDialog
        open={Boolean(encargadoQuote)}
        onOpenChange={(next) => { if (!next) setEncargadoQuote(null); }}
        quote={encargadoQuote}
        vendors={vendors}
        onSaved={fetchAll}
      />

      <Dialog open={categoryOpen} onOpenChange={setCategoryOpen}>
        <DialogContent className="sm:max-w-md max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Accesos rápidos / subcategorías</DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto space-y-4 min-h-0">
            <p className="text-xs text-muted-foreground">
              Las 3 categorías principales ({QUOTATION_MAIN_CATEGORIES.map((m) => m.label).join(', ')}) son fijas.
              Aquí puedes crear accesos rápidos que filtran por subcategoría y aparecen en el formulario de cotización.
              {isMockMode ? ' En modo local solo se guardan en este navegador.' : ''}
            </p>
            {pseudoCats.length > 0 ? (
              <ul className="divide-y divide-border rounded-lg border">
                {pseudoCats.map((row) => (
                  <li key={row.id} className="flex items-center justify-between gap-2 px-3 py-2">
                    <span className="text-sm font-medium truncate">{row.label}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive shrink-0"
                      aria-label={`Eliminar ${row.label}`}
                      onClick={(e) => removeCategory(row, e)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4 border rounded-lg border-dashed">
                Sin accesos rápidos todavía.
              </p>
            )}
            <form onSubmit={createCategory} className="space-y-3 pt-2 border-t">
              <div className="space-y-2">
                <Label htmlFor="new-cat">Nueva subcategoría / acceso rápido</Label>
                <Input
                  id="new-cat"
                  value={newCategoryLabel}
                  onChange={(e) => setNewCategoryLabel(e.target.value)}
                  placeholder="Ej. Mantenimiento"
                  required
                  minLength={2}
                />
              </div>
              <DialogFooter className="gap-2 sm:justify-end px-0">
                <Button type="button" variant="outline" onClick={() => setCategoryOpen(false)}>Cerrar</Button>
                <Button type="submit" variant="action" disabled={savingCategory}>
                  {savingCategory ? 'Añadiendo…' : 'Añadir'}
                </Button>
              </DialogFooter>
            </form>
          </div>
        </DialogContent>
      </Dialog>
    </Layout>
  );
};

export default QuotationsLibraryPage;
