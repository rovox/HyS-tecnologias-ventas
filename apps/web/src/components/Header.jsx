import React from 'react';
import { Menu, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext.jsx';
import { useNavigate } from 'react-router-dom';

const Header = ({ onMenuClick }) => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/public-dashboard');
  };

  return (
    <header className="sticky top-0 z-30 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-16 items-center justify-between px-4 lg:px-8">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={onMenuClick} className="lg:hidden">
            <Menu className="h-6 w-6" />
          </Button>
          <div className="flex items-center gap-2 lg:hidden">
            <img 
              src="https://horizons-cdn.hostinger.com/953104e8-38fd-49dd-9e9d-05691d6b9e35/76c659f73df9e65530b4b8590c65d5d1.jpg" 
              alt="H&S Tecnologías" 
              className="h-8 w-8 object-contain bg-transparent"
            />
            <span className="font-bold text-lg text-foreground tracking-tight">H&S Control</span>
          </div>
        </div>

        <div className="flex items-center gap-4 ml-auto">
          <div className="hidden sm:flex flex-col items-end mr-2 text-right">
            <p className="text-sm font-semibold leading-none">{currentUser?.name || 'Usuario'}</p>
            <p className="text-xs text-muted-foreground capitalize mt-1">{currentUser?.role?.replace('_', ' ')}</p>
          </div>
          <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
            {currentUser?.name?.charAt(0) || 'U'}
          </div>
          <Button variant="ghost" size="sm" onClick={handleLogout} className="text-muted-foreground hover:text-destructive hidden sm:flex">
            <LogOut className="h-4 w-4 mr-2" />
            Salir
          </Button>
        </div>
      </div>
    </header>
  );
};

export default Header;