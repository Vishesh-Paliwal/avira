import { useState } from 'react'
import { User, ChevronDown, ChevronUp } from 'lucide-react'
import type { ChatMessage as ChatMessageType, Reference } from '../types'
import Logo from './Logo'
import CitationPopover from './CitationPopover'

interface Props {
  message: ChatMessageType
  isBeyond?: boolean
}

function parseCitations(text: string, references: Reference[]) {
  const parts: Array<{ type: 'text' | 'citation'; content: string; ref?: Reference }> = []
  const regex = /\[(\d+)\]/g
  let lastIndex = 0
  let match

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ type: 'text', content: text.slice(lastIndex, match.index) })
    }
    const refIndex = parseInt(match[1])
    const ref = references.find((r) => r.index === refIndex)
    parts.push({ type: 'citation', content: match[0], ref })
    lastIndex = regex.lastIndex
  }

  if (lastIndex < text.length) {
    parts.push({ type: 'text', content: text.slice(lastIndex) })
  }

  return parts
}

export default function ChatMessage({ message, isBeyond }: Props) {
  const [showRefs, setShowRefs] = useState(false)
  const isUser = message.role === 'user'

  return (
    <div className={`flex items-start gap-3 ${isUser ? 'flex-row-reverse' : ''}`}>
      {/* Avatar */}
      <div
        className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-colors duration-500 ${
          isUser
            ? 'bg-surface-lighter'
            : isBeyond
              ? 'bg-accent/20'
              : 'bg-surface-lighter'
        }`}
      >
        {isUser ? (
          <User className="w-4 h-4 text-text-secondary" />
        ) : (
          <Logo className="h-3.5" />
        )}
      </div>

      {/* Bubble */}
      <div
        className={`max-w-[75%] rounded-2xl px-4 py-3 transition-all duration-500 ${
          isUser
            ? 'bg-user-bubble rounded-tr-sm'
            : isBeyond
              ? 'bg-accent/[0.07] border border-accent/15 rounded-tl-sm'
              : 'bg-bot-bubble rounded-tl-sm'
        }`}
      >
        <div className="text-sm leading-relaxed text-text-primary whitespace-pre-wrap">
          {!isUser && message.references && message.references.length > 0
            ? parseCitations(message.content, message.references).map((part, i) =>
                part.type === 'citation' && part.ref ? (
                  <CitationPopover key={i} reference={part.ref}>
                    <span className={`inline-flex items-center justify-center px-1.5 py-0.5 mx-0.5 text-xs font-medium rounded cursor-pointer transition-colors ${
                      isBeyond
                        ? 'bg-accent/20 text-accent hover:bg-accent/30'
                        : 'bg-surface-lighter text-accent hover:bg-surface-hover'
                    }`}>
                      {part.content}
                    </span>
                  </CitationPopover>
                ) : (
                  <span key={i}>{part.content}</span>
                ),
              )
            : message.content}
        </div>

        {/* References */}
        {!isUser && message.references && message.references.length > 0 && (
          <div className="mt-3 pt-2 border-t border-border/50">
            <button
              onClick={() => setShowRefs(!showRefs)}
              className="flex items-center gap-1 text-xs text-text-muted hover:text-text-secondary transition-colors"
            >
              {showRefs ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              {message.references.length} references
            </button>
            {showRefs && (
              <div className="mt-2 space-y-1.5">
                {message.references.map((ref) => (
                  <div key={ref.index} className="text-xs text-text-muted">
                    <span className="text-accent font-medium">[{ref.index}]</span>{' '}
                    {ref.title}
                    {ref.page_info && <span>, {ref.page_info}</span>}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {message.enhancerMeta?.decomposed && (
          <p className="text-xs text-text-muted mt-2">
            Smart Retrieval: {message.enhancerMeta.sub_queries?.length || 0} sub-queries |{' '}
            {message.enhancerMeta.deduped_chunks || 0} unique chunks
          </p>
        )}

        {message.tokenUsage && (
          <p className="text-xs text-text-muted mt-1">
            Tokens: {message.tokenUsage.prompt_tokens} in / {message.tokenUsage.candidates_tokens} out
          </p>
        )}
      </div>
    </div>
  )
}
