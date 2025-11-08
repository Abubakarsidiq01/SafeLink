import PropTypes from 'prop-types'
import clsx from 'clsx'
import { useState } from 'react'

export default function UpvoteButton({ count, active, onToggle, disabled }) {
  const [isPending, setIsPending] = useState(false)

  async function handleClick() {
    if (disabled || isPending) return
    try {
      setIsPending(true)
      await onToggle()
    } finally {
      setIsPending(false)
    }
  }

  return (
    <button
      type="button"
      className={clsx(
        'flex h-12 w-full items-center justify-center gap-2 rounded-xl border bg-white text-sm font-semibold transition-all',
        'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600',
        'data-[active=true]:border-blue-600 data-[active=true]:text-blue-600',
        disabled ? 'pointer-events-none opacity-50' : 'active:scale-[0.99]',
      )}
      onClick={handleClick}
      aria-pressed={active}
      aria-label="Upvote this post"
      data-active={active}
      disabled={disabled || isPending}
    >
      <span aria-hidden="true">⬆️</span>
      <span>{isPending ? '...' : count}</span>
    </button>
  )
}

UpvoteButton.propTypes = {
  count: PropTypes.number.isRequired,
  active: PropTypes.bool.isRequired,
  onToggle: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
}

