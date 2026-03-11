import type { Store, Document, QueryResult } from './types';

const API_BASE = import.meta.env.VITE_API_BASE || '';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, options);
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.detail || `Request failed: ${res.status}`);
  }
  return res.json();
}

export const api = {
  health: () => request<{ status: string }>('/api/health'),

  getStores: () => request<Store[]>('/api/stores'),

  createStore: (displayName: string) =>
    request<Store>('/api/stores', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ display_name: displayName }),
    }),

  deleteStore: (storeName: string) =>
    request<{ message: string }>(`/api/stores/${storeName}`, { method: 'DELETE' }),

  getDocuments: (storeName: string) =>
    request<Document[]>(`/api/stores/${storeName}/documents`),

  uploadDocument: (storeName: string, file: File, enrich: boolean) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('store_name', storeName);
    formData.append('enrich', String(enrich));
    return request<{ filename: string; enriched: boolean; stats?: Record<string, number> }>(
      '/api/upload',
      { method: 'POST', body: formData },
    );
  },

  query: (params: {
    question: string;
    store_name: string;
    mode: string;
    top_k: number;
    smart: boolean;
  }) =>
    request<QueryResult>('/api/query', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    }),
};
