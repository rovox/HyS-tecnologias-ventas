import React from 'react';
import { Helmet } from 'react-helmet';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext.jsx';
import { Button } from '@/components/ui/button.jsx';
import { ShieldOff } from 'lucide-react';

/** Usuarios con rol SIN ACCESO: sin menú, solo mensaje y logout. */
const NoAccessPage = () => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <>
      <Helmet>
        <title>Sin acceso - H&S Tecnologías</title>
      </Helmet>
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="max-w-md w-full text-center space-y-6">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-muted">
            <ShieldOff className="h-7 w-7 text-muted-foreground" aria-hidden />
          </div>
          <div className="space-y-2">
            <h1 className="text-xl font-semibold tracking-tight">Sin acceso asignado</h1>
            <p className="text-sm text-muted-foreground">
              Hola{currentUser?.name ? `, ${currentUser.name}` : ''}. Tu cuenta está activa pero aún no
              tienes vistas operativas. Contacta a tu administrador para que te asigne permisos.
            </p>
          </div>
          <Button type="button" variant="outline" onClick={handleLogout}>
            Cerrar sesión
          </Button>
        </div>
      </div>
    </>
  );
};

export default NoAccessPage;
