import axios from 'axios';
import toast from 'react-hot-toast';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' }
});

// Intercepteur requête - ajouter le token JWT
api.interceptors.request.use(config => {
  const token = localStorage.getItem('labokeb_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Intercepteur réponse - gestion erreurs globale
api.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      localStorage.removeItem('labokeb_token');
      window.location.href = '/login';
    } else if (error.response?.status === 403) {
      toast.error('Accès non autorisé');
    } else if (error.response?.status >= 500) {
      toast.error('Erreur serveur. Veuillez réessayer.');
    }
    return Promise.reject(error);
  }
);

export default api;
