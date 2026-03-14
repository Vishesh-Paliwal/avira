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
  follow_ups?: string[];
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  references?: Reference[];
  enhancerMeta?: EnhancerMeta;
  tokenUsage?: TokenUsage;
  followUps?: string[];
}

export interface Conversation {
  id: string;
  user_id: string;
  store_name: string;
  title: string;
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  role: 'user' | 'assistant';
  content: string;
  metadata: Record<string, unknown>;
  created_at: string;
}

// --- Feedback types ---

export interface ResponseFeedback {
  session_id: string;
  response_number: number;
  tester_role?: string;
  question_topic?: string;
  difficulty_tier: 'easy' | 'medium' | 'hard' | 'very_complex';
  q1_relevance: 'different_question' | 'partial' | 'exact' | 'anticipated_followup';
  q2_scientific_accuracy: 'factually_wrong' | 'correct_direction_wrong_details' | 'correct_and_complete' | 'exceptional';
  q3_depth: 'needed_more_equations' | 'right_depth' | 'phd_level';
  q4_length_format: 'way_too_long' | 'slightly_long' | 'just_right' | 'too_short' | 'ignored_format';
  q5_critical_content: 'all_present' | 'mostly_present' | 'core_missing';
  q7_comment: string;
  quick_score: number;
  mode?: string;
  conversation_id?: string;
  message_id?: string;
}

export interface SystemPrompt {
  mode: string;
  prompt_text: string;
  updated_by?: string;
  updated_at?: string;
}

export interface PromptHistoryItem {
  id: string;
  mode: string;
  prompt_text: string;
  edited_by?: string;
  created_at: string;
}

export interface PatternCheck {
  session_id: string;
  checkpoint: number;
  strengths: string[];
  weaknesses: string[];
  confidence_vs_accuracy: 'concern' | 'minor' | 'no_issue';
  comparison_to_usual_tool: 'better' | 'same' | 'worse' | 'mixed';
  comparison_detail?: string;
}
