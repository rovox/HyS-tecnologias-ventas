import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import pb from '@/lib/pocketbaseClient.js';
import { useAuth } from '@/contexts/AuthContext.jsx';
import Layout from '@/components/Layout.jsx';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';
import { Megaphone, Target, Loader2, Download } from 'lucide-react';
import { toast } from 'sonner';

const MarketingReportsPage = () => {
  const { canViewFinancialReports } = useAuth();
  const [loading, setLoading] = useState(true);
  const [campaigns, setCampaigns] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const camps = await pb.collection('campaigns_new').getFullList({ sort: '-created', $autoCancel: false });
        setCampaigns(camps);
      } catch (error) {
        toast.error('Error al cargar datos de marketing');
      } finally {
        setLoading(false);
      }
    };
    if (canViewFinancialReports()) fetchData();
  }, [canViewFinancialReports]);

  if (!canViewFinancialReports()) return <Navigate to="/dashboard" replace />;

  const handleExport = () => {
    if(!campaigns.length) return toast.error("Sin datos para exportar");
    const csv = "data:text/csv;charset=utf-8,Nombre,Presupuesto,Estado\n" + 
      campaigns.map(c => `${c.name},${c.budget||0},${c.status}`).join("\n");
    const link = document.createElement("a");
    link.href = encodeURI(csv);
    link.download = "marketing_report.csv";
    link.click();
  };

  const chartData = campaigns.map(c => ({ name: c.name, Presupuesto: c.budget || 0 })).slice(0, 10);

  return (
    <Layout>
      <Helmet><title>Métricas de Marketing - H&S</title></Helmet>
      <div className="content-container py-6 pb-20 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-3">
              <Megaphone className="h-8 w-8 text-primary" /> ROI y Marketing
            </h1>
            <p className="text-muted-foreground mt-1 font-medium">Análisis de inversión en captación de clientes</p>
          </div>
          <Button onClick={handleExport} variant="outline" className="font-bold gap-2"><Download className="h-4 w-4"/> Exportar CSV</Button>
        </div>

        {loading ? <div className="flex justify-center p-12"><Loader2 className="animate-spin h-8 w-8 text-primary"/></div> : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2 border shadow-sm rounded-2xl">
              <CardHeader><CardTitle>Presupuesto por Campaña</CardTitle></CardHeader>
              <CardContent className="h-[300px]">
                {chartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} />
                      <YAxis axisLine={false} tickLine={false} />
                      <RechartsTooltip cursor={{fill: 'transparent'}}/>
                      <Bar dataKey="Presupuesto" fill="#8b5cf6" radius={[4, 4, 0, 0]} barSize={40} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : <p className="text-center text-muted-foreground">Sin campañas registradas</p>}
              </CardContent>
            </Card>

            <Card className="border shadow-sm rounded-2xl">
              <CardHeader><CardTitle>Campañas Recientes</CardTitle></CardHeader>
              <CardContent className="p-0">
                <div className="divide-y">
                  {campaigns.slice(0,5).map(c => (
                    <div key={c.id} className="p-4 flex justify-between items-center hover:bg-muted/30">
                      <div>
                        <p className="font-bold text-foreground">{c.name}</p>
                        <p className="text-xs text-muted-foreground">{c.status}</p>
                      </div>
                      <p className="font-black text-primary">${c.budget?.toLocaleString()||0}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default MarketingReportsPage;