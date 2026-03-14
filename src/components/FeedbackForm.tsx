import { useState } from 'react'
import { MessageSquarePlus, ChevronDown, ChevronUp, Check, Loader2 } from 'lucide-react'
import { api } from '../api'
import type { ResponseFeedback } from '../types'

interface Props {
  sessionId: string
  responseNumber: number
  conversationId?: string
  messageId?: string
  isBeyond?: boolean
  onSubmitted?: () => void
}

const DIFFICULTY_OPTIONS = [
  { value: 'easy', label: 'Easy' },
  { value: 'medium', label: 'Medium' },
  { value: 'hard', label: 'Hard' },
  { value: 'very_complex', label: 'Very Complex' },
] as const

const Q1_OPTIONS = [
  { value: 'different_question', label: 'Answered a completely different question' },
  { value: 'partial', label: 'Partially addressed what was asked' },
  { value: 'exact', label: 'Answered exactly what was asked' },
  { value: 'anticipated_followup', label: 'Answered the question and anticipated useful follow-up content' },
] as const

const Q2_OPTIONS = [
  { value: 'factually_wrong', label: 'Factually wrong — errors present' },
  { value: 'correct_direction_wrong_details', label: 'Correct direction but wrong/missing details' },
  { value: 'correct_and_complete', label: 'Correct and complete' },
  { value: 'exceptional', label: 'Exceptional — nothing to add or correct' },
] as const

const Q3_OPTIONS = [
  { value: 'needed_more_equations', label: 'Correct but needed more equations or mechanistic reasoning' },
  { value: 'right_depth', label: 'Right depth for this question level' },
  { value: 'phd_level', label: 'PhD-level reasoning — genuinely impressive' },
] as const

const Q4_OPTIONS = [
  { value: 'way_too_long', label: 'Way too long — padded, irrelevant content' },
  { value: 'slightly_long', label: 'Slightly too long' },
  { value: 'just_right', label: 'Just right' },
  { value: 'too_short', label: 'Too short — left important things out' },
  { value: 'ignored_format', label: 'Ignored my format instruction' },
] as const

const Q5_OPTIONS = [
  { value: 'all_present', label: 'Yes — all key concepts present' },
  { value: 'mostly_present', label: 'Mostly — 1 or 2 important points missing' },
  { value: 'core_missing', label: 'No — core content missing entirely' },
] as const

