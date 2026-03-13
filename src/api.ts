import type { Store, Document, QueryResult, Conversation, Message } from './types';
import { supabase } from './lib/supabase';

const API_BASE = import.meta.env.VITE_API_BASE || '';

async function getAuthHeaders(): Promise<Record<string, string>> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) return {};
  return { Authorization: `Bearer ${session.access_token}` };
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const authHeaders = await getAuthHeaders();
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      ...authHeaders,
      ...options?.headers,
    },
  });
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
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Length': String(file.size),
      },
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
    conversation_id?: string;
  }) =>
    request<QueryResult>('/api/query', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    }),

  // --- Conversation endpoints ---

  getConversations: (storeName: string) =>
    request<Conversation[]>(`/api/conversations?store_name=${encodeURIComponent(storeName)}`),

  createConversation: (storeName: string, title?: string) =>
    request<Conversation>('/api/conversations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ store_name: storeName, title: title || 'New conversation' }),
    }),

  getMessages: (conversationId: string) =>
    request<Message[]>(`/api/conversations/${conversationId}/messages`),

  addMessage: (conversationId: string, role: string, content: string, metadata?: Record<string, unknown>) =>
    request<Message>(`/api/conversations/${conversationId}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role, content, metadata }),
    }),

  updateConversation: (conversationId: string, title: string) =>
    request<Conversation>(`/api/conversations/${conversationId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title }),
    }),

  deleteConversation: (conversationId: string) =>
    request<{ status: string }>(`/api/conversations/${conversationId}`, { method: 'DELETE' }),
};
