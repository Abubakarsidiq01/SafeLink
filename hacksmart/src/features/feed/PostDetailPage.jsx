import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import PostCard from '../../components/feed/PostCard.jsx'
import { donateItems, donateMoney, getPost, upvotePost } from '../../lib/firestoreApi.js'
import DonateMoneyModal from '../../components/feed/DonateMoneyModal.jsx'
import DonateItemModal from '../../components/feed/DonateItemModal.jsx'
import { formatCurrency } from '../../utils/formatters.js'

export default function PostDetailPage() {
  const params = useParams()
  const navigate = useNavigate()
  const postId = params.id
  const { data: post, refetch } = useQuery({
    queryKey: ['post', postId],
    queryFn: () => getPost(postId),
  })

  const [moneyModal, setMoneyModal] = useState({ open: false })
  const [itemModal, setItemModal] = useState({ open: false })
  const [toast, setToast] = useState(null)

  const viewerCoords = useMemo(() => ({ lat: 32.525, lng: -92.64 }), [])

  if (!post) {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-4 px-4 pt-10">
          <button
            type="button"
            className="flex w-fit items-center gap-2 text-sm font-semibold text-slate-600"
            onClick={() => navigate(-1)}
          >
            ← Back
          </button>
          <div className="rounded-2xl bg-white p-12 text-center shadow-sm">
            <p className="text-lg font-semibold text-slate-900">Post not found</p>
            <p className="mt-2 text-sm text-slate-500">
              The requested post may have been removed. Return to the feed to browse other updates.
            </p>
          </div>
        </div>
      </div>
    )
  }

  function showToast(message) {
    setToast(message)
    setTimeout(() => setToast(null), 2500)
  }

  async function handleUpvote(postId, isActive) {
    await upvotePost(postId, isActive)
    refetch()
  }

  async function handleDonateMoney(amount) {
    await donateMoney(post.id, amount)
    refetch()
    showToast(`Thanks! ${formatCurrency(amount)} pledged.`)
    setMoneyModal({ open: false })
  }

  async function handleDonateItems(pledges) {
    await donateItems(post.id, pledges)
    refetch()
    showToast('Items pledged. Volunteers will reach out shortly.')
    setItemModal({ open: false })
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-4 px-4 pb-16 pt-6">
        <button
          type="button"
          className="flex w-fit items-center gap-2 text-sm font-semibold text-slate-600"
          onClick={() => navigate(-1)}
        >
          ← Back
        </button>

        <PostCard
          post={post}
          viewerCoords={viewerCoords}
          onUpvote={(postId, isActive) => handleUpvote(postId, isActive)}
          onDonateMoney={() => setMoneyModal({ open: true })}
          onDonateItem={() => setItemModal({ open: true })}
        />

        <section className="rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Additional details</h2>
          <p className="mt-2 text-sm text-slate-600">
            Map preview and donor activity will appear here when connected to the live backend.
          </p>
        </section>
      </div>

      <DonateMoneyModal
        post={post}
        open={moneyModal.open}
        onClose={() => setMoneyModal({ open: false })}
        onConfirm={handleDonateMoney}
      />

      <DonateItemModal
        post={post}
        open={itemModal.open}
        onClose={() => setItemModal({ open: false })}
        onConfirm={handleDonateItems}
      />

      {toast ? (
        <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-full bg-slate-900 px-4 py-2 text-sm font-medium text-white shadow-lg">
          {toast}
        </div>
      ) : null}
    </div>
  )
}

