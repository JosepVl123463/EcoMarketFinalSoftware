import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

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

// sessionStorage: más seguro que localStorage (se borra al cerrar el tab, no se comparte entre tabs).
// En producción el backend también emite httpOnly cookie como segunda capa de seguridad.
const sessionStore = createJSONStorage(() =>
  typeof window !== 'undefined' ? sessionStorage : localStorage
);

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      setAuth: (user, token) => set({ user, token, isAuthenticated: true }),
      logout: () => set({ user: null, token: null, isAuthenticated: false }),
    }),
    {
      name: 'ecomarket-auth',
      storage: sessionStore,
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
