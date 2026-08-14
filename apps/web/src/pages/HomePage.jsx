import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, Camera, Zap, Users, ArrowRight, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';

const HomePage = () => {
  const features = [
    {
      icon: Shield,
      title: 'Seguridad Integral',
      description: 'Sistemas de seguridad completos para empresas y hogares con tecnología de última generación.',
    },
    {
      icon: Camera,
      title: 'Videovigilancia',
      description: 'Cámaras de alta definición con monitoreo remoto y almacenamiento en la nube.',
    },
    {
      icon: Zap,
      title: 'Control de Acceso',
      description: 'Sistemas biométricos y tarjetas inteligentes para control de acceso empresarial.',
    },
    {
      icon: Users,
      title: 'Soporte 24/7',
      description: 'Equipo técnico disponible las 24 horas para atender cualquier emergencia.',
    },
  ];

  const services = [
    'Instalación de sistemas de seguridad',
    'Mantenimiento preventivo y correctivo',
    'Consultoría en seguridad empresarial',
    'Monitoreo remoto 24/7',
    'Integración de sistemas',
    'Capacitación de personal',
  ];

  return (
    <>
      <Helmet>
        <title>H&S Tecnologías - Sistemas de Seguridad Empresarial</title>
        <meta name="description" content="Soluciones integrales de seguridad para empresas. Instalación, mantenimiento y monitoreo de sistemas de videovigilancia, control de acceso y alarmas." />
      </Helmet>

      <div className="min-h-screen bg-[hsl(var(--corporate-dark))]">
        <header className="sticky top-0 z-40 w-full border-b border-white/10 bg-[hsl(var(--corporate-dark))]/95 backdrop-blur supports-[backdrop-filter]:bg-[hsl(var(--corporate-dark))]/60">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex h-16 items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary text-secondary-foreground font-bold text-lg">
                  H&S
                </div>
                <div>
                  <h1 className="text-lg font-semibold text-white">H&S Tecnologías</h1>
                  <p className="text-xs text-white/70">Seguridad Empresarial</p>
                </div>
              </div>
              <Link to="/login">
                <Button className="bg-secondary text-secondary-foreground hover:bg-secondary/90">
                  Ir al Sistema
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </header>

        <main>
          <section className="relative min-h-[600px] flex items-center">
            <div className="absolute inset-0 z-0">
              <img
                src="https://images.unsplash.com/photo-1574311382329-80bcc540bd52"
                alt="Tecnología de seguridad moderna"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-[hsl(var(--corporate-dark))]/95 to-[hsl(var(--corporate-dark))]/70 mix-blend-multiply"></div>
            </div>

            <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="max-w-3xl"
              >
                <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight" style={{ letterSpacing: '-0.02em' }}>
                  Protegemos lo que más importa para tu empresa
                </h2>
                <p className="text-xl text-white/90 mb-8 leading-relaxed max-w-2xl">
                  Soluciones integrales de seguridad con tecnología de vanguardia. Más de 15 años protegiendo empresas en toda la región.
                </p>
                <div className="flex flex-wrap gap-4">
                  <Link to="/login">
                    <Button size="lg" className="bg-secondary text-secondary-foreground hover:bg-secondary/90 text-lg px-8">
                      Acceder al Sistema
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                  </Link>
                  <Button size="lg" variant="outline" className="bg-white/10 text-white border-white/30 hover:bg-white/20 text-lg px-8">
                    Solicitar Cotización
                  </Button>
                </div>
              </motion.div>
            </div>
          </section>

          <section className="py-20 bg-[hsl(var(--corporate-dark))]">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                viewport={{ once: true }}
                className="text-center mb-16"
              >
                <h2 className="text-3xl md:text-4xl font-bold mb-4 text-white">Nuestras Soluciones</h2>
                <p className="text-lg text-white/70 max-w-2xl mx-auto">
                  Tecnología de punta para garantizar la seguridad de tu negocio
                </p>
              </motion.div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {features.map((feature, index) => {
                  const Icon = feature.icon;
                  return (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: index * 0.1 }}
                      viewport={{ once: true }}
                    >
                      <Card className="h-full bg-white/5 border-white/10 hover:bg-white/10 transition-all duration-200">
                        <CardContent className="p-6">
                          <div className="flex items-start gap-4">
                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-secondary/10 text-secondary flex-shrink-0">
                              <Icon className="h-6 w-6" />
                            </div>
                            <div>
                              <h3 className="text-xl font-semibold mb-2 text-white">{feature.title}</h3>
                              <p className="text-white/70 leading-relaxed">{feature.description}</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </section>

          <section className="py-20 bg-[hsl(var(--sidebar-bg))]/10 border-y border-white/5">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6 }}
                  viewport={{ once: true }}
                >
                  <h2 className="text-3xl md:text-4xl font-bold mb-6 text-white">Servicios Profesionales</h2>
                  <p className="text-lg text-white/80 mb-8 leading-relaxed">
                    Ofrecemos un portafolio completo de servicios diseñados para cubrir todas las necesidades de seguridad de tu empresa.
                  </p>
                  <div className="space-y-3">
                    {services.map((service, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.4, delay: index * 0.1 }}
                        viewport={{ once: true }}
                        className="flex items-center gap-3"
                      >
                        <CheckCircle className="h-5 w-5 text-secondary flex-shrink-0" />
                        <span className="text-white/90">{service}</span>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6 }}
                  viewport={{ once: true }}
                  className="relative"
                >
                  <Card className="p-8 bg-white/5 border-white/10 shadow-xl backdrop-blur-md">
                    <h3 className="text-2xl font-bold mb-6 text-white">¿Por qué elegirnos?</h3>
                    <div className="space-y-6">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <div className="h-2 w-2 rounded-full bg-secondary"></div>
                          <h4 className="font-semibold text-white">Experiencia Comprobada</h4>
                        </div>
                        <p className="text-white/70 text-sm pl-4">Más de 15 años protegiendo empresas de diversos sectores</p>
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <div className="h-2 w-2 rounded-full bg-secondary"></div>
                          <h4 className="font-semibold text-white">Tecnología Avanzada</h4>
                        </div>
                        <p className="text-white/70 text-sm pl-4">Equipos de última generación con garantía internacional</p>
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <div className="h-2 w-2 rounded-full bg-secondary"></div>
                          <h4 className="font-semibold text-white">Soporte Continuo</h4>
                        </div>
                        <p className="text-white/70 text-sm pl-4">Equipo técnico disponible 24/7 para emergencias</p>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              </div>
            </div>
          </section>

          <section className="py-20 bg-[hsl(var(--sidebar-bg))] text-white">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                viewport={{ once: true }}
              >
                <h2 className="text-3xl md:text-4xl font-bold mb-6">¿Listo para proteger tu empresa?</h2>
                <p className="text-xl mb-8 text-white/90 leading-relaxed">
                  Accede a nuestro sistema de gestión para programar instalaciones, relevamientos y dar seguimiento a tus proyectos.
                </p>
                <Link to="/login">
                  <Button size="lg" className="bg-white text-[hsl(var(--sidebar-bg))] hover:bg-white/90 text-lg px-8 font-bold">
                    Acceder al Sistema
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
              </motion.div>
            </div>
          </section>
        </main>

        <footer className="border-t border-white/10 bg-[hsl(var(--corporate-dark))] py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary text-secondary-foreground font-bold text-lg">
                  H&S
                </div>
                <div>
                  <p className="font-semibold text-white">H&S Tecnologías</p>
                  <p className="text-sm text-white/60">Seguridad Empresarial</p>
                </div>
              </div>
              <div className="flex gap-6 text-sm text-white/60">
                <a href="#" className="hover:text-white transition-colors">Política de Privacidad</a>
                <a href="#" className="hover:text-white transition-colors">Términos de Servicio</a>
              </div>
              <p className="text-sm text-white/60">
                © 2026 H&S Tecnologías. Todos los derechos reservados.
              </p>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
};

export default HomePage;