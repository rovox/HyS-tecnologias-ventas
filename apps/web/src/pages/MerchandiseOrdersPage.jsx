import React, { useState, useEffect } from 'react';
import Layout from '@/components/Layout.jsx';
import { Helmet } from 'react-helmet';
import pb from '@/lib/pocketbaseClient.js';
import { Package, Plus, MapPin, Calendar as CalIcon } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Skeleton } from '@/components/ui/skeleton';

const MerchandiseOrdersPage = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const records = await pb.collection('merchandise_orders').getFullList({
          sort: '-created',
          $autoCancel: false
        });
        setOrders(records);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, []);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Pendiente': return <Badge variant="outline" className="bg-orange-100 text-orange-800 border-orange-200">Pendiente</Badge>;
      case 'Aprobado': return <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-200">Aprobado</Badge>;
      case 'Entregado': return <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">Entregado</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <Layout>
      <Helmet>
        <title>Pedidos de Mercadería - H&S Tecnologías</title>
      </Helmet>
      
      <div className="content-container space-y-6 py-6 w-full max-w-none">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 w-full">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-primary">Pedidos de Mercadería</h1>
            <p className="text-muted-foreground">Solicitudes a almacén y despachos</p>
          </div>
          <Button className="gap-2 bg-primary hover:bg-primary/90">
            <Plus className="h-4 w-4" /> Nuevo Pedido
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-4 gap-4 w-full">
          {loading ? (
             Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-48 w-full rounded-xl" />)
          ) : orders.length > 0 ? (
            orders.map(order => (
              <Card key={order.id} className="p-5 flex flex-col h-full border shadow-sm w-full">
                <div className="flex justify-between items-start mb-4 w-full">
                  {getStatusBadge(order.estado)}
                  <span className="text-xs text-muted-foreground font-medium flex items-center gap-1 bg-muted px-2 py-1 rounded">
                    <MapPin className="h-3 w-3" />
                    {order.sucursal}
                  </span>
                </div>
                
                <div className="flex-1 mb-4 w-full">
                  <h3 className="font-semibold text-lg leading-tight mb-2 break-words w-full">{order.descripcion}</h3>
                  <p className="text-sm text-muted-foreground">Cantidad: <span className="font-semibold text-foreground">{order.cantidad}</span></p>
                  <p className="text-sm text-muted-foreground mt-1">Responsable: <span className="text-foreground">{order.responsable}</span></p>
                </div>

                <div className="mt-auto pt-4 border-t flex items-center justify-between text-sm text-muted-foreground w-full">
                  <div className="flex items-center gap-1.5">
                    <CalIcon className="h-4 w-4" />
                    {format(new Date(order.fecha_solicitada), "dd MMM yyyy", { locale: es })}
                  </div>
                  {order.fotografias?.length > 0 && (
                    <span className="text-xs font-medium">+{order.fotografias.length} adjuntos</span>
                  )}
                </div>
              </Card>
            ))
          ) : (
             <div className="col-span-full py-16 text-center border-2 border-dashed rounded-xl bg-background/50 w-full">
               <Package className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
               <h3 className="text-lg font-medium text-foreground">No hay pedidos registrados</h3>
               <p className="text-muted-foreground mt-1">Crea el primer pedido usando el botón superior.</p>
             </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default MerchandiseOrdersPage;