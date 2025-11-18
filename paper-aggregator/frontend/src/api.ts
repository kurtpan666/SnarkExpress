import axios from 'axios';
import { AuthResponse, Paper, Comment, UserProfile, Vote, PaperNetwork } from './types';

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

  submit: (url: string, tags: string[], title?: string, authors?: string) =>
    api.post<Paper>('/papers', { url, tags, title, authors }),

  vote: (id: number, vote: number) =>
    api.post(`/papers/${id}/vote`, { vote }),

  getTags: () =>
    api.get<{ name: string; count: number }[]>('/papers/tags'),

  delete: (id: number) =>
    api.delete(`/papers/${id}`),

  edit: (id: number, data: { title?: string; tags?: string[]; authors?: string; abstract?: string }) =>
    api.patch<Paper>(`/papers/${id}`, data),
};

export const comments = {
  getAll: (paperId: number) =>
    api.get<Comment[]>(`/papers/${paperId}/comments`),

  create: (paperId: number, content: string, parentId?: number) =>
    api.post<Comment>(`/papers/${paperId}/comments`, { content, parent_id: parentId }),

  delete: (paperId: number, commentId: number) =>
    api.delete(`/papers/${paperId}/comments/${commentId}`),

  edit: (paperId: number, commentId: number, content: string) =>
    api.patch<Comment>(`/papers/${paperId}/comments/${commentId}`, { content }),
};

export const users = {
  getProfile: (username: string) =>
    api.get<UserProfile>(`/users/${username}`),

  getSubmissions: (username: string, limit = 30, offset = 0) =>
    api.get<Paper[]>(`/users/${username}/submissions`, { params: { limit, offset } }),

  getComments: (username: string, limit = 30, offset = 0) =>
    api.get<Comment[]>(`/users/${username}/comments`, { params: { limit, offset } }),

  getVotes: (username: string, limit = 30, offset = 0) =>
    api.get<Vote[]>(`/users/${username}/votes`, { params: { limit, offset } }),
};

export const search = {
  search: (params: {
    q?: string;
    title?: string;
    author?: string;
    abstract?: string;
    tag?: string;
    sort?: string;
    limit?: number;
    offset?: number;
  }) => api.get<Paper[]>('/search', { params }),

  suggestions: (q: string) =>
    api.get<{ titles: string[]; authors: string[]; tags: string[] }>('/search/suggestions', {
      params: { q },
    }),
};

export const recommendations = {
  getRelated: (paperId: number, limit = 10) =>
    api.get<Paper[]>(`/recommendations/related/${paperId}`, { params: { limit } }),

  getNetwork: (paperId: number, depth = 1) =>
    api.get<PaperNetwork>(`/recommendations/network/${paperId}`, { params: { depth } }),

  getPersonalized: (limit = 10) =>
    api.get<Paper[]>('/recommendations/personalized', { params: { limit } }),
};

export default api;
