import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface User {
  id: string;
  email: string;
  fullName: string;
  phone?: string;
  role: 'customer' | 'provider' | 'admin';
  ecoScore: number;
  avatarUrl?: string;
  authMethod?: 'email' | 'google';
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  setAuth: (user: User, token: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      setAuth: (user, token) => {
        // El token se persiste en sessionStorage (se borra al cerrar el tab, no se comparte entre tabs).
        // El backend TAMBIÉN emite httpOnly cookie: en producción (mismo dominio) el cookie
        // es la fuente de verdad; en desarrollo cross-origin se usa el token de sessionStorage.
        set({ user, token, isAuthenticated: true });
      },
      logout: () => {
        set({ user: null, token: null, isAuthenticated: false });
      },
    }),
    {
      name: 'ecomarket-auth',
      // sessionStorage: más seguro que localStorage (no persiste entre sesiones de navegador)
      storage: {
        getItem: (name) => {
          const value = sessionStorage.getItem(name);
          return value ? JSON.parse(value) : null;
        },
        setItem: (name, value) => sessionStorage.setItem(name, JSON.stringify(value)),
        removeItem: (name) => sessionStorage.removeItem(name),
      },
      partialize: (state) => ({ user: state.user, token: state.token, isAuthenticated: state.isAuthenticated }),
    }
  )
);
