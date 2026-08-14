import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Edit, Trash2, Upload, Clock, CheckCircle, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Header from '@/components/Header.jsx';
import Sidebar from '@/components/Sidebar.jsx';
import CampaignForm from '@/components/CampaignForm.jsx';
import { useAuth } from '@/contexts/AuthContext.jsx';
import { Helmet } from 'react-helmet';

const CampaignDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { userRole } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);

  const campaign = {
    id: id,
    nombre: 'Promoción Sistemas de Seguridad Empresarial',
    descripcion: 'Campaña de promoción para sistemas de seguridad integral dirigida a empresas medianas y grandes. Incluye descuentos especiales en instalación y primer año de mantenimiento.',
    fechaInicio: '2026-06-01',
    fechaFin: '2026-08-31',
    responsable: 'Stephany',
    estado: 'Activa',
    createdBy: 'admin',
    createdAt: '2026-05-25 10:00',
    updatedBy: 'Stephany',
    updatedAt: '2026-06-03 15:30',
  };

  const materials = [
    { name: 'Flyer Digital.pdf', type: 'PDF', uploadDate: '2026-05-26' },
    { name: 'Banner Principal.jpg', type: 'Imagen', uploadDate: '2026-05-27' },
    { name: 'Video Promocional.mp4', type: 'Video', uploadDate: '2026-05-28' },
  ];

  const activityHistory = [
    { user: 'Stephany', action: 'Subió material', timestamp: '2026-06-03 15:30', details: 'Video Promocional.mp4' },
    { user: 'admin', action: 'Aprobó la campaña', timestamp: '2026-05-28 11:20', details: 'Campaña aprobada para publicación' },
    { user: 'Stephany', action: 'Subió material', timestamp: '2026-05-27 14:15', details: 'Banner Principal.jpg' },
    { user: 'admin', action: 'Creó la campaña', timestamp: '2026-05-25 10:00', details: 'Campaña inicial creada' },
  ];

  const handleDelete = () => {
    if (window.confirm('¿Está seguro de eliminar esta campaña?')) {
      navigate('/marketing');
    }
  };

  const handleEdit = (formData) => {
    console.log('Updating campaign:', formData);
  };

  const handleApprove = () => {
    console.log('Campaign approved');
  };

  const handleReject = () => {
    console.log('Campaign rejected');
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Activa':
        return 'bg-secondary text-secondary-foreground';
      case 'Pausada':
        return 'bg-muted text-muted-foreground';
      case 'Finalizada':
        return 'bg-destructive/10 text-destructive';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <>
      <Helmet>
        <title>Detalle de Campaña - H&S Tecnologías</title>
        <meta name="description" content="Detalles de la campaña de marketing" />
      </Helmet>

      <div className="min-h-screen bg-background">
        <Header onMenuClick={() => setSidebarOpen(true)} />
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        <main className="md:pl-64 transition-all duration-300">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="mb-6">
              <Button
                variant="ghost"
                onClick={() => navigate('/marketing')}
                className="mb-4"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Volver a Marketing
              </Button>

              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h1 className="text-3xl font-bold">{campaign.nombre}</h1>
                    <Badge className={getStatusColor(campaign.estado)}>
                      {campaign.estado}
                    </Badge>
                  </div>
                  <p className="text-muted-foreground">
                    {new Date(campaign.fechaInicio).toLocaleDateString('es-ES')} - {new Date(campaign.fechaFin).toLocaleDateString('es-ES')}
                  </p>
                </div>
                <div className="flex gap-2">
                  {userRole === 'admin' && (
                    <>
                      <Button
                        variant="outline"
                        onClick={handleApprove}
                        className="text-secondary"
                      >
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Aprobar
                      </Button>
                      <Button
                        variant="outline"
                        onClick={handleReject}
                        className="text-destructive"
                      >
                        <XCircle className="mr-2 h-4 w-4" />
                        Rechazar
                      </Button>
                    </>
                  )}
                  <Button
                    variant="outline"
                    onClick={() => setShowEditForm(true)}
                  >
                    <Edit className="mr-2 h-4 w-4" />
                    Editar
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={handleDelete}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Eliminar
                  </Button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Información de la Campaña</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">Descripción</p>
                      <p className="leading-relaxed">{campaign.descripcion}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                      <div>
                        <p className="text-sm text-muted-foreground">Responsable</p>
                        <p className="font-medium">{campaign.responsable}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Estado</p>
                        <Badge className={getStatusColor(campaign.estado)}>
                          {campaign.estado}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Materiales de la Campaña</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3 mb-4">
                      {materials.map((material, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                          <div>
                            <p className="font-medium">{material.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {material.type} • Subido el {new Date(material.uploadDate).toLocaleDateString('es-ES')}
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm">Ver</Button>
                            <Button variant="outline" size="sm">Descargar</Button>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="border-2 border-dashed rounded-lg p-8 text-center">
                      <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <p className="text-muted-foreground mb-2">Arrastra archivos aquí o haz clic para seleccionar</p>
                      <Button variant="outline" size="sm">
                        Subir Material
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Historial de Cambios</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {activityHistory.map((activity, index) => (
                        <div key={index} className="flex gap-3">
                          <div className="flex-shrink-0">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary text-secondary-foreground">
                              <Clock className="h-4 w-4" />
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium">{activity.action}</p>
                            <p className="text-xs text-muted-foreground">{activity.user}</p>
                            <p className="text-xs text-muted-foreground">{activity.timestamp}</p>
                            {activity.details && (
                              <p className="text-xs text-muted-foreground mt-1">{activity.details}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Metadatos</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <p className="text-sm text-muted-foreground">Creado por</p>
                      <p className="font-medium">{campaign.createdBy}</p>
                      <p className="text-xs text-muted-foreground">{campaign.createdAt}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Última modificación</p>
                      <p className="font-medium">{campaign.updatedBy}</p>
                      <p className="text-xs text-muted-foreground">{campaign.updatedAt}</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </main>

        {showEditForm && (
          <CampaignForm
            initialData={campaign}
            onClose={() => setShowEditForm(false)}
            onSubmit={handleEdit}
          />
        )}
      </div>
    </>
  );
};

export default CampaignDetailPage;