export default function FeedbackForm({
  sessionId,
  responseNumber,
  conversationId,
  messageId,
  isBeyond,
  onSubmitted,
}: Props) {
  const [open, setOpen] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const [testerRole, setTesterRole] = useState('')
  const [questionTopic, setQuestionTopic] = useState('')
  const [difficulty, setDifficulty] = useState('')
  const [q1, setQ1] = useState('')
  const [q2, setQ2] = useState('')
  const [q3, setQ3] = useState('')
  const [q4, setQ4] = useState('')
  const [q5, setQ5] = useState('')
  const [comment, setComment] = useState('')
  const [score, setScore] = useState(0)

  if (submitted) {
    return (
      <div className="flex items-center gap-2 ml-11 mt-2 text-xs text-success">
        <Check className="w-3.5 h-3.5" />
        Feedback submitted for response #{responseNumber}
      </div>
    )
  }

  const handleSubmit = async () => {
    if (!difficulty || !q1 || !q2 || !q3 || !q4 || !q5 || !score) {
      setError('Please fill in all required fields')
      return
    }
    setError('')
    setSubmitting(true)
    try {
      const feedback: ResponseFeedback = {
        session_id: sessionId,
        response_number: responseNumber,
        tester_role: testerRole || undefined,
        question_topic: questionTopic || undefined,
        difficulty_tier: difficulty as ResponseFeedback['difficulty_tier'],
        q1_relevance: q1 as ResponseFeedback['q1_relevance'],
        q2_scientific_accuracy: q2 as ResponseFeedback['q2_scientific_accuracy'],
        q3_depth: q3 as ResponseFeedback['q3_depth'],
        q4_length_format: q4 as ResponseFeedback['q4_length_format'],
        q5_critical_content: q5 as ResponseFeedback['q5_critical_content'],
        q7_comment: comment.trim(),
        quick_score: score,
        conversation_id: conversationId,
        message_id: messageId,
      }
      await api.submitFeedback(feedback)
      setSubmitted(true)
      onSubmitted?.()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to submit')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="ml-11 mt-2">
      <button
        onClick={() => setOpen(!open)}
        className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border transition-colors ${
          isBeyond
            ? 'border-accent/30 text-accent/70 hover:text-accent hover:bg-accent/10'
            : 'border-border text-text-muted hover:text-text-secondary hover:bg-surface-lighter'
        }`}
      >
        <MessageSquarePlus className="w-3.5 h-3.5" />
        Rate Response #{responseNumber}
        {open ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
      </button>

      {open && (
        <div className={`mt-2 p-4 rounded-xl border space-y-4 ${
          isBeyond ? 'bg-accent/[0.03] border-accent/20' : 'bg-surface-light border-border'
        }`}>
          {/* Meta fields */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-text-muted mb-1">Your Role (optional)</label>
              <input
                value={testerRole}
                onChange={(e) => setTesterRole(e.target.value)}
                placeholder="e.g. PhD Student, Professor"
                className="w-full px-3 py-2 bg-surface-lighter rounded-lg text-xs text-text-primary border border-border focus:border-accent focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs text-text-muted mb-1">Question Topic (optional)</label>
              <input
                value={questionTopic}
                onChange={(e) => setQuestionTopic(e.target.value)}
                placeholder="e.g. Cell culture, Bioreactor design"
                className="w-full px-3 py-2 bg-surface-lighter rounded-lg text-xs text-text-primary border border-border focus:border-accent focus:outline-none"
              />
            </div>
          </div>

          {/* Difficulty */}
          <RadioGroup label="Difficulty Tier" options={DIFFICULTY_OPTIONS} value={difficulty} onChange={setDifficulty} isBeyond={isBeyond} />

          {/* Q1 */}
          <RadioGroup label="Q1. Did it answer what was actually asked?" options={Q1_OPTIONS} value={q1} onChange={setQ1} isBeyond={isBeyond} />

          {/* Q2 */}
          <RadioGroup label="Q2. Scientific Accuracy" options={Q2_OPTIONS} value={q2} onChange={setQ2} isBeyond={isBeyond} />

          {/* Q3 */}
          <RadioGroup label="Q3. Depth of Explanation" options={Q3_OPTIONS} value={q3} onChange={setQ3} isBeyond={isBeyond} />

          {/* Q4 */}
          <RadioGroup label="Q4. Response Length and Format" options={Q4_OPTIONS} value={q4} onChange={setQ4} isBeyond={isBeyond} />

          {/* Q5 */}
          <RadioGroup label="Q5. Critical Content Check" options={Q5_OPTIONS} value={q5} onChange={setQ5} isBeyond={isBeyond} />

          {/* Q7 Comment */}
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1.5">
              Q7. Comment — single most important strength OR weakness (optional)
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={2}
              placeholder="What stood out most about this response?"
              className="w-full px-3 py-2 bg-surface-lighter rounded-lg text-xs text-text-primary border border-border focus:border-accent focus:outline-none resize-none"
            />
          </div>

          {/* Quick Score */}
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-2">
              Quick Score *
            </label>
            <div className="flex items-center gap-1">
              {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                <button
                  key={n}
                  onClick={() => setScore(n)}
                  className={`w-8 h-8 rounded-lg text-xs font-medium transition-all ${
                    score === n
                      ? isBeyond
                        ? 'bg-accent text-white shadow-[0_0_10px_rgba(56,175,216,0.3)]'
                        : 'bg-accent text-white'
                      : 'bg-surface-lighter text-text-muted hover:text-text-secondary hover:bg-surface-hover'
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
            <div className="flex justify-between text-[10px] text-text-muted mt-1 px-1">
              <span>Unusable</span>
              <span>Acceptable</span>
              <span>Perfect</span>
            </div>
          </div>

          {error && <p className="text-xs text-danger">{error}</p>}

          <button
            onClick={handleSubmit}
            disabled={submitting}
            className={`px-4 py-2 rounded-lg text-xs font-medium text-white transition-all disabled:opacity-50 ${
              isBeyond
                ? 'bg-gradient-to-r from-accent via-beyond-2 to-beyond-3 hover:shadow-[0_0_15px_rgba(56,175,216,0.3)]'
                : 'bg-accent hover:bg-accent-light'
            }`}
          >
            {submitting ? (
              <span className="flex items-center gap-1.5"><Loader2 className="w-3 h-3 animate-spin" /> Submitting...</span>
            ) : (
              'Submit Feedback'
            )}
          </button>
        </div>
      )}
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
  options: readonly { value: string; label: string }[]
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
                ? isBeyond
                  ? 'bg-accent/15 text-accent'
                  : 'bg-accent/10 text-accent'
                : 'text-text-secondary hover:bg-surface-lighter'
            }`}
          >
            <div
              className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                value === opt.value
                  ? 'border-accent bg-accent'
                  : 'border-border'
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
