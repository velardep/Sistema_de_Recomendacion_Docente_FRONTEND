

// store/authStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type User = { id: string; email: string; role?: string; name?: string; };

type AuthState = {
  token: string | null;
  user: User | null;

  perfil: any | null;
  meLoaded: boolean;

  isAuthenticated: boolean;

  setSession: (token: string, user: User) => void;
  setMe: (payload: { perfil: any | null }) => void;

  logout: () => void;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      perfil: null,
      meLoaded: false,
      isAuthenticated: false,

      // ✅ IMPORTANTE: al iniciar sesión, limpiar perfil previo
      setSession: (token, user) =>
        set({
          token,
          user,
          isAuthenticated: true,
          perfil: null,
          meLoaded: false,
        }),

      setMe: ({ perfil }) =>
        set({ perfil, meLoaded: true }),

      logout: () => {
        set({ token: null, user: null, perfil: null, meLoaded: false, isAuthenticated: false });
        try { localStorage.removeItem('sipre_auth'); } catch {}
      },
    }),
    {
      name: 'sipre_auth',
      // ✅ Persistir SOLO lo mínimo; NO persistir banderas derivadas
      partialize: (s) => ({
        token: s.token,
        user: s.user,
        perfil: s.perfil,
      }),
    }
  )
);

