/*import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { User, Profile, AuthState } from '../types';
import { meService } from '../services/meService';

interface AuthActions {
  setAccessToken: (token: string | null) => void;
  setUser: (user: User | null) => void;
  setPerfil: (perfil: Profile | null) => void;
  setLoading: (loading: boolean) => void;
  login: (token: string, user: User) => Promise<void>;
  fetchMe: () => Promise<void>;
  logout: () => void;
}

export const useAuthStore = create<AuthState & AuthActions>()(
  persist(
    (set, get) => ({
      accessToken: null,
      user: null,
      perfil: null,
      loading: false,
      error: null,

      setAccessToken: (token) => set({ accessToken: token }),
      setUser: (user) => set({ user }),
      setPerfil: (perfil) => set({ perfil }),
      setLoading: (loading) => set({ loading }),

      login: async (token, user) => {
        set({ accessToken: token, user, loading: true });
        try {
          const { perfil } = await meService.getMe();
          set({ perfil, loading: false });
        } catch (error) {
          set({ error: 'Error al obtener perfil', loading: false });
        }
      },

      fetchMe: async () => {
        if (!get().accessToken) return;
        set({ loading: true });
        try {
          const { user, perfil } = await meService.getMe();
          set({ user, perfil, loading: false });
        } catch (error) {
          set({ accessToken: null, user: null, perfil: null, loading: false });
        }
      },

      logout: () => {
        set({ accessToken: null, user: null, perfil: null, error: null });
        localStorage.removeItem('nexus-auth-storage');
      }
    }),
    {
      name: 'nexus-auth-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ accessToken: state.accessToken }),
    }
  )
);*/

// store/authStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type User = { id: string; email: string; role?: string };

type AuthState = {
  token: string | null;
  user: User | null;

  // perfil puede ser null (usuario nuevo)
  perfil: any | null;

  // meLoaded diferencia: "no he consultado /me" vs "perfil realmente null"
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

      setSession: (token, user) =>
        set({ token, user, isAuthenticated: true }),

      setMe: ({ perfil }) =>
        set({ perfil, meLoaded: true }),

      logout: () =>
        set({ token: null, user: null, perfil: null, meLoaded: false, isAuthenticated: false }),
    }),
    {
      name: 'nexus_auth',
      partialize: (s) => ({
        token: s.token,
        user: s.user,
        isAuthenticated: s.isAuthenticated,
        perfil: s.perfil,
        meLoaded: s.meLoaded,
      }),
    }
  )
);

