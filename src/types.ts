export interface Store {
  name: string;
  display_name: string;
}

export interface Document {
  name: string;
  display_name: string;
}

export interface Reference {
  index: number;
  title: string;
  page_info?: string;
}

export interface TokenUsage {
  prompt_tokens: number;
  candidates_tokens: number;
  total_tokens: number;
}

export interface EnhancerMeta {
  decomposed: boolean;
  sub_queries?: string[];
  deduped_chunks?: number;
}

export interface QueryResult {
  cited_answer: string;
  references: Reference[];
  token_usage: TokenUsage;
  enhancer_meta?: EnhancerMeta;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  references?: Reference[];
  enhancerMeta?: EnhancerMeta;
  tokenUsage?: TokenUsage;
}
