import React, { useEffect, useMemo, useState } from 'react'
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query'
import { fetchPosts, upvotePost, donateMoney, donateItems } from '../lib/firebase/firestoreApi.js'
import { useNavigate } from 'react-router-dom'
import { auth } from '../lib/firebase/firebase.js'
import CreatePostModal from '../components/feed/CreatePostModal.jsx'
import './ReliefFeed.css'

const PAGE_SIZE = 20

function useFeedData(filters) {
  return useInfiniteQuery({
    queryKey: ['feed', filters],
    queryFn: ({ pageParam = 0 }) =>
      fetchPosts({ pageParam, limit: PAGE_SIZE, filters }),
    initialPageParam: 0,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
  })
}

export default function ReliefFeed() {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const [filters, setFilters] = useState({ helpType: undefined, urgency: undefined, mine: undefined })
  const [moneyModal, setMoneyModal] = useState({ open: false, postId: null })
  const [itemModal, setItemModal] = useState({ open: false, postId: null })
  const [createPostModal, setCreatePostModal] = useState(false)
  const [toast, setToast] = useState(null)

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, isError, error } =
    useFeedData(filters)

  // Posts are already ordered by priorityScore (upvotes) from the API
  // Higher upvotes = higher priorityScore = appears first
  const posts = useMemo(() => {
    if (!data?.pages) return []
    const allPosts = data.pages.flatMap((page) => page.posts)
    const uniquePosts = Array.from(
      new Map(allPosts.map((post) => [post.id, post])).values()
    )
    // Sort by priorityScore (upvotes) descending, then by createdAt
    return uniquePosts.sort((a, b) => {
      const scoreA = a.priorityScore || 0
      const scoreB = b.priorityScore || 0
      if (scoreA !== scoreB) return scoreB - scoreA
      return new Date(b.createdAt) - new Date(a.createdAt)
    })
  }, [data])

  function showToast(message) {
    setToast(message)
    setTimeout(() => setToast(null), 3000)
  }

  async function handleUpvote(postId, isActive) {
    try {
      await upvotePost(postId, isActive)
      // Invalidate queries to refresh the feed with updated upvote counts
      queryClient.invalidateQueries({ queryKey: ['feed'] })
      showToast(isActive ? 'Upvoted!' : 'Upvote removed')
    } catch (err) {
      console.error('Upvote error:', err)
      // Show user-friendly error message
      const errorMessage = err.message?.includes('permission') 
        ? 'Unable to upvote. Please check your connection.'
        : err.message || 'Failed to upvote. Please try again.'
      showToast(errorMessage)
    }
  }

  async function handleDonateMoney(postId, amount) {
    try {
      await donateMoney(postId, amount)
      queryClient.invalidateQueries({ queryKey: ['feed'] })
      showToast(`Thanks! $${amount} pledged.`)
      setMoneyModal({ open: false, postId: null })
    } catch (err) {
      console.error('Donate error:', err)
      showToast('Failed to donate. Please try again.')
    }
  }

  async function handleDonateItems(postId, pledges) {
    try {
      await donateItems(postId, pledges)
      queryClient.invalidateQueries({ queryKey: ['feed'] })
      showToast('Items pledged. Volunteers will reach out shortly.')
      setItemModal({ open: false, postId: null })
    } catch (err) {
      console.error('Donate items error:', err)
      showToast('Failed to pledge items. Please try again.')
    }
  }

  const viewerCoords = { lat: 32.525, lng: -92.64 } // Default location

  function handleCreatePostSuccess() {
    queryClient.invalidateQueries({ queryKey: ['feed'] })
    showToast('Post created successfully! 🎉')
  }

  return (
    <div className="reliefFeed">
      <div className="reliefFeed__container">
        <div className="reliefFeed__actions">
          <button
            className="reliefFeed__donateBtn"
            onClick={() => navigate("/donate")}
          >
            Donate Money
          </button>
          <button
            className="reliefFeed__createBtn"
            onClick={() => setCreatePostModal(true)}
          >
            Create Post
          </button>
        </div>

        {isError && (
          <div className="reliefFeed__error">
            {error?.message || 'Failed to load posts. Please retry.'}
          </div>
        )}

        {isLoading && (
          <div className="reliefFeed__loading">
            <div className="spinner" /> Loading posts...
          </div>
        )}

        {!isLoading && posts.length === 0 && (
          <div className="reliefFeed__empty">
            <span className="reliefFeed__emptyIcon">🌤️</span>
            <p className="reliefFeed__emptyText">No posts nearby yet</p>
            <p className="reliefFeed__emptySubtext">
              Try adjusting your filters or create a new post to let responders know what's happening.
            </p>
          </div>
        )}

        <div className="reliefFeed__posts">
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
        </div>

        {hasNextPage && (
          <div className="reliefFeed__loadMore">
            <button
              onClick={() => fetchNextPage()}
              disabled={isFetchingNextPage}
              className="reliefFeed__loadMoreBtn"
            >
              {isFetchingNextPage ? 'Loading more…' : 'Load more'}
            </button>
          </div>
        )}

        {moneyModal.open && (
          <DonateMoneyModal
            post={posts.find((p) => p.id === moneyModal.postId)}
            onClose={() => setMoneyModal({ open: false, postId: null })}
            onConfirm={(amount) => handleDonateMoney(moneyModal.postId, amount)}
          />
        )}

        {itemModal.open && (
          <DonateItemModal
            post={posts.find((p) => p.id === itemModal.postId)}
            onClose={() => setItemModal({ open: false, postId: null })}
            onConfirm={(pledges) => handleDonateItems(itemModal.postId, pledges)}
          />
        )}

        {toast && (
          <div className="reliefFeed__toast">
            {toast}
          </div>
        )}

        {createPostModal && (
          <CreatePostModal
            open={createPostModal}
            onClose={() => setCreatePostModal(false)}
            onSuccess={handleCreatePostSuccess}
          />
        )}
      </div>
    </div>
  )
}

