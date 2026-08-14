import React from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Edit2, Trash2, Reply } from 'lucide-react';
import pb from '@/lib/pocketbaseClient.js';
import PhotoGallery from './PhotoGallery.jsx';

const CommentThread = ({ comments, parentId, postId, usersMap, currentUser, onReply, onEdit, onDelete, depth = 0 }) => {
  // Extract node comments strictly by parentId matching. 
  // Falsy parentId means root comments (comentario_padre_id is empty or null)
  const nodeComments = comments.filter(c => {
    if (!parentId) return !c.comentario_padre_id;
    return c.comentario_padre_id === parentId;
  });
  
  if (!nodeComments.length) return null;

  return (
    <div className={`space-y-4 ${depth > 0 ? 'ml-6 sm:ml-12 mt-4 border-l-2 pl-4 border-muted' : 'mt-6 pt-4 border-t border-border'}`}>
      {nodeComments.map(comment => {
        // Fallback checks for user mapping using both usuario_id and created_by
        const authorId = comment.usuario_id || comment.created_by;
        const author = usersMap[authorId] || { name: 'Usuario Desconocido' };
        const avatarUrl = author.avatar ? pb.files.getUrl(author, author.avatar) : null;
        const isAuthor = currentUser?.id === comment.created_by;

        return (
          <div key={comment.id} className="group">
            <div className="flex gap-3">
              <div className="h-8 w-8 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-xs shrink-0 overflow-hidden shadow-sm">
                {avatarUrl ? <img src={avatarUrl} alt={author.name} className="w-full h-full object-cover" /> : author.name.charAt(0).toUpperCase()}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="bg-muted/50 border border-border rounded-2xl p-3 sm:p-4 inline-block max-w-full">
                  <div className="flex items-center justify-between gap-4 mb-1">
                    <span className="font-bold text-sm text-foreground">{author.name}</span>
                    <span className="text-xs text-muted-foreground font-medium">
                      {format(new Date(comment.created), "d MMM, HH:mm", { locale: es })}
                    </span>
                  </div>
                  <p className="text-sm text-foreground/90 whitespace-pre-wrap leading-relaxed break-words">{comment.contenido}</p>
                  
                  {comment.fotografias && comment.fotografias.length > 0 && (
                     <div className="mt-2">
                       <PhotoGallery record={comment} photos={comment.fotografias} />
                     </div>
                  )}
                </div>

                <div className="flex items-center gap-4 mt-2 ml-2">
                  <button 
                    onClick={() => onReply(postId, comment.id)} 
                    className="text-xs font-bold text-muted-foreground hover:text-primary transition-colors flex items-center gap-1"
                  >
                    <Reply className="h-3 w-3" /> Responder
                  </button>
                  
                  {isAuthor && (
                    <>
                      <button 
                        onClick={() => onEdit(comment)} 
                        className="text-xs font-bold text-muted-foreground hover:text-accent transition-colors flex items-center gap-1"
                      >
                        <Edit2 className="h-3 w-3" /> Editar
                      </button>
                      <button 
                        onClick={() => {
                          if (window.confirm('¿Seguro que deseas eliminar este comentario?')) {
                            onDelete(comment.id);
                          }
                        }} 
                        className="text-xs font-bold text-muted-foreground hover:text-destructive transition-colors flex items-center gap-1"
                      >
                        <Trash2 className="h-3 w-3" /> Eliminar
                      </button>
                    </>
                  )}
                </div>

                {/* Render children recursively */}
                <CommentThread 
                  comments={comments} 
                  parentId={comment.id} 
                  postId={postId}
                  usersMap={usersMap}
                  currentUser={currentUser}
                  onReply={onReply}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  depth={depth + 1}
                />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default CommentThread;