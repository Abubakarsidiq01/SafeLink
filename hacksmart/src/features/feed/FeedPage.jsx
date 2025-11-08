import { useEffect, useMemo, useRef, useState } from 'react'
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { auth } from '../../lib/firebase.js'
import { getUserProfile } from '../../lib/userApi.js'
import {
  donateItems,
  donateMoney,
  fetchPosts,
  upvotePost,
} from '../../lib/firestoreApi.js'
import FiltersBar from './FiltersBar.jsx'
import CaptureSheet from './CaptureSheet.jsx'
import PostCard from '../../components/feed/PostCard.jsx'
import CardSkeleton from '../../components/feed/CardSkeleton.jsx'
import DonateMoneyModal from '../../components/feed/DonateMoneyModal.jsx'
import DonateItemModal from '../../components/feed/DonateItemModal.jsx'
import { formatCurrency } from '../../utils/formatters.js'

const PAGE_SIZE = 20

function useFeedData(filters) {
  const query = useInfiniteQuery({
    queryKey: ['feed', filters],
    queryFn: ({ pageParam = 0 }) =>
      fetchPosts({ pageParam, limit: PAGE_SIZE, filters }),
    initialPageParam: 0,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
    refetchOnWindowFocus: false, // Don't refetch on window focus
  })

  // Real-time listener disabled for demo - uncomment to enable live updates
  // const queryClient = useQueryClient()
  // useEffect(() => {
  //   const unsubscribe = subscribeToPosts(filters, (snapshot) => {
  //     queryClient.setQueryData(['feed', filters], {
  //       pageParams: [0],
  //       pages: [
  //         {
  //           posts: snapshot.slice(0, PAGE_SIZE),
  //           nextCursor: snapshot.length > PAGE_SIZE ? 1 : null,
  //         },
  //       ],
  //     })
  //   })
  //   return unsubscribe
  // }, [filters, queryClient])

  return query
}

