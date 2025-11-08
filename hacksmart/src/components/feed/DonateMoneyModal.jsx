import { useEffect, useMemo, useState } from 'react'
import PropTypes from 'prop-types'
import clsx from 'clsx'
import { formatCurrency } from '../../utils/formatters.js'

const QUICK_AMOUNTS = [10, 25, 50, 100]

export default function DonateMoneyModal({ post, open, onClose, onConfirm }) {
  const [amount, setAmount] = useState('')
  const [error, setError] = useState(null)

  useEffect(() => {
    if (open) {
      setAmount('')
      setError(null)
    }
  }, [open])

  const remaining = useMemo(() => {
    if (!post?.targetAmount) return null
    return Math.max(post.targetAmount - post.currentAmount, 0)
  }, [post])

  if (!open || !post) return null

  function handleQuickAmount(value) {
    setAmount(String(value))
    setError(null)
  }

  function handleSubmit(e) {
    e.preventDefault()
    const numericAmount = Number(amount)
    if (!numericAmount || Number.isNaN(numericAmount) || numericAmount <= 0) {
      setError('Enter a valid amount')
      return
    }

    if (remaining != null && numericAmount > remaining) {
      setError(`Please enter ${formatCurrency(remaining)} or less`)
      return
    }

    onConfirm(numericAmount)
  }

  return (
    <div
      className="fixed inset-0 z-40 flex items-end justify-center bg-slate-900/40 px-4 py-8 backdrop-blur-sm md:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="donate-money-title"
    >
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
      >
        <div className="flex items-start justify-between">
          <div>
            <h2 id="donate-money-title" className="text-lg font-semibold text-slate-900">
              Donate to {post.userName}
            </h2>
            <p className="text-sm text-slate-500">
              {remaining != null
                ? `Needs ${formatCurrency(remaining)} to reach the goal`
                : 'Any amount makes a difference'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1 text-slate-500 hover:bg-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
            aria-label="Close donate money modal"
          >
            ✕
          </button>
        </div>

        <label className="mt-6 block text-sm font-medium text-slate-700">
          Donation amount
          <input
            type="number"
            min="1"
            step="1"
            className={clsx(
              'mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-base shadow-sm focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/30',
              error ? 'border-red-500 focus:border-red-500 focus:ring-red-500/30' : null,
            )}
            value={amount}
            onChange={(event) => {
              setAmount(event.target.value)
              setError(null)
            }}
            placeholder="Enter amount"
          />
        </label>

        <div className="mt-4 flex flex-wrap gap-2">
          {QUICK_AMOUNTS.map((value) => (
            <button
              key={value}
              type="button"
              className="rounded-full border border-slate-200 px-3 py-1 text-sm font-semibold text-slate-700 hover:border-blue-500 hover:text-blue-600"
              onClick={() => handleQuickAmount(value)}
            >
              {formatCurrency(value)}
            </button>
          ))}
        </div>

        {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}

        <button
          type="submit"
          className="mt-6 h-12 w-full rounded-xl bg-blue-600 text-sm font-semibold text-white shadow-sm active:scale-[0.99]"
        >
          Confirm donation
        </button>
      </form>
    </div>
  )
}

DonateMoneyModal.propTypes = {
  post: PropTypes.shape({
    id: PropTypes.string.isRequired,
    userName: PropTypes.string.isRequired,
    targetAmount: PropTypes.number,
    currentAmount: PropTypes.number.isRequired,
  }),
  open: PropTypes.bool,
  onClose: PropTypes.func.isRequired,
  onConfirm: PropTypes.func.isRequired,
}

