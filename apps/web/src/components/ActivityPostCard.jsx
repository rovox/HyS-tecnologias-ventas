import React, { useState } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { MoreHorizontal, Edit2, Archive, Trash2, MessageSquare } from 'lucide-react';
import pb from '@/lib/pocketbaseClient.js';
import PhotoGallery from './PhotoGallery.jsx';
import CommentThread from './CommentThread.jsx';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';

const ActivityPostCard = ({ 
  post, 
  allComments, 
  usersMap, 
  currentUser, 
  onEditPost, 
  onDeletePost, 
  onArchivePost,
  onReply,
  onEditComment,
  onDeleteComment
}) => {
  const [showComments, setShowComments] = useState(false);
  
  // Resolve author handling edge cases where listing users isn't permitted for regular users
  const authorId = post.usuario_id || post.created_by;
  const author = usersMap[authorId] || { name: 'Usuario Desconocido' };
  const avatarUrl = author.avatar ? pb.files.getUrl(author, author.avatar) : null;
  
  const isAuthor = currentUser?.id === post.created_by;
  
  // Get direct comments count for display
  const totalComments = allComments.filter(c => c.actividad_id === post.id).length;

  return (
    <div className="feed-post relative w-full overflow-hidden flex flex-col">
      <div className="flex justify-between items-start mb-4">
        <div className="flex gap-3 items-center min-w-0">
          <div className="h-12 w-12 rounded-2xl bg-secondary text-secondary-foreground flex items-center justify-center font-bold text-lg shrink-0 overflow-hidden shadow-sm border border-border">
            {avatarUrl ? <img src={avatarUrl} alt={author.name} className="w-full h-full object-cover" /> : author.name.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <span className="font-bold text-foreground block leading-tight text-lg truncate">{author.name}</span>
            <span className="text-xs font-semibold text-muted-foreground block truncate">
              {format(new Date(post.created), "d 'de' MMMM, yyyy • HH:mm", { locale: es })}
            </span>
          </div>
        </div>

        {isAuthor && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground shrink-0">
                <MoreHorizontal className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={() => onEditPost(post)} className="cursor-pointer font-medium">
                <Edit2 className="h-4 w-4 mr-2 text-accent" /> Editar
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onArchivePost(post.id)} className="cursor-pointer font-medium">
                <Archive className="h-4 w-4 mr-2 text-orange-500" /> Archivar
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={() => {
                  if (window.confirm('¿Eliminar esta publicación permanentemente?')) {
                    onDeletePost(post.id);
                  }
                }} 
                className="cursor-pointer text-destructive font-medium focus:text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-2" /> Eliminar
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      <div className="space-y-4">
        <h3 className="text-xl font-bold text-foreground tracking-tight break-words">{post.titulo}</h3>
        <p className="text-foreground/90 whitespace-pre-wrap text-base leading-relaxed break-words">{post.contenido}</p>
        
        <PhotoGallery record={post} photos={post.fotografias} />
      </div>

      <div className="flex items-center justify-between mt-6 pt-4 border-t border-border">
        <Button 
          variant="ghost" 
          className={`font-bold hover:text-primary transition-colors ${showComments ? 'text-primary bg-primary/10' : 'text-muted-foreground'}`}
          onClick={() => setShowComments(!showComments)}
        >
          <MessageSquare className="h-4 w-4 mr-2" /> 
          {totalComments === 0 ? 'Comentar' : `${totalComments} Comentario${totalComments !== 1 ? 's' : ''}`}
        </Button>
      </div>

      {showComments && (
        <div className="animate-in fade-in slide-in-from-top-4 duration-300 w-full min-w-0">
          <CommentThread 
            comments={allComments.filter(c => c.actividad_id === post.id)} 
            parentId="" 
            postId={post.id}
            usersMap={usersMap}
            currentUser={currentUser}
            onReply={onReply}
            onEdit={onEditComment}
            onDelete={onDeleteComment}
          />
          
          <div className="mt-4 pt-4">
             <Button variant="outline" className="w-full justify-start text-muted-foreground" onClick={() => onReply(post.id, "")}>
                <MessageSquare className="h-4 w-4 mr-2" /> Escribir un comentario...
             </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ActivityPostCard;