// Simplified PostCard component
function PostCard({ post, onUpvote, onDonateMoney, onDonateItem, viewerCoords }) {
  const [isExpanded, setIsExpanded] = useState(false)
  const isOwnPost = auth.currentUser?.uid && post.userId === auth.currentUser.uid
  const viewerHasUpvoted = Boolean(post.viewerHasUpvoted)
  const canDonateMoney = Boolean(post.targetAmount)
  const isFulfilled = post.status === 'fulfilled'

  const title = post.caption?.split('.')[0] || post.caption?.substring(0, 60) || 'No title'
  const description = post.caption || ''
  const shouldClamp = !isExpanded && description.length > 160

  return (
    <article className="postCard">
      <header className="postCard__header">
        <div className="postCard__avatar">
          {post.userPhoto ? (
            <img src={post.userPhoto} alt={post.userName} className="postCard__avatarImg" />
          ) : (
            <div className="postCard__avatarFallback">
              {post.userName?.charAt(0) || 'U'}
            </div>
          )}
        </div>
        <div className="postCard__userInfo">
          <span className="postCard__userName">{post.userName}</span>
          <span className="postCard__location">📍 {post.city || 'Unknown location'}</span>
        </div>
        {post.verified && (
          <span className="postCard__verified">✔ Verified</span>
        )}
      </header>

      {(post.photoUrl || post.videoUrl) && (
        <div className="postCard__mediaContainer">
          {post.videoUrl ? (
            <video
              src={post.videoUrl}
              controls
              className="postCard__video"
              poster={post.photoUrl || undefined}
            />
          ) : (
            <img src={post.photoUrl} alt="Post" className="postCard__image" />
          )}
          {post.urgency === 1 && (
            <span className="postCard__urgentTag">Urgent</span>
          )}
          {isFulfilled && (
            <span className="postCard__fulfilledTag">Fulfilled</span>
          )}
        </div>
      )}

      <div className="postCard__content">
        <h3 className="postCard__title">{title}</h3>
        <p className={`postCard__description ${shouldClamp ? 'postCard__description--clamped' : ''}`}>
          {description}
        </p>
        {shouldClamp && (
          <button
            onClick={() => setIsExpanded(true)}
            className="postCard__seeMore"
          >
            See more
          </button>
        )}
      </div>

      {canDonateMoney && (
        <div className="postCard__donation">
          <p className="postCard__donationSummary">
            <span>Raised: ${(post.currentAmount || 0).toLocaleString()}</span>
            <span>Goal: ${post.targetAmount.toLocaleString()}</span>
          </p>
          <div className="postCard__progressBar">
            <div
              className="postCard__progressFill"
              style={{ width: `${Math.min(100, ((post.currentAmount || 0) / post.targetAmount) * 100)}%` }}
            />
          </div>
        </div>
      )}

      <div className="postCard__actions">
        <button
          className={`postCard__actionBtn postCard__actionBtn--upvote ${viewerHasUpvoted ? 'postCard__actionBtn--active' : ''}`}
          onClick={() => onUpvote(post.id, !viewerHasUpvoted)}
          title={viewerHasUpvoted ? 'Remove upvote' : 'Upvote this post'}
        >
          <span>⬆️</span>
          <span>{post.upvoteCount || 0}</span>
        </button>
        <button
          className="postCard__actionBtn postCard__actionBtn--donate"
          onClick={() => onDonateItem(post.id)}
          disabled={isFulfilled}
        >
          <span>🎁</span>
          <span>Items</span>
        </button>
      </div>

      {/* Every post gets a donation button */}
      <button
        className={`postCard__donateBtn ${isOwnPost ? 'postCard__donateBtn--own' : ''} ${!canDonateMoney ? 'postCard__donateBtn--secondary' : ''}`}
        onClick={() => onDonateMoney(post.id)}
        disabled={isFulfilled}
      >
        {!isOwnPost && <span>💰</span>}
        <span>{isOwnPost ? 'View Details' : canDonateMoney ? 'Donate Money' : 'Donate to Help'}</span>
      </button>

      <footer className="postCard__footer">
        Posted {new Date(post.createdAt).toLocaleDateString()}
        {post.verified && ' • Verified'}
      </footer>
    </article>
  )
}

