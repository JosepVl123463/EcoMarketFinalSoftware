import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// El token también se refleja en una cookie NO httpOnly únicamente para que el
// middleware de Next pueda hacer gating de rutas en el servidor (defensa en
// profundidad). La autorización real la impone el backend verificando el JWT en
// cada endpoint. La API sigue enviando el token por cabecera Authorization (no
// por cookie), por lo que no se introduce riesgo de CSRF.
const SESSION_COOKIE = 'eco_session';
function writeSessionCookie(token: string | null) {
  if (typeof document === 'undefined') return;
  if (token) {
    const secure = location.protocol === 'https:' ? '; Secure' : '';
    document.cookie = `${SESSION_COOKIE}=${encodeURIComponent(token)}; Path=/; Max-Age=86400; SameSite=Lax${secure}`;
  } else {
    document.cookie = `${SESSION_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax`;
  }
}

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
        localStorage.setItem('eco_access_token', token);
        writeSessionCookie(token);
        set({ user, token, isAuthenticated: true });
      },
      logout: () => {
        localStorage.removeItem('eco_access_token');
        writeSessionCookie(null);
        set({ user: null, token: null, isAuthenticated: false });
      },
    }),
    {
      name: 'ecomarket-auth',
      partialize: (state) => ({ user: state.user, token: state.token, isAuthenticated: state.isAuthenticated }),
    }
  )
);
