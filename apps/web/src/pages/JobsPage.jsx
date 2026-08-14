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
import JobForm from '@/components/JobForm.jsx';
import { Helmet } from 'react-helmet';

const JobsPage = () => {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const jobs = [
    { id: 1, cliente: 'Banco Nacional', direccion: 'Av. Principal 123', tipoTrabajo: 'Instalación', fecha: '2026-06-15', hora: '09:00', monto: 2847.50, responsable: 'Stephany' },
    { id: 2, cliente: 'Supermercado Central', direccion: 'Calle Comercio 456', tipoTrabajo: 'Mantenimiento', fecha: '2026-06-16', hora: '14:00', monto: 1250.00, responsable: 'Dennis Palacios' },
    { id: 3, cliente: 'Hotel Plaza', direccion: 'Av. Turística 789', tipoTrabajo: 'Actualización', fecha: '2026-06-17', hora: '10:30', monto: 3420.00, responsable: 'Stephany' },
    { id: 4, cliente: 'Fábrica Industrial', direccion: 'Zona Industrial 101', tipoTrabajo: 'Reparación', fecha: '2026-06-18', hora: '08:00', monto: 890.00, responsable: 'Rodrigo' },
    { id: 5, cliente: 'Centro Comercial Norte', direccion: 'Av. Norte 234', tipoTrabajo: 'Instalación', fecha: '2026-06-19', hora: '11:00', monto: 4150.00, responsable: 'Dennis Palacios' },
    { id: 6, cliente: 'Clínica Médica', direccion: 'Calle Salud 567', tipoTrabajo: 'Mantenimiento', fecha: '2026-06-20', hora: '15:30', monto: 1680.00, responsable: 'Wilson' },
    { id: 7, cliente: 'Universidad Técnica', direccion: 'Campus Central', tipoTrabajo: 'Instalación', fecha: '2026-06-21', hora: '09:30', monto: 5230.00, responsable: 'Stephany' },
    { id: 8, cliente: 'Edificio Corporativo', direccion: 'Av. Empresarial 890', tipoTrabajo: 'Actualización', fecha: '2026-06-22', hora: '13:00', monto: 2975.00, responsable: 'Marcelo' },
  ];

  const filteredJobs = jobs.filter(job =>
    job.cliente.toLowerCase().includes(searchQuery.toLowerCase()) ||
    job.direccion.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreateJob = (formData) => {
    console.log('Creating job:', formData);
  };

  return (
    <>
      <Helmet>
        <title>Cronograma de Trabajos - H&S Tecnologías</title>
        <meta name="description" content="Gestión de trabajos de instalación y mantenimiento" />
      </Helmet>

      <div className="min-h-screen bg-background">
        <Header onMenuClick={() => setSidebarOpen(true)} />
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        <main className="md:pl-64 transition-all duration-300">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-3xl font-bold mb-2">Cronograma de Trabajos</h1>
                <p className="text-muted-foreground">Gestiona instalaciones y mantenimientos programados</p>
              </div>
              <Button
                onClick={() => setShowCreateForm(true)}
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                <Plus className="mr-2 h-4 w-4" />
                Crear Nuevo Trabajo
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
                <CardTitle>Trabajos Programados ({filteredJobs.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Cliente</TableHead>
                        <TableHead>Dirección</TableHead>
                        <TableHead>Tipo de Trabajo</TableHead>
                        <TableHead>Fecha</TableHead>
                        <TableHead>Hora</TableHead>
                        <TableHead>Monto</TableHead>
                        <TableHead>Responsable</TableHead>
                        <TableHead className="text-right">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredJobs.map((job) => (
                        <TableRow
                          key={job.id}
                          className="cursor-pointer hover:bg-muted/50"
                          onClick={() => navigate(`/jobs/${job.id}`)}
                        >
                          <TableCell className="font-medium">{job.cliente}</TableCell>
                          <TableCell>{job.direccion}</TableCell>
                          <TableCell>{job.tipoTrabajo}</TableCell>
                          <TableCell>{new Date(job.fecha).toLocaleDateString('es-ES')}</TableCell>
                          <TableCell>{job.hora}</TableCell>
                          <TableCell>${job.monto.toFixed(2)}</TableCell>
                          <TableCell>{job.responsable}</TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/jobs/${job.id}`);
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

                {filteredJobs.length === 0 && (
                  <div className="text-center py-12">
                    <p className="text-muted-foreground">No se encontraron trabajos</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </main>

        {showCreateForm && (
          <JobForm
            onClose={() => setShowCreateForm(false)}
            onSubmit={handleCreateJob}
          />
        )}
      </div>
    </>
  );
};

export default JobsPage;