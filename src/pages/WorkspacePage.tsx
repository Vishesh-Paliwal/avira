import { useEffect, useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { FlaskConical, ArrowLeft } from 'lucide-react'
import { api } from '../api'
import type { Store, ChatMessage } from '../types'
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
  const [smart] = useState(true)
  const [sending, setSending] = useState(false)
  const [docCount, setDocCount] = useState(0)
  const refreshDocsRef = useRef<(() => void) | null>(null)

  useEffect(() => {
    api.getStores().then((stores) => {
      const found = stores.find((s) => s.name === decodedStoreName)
      if (found) setStore(found)
      else navigate('/')
    }).catch(() => navigate('/'))
  }, [decodedStoreName, navigate])

  const handleSend = async (question: string) => {
    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: question,
    }
    setMessages((prev) => [...prev, userMsg])
    setSending(true)

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

  if (!store) {
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
        <FlaskConical className="w-6 h-6 text-accent" />
        <div className="flex-1 min-w-0">
          <h1 className="text-sm font-semibold text-text-primary truncate">AVIRA</h1>
          <p className="text-xs text-text-muted">AI Scientist</p>
        </div>
      </header>

      {/* Workspace bar */}
      <div className="px-5 py-2.5 border-b border-border bg-surface-light/50 shrink-0">
        <span className="text-sm text-text-secondary">
          Workspace: <span className="text-text-primary font-medium">{store.display_name}</span>
          {' | '}Active Sources: <span className="text-text-primary font-medium">{docCount}</span>
        </span>
      </div>

      {/* Main content */}
      <div className="flex flex-1 min-h-0">
        {/* Left sidebar - Knowledge Core */}
        <div className="w-[340px] shrink-0 border-r border-border">
          <KnowledgeCore
            storeName={decodedStoreName}
            onDocCountChange={setDocCount}
            onRefresh={(fn) => { refreshDocsRef.current = fn }}
          />
        </div>

        {/* Chat area */}
        <div className="flex-1 min-w-0">
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
