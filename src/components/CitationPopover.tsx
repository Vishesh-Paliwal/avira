import { useState, useRef, type ReactNode } from 'react'
import { BookOpen } from 'lucide-react'
import type { Reference } from '../types'

interface Props {
  reference: Reference
  children: ReactNode
}

export default function CitationPopover({ reference, children }: Props) {
  const [show, setShow] = useState(false)
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>(null)

  const handleEnter = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    setShow(true)
  }

  const handleLeave = () => {
    timeoutRef.current = setTimeout(() => setShow(false), 200)
  }

  return (
    <span
      className="relative inline-block"
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
    >
      {children}
      {show && (
        <div
          className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 w-72 p-3 bg-surface-lighter border border-border rounded-xl shadow-2xl"
          onMouseEnter={handleEnter}
          onMouseLeave={handleLeave}
        >
          <p className="text-sm font-medium text-text-primary leading-snug">
            {reference.index}. {reference.title}
          </p>
          {reference.page_info && (
            <p className="text-xs text-text-muted mt-1">{reference.page_info}</p>
          )}
          <div className="flex items-center gap-1 mt-2 text-xs text-text-muted">
            <BookOpen className="w-3 h-3" />
            Source: Document
          </div>
          {/* Arrow */}
          <div className="absolute left-1/2 -translate-x-1/2 -bottom-1.5 w-3 h-3 bg-surface-lighter border-r border-b border-border rotate-45" />
        </div>
      )}
    </span>
  )
}
