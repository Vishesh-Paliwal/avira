import { useEffect, useState, useRef, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Plus, MessageSquare, Trash2 } from 'lucide-react'
import { api } from '../api'
import type { Store, ChatMessage, Conversation } from '../types'
import Logo from '../components/Logo'
import KnowledgeCore from '../components/KnowledgeCore'
import ChatArea from '../components/ChatArea'

export default function WorkspacePage() {
  const { storeName } = useParams<{ storeName: string }>()
  const navigate = useNavigate()
  const decodedStoreName = decodeURIComponent(storeName || '')

  const [store, setStore] = useState<Store | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [mode, setMode] = useState<'strict' | 'augmented'>('strict')
  const [topK] = useState(10)
  const [smart] = useState(false)
  const [sending, setSending] = useState(false)
  const [docCount, setDocCount] = useState(0)
  const refreshDocsRef = useRef<(() => void) | null>(null)

  // Conversation state
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null)
  const [loadingConvos, setLoadingConvos] = useState(true)

  // Load store
  useEffect(() => {
    api.getStores().then((stores) => {
      const found = stores.find((s) => s.name === decodedStoreName)
      if (found) setStore(found)
      else navigate('/')
    }).catch(() => navigate('/'))
  }, [decodedStoreName, navigate])

  // Load conversations for this store
  const loadConversations = useCallback(async () => {
    if (!decodedStoreName) return
    try {
      const convos = await api.getConversations(decodedStoreName)
      setConversations(convos)
      if (convos.length > 0 && !activeConversationId) {
        setActiveConversationId(convos[0].id)
      } else if (convos.length === 0) {
        // Auto-create first conversation
        const newConvo = await api.createConversation(decodedStoreName)
        setConversations([newConvo])
        setActiveConversationId(newConvo.id)
      }
    } catch {
      // If auth fails or conversations not available, continue without persistence
    } finally {
      setLoadingConvos(false)
    }
  }, [decodedStoreName, activeConversationId])

  useEffect(() => {
    loadConversations()
  }, [decodedStoreName]) // eslint-disable-line react-hooks/exhaustive-deps

  // Load messages when conversation changes
  useEffect(() => {
    if (!activeConversationId) return
    api.getMessages(activeConversationId).then((msgs) => {
      setMessages(
        msgs.map((m) => ({
          id: m.id,
          role: m.role as 'user' | 'assistant',
          content: m.content,
          references: (m.metadata as Record<string, unknown>)?.references as ChatMessage['references'],
          enhancerMeta: (m.metadata as Record<string, unknown>)?.enhancerMeta as ChatMessage['enhancerMeta'],
          tokenUsage: (m.metadata as Record<string, unknown>)?.tokenUsage as ChatMessage['tokenUsage'],
        }))
      )
    }).catch(() => setMessages([]))
  }, [activeConversationId])

  const handleSend = async (question: string) => {
    if (!activeConversationId) return

    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: question,
    }
    setMessages((prev) => [...prev, userMsg])
    setSending(true)

    // Save user message
    api.addMessage(activeConversationId, 'user', question).catch(() => {})

    // Auto-title from first message
    if (messages.length === 0) {
      const title = question.length > 50 ? question.slice(0, 50) + '...' : question
      api.updateConversation(activeConversationId, title).then(() => {
        setConversations((prev) =>
          prev.map((c) => c.id === activeConversationId ? { ...c, title } : c)
        )
      }).catch(() => {})
    }

    try {
      const result = await api.query({
        question,
        store_name: decodedStoreName,
        mode,
        top_k: topK,
        smart,
      })

      const assistantMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: result.cited_answer,
        references: result.references,
        enhancerMeta: result.enhancer_meta,
        tokenUsage: result.token_usage,
      }
      setMessages((prev) => [...prev, assistantMsg])

      // Save assistant message with metadata
      api.addMessage(activeConversationId, 'assistant', result.cited_answer, {
        references: result.references,
        enhancerMeta: result.enhancer_meta,
        tokenUsage: result.token_usage,
      }).catch(() => {})
    } catch (e: unknown) {
      const errorMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: `Error: ${e instanceof Error ? e.message : 'Something went wrong'}`,
      }
      setMessages((prev) => [...prev, errorMsg])
    } finally {
      setSending(false)
    }
  }

  const handleNewConversation = async () => {
    try {
      const newConvo = await api.createConversation(decodedStoreName)
      setConversations((prev) => [newConvo, ...prev])
      setActiveConversationId(newConvo.id)
      setMessages([])
    } catch { /* ignore */ }
  }

  const handleDeleteConversation = async (id: string) => {
    try {
      await api.deleteConversation(id)
      const remaining = conversations.filter((c) => c.id !== id)
      setConversations(remaining)
      if (activeConversationId === id) {
        if (remaining.length > 0) {
          setActiveConversationId(remaining[0].id)
        } else {
          const newConvo = await api.createConversation(decodedStoreName)
          setConversations([newConvo])
          setActiveConversationId(newConvo.id)
          setMessages([])
        }
      }
    } catch { /* ignore */ }
  }

  const handleSwitchConversation = (id: string) => {
    setActiveConversationId(id)
  }

  if (!store || loadingConvos) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col bg-surface overflow-hidden">
      {/* Header */}
      <header className="flex items-center gap-4 px-5 py-3 border-b border-border shrink-0">
        <button
          onClick={() => navigate('/')}
          className="p-2 rounded-lg hover:bg-surface-lighter text-text-muted hover:text-text-primary transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <Logo className="h-5" />
      </header>

      {/* Workspace bar */}
      <div className={`px-5 py-2.5 border-b shrink-0 transition-all duration-500 ${
        mode === 'augmented'
          ? 'border-accent/30 bg-accent/5 beyond-shimmer'
          : 'border-border bg-surface-light/50'
      }`}>
        <span className="text-sm text-text-secondary">
          Workspace: <span className="text-text-primary font-medium">{store.display_name}</span>
          {' | '}Active Sources: <span className="text-text-primary font-medium">{docCount}</span>
          {mode === 'augmented' && (
            <span className="ml-3 text-xs text-accent font-medium">
              ✦ Go Beyond
            </span>
          )}
        </span>
      </div>

      {/* Main content */}
      <div className="flex flex-1 min-h-0">
        {/* Left sidebar - Knowledge Core + Conversations */}
        <div className="w-[340px] shrink-0 border-r border-border flex flex-col">
          <div className="h-1/2 border-b border-border overflow-hidden">
            <KnowledgeCore
              storeName={decodedStoreName}
              onDocCountChange={setDocCount}
              onRefresh={(fn) => { refreshDocsRef.current = fn }}
            />
          </div>

          {/* Conversation list */}
          <div className="flex flex-col flex-1 min-h-0">
            <div className="flex items-center justify-between px-4 py-3">
              <span className="text-xs font-medium text-text-muted uppercase tracking-wider">Conversations</span>
              <button
                onClick={handleNewConversation}
                className="p-1 rounded-md hover:bg-surface-lighter text-text-muted hover:text-text-primary transition-colors"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-2 pb-2 space-y-0.5">
              {conversations.map((convo) => (
                <div
                  key={convo.id}
                  onClick={() => handleSwitchConversation(convo.id)}
                  className={`group flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-colors text-sm ${
                    activeConversationId === convo.id
                      ? 'bg-surface-lighter text-text-primary'
                      : 'text-text-secondary hover:bg-surface-lighter/50 hover:text-text-primary'
                  }`}
                >
                  <MessageSquare className="w-3.5 h-3.5 shrink-0 opacity-50" />
                  <span className="truncate flex-1">{convo.title}</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDeleteConversation(convo.id)
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-surface-hover text-text-muted hover:text-danger transition-all shrink-0"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Chat area */}
        <div className={`flex-1 min-w-0 transition-all duration-700 ${
          mode === 'augmented' ? 'beyond-shimmer' : ''
        }`}>
          <ChatArea
            messages={messages}
            mode={mode}
            onModeChange={setMode}
            onSend={handleSend}
            sending={sending}
            storeName={store.display_name}
          />
        </div>
      </div>
    </div>
  )
}
