import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import Header from '@/components/Header.jsx';
import Sidebar from '@/components/Sidebar.jsx';
import SurveyForm from '@/components/SurveyForm.jsx';
import { Helmet } from 'react-helmet';

const SurveysPage = () => {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const surveys = [
    { id: 1, cliente: 'Corporación Industrial', direccion: 'Zona Industrial Norte', motivo: 'Evaluación de sistema de seguridad perimetral', fecha: '2026-06-12', hora: '14:00', responsable: 'Rodrigo' },
    { id: 2, cliente: 'Residencial Los Pinos', direccion: 'Urbanización Norte', motivo: 'Asistencia técnica en cámaras', fecha: '2026-06-13', hora: '10:00', responsable: 'Wilson' },
    { id: 3, cliente: 'Almacén Central', direccion: 'Av. Logística 234', motivo: 'Relevamiento para control de acceso', fecha: '2026-06-14', hora: '09:30', responsable: 'Ronald' },
    { id: 4, cliente: 'Oficinas Ejecutivas', direccion: 'Torre Empresarial', motivo: 'Evaluación de red de datos', fecha: '2026-06-15', hora: '15:00', responsable: 'Rodrigo' },
    { id: 5, cliente: 'Condominio Vista Mar', direccion: 'Zona Costera', motivo: 'Asistencia en sistema de alarmas', fecha: '2026-06-16', hora: '11:30', responsable: 'Vanessa' },
    { id: 6, cliente: 'Parque Industrial', direccion: 'Sector Industrial Sur', motivo: 'Relevamiento de cerco eléctrico', fecha: '2026-06-17', hora: '08:00', responsable: 'Marcelo' },
  ];

  const filteredSurveys = surveys.filter(survey =>
    survey.cliente.toLowerCase().includes(searchQuery.toLowerCase()) ||
    survey.direccion.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreateSurvey = (formData) => {
    console.log('Creating survey:', formData);
  };

  return (
    <>
      <Helmet>
        <title>Relevamientos y Asistencias - H&S Tecnologías</title>
        <meta name="description" content="Gestión de relevamientos técnicos y asistencias" />
      </Helmet>

      <div className="min-h-screen bg-background">
        <Header onMenuClick={() => setSidebarOpen(true)} />
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        <main className="md:pl-64 transition-all duration-300">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-3xl font-bold mb-2">Relevamientos y Asistencias</h1>
                <p className="text-muted-foreground">Gestiona relevamientos técnicos y asistencias programadas</p>
              </div>
              <Button
                onClick={() => setShowCreateForm(true)}
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                <Plus className="mr-2 h-4 w-4" />
                Crear Nuevo Relevamiento
              </Button>
            </div>

            <Card className="mb-6">
              <CardContent className="p-6">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder="Buscar por cliente o dirección..."
                    className="pl-9 bg-background text-foreground"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Relevamientos Programados ({filteredSurveys.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Cliente</TableHead>
                        <TableHead>Dirección</TableHead>
                        <TableHead>Motivo</TableHead>
                        <TableHead>Fecha</TableHead>
                        <TableHead>Hora</TableHead>
                        <TableHead>Responsable</TableHead>
                        <TableHead className="text-right">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredSurveys.map((survey) => (
                        <TableRow
                          key={survey.id}
                          className="cursor-pointer hover:bg-muted/50"
                          onClick={() => navigate(`/surveys/${survey.id}`)}
                        >
                          <TableCell className="font-medium">{survey.cliente}</TableCell>
                          <TableCell>{survey.direccion}</TableCell>
                          <TableCell>{survey.motivo}</TableCell>
                          <TableCell>{new Date(survey.fecha).toLocaleDateString('es-ES')}</TableCell>
                          <TableCell>{survey.hora}</TableCell>
                          <TableCell>{survey.responsable}</TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/surveys/${survey.id}`);
                              }}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {filteredSurveys.length === 0 && (
                  <div className="text-center py-12">
                    <p className="text-muted-foreground">No se encontraron relevamientos</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </main>

        {showCreateForm && (
          <SurveyForm
            onClose={() => setShowCreateForm(false)}
            onSubmit={handleCreateSurvey}
          />
        )}
      </div>
    </>
  );
};

export default SurveysPage;