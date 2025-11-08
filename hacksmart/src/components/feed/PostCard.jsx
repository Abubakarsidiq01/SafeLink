import { useMemo, useState } from 'react'
import PropTypes from 'prop-types'
import { useNavigate } from 'react-router-dom'
import clsx from 'clsx'
import Avatar from './Avatar.jsx'
import TagChip from './TagChip.jsx'
import ProgressBar from './ProgressBar.jsx'
import UpvoteButton from './UpvoteButton.jsx'
import useGeoDistance from '../../hooks/useGeoDistance.js'
import { extractTitleFromCaption, formatCurrency, formatRelativeTime } from '../../utils/formatters.js'
import { auth } from '../../lib/firebase.js'

const helpTypeVariants = {
  urgent: 'urgent',
  medical: 'medical',
  shelter: 'shelter',
  food: 'food',
  donation: 'donation',
}

export default function PostCard({ post, onUpvote, onDonateMoney, onDonateItem, viewerCoords }) {
  const navigate = useNavigate()
  const [isExpanded, setIsExpanded] = useState(false)
  const { distanceLabel } = useGeoDistance(post.location, viewerCoords)
  const isOwnPost = auth.currentUser?.uid && post.userId === auth.currentUser.uid

  const title = useMemo(() => extractTitleFromCaption(post.caption), [post.caption])
  const isFulfilled = post.status === 'fulfilled'
  const urgencyLabel = post.urgency === 1 ? 'Urgent' : null
  const helpTypeLabel = post.helpType ? post.helpType.charAt(0).toUpperCase() + post.helpType.slice(1) : null
  const hashtags = post.hashtags || [post.helpType, post.urgency === 1 ? 'urgent' : null].filter(Boolean)
  const description = post.caption || ''
  const shouldClamp = !isExpanded && description.length > 160

  const viewerHasUpvoted = Boolean(post.viewerHasUpvoted)
  const canDonateMoney = Boolean(post.targetAmount)

  const donationSummary = useMemo(() => {
    if (!post.targetAmount) return null
    return `${formatCurrency(post.currentAmount)} / ${formatCurrency(post.targetAmount)} raised`
  }, [post.currentAmount, post.targetAmount])

  function handleCardClick(event) {
    // avoid triggering when interacting with buttons
    const interactiveTags = ['BUTTON', 'A', 'INPUT', 'TEXTAREA', 'SELECT', 'LABEL']
    if (interactiveTags.includes(event.target.tagName)) return
    navigate(`/post/${post.id}`)
  }

  return (
    <article
      className={clsx(
        'group relative cursor-pointer overflow-hidden rounded-2xl border border-slate-100/80 bg-white shadow-lg shadow-slate-200/60 transition-all duration-200 hover:-translate-y-1 hover:shadow-card',
      )}
      onClick={handleCardClick}
      tabIndex={0}
      onKeyDown={(event) => {
        if (event.key === 'Enter') {
          handleCardClick(event)
        }
      }}
      role="button"
      aria-label={`Open details for ${title}`}
    >
      <header className="flex items-center gap-3 px-4 pt-4">
        <Avatar src={post.userPhoto} alt={post.userName} size={40} />
        <div className="flex flex-1 flex-col">
          <span className="font-semibold text-slate-900">{post.userName}</span>
          <span className="flex items-center gap-2 text-sm text-slate-500">
            <span aria-hidden="true">📍</span>
            {post.city || 'Unknown location'}
            {distanceLabel ? <span className="text-slate-400">• {distanceLabel}</span> : null}
          </span>
        </div>
        {post.verified ? (
          <span className="ml-auto flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-600">
            <span aria-hidden="true">✔︎</span> Verified
          </span>
        ) : null}
      </header>

      <div className="relative mt-3 px-4">
        <img
          src={post.photoUrl}
          alt={post.photoAlt || 'Post photo'}
          className="h-56 w-full rounded-xl object-cover transition-transform duration-500 group-hover:scale-[1.02]"
          loading="lazy"
        />
        <div className="absolute left-7 top-5 flex gap-2">
          {urgencyLabel ? (
            <TagChip label={urgencyLabel} variant="urgent" aria-label="Urgent request" />
          ) : null}
          {helpTypeLabel ? (
            <TagChip
              label={helpTypeLabel}
              variant={helpTypeVariants[post.helpType] || 'default'}
              aria-label={`${helpTypeLabel} tag`}
            />
          ) : null}
          {isOwnPost ? <TagChip label="Recent" variant="recent" aria-label="Your post" /> : null}
        </div>
        {isFulfilled ? (
          <span className="absolute right-7 top-5 rounded-full bg-slate-800 px-3 py-1 text-xs font-semibold text-white">
            Fulfilled
          </span>
        ) : null}
      </div>

      <div className="px-4">
        <h3 className="mt-3 text-xl font-bold text-slate-900">{title}</h3>
        <p
          className={clsx(
            'mt-2 text-sm leading-relaxed text-slate-600',
            shouldClamp ? 'line-clamp-2' : '',
          )}
        >
          {description}
        </p>
        {shouldClamp ? (
          <button
            type="button"
            className="mt-2 text-sm font-semibold text-blue-600"
            onClick={() => setIsExpanded(true)}
          >
            See more
          </button>
        ) : null}
      </div>

      {hashtags.length ? (
        <div className="mt-3 flex flex-wrap gap-2 px-4">
          {hashtags.slice(0, 4).map((tag) => (
            <TagChip key={tag} label={tag} showHash className="bg-blue-50 text-blue-600" />
          ))}
        </div>
      ) : null}

      {canDonateMoney ? (
        <>
          <p className="px-4 pt-4 text-sm font-semibold text-slate-900">{donationSummary}</p>
          <ProgressBar value={post.currentAmount} max={post.targetAmount} />
        </>
      ) : null}

      <div className="px-4">
        <button
          type="button"
          className={clsx(
            'mt-4 mb-2 h-12 w-full rounded-xl text-sm font-semibold shadow-md transition active:scale-[0.98]',
            isOwnPost
              ? 'bg-slate-700 text-white'
              : 'bg-brand text-white hover:bg-brand-light focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-dark',
            isFulfilled ? 'pointer-events-none bg-slate-300 text-slate-500' : null,
          )}
          onClick={() => onDonateMoney(post.id)}
          disabled={isFulfilled || !canDonateMoney}
        >
          Donate $
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3 px-4 pb-3">
        <UpvoteButton
          count={post.upvoteCount}
          active={viewerHasUpvoted}
          onToggle={() => onUpvote(post.id, !viewerHasUpvoted)}
        />
        <button
          type="button"
          className="flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-700 shadow-sm transition active:scale-[0.98] hover:border-brand hover:text-brand focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
          onClick={() => onDonateItem(post.id)}
        >
          <span aria-hidden="true">🎁</span> Donate Item
        </button>
      </div>

      <footer className="px-4 pb-4 text-sm text-slate-400">
        Posted {formatRelativeTime(post.createdAt)}
        {post.verified ? ' • Verified' : ''}
      </footer>
    </article>
  )
}

PostCard.propTypes = {
  post: PropTypes.shape({
    id: PropTypes.string.isRequired,
    userName: PropTypes.string.isRequired,
    userPhoto: PropTypes.string,
    city: PropTypes.string,
    caption: PropTypes.string.isRequired,
    helpType: PropTypes.string,
    urgency: PropTypes.number,
    photoUrl: PropTypes.string.isRequired,
    photoAlt: PropTypes.string,
    targetAmount: PropTypes.number,
    currentAmount: PropTypes.number.isRequired,
    status: PropTypes.string,
    upvoteCount: PropTypes.number.isRequired,
    createdAt: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    verified: PropTypes.bool,
    viewerHasUpvoted: PropTypes.bool,
    hashtags: PropTypes.arrayOf(PropTypes.string),
  }).isRequired,
  onUpvote: PropTypes.func.isRequired,
  onDonateMoney: PropTypes.func.isRequired,
  onDonateItem: PropTypes.func.isRequired,
  viewerCoords: PropTypes.shape({
    lat: PropTypes.number.isRequired,
    lng: PropTypes.number.isRequired,
  }),
}