export default function FeedPage() {
  const queryClient = useQueryClient()
  const [filters, setFilters] = useState({ helpType: undefined, urgency: undefined, mine: undefined })
  const [captureOpen, setCaptureOpen] = useState(false)
  const [moneyModal, setMoneyModal] = useState({ open: false, postId: null })
  const [itemModal, setItemModal] = useState({ open: false, postId: null })
  const [toast, setToast] = useState(null)
  const loadMoreRef = useRef(null)

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, isError, error } =
    useFeedData(filters)

  const posts = useMemo(() => {
    if (!data?.pages) return []
    const allPosts = data.pages.flatMap((page) => page.posts)
    // Deduplicate posts by ID
    const uniquePosts = Array.from(
      new Map(allPosts.map((post) => [post.id, post])).values()
    )
    return uniquePosts
  }, [data])

  useEffect(() => {
    if (!hasNextPage || !loadMoreRef.current) return undefined
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          fetchNextPage()
        }
      },
      { threshold: 1 },
    )
    observer.observe(loadMoreRef.current)
    return () => observer.disconnect()
  }, [fetchNextPage, hasNextPage])

  const activePostForMoney = useMemo(
    () => posts.find((post) => post.id === moneyModal.postId),
    [moneyModal.postId, posts],
  )
  const activePostForItems = useMemo(
    () => posts.find((post) => post.id === itemModal.postId),
    [itemModal.postId, posts],
  )

  function showToast(message) {
    setToast(message)
    setTimeout(() => setToast(null), 3000)
  }

  async function handleUpvote(postId, isActive) {
    await upvotePost(postId, isActive)
    // Refresh feed so counts reflect
    queryClient.invalidateQueries({ queryKey: ['feed'] })
    showToast(isActive ? 'Upvoted!' : 'Upvote removed')
  }

  async function handleDonateMoney(postId, amount) {
    await donateMoney(postId, amount)
    queryClient.invalidateQueries({ queryKey: ['feed'] })
    showToast(`Thanks! ${formatCurrency(amount)} pledged.`)
    setMoneyModal({ open: false, postId: null })
  }

  async function handleDonateItems(postId, pledges) {
    await donateItems(postId, pledges)
    queryClient.invalidateQueries({ queryKey: ['feed'] })
    showToast('Items pledged. Volunteers will reach out shortly.')
    setItemModal({ open: false, postId: null })
  }

  const uid = auth.currentUser?.uid
  const { data: profile } = useQuery({
    queryKey: ['profile', uid],
    queryFn: () => getUserProfile(uid),
    enabled: Boolean(uid),
    staleTime: 1000 * 60 * 5,
  })

  const viewerCoords = { lat: profile?.location?.lat ?? 32.525, lng: profile?.location?.lng ?? -92.64 }

  return (
    <div className="min-h-screen bg-slate-100">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 pb-24 pt-10">
        <header className="flex flex-col gap-5">
          <div className="flex flex-col gap-4 rounded-3xl border border-white/60 bg-white/85 p-6 shadow-card backdrop-blur-md md:flex-row md:items-center md:justify-between">
            <Link to="/" className="flex items-center gap-3 text-slate-900">
              <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-brand text-lg font-semibold text-white shadow-lg shadow-brand/20">
                {(profile?.name || 'U').split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase()}
              </span>
              <div className="flex flex-col">
                <span className="text-sm text-slate-500">Welcome back</span>
                <span className="text-lg font-semibold">{profile?.name || 'User'}</span>
              </div>
            </Link>
            <div className="flex items-center justify-between gap-4 md:ml-auto md:w-auto">
              <div className="hidden text-right md:block">
                <p className="text-xs uppercase text-slate-400">Current location</p>
                <p className="text-sm font-semibold text-slate-700">{profile?.city || 'Set your city'}</p>
              </div>
              <button
                type="button"
                className="flex items-center gap-2 rounded-full bg-brand px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-brand/30 transition hover:bg-brand-light focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-dark active:scale-[0.98]"
                onClick={() => setCaptureOpen(true)}
              >
                <span aria-hidden="true">📸</span>
                Capture
              </button>
            </div>
          </div>

          <FiltersBar
            active={filters}
            onChange={(nextFilters) => setFilters(nextFilters)}
            className="pt-1"
          />
        </header>

        <main className="flex flex-col gap-5 pb-12">
          {isError ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              {error?.message || 'Failed to load posts. Please retry.'}
            </div>
          ) : null}

          {isLoading ? (
            <>
              <CardSkeleton />
              <CardSkeleton />
            </>
          ) : null}

          {!isLoading && posts.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-4 rounded-2xl bg-white p-12 text-center shadow-sm">
              <span className="text-4xl" role="img" aria-hidden="true">
                🌤️
              </span>
              <p className="text-lg font-semibold text-slate-800">No posts nearby yet</p>
              <p className="max-w-sm text-sm text-slate-500">
                Try adjusting your filters or capture a new update to let responders know what&apos;s happening.
              </p>
            </div>
          ) : null}

          {posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              onUpvote={handleUpvote}
              onDonateMoney={(postId) => setMoneyModal({ open: true, postId })}
              onDonateItem={(postId) => setItemModal({ open: true, postId })}
              viewerCoords={viewerCoords}
            />
          ))}

          {hasNextPage ? (
            <div ref={loadMoreRef} className="py-4 text-center text-sm text-slate-500">
              {isFetchingNextPage ? 'Loading more…' : 'Scroll to load more'}
            </div>
          ) : null}
        </main>
      </div>

      <CaptureSheet open={captureOpen} onClose={() => setCaptureOpen(false)} />

      <DonateMoneyModal
        post={activePostForMoney}
        open={moneyModal.open}
        onClose={() => setMoneyModal({ open: false, postId: null })}
        onConfirm={(amount) => handleDonateMoney(moneyModal.postId, amount)}
      />

      <DonateItemModal
        post={activePostForItems}
        open={itemModal.open}
        onClose={() => setItemModal({ open: false, postId: null })}
        onConfirm={(pledges) => handleDonateItems(itemModal.postId, pledges)}
      />

      {toast ? (
        <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-full bg-slate-900 px-4 py-2 text-sm font-medium text-white shadow-lg">
          {toast}
        </div>
      ) : null}
    </div>
  )
}