// Enhanced DonateMoneyModal with quick amounts
function DonateMoneyModal({ post, onClose, onConfirm }) {
  const [amount, setAmount] = useState('')
  const [selectedQuickAmount, setSelectedQuickAmount] = useState(null)
  const [error, setError] = useState(null)

  if (!post) return null

  const QUICK_AMOUNTS = [10, 25, 50, 100, 250, 500]
  const remaining = post.targetAmount ? Math.max(post.targetAmount - (post.currentAmount || 0), 0) : null
  const currentRaised = post.currentAmount || 0
  const goal = post.targetAmount || 0

  function handleQuickAmount(value) {
    setAmount(String(value))
    setSelectedQuickAmount(value)
    setError(null)
  }

  function handleSubmit(e) {
    e.preventDefault()
    const numericAmount = Number(amount)
    if (!numericAmount || Number.isNaN(numericAmount) || numericAmount <= 0) {
      setError('Please enter a valid amount')
      return
    }
    if (remaining != null && numericAmount > remaining) {
      setError(`Maximum donation is $${remaining.toLocaleString()}`)
      return
    }
    if (numericAmount < 1) {
      setError('Minimum donation is $1')
      return
    }
    onConfirm(numericAmount)
  }

  return (
    <div className="modalOverlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal__header">
          <div>
            <h2>Donate to {post.userName}</h2>
            {goal > 0 && (
              <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#64748b', fontWeight: '400' }}>
                {remaining > 0 ? `$${remaining.toLocaleString()} needed to reach goal` : 'Goal reached! 💚'}
              </p>
            )}
          </div>
          <button onClick={onClose} className="modal__close" aria-label="Close">✕</button>
        </div>
        <form onSubmit={handleSubmit}>
          {goal > 0 && (
            <div style={{ 
              padding: '16px', 
              background: '#f8fafc', 
              borderRadius: '10px', 
              marginBottom: '20px',
              border: '1px solid #e2e8f0'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '13px', fontWeight: '600', color: '#475569' }}>Raised</span>
                <span style={{ fontSize: '13px', fontWeight: '700', color: '#10b981' }}>
                  ${currentRaised.toLocaleString()}
                </span>
              </div>
              <div style={{ 
                height: '8px', 
                background: '#e2e8f0', 
                borderRadius: '8px', 
                overflow: 'hidden',
                marginBottom: '8px'
              }}>
                <div style={{ 
                  height: '100%', 
                  background: 'linear-gradient(90deg, #10b981 0%, #059669 100%)',
                  width: `${Math.min(100, (currentRaised / goal) * 100)}%`,
                  transition: 'width 0.3s'
                }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '12px', color: '#94a3b8' }}>Goal: ${goal.toLocaleString()}</span>
                <span style={{ fontSize: '12px', fontWeight: '600', color: '#64748b' }}>
                  {Math.round((currentRaised / goal) * 100)}%
                </span>
              </div>
            </div>
          )}
          
          <label className="modal__label">
            Donation Amount (USD)
            <input
              type="number"
              min="1"
              step="1"
              className={`modal__input ${error ? 'modal__input--error' : ''}`}
              value={amount}
              onChange={(e) => {
                setAmount(e.target.value)
                setSelectedQuickAmount(null)
                setError(null)
              }}
              placeholder="Enter amount"
              style={{ fontSize: '18px', fontWeight: '600', textAlign: 'center' }}
            />
          </label>

          <div>
            <p style={{ fontSize: '13px', fontWeight: '600', color: '#475569', marginBottom: '12px' }}>
              Quick Amounts
            </p>
            <div className="modal__quickAmounts">
              {QUICK_AMOUNTS.map((value) => (
                <button
                  key={value}
                  type="button"
                  className={`modal__quickAmountBtn ${selectedQuickAmount === value ? 'modal__quickAmountBtn--selected' : ''}`}
                  onClick={() => handleQuickAmount(value)}
                  disabled={remaining != null && value > remaining}
                >
                  ${value}
                </button>
              ))}
            </div>
          </div>

          {error && <p className="modal__error">{error}</p>}
          
          <button type="submit" className="modal__submit">
            Confirm Donation
          </button>
          <button type="button" onClick={onClose} className="modal__cancel">
            Cancel
          </button>
        </form>
      </div>
    </div>
  )
}

