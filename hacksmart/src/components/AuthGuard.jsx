import { useEffect } from 'react'
import { useAuth } from '../hooks/useAuth.js'
import { useLocation, useNavigate } from 'react-router-dom'

/**
 * Component that ensures user is authenticated.
 * If not, redirects to /auth.
 */
export default function AuthGuard({ children }) {
  const { user, loading } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    if (!loading && !user && location.pathname !== '/auth') {
      navigate('/auth', { replace: true })
    }
  }, [user, loading, navigate, location])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600"></div>
          <p className="text-sm text-slate-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user && location.pathname !== '/auth') {
    return null
  }

  return children
}

