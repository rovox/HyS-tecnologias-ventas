import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Edit, Trash2, Upload, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Header from '@/components/Header.jsx';
import Sidebar from '@/components/Sidebar.jsx';
import JobForm from '@/components/JobForm.jsx';
import { Helmet } from 'react-helmet';

const JobDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);

  const job = {
    id: id,
    cliente: 'Banco Nacional',
    direccion: 'Av. Principal 123, Centro',
    tipoTrabajo: 'Instalación',
    fecha: '2026-06-15',
    hora: '09:00',
    monto: 2847.50,
    adelanto: 1200.00,
    responsable: 'Stephany',
    observaciones: 'Instalación de sistema de cámaras de seguridad en sucursal principal. Requiere coordinación con gerencia.',
    createdBy: 'admin',
    createdAt: '2026-06-01 10:30',
    updatedBy: 'Stephany',
    updatedAt: '2026-06-05 14:20',
  };

  const activityHistory = [
    { user: 'Stephany', action: 'Actualizó el monto', timestamp: '2026-06-05 14:20', details: 'Monto: $2,500.00 → $2,847.50' },
    { user: 'Stephany', action: 'Agregó observaciones', timestamp: '2026-06-03 11:15', details: 'Requiere coordinación con gerencia' },
    { user: 'admin', action: 'Creó el trabajo', timestamp: '2026-06-01 10:30', details: 'Trabajo inicial creado' },
  ];

  const handleDelete = () => {
    if (window.confirm('¿Está seguro de eliminar este trabajo?')) {
      navigate('/jobs');
    }
  };

  const handleEdit = (formData) => {
    console.log('Updating job:', formData);
  };

  return (
    <>
      <Helmet>
        <title>Detalle de Trabajo - H&S Tecnologías</title>
        <meta name="description" content="Detalles del trabajo de instalación y mantenimiento" />
      </Helmet>

      <div className="min-h-screen bg-background">
        <Header onMenuClick={() => setSidebarOpen(true)} />
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        <main className="md:pl-64 transition-all duration-300">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="mb-6">
              <Button
                variant="ghost"
                onClick={() => navigate('/jobs')}
                className="mb-4"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Volver a Trabajos
              </Button>

              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold">{job.cliente}</h1>
                  <p className="text-muted-foreground mt-1">{job.direccion}</p>
                </div>
                <div className="flex gap-2">
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
                    <CardTitle>Información del Trabajo</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Tipo de Trabajo</p>
                        <p className="font-medium">{job.tipoTrabajo}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Responsable</p>
                        <p className="font-medium">{job.responsable}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Fecha</p>
                        <p className="font-medium">{new Date(job.fecha).toLocaleDateString('es-ES')}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Hora</p>
                        <p className="font-medium">{job.hora}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Monto</p>
                        <p className="font-medium text-lg">${job.monto.toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Adelanto</p>
                        <p className="font-medium text-lg">${job.adelanto.toFixed(2)}</p>
                      </div>
                    </div>

                    {job.observaciones && (
                      <div className="pt-4 border-t">
                        <p className="text-sm text-muted-foreground mb-2">Observaciones</p>
                        <p className="leading-relaxed">{job.observaciones}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Fotografías</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="border-2 border-dashed rounded-lg p-8 text-center">
                      <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <p className="text-muted-foreground mb-2">Arrastra archivos aquí o haz clic para seleccionar</p>
                      <Button variant="outline" size="sm">
                        Seleccionar Archivos
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Historial de Actividad</CardTitle>
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
                      <p className="font-medium">{job.createdBy}</p>
                      <p className="text-xs text-muted-foreground">{job.createdAt}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Última modificación</p>
                      <p className="font-medium">{job.updatedBy}</p>
                      <p className="text-xs text-muted-foreground">{job.updatedAt}</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </main>

        {showEditForm && (
          <JobForm
            initialData={job}
            onClose={() => setShowEditForm(false)}
            onSubmit={handleEdit}
          />
        )}
      </div>
    </>
  );
};

export default JobDetailPage;