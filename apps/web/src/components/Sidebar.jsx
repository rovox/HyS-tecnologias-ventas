import React, { useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Briefcase, Target, Building2, PackageOpen, ActivitySquare, CarFront, FileStack, Megaphone, FileText, ClipboardList, Settings, LogOut, Menu, Package, ChevronDown, ChevronRight, Receipt, BadgeDollarSign } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext.jsx';
import { cn } from '@/lib/utils.js';

const Sidebar = ({ isOpen, setIsOpen }) => {
  const { userRole, logout, currentUser } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [expandedMenus, setExpandedMenus] = useState({
    'Cronogramas': true
  });

  const closeSidebar = () => {
    if (typeof setIsOpen === 'function') setIsOpen(false);
  };

  const handleLinkClick = () => {
    if (window.innerWidth < 1024) {
      closeSidebar();
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const toggleMenu = (title) => {
    setExpandedMenus(prev => ({
      ...prev,
      [title]: !prev[title]
    }));
  };

  const menuSections = [
    {
      title: 'PRINCIPAL',
      items: [
        { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', allowedRoles: ['ADMINISTRADOR', 'VENTAS / ADMINISTRACIÓN', 'SEGURIDAD ELECTRÓNICA', 'Contadora'] }
      ]
    },
    {
      title: 'OPERACIONES',
      items: [
        { 
          label: 'Cronogramas', 
          icon: Briefcase, 
          allowedRoles: ['ADMINISTRADOR', 'VENTAS / ADMINISTRACIÓN', 'SEGURIDAD ELECTRÓNICA', 'Contadora'],
          children: [
            { to: '/schedule', label: 'Instalaciones/Proyectos' },
            { to: '/surveys', label: 'Relevamientos/Asistencias' }
          ]
        },
        { to: '/clientes', icon: Building2, label: 'Clientes', allowedRoles: ['ADMINISTRADOR', 'VENTAS / ADMINISTRACIÓN', 'Contadora', 'SEGURIDAD ELECTRÓNICA'] },
        { to: '/pedidos-internos', icon: PackageOpen, label: 'Pedidos Internos', allowedRoles: ['ADMINISTRADOR', 'VENTAS / ADMINISTRACIÓN', 'SEGURIDAD ELECTRÓNICA', 'Contadora'] },
        { to: '/gastos-operativos', icon: Receipt, label: 'Gastos Operativos', allowedRoles: ['ADMINISTRADOR', 'VENTAS / ADMINISTRACIÓN', 'SEGURIDAD ELECTRÓNICA', 'Contadora'] },
        { to: '/activity-wall', icon: ActivitySquare, label: 'Muro de Actividad', allowedRoles: ['ADMINISTRADOR', 'VENTAS / ADMINISTRACIÓN', 'SEGURIDAD ELECTRÓNICA', 'Contadora'] }
      ]
    },
    {
      title: 'GESTIÓN',
      items: [
        { to: '/vehicle-control', icon: CarFront, label: 'Control Vehicular', allowedRoles: ['ADMINISTRADOR', 'VENTAS / ADMINISTRACIÓN', 'SEGURIDAD ELECTRÓNICA', 'Contadora'] },
        { to: '/marketing', icon: Megaphone, label: 'Marketing', allowedRoles: ['ADMINISTRADOR', 'VENTAS / ADMINISTRACIÓN', 'SEGURIDAD ELECTRÓNICA'] },
        { to: '/quotations', icon: FileStack, label: 'Cotizaciones', allowedRoles: ['ADMINISTRADOR', 'VENTAS / ADMINISTRACIÓN', 'Contadora', 'SEGURIDAD ELECTRÓNICA'] },

      ]
    },
    {
      title: 'ADMINISTRACIÓN',
      items: [
        { to: '/reports', icon: FileText, label: 'Reportes', allowedRoles: ['ADMINISTRADOR', 'VENTAS / ADMINISTRACIÓN', 'Contadora'] },
        { to: '/accounting', icon: Package, label: 'Costos Operativos', allowedRoles: ['ADMINISTRADOR', 'VENTAS / ADMINISTRACIÓN', 'Contadora'] },
        { to: '/finanzas', icon: BadgeDollarSign, label: 'Finanzas y Contabilidad', allowedRoles: ['ADMINISTRADOR', 'VENTAS / ADMINISTRACIÓN', 'Contadora'] },
        { to: '/admin/management', icon: ClipboardList, label: 'Panel de Control', allowedRoles: ['ADMINISTRADOR'] },
        { to: '/configuration', icon: Settings, label: 'Configuración', allowedRoles: ['ADMINISTRADOR'] }
      ]
    }
  ];

  const getProfileInitial = () => {
    if (currentUser?.name) return currentUser.name.charAt(0).toUpperCase();
    return 'U';
  };

  return (
    <>
      <div 
        className={cn(
          "fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden transition-opacity duration-300",
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={closeSidebar}
      />

      <aside 
        className={cn(
          "fixed top-0 left-0 z-50 h-full w-72 text-white transform transition-transform duration-300 ease-in-out flex flex-col shadow-2xl lg:shadow-none lg:translate-x-0 border-r border-white/10",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
        style={{ background: 'linear-gradient(180deg, #001F4D 0%, #002B66 100%)' }}
      >
        <div className="flex items-center justify-between p-4 shrink-0 border-b border-white/10 relative">
          <div className="flex flex-col items-center w-full gap-2 mt-2">
            <div className="bg-white rounded-xl shadow-lg w-32 h-32 flex items-center justify-center overflow-hidden">
              <img 
                src="/branding/logo.svg" 
                alt="H&S Tecnologías" 
                className="w-full h-full object-cover mix-blend-multiply"
              />
            </div>
            <span className="font-black text-lg tracking-wide text-white mt-1 text-center leading-tight">
              H&S Tecnologías
            </span>
          </div>
          <button onClick={closeSidebar} className="absolute top-4 right-4 lg:hidden text-white/70 hover:text-white bg-black/20 p-1 rounded-md">
            <Menu className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto py-6 px-3 custom-scrollbar">
          {menuSections.map((section, secIdx) => {
            const visibleItems = section.items.filter(item => item.allowedRoles.includes(userRole));
            if (visibleItems.length === 0) return null;

            return (
              <div key={secIdx} className="mb-6">
                <div className="text-[10px] font-extrabold text-blue-200/50 uppercase tracking-widest mb-2 px-4">
                  {section.title}
                </div>
                <div className="space-y-1">
                  {visibleItems.map((item, itemIdx) => {
                    if (item.children) {
                      const isExpanded = expandedMenus[item.label];
                      const isChildActive = item.children.some(child => location.pathname.startsWith(child.to));
                      
                      return (
                        <div key={itemIdx} className="flex flex-col">
                          <button
                            onClick={() => toggleMenu(item.label)}
                            className={cn(
                              "flex items-center justify-between px-4 py-2.5 rounded-xl transition-all duration-200 group relative overflow-hidden text-sm w-full",
                              isChildActive ? "text-white font-bold bg-white/5" : "text-blue-100 hover:text-white hover:bg-white/5 font-medium"
                            )}
                          >
                            <div className="flex items-center gap-3">
                              <item.icon className={cn("h-4 w-4 shrink-0 transition-transform duration-300", isChildActive ? "text-blue-300 scale-110" : "group-hover:scale-110")} />
                              <span>{item.label}</span>
                            </div>
                            {isExpanded ? <ChevronDown className="h-4 w-4 opacity-50" /> : <ChevronRight className="h-4 w-4 opacity-50" />}
                          </button>
                          
                          {isExpanded && (
                            <div className="mt-1 ml-4 border-l border-blue-400/20 pl-2 space-y-1">
                              {item.children.map((child, cIdx) => {
                                const isActive = location.pathname.startsWith(child.to);
                                return (
                                  <NavLink
                                    key={cIdx}
                                    to={child.to}
                                    onClick={handleLinkClick}
                                    className={cn(
                                      "flex items-center gap-3 px-4 py-2 rounded-lg transition-all duration-200 relative text-sm",
                                      isActive 
                                        ? "bg-[#38517A] text-white font-bold shadow-md" 
                                        : "text-blue-100/80 hover:text-white hover:bg-white/10 font-medium"
                                    )}
                                  >
                                    <span className="truncate">{child.label}</span>
                                  </NavLink>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    }

                    const isActive = location.pathname.startsWith(item.to);
                    return (
                      <NavLink
                        key={itemIdx}
                        to={item.to}
                        onClick={handleLinkClick}
                        className={cn(
                          "flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200 group relative overflow-hidden text-sm",
                          isActive 
                            ? "bg-[#38517A] text-white font-bold shadow-md" 
                            : "text-blue-100 hover:text-white hover:bg-white/5 font-medium"
                        )}
                      >
                        {isActive && <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-300 rounded-r-full shadow-[0_0_8px_rgba(147,197,253,0.5)]" />}
                        <item.icon className={cn("h-4 w-4 shrink-0 transition-transform duration-300", isActive ? "text-blue-300 scale-110" : "group-hover:scale-110")} />
                        <span className="truncate">{item.label}</span>
                      </NavLink>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        <div className="p-4 border-t border-white/10 shrink-0 bg-[#001533]/40 flex items-center justify-between">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="h-9 w-9 rounded-full bg-[#38517A] border border-blue-400/30 flex items-center justify-center shrink-0">
              <span className="font-bold text-sm text-white">
                {currentUser?.name ? currentUser.name.charAt(0).toUpperCase() : 'U'}
              </span>
            </div>
            <div className="flex flex-col overflow-hidden">
              <span className="text-xs text-blue-200/70 font-medium">Usuario Activo</span>
              <span className="text-sm font-bold text-white truncate" title={userRole}>
                {userRole?.split('/')[0] || 'Administrador'}
              </span>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="p-2 text-blue-200 hover:text-white hover:bg-red-500/80 rounded-lg transition-colors"
            title="Cerrar Sesión"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;