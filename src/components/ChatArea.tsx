import { useState, useRef, useEffect } from 'react'
import { Send, FlaskConical } from 'lucide-react'
import type { ChatMessage as ChatMessageType } from '../types'
import ChatMessage from './ChatMessage'

interface Props {
  messages: ChatMessageType[]
  mode: 'strict' | 'augmented'
  onModeChange: (mode: 'strict' | 'augmented') => void
  onSend: (question: string) => void
  sending: boolean
  storeName: string
}

export default function ChatArea({ messages, mode, onModeChange, onSend, sending, storeName }: Props) {
  const [input, setInput] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSubmit = () => {
    if (!input.trim() || sending) return
    onSend(input.trim())
    setInput('')
  }

  return (
    <div className="flex flex-col h-full">
      {/* Chat header */}
      <div className="px-6 py-3 border-b border-border bg-surface-light/30 shrink-0">
        <p className="text-xs text-text-muted text-center">
          AVIRA AI Scientist: {storeName}
        </p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <FlaskConical className="w-16 h-16 text-accent/30 mb-4" />
            <h3 className="text-lg font-medium text-text-secondary mb-2">
              Start a conversation
            </h3>
            <p className="text-sm text-text-muted max-w-md">
              Ask questions about your uploaded documents. AVIRA will search through your knowledge base and provide cited answers.
            </p>
          </div>
        )}

        {messages.map((msg) => (
          <ChatMessage key={msg.id} message={msg} />
        ))}

        {sending && (
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center shrink-0">
              <FlaskConical className="w-4 h-4 text-accent" />
            </div>
            <div className="bg-bot-bubble rounded-2xl rounded-tl-sm px-4 py-3">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-accent rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 bg-accent rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 bg-accent rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Mode selector + Input */}
      <div className="px-6 pb-5 pt-3 shrink-0">
        {/* Mode toggle */}
        <div className="flex items-center gap-3 mb-3">
          <span className="text-xs text-text-muted font-medium">Mode</span>
          <div className="flex rounded-full bg-surface-light border border-border overflow-hidden">
            <button
              onClick={() => onModeChange('strict')}
              className={`px-4 py-1.5 text-xs font-medium transition-colors ${
                mode === 'strict'
                  ? 'bg-accent text-white'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              Strict mode
            </button>
            <button
              onClick={() => onModeChange('augmented')}
              className={`px-4 py-1.5 text-xs font-medium transition-colors ${
                mode === 'augmented'
                  ? 'bg-gradient-to-r from-accent to-pink-500 text-white'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              Go Beyond
            </button>
          </div>
        </div>

        {/* Input bar */}
        <div className="flex items-center gap-3">
          <div className="flex-1 relative">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
              placeholder="Type your scientific query..."
              disabled={sending}
              className="w-full px-5 py-3.5 bg-surface-light border border-border rounded-xl text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent transition-colors text-sm disabled:opacity-50"
            />
          </div>
          <button
            onClick={handleSubmit}
            disabled={!input.trim() || sending}
            className="w-12 h-12 flex items-center justify-center rounded-xl bg-accent hover:bg-accent-light disabled:opacity-30 text-white transition-colors shrink-0"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  )
}
