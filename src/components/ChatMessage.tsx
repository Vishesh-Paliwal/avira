import { type ReactNode } from 'react'
import { User } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import 'katex/dist/katex.min.css'
import type { ChatMessage as ChatMessageType, Reference } from '../types'
import Logo from './Logo'
import CitationPopover from './CitationPopover'

interface Props {
  message: ChatMessageType
  isBeyond?: boolean
}

/**
 * Processes message text to:
 * 1. Convert [N] citations to interactive popovers
 * 2. Strip [Chunk X, Y, ...] raw references or convert them to citation badges
 * Returns React nodes with markdown rendered
 */
function processContent(
  text: string,
  references: Reference[],
): { cleaned: string; chunkRefs: Map<number, Reference> } {
  // Build a map of chunk index -> reference for [Chunk N] patterns
  const chunkRefs = new Map<number, Reference>()
  references.forEach((ref) => chunkRefs.set(ref.index, ref))

  // Remove [Chunk X, Y, ...] patterns and replace with numbered citations
  let cleaned = text.replace(
    /\[Chunk\s+([\d,\s]+)\]/gi,
    (_match, nums: string) => {
      const indices = nums.split(',').map((n: string) => n.trim()).filter(Boolean)
      return indices.map((n: string) => `[${n}]`).join('')
    }
  )

  // Split [N,N,N] comma-separated citations into individual [N] badges
  cleaned = cleaned.replace(
    /\[([\d]+(?:\s*,\s*\d+)+)\]/g,
    (_match, nums: string) => {
      const indices = nums.split(',').map((n: string) => n.trim()).filter(Boolean)
      return indices.map((n: string) => `[${n}]`).join('')
    }
  )

  return { cleaned, chunkRefs }
}

function CitationBadge({
  index,
  references,
  isBeyond,
}: {
  index: number
  references: Reference[]
  isBeyond: boolean
}) {
  const ref = references.find((r) => r.index === index)
  const badge = (
    <span
      className={`inline-flex items-center justify-center px-1.5 py-0.5 mx-0.5 text-xs font-medium rounded cursor-pointer transition-colors ${
        isBeyond
          ? 'bg-accent/20 text-accent hover:bg-accent/30'
          : 'bg-surface-lighter text-accent hover:bg-surface-hover'
      }`}
    >
      [{index}]
    </span>
  )

  if (ref) {
    return <CitationPopover reference={ref}>{badge}</CitationPopover>
  }
  // No matching reference — strip it entirely
  return null
}

function renderWithCitations(
  text: string,
  references: Reference[],
  isBeyond: boolean
): ReactNode[] {
  const parts: ReactNode[] = []
  const regex = /\[(\d+)\]/g
  let lastIndex = 0
  let match
  let key = 0

  while ((match = regex.exec(text)) !== null) {
    // Skip if [N] is embedded within a word (letter before or after)
    const charBefore = match.index > 0 ? text[match.index - 1] : ''
    const charAfter = text[regex.lastIndex] || ''
    if (/[a-zA-Z]/.test(charBefore) || /[a-zA-Z]/.test(charAfter)) {
      continue
    }

    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index))
    }
    const refIndex = parseInt(match[1])
    parts.push(
      <CitationBadge key={key++} index={refIndex} references={references} isBeyond={isBeyond} />
    )
    lastIndex = regex.lastIndex
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex))
  }

  return parts
}

export default function ChatMessage({ message, isBeyond }: Props) {
  const isUser = message.role === 'user'
  const references = message.references || []
  const hasRefs = !isUser && references.length > 0

  const { cleaned } = hasRefs
    ? processContent(message.content, references)
    : { cleaned: message.content }

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
        {isUser ? (
          <div className="text-sm leading-relaxed text-text-primary whitespace-pre-wrap">
            {message.content}
          </div>
        ) : (
          <div className="text-sm leading-relaxed text-text-primary prose prose-invert prose-sm max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
            <ReactMarkdown
              remarkPlugins={[remarkMath]}
              rehypePlugins={[rehypeKatex]}
              components={{
                p: ({ children }) => {
                  if (!hasRefs) return <p>{children}</p>
                  // Process children to inject citation popovers
                  const processed = processChildren(children, references, !!isBeyond)
                  return <p>{processed}</p>
                },
                li: ({ children }) => {
                  if (!hasRefs) return <li>{children}</li>
                  const processed = processChildren(children, references, !!isBeyond)
                  return <li>{processed}</li>
                },
                strong: ({ children }) => <strong className="font-semibold text-text-primary">{children}</strong>,
                em: ({ children }) => <em>{children}</em>,
                code: ({ children, className }) => {
                  const isBlock = className?.includes('language-')
                  if (isBlock) {
                    return (
                      <code className={`block bg-surface-light rounded-lg p-3 text-xs overflow-x-auto ${className || ''}`}>
                        {children}
                      </code>
                    )
                  }
                  return (
                    <code className="bg-surface-lighter px-1.5 py-0.5 rounded text-xs">
                      {children}
                    </code>
                  )
                },
                ol: ({ children }) => <ol className="list-decimal list-outside ml-4 space-y-1">{children}</ol>,
                ul: ({ children }) => <ul className="list-disc list-outside ml-4 space-y-1">{children}</ul>,
                blockquote: ({ children }) => (
                  <blockquote className="border-l-2 border-accent/40 pl-3 italic text-text-secondary">
                    {children}
                  </blockquote>
                ),
              }}
            >
              {cleaned}
            </ReactMarkdown>
          </div>
        )}


      </div>
    </div>
  )
}

/**
 * Walks React children and replaces [N] citation patterns with CitationBadge components
 */
function processChildren(
  children: ReactNode,
  references: Reference[],
  isBeyond: boolean
): ReactNode {
  if (typeof children === 'string') {
    return renderWithCitations(children, references, isBeyond)
  }

  if (Array.isArray(children)) {
    return children.map((child, i) => {
      if (typeof child === 'string') {
        return <span key={i}>{renderWithCitations(child, references, isBeyond)}</span>
      }
      return child
    })
  }

  return children
}
