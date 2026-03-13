import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import Logo from '../components/Logo'

export default function LoginPage() {
  const navigate = useNavigate()
  const { signIn, signUp } = useAuth()
  const [tab, setTab] = useState<'signin' | 'signup'>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [signUpSuccess, setSignUpSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (tab === 'signin') {
        await signIn(email, password)
        navigate('/')
      } else {
        await signUp(email, password, displayName)
        setSignUpSuccess(true)
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="flex justify-center mb-8">
          <Logo className="h-8" />
        </div>

        {signUpSuccess ? (
          <div className="bg-surface-light border border-border rounded-2xl p-6 text-center">
            <h2 className="text-lg font-semibold text-text-primary mb-2">Check your email</h2>
            <p className="text-sm text-text-secondary mb-4">
              We sent a confirmation link to <span className="text-text-primary">{email}</span>
            </p>
            <button
              onClick={() => { setSignUpSuccess(false); setTab('signin') }}
              className="text-sm text-accent hover:text-accent-light transition-colors"
            >
              Back to sign in
            </button>
          </div>
        ) : (
          <div className="bg-surface-light border border-border rounded-2xl p-6">
            {/* Tabs */}
            <div className="flex gap-1 mb-6 bg-surface rounded-lg p-1">
              <button
                onClick={() => setTab('signin')}
                className={`flex-1 py-2 text-sm rounded-md transition-colors ${
                  tab === 'signin'
                    ? 'bg-surface-lighter text-text-primary font-medium'
                    : 'text-text-muted hover:text-text-secondary'
                }`}
              >
                Sign in
              </button>
              <button
                onClick={() => setTab('signup')}
                className={`flex-1 py-2 text-sm rounded-md transition-colors ${
                  tab === 'signup'
                    ? 'bg-surface-lighter text-text-primary font-medium'
                    : 'text-text-muted hover:text-text-secondary'
                }`}
              >
                Sign up
              </button>
            </div>

            {error && (
              <div className="mb-4 px-3 py-2 bg-danger/10 border border-danger/30 rounded-lg text-danger text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {tab === 'signup' && (
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Display name"
                  required
                  className="w-full px-4 py-3 bg-surface border border-border rounded-xl text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent transition-colors text-sm"
                />
              )}
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email"
                required
                className="w-full px-4 py-3 bg-surface border border-border rounded-xl text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent transition-colors text-sm"
              />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                required
                minLength={6}
                className="w-full px-4 py-3 bg-surface border border-border rounded-xl text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent transition-colors text-sm"
              />
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-accent hover:bg-accent-light disabled:opacity-50 text-white rounded-xl transition-colors text-sm font-medium"
              >
                {loading ? 'Please wait...' : tab === 'signin' ? 'Sign in' : 'Create account'}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  )
}