// Simplified DonateItemModal
function DonateItemModal({ post, onClose, onConfirm }) {
  const [items, setItems] = useState(() => {
    if (!post?.neededItems) return []
    return post.neededItems.map((item) => ({
      name: item.name,
      qtyNeeded: item.qtyNeeded,
      qtyPledged: item.qtyPledged || 0,
      qty: 0,
    }))
  })
  const [error, setError] = useState(null)

  if (!post) return null

  function updateQty(index, qty) {
    setItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, qty: Math.max(Number(qty) || 0, 0) } : item))
    )
  }

  function handleSubmit(event) {
    event.preventDefault()
    const pledges = items
      .filter((item) => item.qty > 0)
      .map((item) => ({ name: item.name, qty: item.qty }))

    if (!pledges.length) {
      setError('Select at least one item to pledge')
      return
    }

    onConfirm(pledges)
  }

  return (
    <div className="modalOverlay" onClick={onClose}>
      <div className="modal modal--large" onClick={(e) => e.stopPropagation()}>
        <div className="modal__header">
          <h2>Pledge items for {post.userName}</h2>
          <button onClick={onClose} className="modal__close">✕</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal__items">
            {items.map((item, index) => (
              <div key={index} className="modal__item">
                <div>
                  <p className="modal__itemName">{item.name}</p>
                  <p className="modal__itemNeeded">
                    Needed: {item.qtyPledged}/{item.qtyNeeded}
                  </p>
                </div>
                <label>
                  Qty
                  <input
                    type="number"
                    min="0"
                    className="modal__input modal__input--small"
                    value={item.qty}
                    onChange={(e) => updateQty(index, e.target.value)}
                  />
                </label>
              </div>
            ))}
          </div>
          {error && <p className="modal__error">{error}</p>}
          <div className="modal__actions">
            <button type="submit" className="modal__submit">
              Confirm pledge
            </button>
            <button type="button" onClick={onClose} className="modal__cancel">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

