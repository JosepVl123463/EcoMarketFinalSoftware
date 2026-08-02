import axios from 'axios';

// Central API client — reads base URL from env variables
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Attach Bearer token to every request
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('eco_access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Limpia por completo la sesión del cliente (token, store persistido y cookie).
function clearClientSession() {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem('eco_access_token');
    localStorage.removeItem('ecomarket-auth'); // store persistido de Zustand
  } catch { /* ignore */ }
  // Borra la cookie usada por el middleware de rutas.
  document.cookie = 'eco_session=; Path=/; Max-Age=0; SameSite=Lax';
}

// Manejo global de 401 (token inválido o expirado). Importante: NO redirige si
// ya estamos en una página de autenticación, para no recargar el login y borrar
// el mensaje de error cuando el usuario simplemente escribió mal la contraseña.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      const path = window.location.pathname;
      const onAuthPage = path.startsWith('/auth/');
      if (!onAuthPage) {
        clearClientSession();
        window.location.href = '/auth/login';
      }
      // En páginas de auth se deja pasar el error para que el formulario lo muestre.
    }
    return Promise.reject(error);
  }
);

export default api;
