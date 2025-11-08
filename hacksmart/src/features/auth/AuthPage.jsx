import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile } from 'firebase/auth'
import { auth } from '../../lib/firebase.js'
import { ensureUserProfile } from '../../lib/userApi.js'

export default function AuthPage() {
  const navigate = useNavigate()
  const [mode, setMode] = useState('signin') // 'signin' | 'signup'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [city, setCity] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    setError(null)
  }, [mode])

  async function handleSubmit(event) {
    event.preventDefault()
    setError(null)
    setLoading(true)
    try {
      if (mode === 'signup') {
        const cred = await createUserWithEmailAndPassword(auth, email, password)
        if (name) {
          await updateProfile(cred.user, { displayName: name })
        }
        await ensureUserProfile({ name, city })
      } else {
        await signInWithEmailAndPassword(auth, email, password)
        await ensureUserProfile({}) // ensure exists
      }
      navigate('/feed', { replace: true })
    } catch (e) {
      console.error(e)
      setError(e.message || 'Authentication failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-card">
        <h1 className="text-xl font-semibold text-slate-900">{mode === 'signup' ? 'Create account' : 'Sign in'}</h1>
        <p className="mt-1 text-sm text-slate-500">Enter your details to continue</p>

        <div className="mt-4 flex gap-2">
          <button
            type="button"
            className={`flex-1 rounded-lg px-4 py-2 text-sm font-semibold ${mode === 'signin' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700'}`}
            onClick={() => setMode('signin')}
          >
            Sign in
          </button>
          <button
            type="button"
            className={`flex-1 rounded-lg px-4 py-2 text-sm font-semibold ${mode === 'signup' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700'}`}
            onClick={() => setMode('signup')}
          >
            Sign up
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          {mode === 'signup' ? (
            <>
              <label className="block text-sm font-medium text-slate-700">
                Name
                <input
                  type="text"
                  required
                  className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/30"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your full name"
                />
              </label>
              <label className="block text-sm font-medium text-slate-700">
                City
                <input
                  type="text"
                  className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/30"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="e.g. Grambling, LA"
                />
              </label>
            </>
          ) : null}

          <label className="block text-sm font-medium text-slate-700">
            Email
            <input
              type="email"
              required
              className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/30"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
            />
          </label>

          <label className="block text-sm font-medium text-slate-700">
            Password
            <input
              type="password"
              required
              className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/30"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </label>

          {error ? <p className="text-sm text-red-600">{error}</p> : null}

          <button
            type="submit"
            disabled={loading}
            className="mt-2 h-12 w-full rounded-xl bg-blue-600 text-sm font-semibold text-white shadow-sm disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            {loading ? 'Please wait…' : mode === 'signup' ? 'Create account' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  )
}


