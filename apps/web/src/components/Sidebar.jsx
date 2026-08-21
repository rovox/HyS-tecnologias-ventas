import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { LogOut, Menu } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext.jsx';
import { menuSections } from '@/config/nav.js';
import { cn } from '@/lib/utils.js';

const Sidebar = ({ isOpen, setIsOpen }) => {
  const { userRole, logout, currentUser } = useAuth();
  const navigate = useNavigate();

  const closeSidebar = () => {
    if (typeof setIsOpen === 'function') setIsOpen(false);
  };

  const handleLinkClick = () => {
    if (window.innerWidth < 1024) closeSidebar();
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <>
      <div
        className={cn(
          'fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden transition-opacity duration-300',
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none',
        )}
        onClick={closeSidebar}
      />

      <aside
        className={cn(
          'fixed top-0 left-0 z-50 h-full w-[260px] bg-primary text-primary-foreground transform transition-transform duration-300 ease-in-out flex flex-col border-r border-white/10 lg:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="flex items-center justify-between p-4 shrink-0 border-b border-white/10 relative">
          <div className="flex items-center gap-3 w-full pr-8">
            <div className="bg-white rounded-lg w-12 h-12 flex items-center justify-center overflow-hidden shrink-0">
              <img
                src="/branding/hyslogo.jpg"
                alt="H&S Tecnologías"
                className="w-full h-full object-contain"
              />
            </div>
            <span className="font-bold text-base tracking-tight leading-tight">
              H&S Tecnologías
            </span>
          </div>
          <button
            type="button"
            onClick={closeSidebar}
            className="absolute top-3 right-3 lg:hidden min-h-11 min-w-11 flex items-center justify-center text-white/80 hover:text-white bg-black/20 rounded-md"
            aria-label="Cerrar menú"
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-4 px-3 custom-scrollbar">
          {menuSections.map((section) => {
            const visibleItems = section.items.filter((item) => item.allowedRoles.includes(userRole));
            if (visibleItems.length === 0) return null;

            return (
              <div key={section.title} className="mb-5">
                <div className="text-[11px] font-bold text-primary-foreground/50 uppercase tracking-widest mb-2 px-3">
                  {section.title}
                </div>
                <div className="space-y-1">
                  {visibleItems.map((item) => (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      onClick={handleLinkClick}
                      className={({ isActive }) =>
                        cn(
                          'flex items-center gap-3 px-3 min-h-11 rounded-xl text-sm font-semibold transition-colors',
                          isActive
                            ? 'bg-primary-container text-white'
                            : 'text-primary-foreground/80 hover:text-white hover:bg-white/10',
                        )
                      }
                    >
                      <item.icon className="h-5 w-5 shrink-0" />
                      <span className="truncate">{item.label}</span>
                    </NavLink>
                  ))}
                </div>
              </div>
            );
          })}
        </nav>

        <div className="p-3 border-t border-white/10 shrink-0 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className="h-10 w-10 rounded-full bg-primary-container flex items-center justify-center shrink-0 font-bold">
              {(currentUser?.name || 'U').charAt(0).toUpperCase()}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-semibold truncate">{currentUser?.name || 'Usuario'}</span>
              <span className="text-xs text-primary-foreground/70 truncate" title={userRole}>
                {userRole?.split('/')[0] || ''}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="min-h-11 min-w-11 flex items-center justify-center text-primary-foreground/80 hover:text-white hover:bg-destructive/80 rounded-lg"
            title="Cerrar sesión"
            aria-label="Cerrar sesión"
          >
            <LogOut className="h-5 w-5" />
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
