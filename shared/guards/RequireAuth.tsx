// shared/guards/RequireAuth.tsx
import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { meService } from '../../services/meService';

const RequireAuth: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const token = useAuthStore((s) => s.token);
  const meLoaded = useAuthStore((s) => s.meLoaded);
  const perfil = useAuthStore((s) => s.perfil);
  const setMe = useAuthStore((s) => s.setMe);
  const logout = useAuthStore((s) => s.logout);

  const location = useLocation();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const run = async () => {
      if (!token) {
        setLoading(false);
        return;
      }
      if (meLoaded) {
        setLoading(false);
        return;
      }
      try {
        const me = await meService.getMe();
        setMe({ perfil: me.perfil });
      } catch {
        logout();
      } finally {
        setLoading(false);
      }
    };
    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  if (!token) return <Navigate to="/login" replace state={{ from: location.pathname }} />;

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center opacity-70">
        Cargando perfil...
      </div>
    );
  }

  const isOnboarding = location.pathname.startsWith('/onboarding');

  // usuario nuevo => forzar onboarding
  if (meLoaded && perfil == null && !isOnboarding) return <Navigate to="/onboarding" replace />;

  // usuario con perfil => no debería estar en onboarding
  if (meLoaded && perfil != null && isOnboarding) return <Navigate to="/dashboard" replace />;

  return <>{children}</>;
};

export default RequireAuth;
