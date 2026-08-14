import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Edit, Trash2, Upload, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Header from '@/components/Header.jsx';
import Sidebar from '@/components/Sidebar.jsx';
import SurveyForm from '@/components/SurveyForm.jsx';
import { Helmet } from 'react-helmet';

const SurveyDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);

  const survey = {
    id: id,
    cliente: 'Corporación Industrial',
    direccion: 'Zona Industrial Norte, Lote 45',
    motivo: 'Evaluación de sistema de seguridad perimetral',
    fecha: '2026-06-12',
    hora: '14:00',
    monto: 450.00,
    adelanto: 0,
    responsable: 'Rodrigo',
    observaciones: 'Relevamiento para instalación de cerco eléctrico. Perímetro aproximado de 200 metros.',
    createdBy: 'Stephany',
    createdAt: '2026-06-02 09:15',
    updatedBy: 'Rodrigo',
    updatedAt: '2026-06-06 16:45',
  };

  const activityHistory = [
    { user: 'Rodrigo', action: 'Actualizó observaciones', timestamp: '2026-06-06 16:45', details: 'Agregó medidas del perímetro' },
    { user: 'Stephany', action: 'Asignó responsable', timestamp: '2026-06-02 11:30', details: 'Responsable: Rodrigo' },
    { user: 'Stephany', action: 'Creó el relevamiento', timestamp: '2026-06-02 09:15', details: 'Relevamiento inicial creado' },
  ];

  const handleDelete = () => {
    if (window.confirm('¿Está seguro de eliminar este relevamiento?')) {
      navigate('/surveys');
    }
  };

  const handleEdit = (formData) => {
    console.log('Updating survey:', formData);
  };

  return (
    <>
      <Helmet>
        <title>Detalle de Relevamiento - H&S Tecnologías</title>
        <meta name="description" content="Detalles del relevamiento y asistencia técnica" />
      </Helmet>

      <div className="min-h-screen bg-background">
        <Header onMenuClick={() => setSidebarOpen(true)} />
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        <main className="md:pl-64 transition-all duration-300">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="mb-6">
              <Button
                variant="ghost"
                onClick={() => navigate('/surveys')}
                className="mb-4"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Volver a Relevamientos
              </Button>

              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold">{survey.cliente}</h1>
                  <p className="text-muted-foreground mt-1">{survey.direccion}</p>
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
                    <CardTitle>Información del Relevamiento</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">Motivo</p>
                      <p className="font-medium text-lg">{survey.motivo}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                      <div>
                        <p className="text-sm text-muted-foreground">Responsable</p>
                        <p className="font-medium">{survey.responsable}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Fecha</p>
                        <p className="font-medium">{new Date(survey.fecha).toLocaleDateString('es-ES')}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Hora</p>
                        <p className="font-medium">{survey.hora}</p>
                      </div>
                      {survey.monto > 0 && (
                        <>
                          <div>
                            <p className="text-sm text-muted-foreground">Monto</p>
                            <p className="font-medium">${survey.monto.toFixed(2)}</p>
                          </div>
                          {survey.adelanto > 0 && (
                            <div>
                              <p className="text-sm text-muted-foreground">Adelanto</p>
                              <p className="font-medium">${survey.adelanto.toFixed(2)}</p>
                            </div>
                          )}
                        </>
                      )}
                    </div>

                    {survey.observaciones && (
                      <div className="pt-4 border-t">
                        <p className="text-sm text-muted-foreground mb-2">Observaciones</p>
                        <p className="leading-relaxed">{survey.observaciones}</p>
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
                      <p className="font-medium">{survey.createdBy}</p>
                      <p className="text-xs text-muted-foreground">{survey.createdAt}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Última modificación</p>
                      <p className="font-medium">{survey.updatedBy}</p>
                      <p className="text-xs text-muted-foreground">{survey.updatedAt}</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </main>

        {showEditForm && (
          <SurveyForm
            initialData={survey}
            onClose={() => setShowEditForm(false)}
            onSubmit={handleEdit}
          />
        )}
      </div>
    </>
  );
};

export default SurveyDetailPage;