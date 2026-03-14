import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Save, Loader2, Check, History, ChevronDown, ChevronUp } from 'lucide-react'
import { api } from '../api'
import type { SystemPrompt, PromptHistoryItem } from '../types'
import Logo from '../components/Logo'

export default function PromptsPage() {
  const navigate = useNavigate()
  const [prompts, setPrompts] = useState<SystemPrompt[]>([])
  const [loading, setLoading] = useState(true)
  const [activeMode, setActiveMode] = useState<'strict' | 'augmented'>('strict')
  const [editText, setEditText] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  // History
  const [history, setHistory] = useState<PromptHistoryItem[]>([])
  const [showHistory, setShowHistory] = useState(false)
  const [loadingHistory, setLoadingHistory] = useState(false)
  const [expandedHistoryId, setExpandedHistoryId] = useState<string | null>(null)

  useEffect(() => {
    api.getPrompts().then((data) => {
      setPrompts(data)
      const strict = data.find((p) => p.mode === 'strict')
      if (strict) setEditText(strict.prompt_text)
    }).catch(() => setError('Failed to load prompts'))
      .finally(() => setLoading(false))
  }, [])

  const handleModeSwitch = (mode: 'strict' | 'augmented') => {
    setActiveMode(mode)
    const prompt = prompts.find((p) => p.mode === mode)
    setEditText(prompt?.prompt_text || '')
    setSaved(false)
    setError('')
    setShowHistory(false)
    setHistory([])
  }

  const handleSave = async () => {
    if (!editText.trim()) {
      setError('Prompt cannot be empty')
      return
    }
    setError('')
    setSaving(true)
    try {
      const updated = await api.updatePrompt(activeMode, editText)
      setPrompts((prev) =>
        prev.map((p) => p.mode === activeMode ? updated : p)
      )
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  const loadHistory = async () => {
    if (showHistory) {
      setShowHistory(false)
      return
    }
    setLoadingHistory(true)
    try {
      const data = await api.getPromptHistory(activeMode)
      setHistory(data)
      setShowHistory(true)
    } catch {
      setError('Failed to load history')
    } finally {
      setLoadingHistory(false)
    }
  }

  const handleRestoreVersion = (text: string) => {
    setEditText(text)
    setShowHistory(false)
    setSaved(false)
  }

  const activePrompt = prompts.find((p) => p.mode === activeMode)
  const hasChanges = activePrompt ? editText !== activePrompt.prompt_text : editText.length > 0

  if (loading) {
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
        <h1 className="text-sm font-medium text-text-primary">System Prompts</h1>
      </header>

      {/* Mode tabs + controls */}
      <div className="px-6 py-3 border-b border-border flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <span className="text-xs text-text-muted font-medium">Mode</span>
          <div className="flex rounded-full overflow-hidden bg-surface-light border border-border">
            <button
              onClick={() => handleModeSwitch('strict')}
              className={`px-4 py-1.5 text-xs font-medium transition-all ${
                activeMode === 'strict' ? 'bg-accent text-white' : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              Strict
            </button>
            <button
              onClick={() => handleModeSwitch('augmented')}
              className={`px-4 py-1.5 text-xs font-medium transition-all ${
                activeMode === 'augmented'
                  ? 'bg-gradient-to-r from-accent via-beyond-2 to-beyond-3 text-white'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              Go Beyond
            </button>
          </div>

          {activePrompt?.updated_at && (
            <span className="text-[10px] text-text-muted">
              Last updated: {new Date(activePrompt.updated_at).toLocaleString()}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadHistory}
            disabled={loadingHistory}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg border border-border text-text-secondary hover:text-text-primary hover:bg-surface-lighter transition-colors"
          >
            {loadingHistory ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <History className="w-3.5 h-3.5" />}
            Version History
          </button>

          <button
            onClick={handleSave}
            disabled={saving || !hasChanges}
            className={`flex items-center gap-1.5 px-4 py-1.5 text-xs font-medium rounded-lg text-white transition-all disabled:opacity-40 ${
              saved
                ? 'bg-success'
                : activeMode === 'augmented'
                  ? 'bg-gradient-to-r from-accent via-beyond-2 to-beyond-3'
                  : 'bg-accent hover:bg-accent-light'
            }`}
          >
            {saving ? (
              <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving...</>
            ) : saved ? (
              <><Check className="w-3.5 h-3.5" /> Saved</>
            ) : (
              <><Save className="w-3.5 h-3.5" /> Save Prompt</>
            )}
          </button>
        </div>
      </div>

      {error && (
        <div className="px-6 py-2 bg-danger/10 border-b border-danger/20">
          <p className="text-xs text-danger">{error}</p>
        </div>
      )}

      {/* Main content */}
      <div className="flex flex-1 min-h-0">
        {/* Editor */}
        <div className="flex-1 flex flex-col min-w-0">
          <textarea
            value={editText}
            onChange={(e) => { setEditText(e.target.value); setSaved(false) }}
            spellCheck={false}
            className="flex-1 w-full px-6 py-4 bg-transparent text-sm text-text-primary font-mono leading-relaxed resize-none focus:outline-none"
            placeholder="Enter system prompt..."
          />
          <div className="px-6 py-2 border-t border-border flex items-center justify-between">
            <span className="text-[10px] text-text-muted">
              {editText.length} characters
              {hasChanges && ' (unsaved changes)'}
            </span>
            <span className="text-[10px] text-text-muted">
              Changes take effect on the next query — no deploy needed
            </span>
          </div>
        </div>

        {/* History sidebar */}
        {showHistory && (
          <div className="w-[350px] border-l border-border flex flex-col shrink-0 bg-surface-light/30">
            <div className="px-4 py-3 border-b border-border">
              <h3 className="text-xs font-medium text-text-secondary uppercase tracking-wider">
                Version History — {activeMode}
              </h3>
            </div>
            <div className="flex-1 overflow-y-auto">
              {history.length === 0 ? (
                <p className="px-4 py-6 text-xs text-text-muted text-center">No previous versions</p>
              ) : (
                history.map((item) => (
                  <div key={item.id} className="border-b border-border">
                    <button
                      onClick={() => setExpandedHistoryId(expandedHistoryId === item.id ? null : item.id)}
                      className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-surface-lighter/50 transition-colors"
                    >
                      <div>
                        <p className="text-xs text-text-primary">
                          {new Date(item.created_at).toLocaleString()}
                        </p>
                        <p className="text-[10px] text-text-muted mt-0.5">
                          {item.prompt_text.length} chars
                        </p>
                      </div>
                      {expandedHistoryId === item.id ? (
                        <ChevronUp className="w-3.5 h-3.5 text-text-muted" />
                      ) : (
                        <ChevronDown className="w-3.5 h-3.5 text-text-muted" />
                      )}
                    </button>
                    {expandedHistoryId === item.id && (
                      <div className="px-4 pb-3">
                        <pre className="text-[10px] text-text-secondary bg-surface-lighter rounded-lg p-3 max-h-40 overflow-y-auto whitespace-pre-wrap font-mono">
                          {item.prompt_text}
                        </pre>
                        <button
                          onClick={() => handleRestoreVersion(item.prompt_text)}
                          className="mt-2 px-3 py-1 text-[10px] font-medium rounded-md bg-accent/10 text-accent hover:bg-accent/20 transition-colors"
                        >
                          Load this version into editor
                        </button>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
