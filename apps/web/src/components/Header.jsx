import React from 'react';
import { Menu, Activity } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext.jsx';
import { cn } from '@/lib/utils.js';

const Header = ({ onMenuClick, activityOpen = false, onToggleActivity }) => {
  const { currentUser } = useAuth();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-16 items-center justify-between px-4 lg:px-8 gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <Button
            variant="ghost"
            size="icon"
            onClick={onMenuClick}
            className="lg:hidden min-h-11 min-w-11"
            aria-label="Abrir menú"
          >
            <Menu className="h-6 w-6" />
          </Button>
          <div className="flex items-center gap-2 lg:hidden min-w-0">
            <img
              src="/branding/hyslogo.jpg"
              alt="H&S Tecnologías"
              className="h-8 w-8 object-contain shrink-0"
            />
            <span className="font-bold text-base text-foreground tracking-tight truncate">H&S Control</span>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 ml-auto min-w-0">
          <div className="hidden sm:flex flex-col items-end mr-1 text-right min-w-0">
            <p className="text-sm font-semibold leading-none truncate max-w-[10rem]">{currentUser?.name || 'Usuario'}</p>
            <p className="text-xs text-muted-foreground mt-1 truncate max-w-[10rem]">{currentUser?.role}</p>
          </div>
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold shrink-0">
            {currentUser?.name?.charAt(0) || 'U'}
          </div>
          <Button
            type="button"
            variant={activityOpen ? 'default' : 'outline'}
            size="default"
            onClick={onToggleActivity}
            aria-pressed={activityOpen}
            aria-label={activityOpen ? 'Cerrar cronograma y actividad' : 'Abrir cronograma y actividad'}
            className={cn('min-h-11 font-semibold', activityOpen && 'shadow-md')}
          >
            <Activity className="h-5 w-5" />
            <span className="hidden xs:inline sm:inline">Actividad</span>
          </Button>
        </div>
      </div>
    </header>
  );
};

export default Header;
