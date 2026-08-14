import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';

const DeleteConfirmationModal = ({ isOpen, onClose, onConfirm, itemName, isDeleting }) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" /> Confirmar Eliminación
          </DialogTitle>
          <DialogDescription className="pt-3 text-base">
            ¿Estás seguro de que deseas eliminar permanentemente <strong className="text-foreground">{itemName}</strong>?
          </DialogDescription>
        </DialogHeader>
        <div className="bg-destructive/10 p-3 rounded-lg border border-destructive/20 text-sm text-destructive-foreground">
          Esta acción eliminará todos los registros asociados (detalles y comentarios) y no se puede deshacer.
        </div>
        <DialogFooter className="pt-4">
          <Button type="button" variant="outline" onClick={onClose} disabled={isDeleting}>Cancelar</Button>
          <Button type="button" variant="destructive" onClick={onConfirm} disabled={isDeleting}>
            {isDeleting ? 'Eliminando...' : 'Sí, Eliminar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DeleteConfirmationModal;