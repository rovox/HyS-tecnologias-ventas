import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog.jsx';
import { Button } from '@/components/ui/button.jsx';
import { Input } from '@/components/ui/input.jsx';
import { Label } from '@/components/ui/label.jsx';
import { Textarea } from '@/components/ui/textarea.jsx';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select.jsx';
import { Loader2, PackageCheck } from 'lucide-react';
import { format } from 'date-fns';
import { useAuth } from '@/contexts/AuthContext.jsx';
import pb from '@/lib/pocketbaseClient.js';

const EntregaPedidoModal = ({ isOpen, onClose, onConfirm, submitting }) => {
  const { currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [fechaEntrega, setFechaEntrega] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [entregadoPorId, setEntregadoPorId] = useState(currentUser?.id || '');
  const [observacion, setObservacion] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    setFechaEntrega(format(new Date(), 'yyyy-MM-dd'));
    setEntregadoPorId(currentUser?.id || '');
    setObservacion('');

    pb.collection('users').getFullList({ $autoCancel: false, sort: 'name' })
      .then(setUsers)
      .catch(() => setUsers([]));
  }, [isOpen, currentUser]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onConfirm({ fecha_entrega: fechaEntrega, entregado_por_id: entregadoPorId, observacion });
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !submitting && !open && onClose()}>
      <DialogContent className="sm:max-w-md bg-card rounded-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-extrabold">
            <PackageCheck className="h-5 w-5 text-emerald-600" /> Confirmar Entrega
          </DialogTitle>
          <DialogDescription>
            Registra los datos de la entrega de este pedido interno.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Fecha de Entrega <span className="text-destructive">*</span></Label>
            <Input type="date" value={fechaEntrega} onChange={(e) => setFechaEntrega(e.target.value)} disabled={submitting} required />
          </div>

          <div className="space-y-2">
            <Label>Entregado por <span className="text-destructive">*</span></Label>
            <Select value={entregadoPorId} onValueChange={setEntregadoPorId} disabled={submitting}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccione usuario" />
              </SelectTrigger>
              <SelectContent>
                {users.map(u => <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Observación (opcional)</Label>
            <Textarea value={observacion} onChange={(e) => setObservacion(e.target.value)} className="resize-none min-h-[80px]" placeholder="Detalles de la entrega..." disabled={submitting} />
          </div>

          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={submitting} className="font-bold">Cancelar</Button>
            <Button type="submit" disabled={submitting || !entregadoPorId} className="font-bold bg-emerald-600 hover:bg-emerald-700 text-white">
              {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />} Confirmar Entrega
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EntregaPedidoModal;
