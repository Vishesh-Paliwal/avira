import { useState, useRef, useEffect, useCallback } from 'react'
import { Send } from 'lucide-react'
import type { ChatMessage as ChatMessageType } from '../types'
import ChatMessage from './ChatMessage'
import FeedbackForm from './FeedbackForm'
import Logo from './Logo'
import ModeTransition from './ModeTransition'

interface Props {
  messages: ChatMessageType[]
  mode: 'strict' | 'augmented'
  onModeChange: (mode: 'strict' | 'augmented') => void
  onSend: (question: string) => void
  sending: boolean
  storeName: string
  sessionId: string
  conversationId?: string
}

const BIO_FACTS = [
  { emoji: '\u{1F9EB}', title: 'The Living Reactor', text: 'A single 10,000 L production fermenter can contain more individual fungal cells than there are stars in the Milky Way galaxy.' },
  { emoji: '\u{1F300}', title: 'The Viscosity Paradox', text: 'Pseudoplastic broths are thinner where you stir them hardest \u2014 meaning the impeller literally creates its own "easy lane" through the fluid, while the rest of the tank stays thick and sluggish.' },
  { emoji: '\u26A1', title: 'Power-Hungry at Scale', text: 'Agitation and aeration in large-scale aerobic fermenters can account for up to 70% of a bioprocess facility\u2019s total energy consumption.' },
  { emoji: '\u{1FAE7}', title: 'Bubble Science', text: 'A smaller bubble is actually better for oxygen transfer \u2014 a 1 mm bubble has roughly 6\u00D7 the surface-area-to-volume ratio of a 6 mm bubble, which is why sparger design is so critical.' },
  { emoji: '\u{1F344}', title: 'Fungus Changes Its Own Rules', text: 'As a fungal fermentation progresses, the organism\u2019s own growth physically changes the broth\u2019s viscosity \u2014 meaning the fluid you designed your process around at hour 0 is a completely different material by hour 48.' },
  { emoji: '\u{1F30A}', title: 'The Mixing Time Gap', text: 'Mixing time scales roughly with vessel volume to the power of 0.3\u20130.4. Going from 10 L to 10,000 L can push mixing time from a few seconds to several minutes \u2014 long enough for cells to experience complete oxygen starvation between impeller passes.' },
  { emoji: '\u{1F52C}', title: 'Kolmogorov\u2019s Brutal Threshold', text: 'Cells are damaged when turbulent eddies are smaller than the cell itself. The Kolmogorov microscale shrinks as you add more power, meaning you can literally stir a culture to death.' },
  { emoji: '\u{1F48A}', title: 'Ancient Bioprocess, Modern Problem', text: 'Penicillin, first produced industrially in the 1940s, is made by a filamentous fungus whose pseudoplastic broth still challenges bioprocess engineers today using essentially the same scale-up physics.' },
]

