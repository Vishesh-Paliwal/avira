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

  // Legacy direct upload (for small files < 32MB)
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

  // GCS signed URL flow (for all file sizes)
  getUploadUrl: (filename: string) =>
    request<{ upload_url: string; gcs_path: string; bucket: string }>(
      '/api/get-upload-url',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename }),
      },
    ),

  uploadToGcs: async (uploadUrl: string, file: File) => {
    const res = await fetch(uploadUrl, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/pdf' },
      body: file,
    });
    if (!res.ok) {
      throw new Error(`GCS upload failed: ${res.status}`);
    }
  },

  processDocument: (params: {
    gcs_path: string;
    store_name: string;
    filename: string;
    enrich: boolean;
  }) =>
    request<{ filename: string; enriched: boolean; stats?: Record<string, number> }>(
      '/api/process',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      },
    ),

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
