import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Helmet } from 'react-helmet';
import pb from '@/lib/pocketbaseClient.js';
import Layout from '@/components/Layout.jsx';
import { Input } from '@/components/ui/input.jsx';
import { Textarea } from '@/components/ui/textarea.jsx';
import { Button } from '@/components/ui/button.jsx';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select.jsx';
import { Badge } from '@/components/ui/badge.jsx';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog.jsx';
import { Activity, Image as ImageIcon, Send, Loader2, X, Pin, Star, CheckCircle, MessageSquare, ChevronDown, ChevronUp, Trash2, Filter } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext.jsx';
import PhotoGallery from '@/components/PhotoGallery.jsx';
const TIPOS = ['General', 'Trabajo', 'Urgente', 'Material', 'Cobro/Rendición', 'Foto de avance', 'Aviso interno'];
const TIPO_COLORS = {
  'General': 'bg-gray-100 text-gray-700 border-gray-200',
  'Trabajo': 'bg-blue-100 text-blue-700 border-blue-200',
  'Urgente': 'bg-red-100 text-red-700 border-red-200',
  'Material': 'bg-orange-100 text-orange-700 border-orange-200',
  'Cobro/Rendición': 'bg-green-100 text-green-700 border-green-200',
  'Foto de avance': 'bg-purple-100 text-purple-700 border-purple-200',
  'Aviso interno': 'bg-yellow-100 text-yellow-700 border-yellow-200'
};
const REACTIONS = ['👍', '❤️', '🔥', '✅'];
const PostCard = ({
  post,
  currentUser,
  isAdmin,
  onDelete,
  onToggleImportante,
  onToggleResuelto,
  onToggleFijado,
  onReaction,
  onRefresh
}) => {
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [savingComment, setSavingComment] = useState(false);
  const reacciones = useMemo(() => {
    try {
      return typeof post.reacciones === 'object' && post.reacciones ? post.reacciones : post.reacciones ? JSON.parse(post.reacciones) : {};
    } catch {
      return {};
    }
  }, [post.reacciones]);
  const loadComments = useCallback(async () => {
    setLoadingComments(true);
    try {
      const recs = await pb.collection('comentarios_actividad').getFullList({
        filter: `actividad_id="${post.id}"`,
        sort: 'created',
        requestKey: `comments-${post.id}`
      });
      setComments(recs);
    } catch {
      setComments([]);
    } finally {
      setLoadingComments(false);
    }
  }, [post.id]);
  const toggleComments = () => {
    if (!showComments) loadComments();
    setShowComments(v => !v);
  };
  const submitComment = async e => {
    e.preventDefault();
    if (!newComment.trim()) return;
    setSavingComment(true);
    try {
      await pb.collection('comentarios_actividad').create({
        actividad_id: post.id,
        contenido: newComment.trim(),
        usuario_nombre: currentUser?.name || 'Usuario',
        created_by: currentUser?.id || ''
      }, {
        requestKey: `comment-create-${post.id}`
      });
      setNewComment('');
      loadComments();
    } catch {
      toast.error('Error al comentar');
    } finally {
      setSavingComment(false);
    }
  };
  const deleteComment = async cid => {
    try {
      await pb.collection('comentarios_actividad').delete(cid, {
        requestKey: `comment-del-${cid}`
      });
      loadComments();
    } catch {
      toast.error('Error al eliminar comentario');
    }
  };
  const isOwner = post.created_by === currentUser?.id || post.usuario_id === currentUser?.id;
  return <div className={`bg-card border rounded-2xl shadow-sm overflow-hidden ${post.fijado ? 'border-primary/40 ring-1 ring-primary/20' : ''} ${post.es_importante ? 'border-orange-300 dark:border-orange-700' : ''}`}>
      {/* Pinned/Important banners */}
      {post.fijado && <div className="bg-primary/10 text-primary text-xs font-bold px-4 py-1.5 flex items-center gap-1.5">
          <Pin className="h-3 w-3" /> Publicación fijada
        </div>}

      {/* Header */}
      <div className="p-4 border-b bg-muted/10 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-primary/20 text-primary flex items-center justify-center font-black text-base shrink-0">
            {(post.created_by_nombre || post.created_by || 'U').charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="font-bold text-foreground">{post.created_by_nombre || post.created_by || 'Usuario'}</p>
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-xs text-muted-foreground">{format(new Date(post.created), "dd MMM yyyy, HH:mm", {
                locale: es
              })}</p>
              {post.tipo && <Badge className={`text-[10px] border ${TIPO_COLORS[post.tipo] || 'bg-gray-100 text-gray-700 border-gray-200'}`}>{post.tipo}</Badge>}
              {post.sucursal_nombre && <span className="text-[10px] text-muted-foreground">• {post.sucursal_nombre}</span>}
              {post.cliente_nombre && <span className="text-[10px] text-muted-foreground">• {post.cliente_nombre}</span>}
              {post.trabajo_nombre && <span className="text-[10px] text-muted-foreground">• {post.trabajo_nombre}</span>}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {post.es_importante && <Star className="h-4 w-4 text-orange-500 fill-orange-500" />}
          {post.es_resuelto && <CheckCircle className="h-4 w-4 text-green-500" />}
          {(isAdmin || isOwner) && <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => onDelete(post)}>
              <Trash2 className="h-3.5 w-3.5" />
            </Button>}
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <p className="text-sm text-foreground/90 whitespace-pre-wrap mb-3">{post.contenido}</p>
        {post.fotografias?.length > 0 && <PhotoGallery record={post} photos={post.fotografias} />}
      </div>

      {/* Reactions + Actions */}
      <div className="px-4 pb-3 flex items-center justify-between gap-2 flex-wrap">
        {/* Reaction buttons */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {REACTIONS.map(emoji => {
          const count = reacciones[emoji]?.length || 0;
          const hasReacted = reacciones[emoji]?.includes(currentUser?.id);
          return <button key={emoji} onClick={() => onReaction(post, emoji)} className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full border transition-all ${hasReacted ? 'bg-primary/10 border-primary/30 text-primary font-bold' : 'border-border hover:border-primary/30 hover:bg-muted/50'}`}>
                {emoji} {count > 0 && <span className="font-bold">{count}</span>}
              </button>;
        })}
        </div>

        {/* Quick actions */}
        <div className="flex items-center gap-1.5">
          {isAdmin && <>
              <button onClick={() => onToggleFijado(post)} className={`p-1.5 rounded-lg text-xs transition-colors ${post.fijado ? 'text-primary bg-primary/10' : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'}`} title={post.fijado ? 'Desfijar' : 'Fijar publicación'}>
                <Pin className="h-3.5 w-3.5" />
              </button>
              <button onClick={() => onToggleImportante(post)} className={`p-1.5 rounded-lg text-xs transition-colors ${post.es_importante ? 'text-orange-500 bg-orange-50' : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'}`} title="Marcar como importante">
                <Star className="h-3.5 w-3.5" />
              </button>
            </>}
          <button onClick={() => onToggleResuelto(post)} className={`p-1.5 rounded-lg text-xs transition-colors ${post.es_resuelto ? 'text-green-500 bg-green-50' : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'}`} title="Marcar como resuelto">
            <CheckCircle className="h-3.5 w-3.5" />
          </button>
          <button onClick={toggleComments} className="flex items-center gap-1 p-1.5 rounded-lg text-xs text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors">
            <MessageSquare className="h-3.5 w-3.5" />
            {showComments ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          </button>
        </div>
      </div>

      {/* Comments section */}
      {showComments && <div className="border-t bg-muted/10 px-4 py-3 space-y-3">
          {loadingComments ? <p className="text-xs text-muted-foreground">Cargando comentarios...</p> : <>
              {comments.map(c => <div key={c.id} className="flex items-start gap-2">
                  <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center text-xs font-bold shrink-0">
                    {(c.usuario_nombre || 'U').charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 bg-card rounded-xl px-3 py-2 text-sm">
                    <span className="font-bold text-xs text-muted-foreground">{c.usuario_nombre || 'Usuario'} · {format(new Date(c.created), 'dd/MM HH:mm')}</span>
                    <p className="text-foreground/90 mt-0.5">{c.contenido}</p>
                  </div>
                  {(isAdmin || c.created_by === currentUser?.id) && <button onClick={() => deleteComment(c.id)} className="text-muted-foreground hover:text-destructive p-1 shrink-0">
                      <X className="h-3 w-3" />
                    </button>}
                </div>)}
              {comments.length === 0 && <p className="text-xs text-muted-foreground text-center">Sin comentarios aún</p>}
              <form onSubmit={submitComment} className="flex gap-2 pt-1">
                <Input value={newComment} onChange={e => setNewComment(e.target.value)} placeholder="Escribe un comentario..." className="text-sm h-8" />
                <Button type="submit" size="sm" className="h-8 px-3 font-bold" disabled={savingComment || !newComment.trim()}>
                  {savingComment ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                </Button>
              </form>
            </>}
        </div>}
    </div>;
};
const ActivityWallPage = () => {
  const {
    currentUser,
    isAdmin: isAdminFn
  } = useAuth();
  const isAdmin = isAdminFn();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newPost, setNewPost] = useState('');
  const [postTipo, setPostTipo] = useState('General');
  const [files, setFiles] = useState([]);
  const [previewUrls, setPreviewUrls] = useState([]);
  const [showLinkOptions, setShowLinkOptions] = useState(false);
  const [linkCliente, setLinkCliente] = useState('');
  const [linkTrabajo, setLinkTrabajo] = useState('');
  const [linkSucursal, setLinkSucursal] = useState('');
  const [linkPedido, setLinkPedido] = useState('');

  // Filters
  const [filterTipo, setFilterTipo] = useState('all');
  const [filterSucursal, setFilterSucursal] = useState('all');
  const [filterUsuario, setFilterUsuario] = useState('all');
  const [filterDate, setFilterDate] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // Delete confirmation
  const [deleteTarget, setDeleteTarget] = useState(null);
  const fetchPosts = useCallback(async () => {
    try {
      const records = await pb.collection('actividad_interna').getList(1, 100, {
        sort: '-fijado,-created',
        requestKey: 'wall-fetch'
      });
      setPosts(records.items);
    } catch (err) {
      console.error('Error loading wall', err);
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);
  const uniqueUsuarios = useMemo(() => {
    const map = {};
    posts.forEach(p => {
      const n = p.created_by_nombre || p.created_by;
      if (n) map[n] = true;
    });
    return Object.keys(map).sort();
  }, [posts]);
  const uniqueSucursales = useMemo(() => {
    const map = {};
    posts.forEach(p => {
      if (p.sucursal_nombre) map[p.sucursal_nombre] = true;
    });
    return Object.keys(map).sort();
  }, [posts]);
  const filteredPosts = useMemo(() => {
    return posts.filter(p => {
      if (filterTipo !== 'all' && p.tipo !== filterTipo) return false;
      if (filterSucursal !== 'all' && p.sucursal_nombre !== filterSucursal) return false;
      const name = p.created_by_nombre || p.created_by;
      if (filterUsuario !== 'all' && name !== filterUsuario) return false;
      if (filterDate) {
        const pDate = String(p.created || '').split('T')[0].split(' ')[0];
        if (pDate !== filterDate) return false;
      }
      return true;
    });
  }, [posts, filterTipo, filterSucursal, filterUsuario, filterDate]);
  const handleFileChange = e => {
    const selected = Array.from(e.target.files);
    if (selected.length + files.length > 5) {
      toast.error('Máximo 5 imágenes.');
      return;
    }
    setFiles(prev => [...prev, ...selected]);
    setPreviewUrls(prev => [...prev, ...selected.map(f => URL.createObjectURL(f))]);
  };
  const removeFile = idx => {
    setFiles(prev => prev.filter((_, i) => i !== idx));
    URL.revokeObjectURL(previewUrls[idx]);
    setPreviewUrls(prev => prev.filter((_, i) => i !== idx));
  };
  const handleSubmit = async e => {
    e.preventDefault();
    if (!newPost.trim() && files.length === 0) return;
    setIsSubmitting(true);
    try {
      const fd = new FormData();
      fd.append('titulo', postTipo);
      fd.append('contenido', newPost);
      fd.append('tipo', postTipo);
      fd.append('usuario_id', currentUser?.id || '');
      fd.append('sucursal_id', currentUser?.department || '');
      fd.append('sucursal_nombre', linkSucursal || '');
      fd.append('cliente_id', linkCliente || '');
      fd.append('trabajo_id', linkTrabajo || '');
      fd.append('pedido_id', linkPedido || '');
      fd.append('created_by', currentUser?.id || '');
      fd.append('created_by_nombre', currentUser?.name || '');
      fd.append('es_importante', postTipo === 'Urgente' ? 'true' : 'false');
      files.forEach(f => fd.append('fotografias', f));
      await pb.collection('actividad_interna').create(fd, {
        requestKey: 'wall-create'
      });
      setNewPost('');
      setFiles([]);
      setPreviewUrls([]);
      setPostTipo('General');
      setLinkCliente('');
      setLinkTrabajo('');
      setLinkSucursal('');
      setLinkPedido('');
      setShowLinkOptions(false);
      toast.success('Publicado');
      fetchPosts();
    } catch {
      toast.error('Error al publicar');
    } finally {
      setIsSubmitting(false);
    }
  };
  const handleDelete = async post => {
    try {
      await pb.collection('actividad_interna').delete(post.id, {
        requestKey: `wall-del-${post.id}`
      });
      toast.success('Publicación eliminada');
      setDeleteTarget(null);
      fetchPosts();
    } catch {
      toast.error('Error al eliminar');
    }
  };
  const handleToggle = async (post, field) => {
    try {
      await pb.collection('actividad_interna').update(post.id, {
        [field]: !post[field]
      }, {
        requestKey: `wall-toggle-${post.id}-${field}`
      });
      fetchPosts();
    } catch {
      toast.error('Error al actualizar');
    }
  };
  const handleReaction = async (post, emoji) => {
    try {
      let reacciones = {};
      try {
        reacciones = typeof post.reacciones === 'object' && post.reacciones ? {
          ...post.reacciones
        } : post.reacciones ? JSON.parse(post.reacciones) : {};
      } catch {
        reacciones = {};
      }
      const uid = currentUser?.id;
      if (!reacciones[emoji]) reacciones[emoji] = [];
      const idx = reacciones[emoji].indexOf(uid);
      if (idx > -1) reacciones[emoji].splice(idx, 1);else reacciones[emoji].push(uid);
      await pb.collection('actividad_interna').update(post.id, {
        reacciones
      }, {
        requestKey: `wall-react-${post.id}`
      });
      fetchPosts();
    } catch {
      toast.error('Error al reaccionar');
    }
  };
  return <Layout>
      <Helmet>
        <title>Muro de Actividad - H&S Tecnologías</title>
        <meta name="description" content="Feed interno del equipo, avisos y actualizaciones de proyecto" />
      </Helmet>
      <div className="content-container py-6 pb-20 space-y-5 max-w-3xl mx-auto">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-3">
              <Activity className="h-8 w-8 text-primary" /> Muro de Actividad
            </h1>
            <p className="text-muted-foreground mt-1 font-medium">Feed interno del equipo&nbsp;</p>
          </div>
          <Button variant="outline" size="sm" className="font-bold gap-2" onClick={() => setShowFilters(v => !v)}>
            <Filter className="h-4 w-4" /> Filtros
          </Button>
        </div>

        {/* Filters panel */}
        {showFilters && <div className="bg-card border rounded-2xl p-4 flex flex-wrap gap-3 shadow-sm">
            <Select value={filterTipo} onValueChange={setFilterTipo}>
              <SelectTrigger className="w-40 font-bold"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tipo: Todos</SelectItem>
                {TIPOS.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={filterSucursal} onValueChange={setFilterSucursal}>
              <SelectTrigger className="w-44 font-bold"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Sucursal: Todas</SelectItem>
                {uniqueSucursales.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={filterUsuario} onValueChange={setFilterUsuario}>
              <SelectTrigger className="w-44 font-bold"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Usuario: Todos</SelectItem>
                {uniqueUsuarios.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}
              </SelectContent>
            </Select>
            <Input type="date" className="w-40" value={filterDate} onChange={e => setFilterDate(e.target.value)} />
            {(filterTipo !== 'all' || filterSucursal !== 'all' || filterUsuario !== 'all' || filterDate) && <Button variant="ghost" size="sm" className="text-xs font-bold text-muted-foreground" onClick={() => {
          setFilterTipo('all');
          setFilterSucursal('all');
          setFilterUsuario('all');
          setFilterDate('');
        }}>
                Limpiar
              </Button>}
          </div>}

        {/* New post composer */}
        <div className="bg-card border rounded-2xl p-4 shadow-sm space-y-3">
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-full bg-primary/20 text-primary flex items-center justify-center font-black shrink-0">
                {(currentUser?.name || 'U').charAt(0).toUpperCase()}
              </div>
              <Select value={postTipo} onValueChange={setPostTipo}>
                <SelectTrigger className="w-44 font-bold h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TIPOS.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <Textarea placeholder="¿Qué quieres compartir con el equipo?" value={newPost} onChange={e => setNewPost(e.target.value)} className="min-h-[80px] resize-none bg-muted/20 border-muted" />

            {previewUrls.length > 0 && <div className="flex gap-3 overflow-x-auto py-1">
                {previewUrls.map((url, idx) => <div key={idx} className="relative h-20 w-20 shrink-0 rounded-lg overflow-hidden border shadow-sm">
                    <img src={url} alt="Preview" className="w-full h-full object-cover" />
                    <button type="button" onClick={() => removeFile(idx)} className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-1 hover:bg-black">
                      <X className="h-3 w-3" />
                    </button>
                  </div>)}
              </div>}

            {/* Link options */}
            <button type="button" onClick={() => setShowLinkOptions(v => !v)} className="text-xs text-muted-foreground hover:text-foreground font-semibold flex items-center gap-1 transition-colors">
              {showLinkOptions ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
              Vincular con trabajo, cliente o sucursal (opcional)
            </button>
            {showLinkOptions && <div className="grid grid-cols-2 gap-3 pt-1 pb-1">
                <Input placeholder="ID o nombre de cliente" value={linkCliente} onChange={e => setLinkCliente(e.target.value)} className="text-sm" />
                <Input placeholder="ID o nombre de trabajo" value={linkTrabajo} onChange={e => setLinkTrabajo(e.target.value)} className="text-sm" />
                <Input placeholder="Sucursal" value={linkSucursal} onChange={e => setLinkSucursal(e.target.value)} className="text-sm" />
                <Input placeholder="ID pedido interno" value={linkPedido} onChange={e => setLinkPedido(e.target.value)} className="text-sm" />
              </div>}

            <div className="flex justify-between items-center pt-1 border-t">
              <label className="cursor-pointer flex items-center gap-2 text-sm font-bold text-primary hover:text-primary/80 transition-colors bg-primary/10 px-3 py-1.5 rounded-lg">
                <ImageIcon className="h-4 w-4" /> Fotos
                <input type="file" accept="image/*" multiple className="hidden" onChange={handleFileChange} />
              </label>
              <Button type="submit" disabled={isSubmitting || !newPost.trim() && files.length === 0} className="font-bold h-9">
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}
                Publicar
              </Button>
            </div>
          </form>
        </div>

        {/* Feed */}
        <div className="space-y-4">
          {loading ? <div className="flex justify-center py-12"><Loader2 className="animate-spin h-8 w-8 text-primary" /></div> : filteredPosts.length === 0 ? <p className="text-center text-muted-foreground py-8 font-medium">No hay publicaciones que mostrar.</p> : filteredPosts.map(post => <PostCard key={post.id} post={post} currentUser={currentUser} isAdmin={isAdmin} onDelete={setDeleteTarget} onToggleImportante={p => handleToggle(p, 'es_importante')} onToggleResuelto={p => handleToggle(p, 'es_resuelto')} onToggleFijado={p => handleToggle(p, 'fijado')} onReaction={handleReaction} onRefresh={fetchPosts} />)}
        </div>
      </div>

      {/* Delete confirmation */}
      {deleteTarget && <Dialog open onOpenChange={() => setDeleteTarget(null)}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle className="font-extrabold text-destructive flex items-center gap-2">
                <Trash2 className="h-5 w-5" /> Eliminar publicación
              </DialogTitle>
            </DialogHeader>
            <p className="text-sm text-muted-foreground">¿Seguro que deseas eliminar esta publicación? Esta acción no se puede deshacer.</p>
            <div className="flex gap-3 pt-2">
              <Button variant="outline" className="flex-1 font-bold" onClick={() => setDeleteTarget(null)}>Cancelar</Button>
              <Button variant="destructive" className="flex-1 font-bold" onClick={() => handleDelete(deleteTarget)}>Eliminar</Button>
            </div>
          </DialogContent>
        </Dialog>}
    </Layout>;
};
export default ActivityWallPage;