export default function ChatArea({ messages, mode, onModeChange, onSend, sending, storeName, sessionId, conversationId }: Props) {
  const [input, setInput] = useState('')
  const [showTransition, setShowTransition] = useState(false)
  const [pendingMode, setPendingMode] = useState<'strict' | 'augmented' | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const [factIndex, setFactIndex] = useState(() => Math.floor(Math.random() * BIO_FACTS.length))

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Rotate facts every 6 seconds while loading
  useEffect(() => {
    if (!sending) return
    setFactIndex(Math.floor(Math.random() * BIO_FACTS.length))
    const interval = setInterval(() => {
      setFactIndex((prev) => (prev + 1) % BIO_FACTS.length)
    }, 6000)
    return () => clearInterval(interval)
  }, [sending])

  const handleModeSwitch = (newMode: 'strict' | 'augmented') => {
    if (newMode === mode) return
    if (newMode === 'augmented') {
      setPendingMode(newMode)
      setShowTransition(true)
    } else {
      onModeChange(newMode)
    }
  }

  const handleTransitionComplete = useCallback(() => {
    if (pendingMode) {
      onModeChange(pendingMode)
      setPendingMode(null)
    }
    setShowTransition(false)
  }, [pendingMode, onModeChange])

  const handleSubmit = () => {
    if (!input.trim() || sending) return
    onSend(input.trim())
    setInput('')
  }

  const isBeyond = mode === 'augmented'

  return (
    <div className="flex flex-col h-full relative">
      <ModeTransition active={showTransition} onComplete={handleTransitionComplete} />

      {/* Chat header */}
      <div className={`px-6 py-3 border-b shrink-0 transition-all duration-500 ${
        isBeyond ? 'border-accent/20 bg-accent/5' : 'border-border bg-surface-light/30'
      }`}>
        <p className="text-xs text-text-muted text-center">
          {storeName} - AI Companion
        </p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className={`mb-6 transition-all duration-500 ${isBeyond ? 'opacity-80' : 'opacity-30'}`}>
              <Logo className="h-12 mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-text-secondary mb-2">
              Start a conversation
            </h3>
            <p className="text-sm text-text-muted max-w-md">
              Ask questions about your uploaded documents. Lemnisca will search through your knowledge base and provide cited answers.
            </p>
          </div>
        )}

        {messages.map((msg, idx) => {
          const assistantNumber = msg.role === 'assistant'
            ? messages.filter((m, i) => m.role === 'assistant' && i <= idx).length
            : 0
          return (
            <div key={msg.id}>
              <ChatMessage message={msg} isBeyond={isBeyond} />
              {/* Follow-up suggestions — only on the last assistant message */}
              {msg.role === 'assistant' && idx === messages.length - 1 && msg.followUps && msg.followUps.length > 0 && !sending && (
                <div className="flex flex-wrap gap-2 mt-3 ml-11">
                  {msg.followUps.map((q, i) => (
                    <button
                      key={i}
                      onClick={() => onSend(q)}
                      className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                        isBeyond
                          ? 'border-accent/30 text-accent hover:bg-accent/10'
                          : 'border-border text-text-secondary hover:bg-surface-lighter hover:text-text-primary'
                      }`}
                    >
                      {q}
                    </button>
                  ))}
                </div>
              )}
              {/* Feedback form for each assistant response */}
              {msg.role === 'assistant' && !sending && (
                <FeedbackForm
                  sessionId={sessionId}
                  responseNumber={assistantNumber}
                  conversationId={conversationId}
                  messageId={msg.id}
                  mode={mode}
                  isBeyond={isBeyond}
                />
              )}
            </div>
          )
        })}

        {sending && (
          <div className="flex items-start gap-3">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-colors duration-500 ${
              isBeyond ? 'bg-accent/20' : 'bg-surface-lighter'
            }`}>
              <Logo className="h-3.5" />
            </div>
            <div className={`max-w-[75%] rounded-2xl rounded-tl-sm px-4 py-3 transition-colors duration-500 ${
              isBeyond ? 'bg-accent/10 border border-accent/20' : 'bg-bot-bubble'
            }`}>
              <div className="flex items-center gap-1.5 mb-2">
                <div className={`w-2 h-2 rounded-full animate-bounce ${isBeyond ? 'bg-accent' : 'bg-text-muted'}`} style={{ animationDelay: '0ms' }} />
                <div className={`w-2 h-2 rounded-full animate-bounce ${isBeyond ? 'bg-beyond-2' : 'bg-text-muted'}`} style={{ animationDelay: '150ms' }} />
                <div className={`w-2 h-2 rounded-full animate-bounce ${isBeyond ? 'bg-beyond-3' : 'bg-text-muted'}`} style={{ animationDelay: '300ms' }} />
              </div>
              <div className="text-xs text-text-muted leading-relaxed">
                <span className="mr-1.5">{BIO_FACTS[factIndex].emoji}</span>
                <span className={`font-medium ${isBeyond ? 'text-accent/80' : 'text-text-secondary'}`}>
                  {BIO_FACTS[factIndex].title}
                </span>
                <span className="mx-1.5">&mdash;</span>
                {BIO_FACTS[factIndex].text}
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Mode selector + Input */}
      <div className={`px-6 pb-5 pt-3 shrink-0 transition-all duration-500 ${
        isBeyond ? 'bg-gradient-to-t from-accent/5 to-transparent' : ''
      }`}>
        {/* Mode toggle */}
        <div className="flex items-center gap-3 mb-3">
          <span className="text-xs text-text-muted font-medium">Mode</span>
          <div className={`flex rounded-full overflow-hidden transition-all duration-500 ${
            isBeyond
              ? 'bg-surface-light border border-accent/30 shadow-[0_0_15px_rgba(56,175,216,0.15)]'
              : 'bg-surface-light border border-border'
          }`}>
            <button
              onClick={() => handleModeSwitch('strict')}
              className={`px-4 py-1.5 text-xs font-medium transition-all duration-300 ${
                mode === 'strict'
                  ? 'bg-accent text-white'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              Strict mode
            </button>
            <button
              onClick={() => handleModeSwitch('augmented')}
              className={`relative px-4 py-1.5 text-xs font-medium transition-all duration-300 overflow-hidden ${
                mode === 'augmented'
                  ? 'bg-gradient-to-r from-accent via-beyond-2 to-beyond-3 text-white shadow-[0_0_20px_rgba(56,175,216,0.3)]'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              {mode === 'augmented' && (
                <span
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                  style={{ animation: 'shimmer 2s linear infinite', backgroundSize: '200% 100%' }}
                />
              )}
              <span className="relative">Go Beyond</span>
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
              className={`w-full px-5 py-3.5 bg-surface-light rounded-xl text-text-primary placeholder:text-text-muted focus:outline-none transition-all duration-500 text-sm disabled:opacity-50 ${
                isBeyond
                  ? 'border border-accent/30 focus:border-accent shadow-[0_0_10px_rgba(56,175,216,0.1)]'
                  : 'border border-border focus:border-accent'
              }`}
            />
          </div>
          <button
            onClick={handleSubmit}
            disabled={!input.trim() || sending}
            className={`w-12 h-12 flex items-center justify-center rounded-xl text-white transition-all duration-500 shrink-0 disabled:opacity-30 ${
              isBeyond
                ? 'bg-gradient-to-br from-accent via-beyond-2 to-beyond-3 hover:shadow-[0_0_20px_rgba(56,175,216,0.4)]'
                : 'bg-accent hover:bg-accent-light'
            }`}
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  )
}
