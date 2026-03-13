import { useState } from 'react'
import { X, Loader2, Check } from 'lucide-react'
import { api } from '../api'
import type { PatternCheck } from '../types'

interface Props {
  sessionId: string
  checkpoint: number
  onClose: () => void
  isBeyond?: boolean
}

const STRENGTH_OPTIONS = [
  { value: 'conceptual_explanations', label: 'Conceptual explanations' },
  { value: 'math_derivations', label: 'Mathematical derivations and equations' },
  { value: 'industrial_examples', label: 'Industrial and real-world examples' },
  { value: 'regulatory_context', label: 'Regulatory and compliance context' },
  { value: 'calculations', label: 'Calculations and quantitative problems' },
  { value: 'format_compliance', label: 'Respecting my format instructions' },
  { value: 'no_strength_yet', label: 'No consistent strength yet' },
]

const WEAKNESS_OPTIONS = [
  { value: 'quantitative_depth', label: 'Quantitative depth — avoids equations' },
  { value: 'specific_factual_recall', label: 'Very specific factual recall' },
  { value: 'answering_exactly_asked', label: 'Answering exactly what was asked' },
  { value: 'brief_vs_detailed', label: 'Knowing when to be brief vs detailed' },
  { value: 'confidence_accuracy_mismatch', label: 'Confidence vs accuracy mismatch (sounds sure but was wrong)' },
  { value: 'no_weakness_yet', label: 'No consistent weakness yet' },
]

const CONFIDENCE_OPTIONS = [
  { value: 'concern', label: 'Yes — this is a concern' },
  { value: 'minor', label: 'Once — minor instance' },
  { value: 'no_issue', label: 'No — confidence matches accuracy' },
]

const COMPARISON_OPTIONS = [
  { value: 'better', label: 'Noticeably better' },
  { value: 'same', label: 'About the same' },
  { value: 'worse', label: 'Noticeably worse' },
  { value: 'mixed', label: 'Better in some areas, worse in others' },
]

