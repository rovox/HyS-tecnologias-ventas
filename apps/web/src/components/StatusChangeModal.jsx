import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext.jsx';

const StatusChangeModal = ({ isOpen, onClose, onConfirm, currentStatus }) => {
  const { currentUser } = useAuth();
  const [newStatus, setNewStatus] = useState('');
  const [reason, setReason] = useState('');

  const isTecnico = currentUser?.role === 'SEGURIDAD ELECTRÓNICA';
  const isAdmin = currentUser?.role === 'ADMINISTRADOR';

  const availableStatuses = [
    { value: 'solicitado', label: 'Solicitado' },
    { value: 'aprobado', label: 'Aprobado' },
    { value: 'en_preparación', label: 'En Preparación' },
    { value: 'entregado', label: 'Entregado' },
    { value: 'cancelado', label: 'Cancelado' }
  ];

  const allowedStatuses = availableStatuses.filter(s => {
    if (isAdmin) return true;
    if (isTecnico) return s.value === 'en_preparación' || s.value === 'entregado';
    return true; // Ventas/Admin
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!newStatus) return;
    onConfirm(newStatus, reason);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Cambiar Estado</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label>Estado Actual: <span className="font-bold uppercase ml-2 text-muted-foreground">{currentStatus}</span></Label>
          </div>
          <div className="space-y-2">
            <Label htmlFor="newStatus">Nuevo Estado</Label>
            <Select value={newStatus} onValueChange={setNewStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccione el nuevo estado" />
              </SelectTrigger>
              <SelectContent>
                {allowedStatuses.map(s => (
                  <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="reason">Motivo / Observaciones (Opcional)</Label>
            <Textarea 
              id="reason" 
              value={reason} 
              onChange={(e) => setReason(e.target.value)} 
              placeholder="Explique el motivo del cambio..."
              className="resize-none"
            />
          </div>
          <DialogFooter className="pt-4">
            <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
            <Button type="submit" disabled={!newStatus || newStatus === currentStatus}>Guardar Cambios</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default StatusChangeModal;