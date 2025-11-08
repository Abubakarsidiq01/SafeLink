import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import FeedPage from './features/feed/FeedPage.jsx'
import PostDetailPage from './features/feed/PostDetailPage.jsx'
import AuthGuard from './components/AuthGuard.jsx'
import AuthPage from './features/auth/AuthPage.jsx'

const queryClient = new QueryClient()

export default function App() {
  // Auto-seeding disabled - using real Firestore data
  // To seed mock data, uncomment the following:
  // import { seedMockData } from './lib/seedMockData.js'
  // useEffect(() => { seedMockData() }, [])

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/auth" element={<AuthPage />} />
          <Route
            path="/"
            element={
              <AuthGuard>
                <FeedPage />
              </AuthGuard>
            }
          />
          <Route
            path="/feed"
            element={
              <AuthGuard>
                <FeedPage />
              </AuthGuard>
            }
          />
          <Route
            path="/post/:id"
            element={
              <AuthGuard>
                <PostDetailPage />
              </AuthGuard>
            }
          />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  )
}