export default function PatternCheckModal({ sessionId, checkpoint, onClose, isBeyond }: Props) {
  const [strengths, setStrengths] = useState<string[]>([])
  const [weaknesses, setWeaknesses] = useState<string[]>([])
  const [confidence, setConfidence] = useState('')
  const [comparison, setComparison] = useState('')
  const [comparisonDetail, setComparisonDetail] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')

  const toggleItem = (list: string[], setList: (v: string[]) => void, value: string) => {
    setList(list.includes(value) ? list.filter((v) => v !== value) : [...list, value])
  }

  const handleSubmit = async () => {
    if (!confidence || !comparison) {
      setError('Please fill in all required fields')
      return
    }
    setError('')
    setSubmitting(true)
    try {
      const check: PatternCheck = {
        session_id: sessionId,
        checkpoint,
        strengths,
        weaknesses,
        confidence_vs_accuracy: confidence as PatternCheck['confidence_vs_accuracy'],
        comparison_to_usual_tool: comparison as PatternCheck['comparison_to_usual_tool'],
        comparison_detail: comparisonDetail || undefined,
      }
      await api.submitPatternCheck(check)
      setSubmitted(true)
      setTimeout(onClose, 1500)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to submit')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className={`w-full max-w-lg max-h-[85vh] overflow-y-auto rounded-2xl border p-6 space-y-5 ${
        isBeyond ? 'bg-surface border-accent/30' : 'bg-surface border-border'
      }`}>
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-text-primary">
              Pattern Check — After Response #{checkpoint}
            </h2>
            <p className="text-xs text-text-muted mt-0.5">How is AVIRA performing overall?</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-surface-lighter text-text-muted hover:text-text-primary transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {submitted ? (
          <div className="flex flex-col items-center justify-center py-8 gap-3">
            <div className="w-12 h-12 rounded-full bg-success/20 flex items-center justify-center">
              <Check className="w-6 h-6 text-success" />
            </div>
            <p className="text-sm text-text-primary">Pattern check submitted!</p>
          </div>
        ) : (
          <>
            {/* P1. Strengths */}
            <CheckboxGroup
              label="P1. Where is AVIRA consistently strong?"
              options={STRENGTH_OPTIONS}
              selected={strengths}
              onToggle={(v) => toggleItem(strengths, setStrengths, v)}
              isBeyond={isBeyond}
            />

            {/* P2. Weaknesses */}
            <CheckboxGroup
              label="P2. Where is AVIRA consistently weak?"
              options={WEAKNESS_OPTIONS}
              selected={weaknesses}
              onToggle={(v) => toggleItem(weaknesses, setWeaknesses, v)}
              isBeyond={isBeyond}
            />

            {/* P3. Confidence vs Accuracy */}
            <RadioGroup
              label="P3. Has AVIRA sounded confident but been wrong?"
              options={CONFIDENCE_OPTIONS}
              value={confidence}
              onChange={setConfidence}
              isBeyond={isBeyond}
            />

            {/* P4. Comparison */}
            <RadioGroup
              label="P4. Compared to your usual AI tool"
              options={COMPARISON_OPTIONS}
              value={comparison}
              onChange={setComparison}
              isBeyond={isBeyond}
            />

            <div>
              <label className="block text-xs text-text-muted mb-1">One line on the key difference (optional)</label>
              <input
                value={comparisonDetail}
                onChange={(e) => setComparisonDetail(e.target.value)}
                placeholder="e.g. Better at citations but weaker on math"
                className="w-full px-3 py-2 bg-surface-lighter rounded-lg text-xs text-text-primary border border-border focus:border-accent focus:outline-none"
              />
            </div>

            {error && <p className="text-xs text-danger">{error}</p>}

            <div className="flex justify-end gap-2">
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-lg text-xs text-text-secondary hover:bg-surface-lighter transition-colors"
              >
                Skip
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className={`px-4 py-2 rounded-lg text-xs font-medium text-white transition-all disabled:opacity-50 ${
                  isBeyond
                    ? 'bg-gradient-to-r from-accent via-beyond-2 to-beyond-3'
                    : 'bg-accent hover:bg-accent-light'
                }`}
              >
                {submitting ? (
                  <span className="flex items-center gap-1.5"><Loader2 className="w-3 h-3 animate-spin" /> Submitting...</span>
                ) : (
                  'Submit Pattern Check'
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function CheckboxGroup({
  label,
  options,
  selected,
  onToggle,
  isBeyond,
}: {
  label: string
  options: { value: string; label: string }[]
  selected: string[]
  onToggle: (value: string) => void
  isBeyond?: boolean
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-text-secondary mb-1.5">{label}</label>
      <div className="space-y-1">
        {options.map((opt) => {
          const checked = selected.includes(opt.value)
          return (
            <label
              key={opt.value}
              onClick={() => onToggle(opt.value)}
              className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg cursor-pointer transition-colors text-xs ${
                checked
                  ? isBeyond ? 'bg-accent/15 text-accent' : 'bg-accent/10 text-accent'
                  : 'text-text-secondary hover:bg-surface-lighter'
              }`}
            >
              <div
                className={`w-3.5 h-3.5 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${
                  checked ? 'border-accent bg-accent' : 'border-border'
                }`}
              >
                {checked && <Check className="w-2 h-2 text-white" />}
              </div>
              {opt.label}
            </label>
          )
        })}
      </div>
    </div>
  )
}

function RadioGroup({
  label,
  options,
  value,
  onChange,
  isBeyond,
}: {
  label: string
  options: { value: string; label: string }[]
  value: string
  onChange: (v: string) => void
  isBeyond?: boolean
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-text-secondary mb-1.5">{label} *</label>
      <div className="space-y-1">
        {options.map((opt) => (
          <label
            key={opt.value}
            onClick={() => onChange(opt.value)}
            className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg cursor-pointer transition-colors text-xs ${
              value === opt.value
                ? isBeyond ? 'bg-accent/15 text-accent' : 'bg-accent/10 text-accent'
                : 'text-text-secondary hover:bg-surface-lighter'
            }`}
          >
            <div
              className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                value === opt.value ? 'border-accent bg-accent' : 'border-border'
              }`}
            >
              {value === opt.value && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
            </div>
            {opt.label}
          </label>
        ))}
      </div>
    </div>
  )
}
