import React from 'react';
import { Eye, Edit2 } from 'lucide-react';
import { Button } from '@/components/ui/button.jsx';

/**
 * Acciones de fila Ver / Editar con el mismo acento (variant action).
 */
export default function RowActions({
  onView,
  onEdit,
  canEdit = true,
  viewLabel = 'Ver',
  editLabel = 'Editar',
  viewTitle = 'Ver detalle',
  editTitle = 'Editar',
  className = '',
}) {
  return (
    <div className={`flex gap-2 shrink-0 ${className}`}>
      {typeof onView === 'function' && (
        <Button
          type="button"
          variant="action"
          size="sm"
          className="min-h-10 flex-1 sm:flex-none"
          onClick={onView}
          title={viewTitle}
        >
          <Eye className="h-4 w-4 mr-1.5" /> {viewLabel}
        </Button>
      )}
      {canEdit && typeof onEdit === 'function' && (
        <Button
          type="button"
          variant="action"
          size="sm"
          className="min-h-10 flex-1 sm:flex-none"
          onClick={onEdit}
          title={editTitle}
        >
          <Edit2 className="h-4 w-4 mr-1.5" /> {editLabel}
        </Button>
      )}
    </div>
  );
}
