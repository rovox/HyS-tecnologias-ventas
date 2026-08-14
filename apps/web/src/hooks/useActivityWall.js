import { useState, useCallback } from 'react';
import pb from '@/lib/pocketbaseClient.js';
import { useAuth } from '@/contexts/AuthContext.jsx';
import { toast } from 'sonner';

export const useActivityWall = () => {
  const { currentUser } = useAuth();
  const [posts, setPosts] = useState([]);
  const [comments, setComments] = useState([]);
  const [usersMap, setUsersMap] = useState({});
  const [loading, setLoading] = useState(true);

  const logActivity = async (entityType, entityId, action, description) => {
    try {
      await pb.collection('historial_actividad').create({
        entidad_tipo: entityType,
        entidad_id: entityId,
        usuario_id: currentUser.id,
        accion: action,
        descripcion: description,
        created_by: currentUser.id
      }, { $autoCancel: false });
    } catch (err) {
      console.error('Failed to log activity:', err);
    }
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const sucursal = currentUser.department || 'Central';
      
      const [fetchedPosts, fetchedComments, fetchedUsers] = await Promise.all([
        pb.collection('actividad_interna').getList(1, 50, { 
          sort: '-created',
          filter: `estado != 'archivado'`, 
          $autoCancel: false 
        }),
        pb.collection('comentarios_actividad').getFullList({ 
          sort: 'created',
          $autoCancel: false 
        }),
        // Note: non-admins might not be able to fetch all users depending on listRule.
        // We handle empty list gracefully in the UI.
        pb.collection('users').getFullList({ $autoCancel: false }).catch(() => [])
      ]);

      const mappedUsers = (fetchedUsers || []).reduce((acc, user) => {
        acc[user.id] = user;
        return acc;
      }, {});

      // Always ensure the current user is in the map as a fallback
      if (currentUser && !mappedUsers[currentUser.id]) {
        mappedUsers[currentUser.id] = currentUser;
      }

      setPosts(fetchedPosts.items);
      setComments(fetchedComments);
      setUsersMap(mappedUsers);
    } catch (err) {
      console.error(err);
      toast.error('Error al cargar la actividad');
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  const createPost = async (formData) => {
    try {
      formData.append('created_by', currentUser.id);
      formData.append('usuario_id', currentUser.id);
      formData.append('sucursal_id', currentUser.department || 'Central');
      formData.append('estado', 'activo');

      const record = await pb.collection('actividad_interna').create(formData, { $autoCancel: false });
      setPosts(prev => [record, ...prev]);
      await logActivity('actividad_interna', record.id, 'crear', `Creó publicación: ${record.titulo}`);
      toast.success('Publicación creada con éxito');
      return record;
    } catch (err) {
      console.error(err);
      toast.error('Error al crear la publicación');
      throw err;
    }
  };

  const updatePost = async (id, formData) => {
    try {
      const record = await pb.collection('actividad_interna').update(id, formData, { $autoCancel: false });
      setPosts(prev => prev.map(p => p.id === id ? record : p));
      await logActivity('actividad_interna', id, 'editar', `Editó publicación: ${record.titulo}`);
      toast.success('Publicación actualizada');
      return record;
    } catch (err) {
      console.error(err);
      toast.error('Error al actualizar');
      throw err;
    }
  };

  const archivePost = async (id) => {
    try {
      await pb.collection('actividad_interna').update(id, { estado: 'archivado' }, { $autoCancel: false });
      setPosts(prev => prev.filter(p => p.id !== id));
      await logActivity('actividad_interna', id, 'archivar', `Archivó publicación`);
      toast.success('Publicación archivada');
    } catch (err) {
      console.error(err);
      toast.error('Error al archivar');
      throw err;
    }
  };

  const deletePost = async (id) => {
    try {
      await pb.collection('actividad_interna').delete(id, { $autoCancel: false });
      setPosts(prev => prev.filter(p => p.id !== id));
      await logActivity('actividad_interna', id, 'eliminar', `Eliminó publicación`);
      toast.success('Publicación eliminada');
    } catch (err) {
      console.error(err);
      toast.error('Error al eliminar');
      throw err;
    }
  };

  const createComment = async (formData, postId) => {
    try {
      formData.append('created_by', currentUser.id);
      formData.append('usuario_id', currentUser.id);
      formData.append('actividad_id', postId);

      const record = await pb.collection('comentarios_actividad').create(formData, { $autoCancel: false });
      setComments(prev => [...prev, record]);
      await logActivity('comentarios_actividad', record.id, 'crear', `Comentó en publicación ${postId}`);
      toast.success('Comentario añadido');
      return record;
    } catch (err) {
      console.error(err);
      toast.error('Error al comentar');
      throw err;
    }
  };

  const updateComment = async (id, formData) => {
    try {
      const record = await pb.collection('comentarios_actividad').update(id, formData, { $autoCancel: false });
      setComments(prev => prev.map(c => c.id === id ? record : c));
      await logActivity('comentarios_actividad', id, 'editar', `Editó comentario`);
      toast.success('Comentario actualizado');
      return record;
    } catch (err) {
      console.error(err);
      toast.error('Error al actualizar');
      throw err;
    }
  };

  const deleteComment = async (id) => {
    try {
      await pb.collection('comentarios_actividad').delete(id, { $autoCancel: false });
      setComments(prev => prev.filter(c => c.id !== id));
      await logActivity('comentarios_actividad', id, 'eliminar', `Eliminó comentario`);
      toast.success('Comentario eliminado');
    } catch (err) {
      console.error(err);
      toast.error('Error al eliminar');
      throw err;
    }
  };

  return {
    posts,
    comments,
    usersMap,
    loading,
    fetchData,
    createPost,
    updatePost,
    archivePost,
    deletePost,
    createComment,
    updateComment,
    deleteComment
  };
};