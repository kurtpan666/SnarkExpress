import axios from 'axios';
import { AuthResponse, Paper } from './types';

const API_URL = '/api';

const api = axios.create({
  baseURL: API_URL,
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const auth = {
  register: (username: string, email: string, password: string) =>
    api.post<AuthResponse>('/auth/register', { username, email, password }),

  login: (username: string, password: string) =>
    api.post<AuthResponse>('/auth/login', { username, password }),
};

export const papers = {
  getAll: (tag?: string, sort?: string) =>
    api.get<Paper[]>('/papers', { params: { tag, sort } }),

  submit: (url: string, tags: string[]) =>
    api.post<Paper>('/papers', { url, tags }),

  vote: (id: number, vote: number) =>
    api.post(`/papers/${id}/vote`, { vote }),

  getTags: () =>
    api.get<{ name: string; count: number }[]>('/papers/tags'),
};

export default api;
