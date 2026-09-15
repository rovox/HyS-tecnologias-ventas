import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet';
import { Link, useNavigate, useParams } from 'react-router-dom';
import Layout from '@/components/Layout.jsx';
import { useAuth } from '@/contexts/AuthContext.jsx';
import authService from '@/services/auth/index.js';
import goalsService from '@/services/goals/index.js';
import { ROLES } from '@/config/nav.js';
import { Badge } from '@/components/ui/badge.jsx';
import { Button } from '@/components/ui/button.jsx';
import { Skeleton } from '@/components/ui/skeleton.jsx';
import { toast } from 'sonner';

const UserProfilePage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser, isAdmin } = useAuth();
  const [user, setUser] = useState(null);
  const [goal, setGoal] = useState(null);
  const [loading, setLoading] = useState(true);

  const canView = isAdmin() || currentUser?.id === id;

  useEffect(() => {
    if (!canView) {
      toast.error('Sin acceso a este perfil');
      navigate('/dashboard', { replace: true });
      return;
    }
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const users = await authService.listUsers();
        const found = (users || []).find((u) => u.id === id) || null;
        if (!cancelled) setUser(found);
        if (found && (found.role === ROLES.VENTAS || found.role === ROLES.ADMIN)) {
          try {
            const goals = await goalsService.listSellerGoals();
            const g = (goals || []).find((row) => row.userId === id || row.usuarioId === id || row.user_id === id);
            if (!cancelled) setGoal(g || null);
          } catch {
            if (!cancelled) setGoal(null);
          }
        }
      } catch {
        if (!cancelled) setUser(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [id, canView, navigate]);

  return (
    <Layout>
      <Helmet><title>Perfil · H&S</title></Helmet>
      <div className="content-container py-6 space-y-4 max-w-2xl">
        <div className="flex items-center justify-between gap-2">
          <h1 className="text-2xl font-extrabold tracking-tight">Perfil de usuario</h1>
          <Button variant="outline" asChild><Link to="/dashboard">Volver</Link></Button>
        </div>
        {loading ? (
          <Skeleton className="h-40 w-full rounded-2xl" />
        ) : !user ? (
          <p className="text-sm text-muted-foreground">Usuario no encontrado.</p>
        ) : (
          <div className="rounded-2xl border bg-card p-5 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xl font-bold">{user.name}</p>
                <p className="text-sm text-muted-foreground">{user.email}</p>
              </div>
              <Badge variant="outline" className="font-bold">{user.role}</Badge>
            </div>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <div>
                <dt className="text-muted-foreground font-semibold">Teléfono</dt>
                <dd className="font-bold">{user.phone || '—'}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground font-semibold">Sucursal</dt>
                <dd className="font-bold">{user.sucursalId || user.sucursal_id || user.department || '—'}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground font-semibold">Estado</dt>
                <dd className="font-bold">{user.active === false ? 'Inactivo' : 'Activo'}</dd>
              </div>
              {goal ? (
                <div>
                  <dt className="text-muted-foreground font-semibold">Meta mensual</dt>
                  <dd className="font-bold tabular-nums">
                    Bs {Number(goal.metaMonto ?? goal.monthly_goal ?? goal.monto ?? 0).toFixed(0)}
                  </dd>
                </div>
              ) : null}
            </dl>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default UserProfilePage;
