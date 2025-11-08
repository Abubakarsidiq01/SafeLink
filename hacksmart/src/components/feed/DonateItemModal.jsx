import { useEffect, useState } from 'react'
import PropTypes from 'prop-types'
import clsx from 'clsx'

function buildInitialItems(post) {
  if (!post?.neededItems) return []
  return post.neededItems.map((item) => ({
    name: item.name,
    qtyNeeded: item.qtyNeeded,
    qtyPledged: item.qtyPledged,
    qty: 0,
  }))
}

export default function DonateItemModal({ post, open, onClose, onConfirm }) {
  const [items, setItems] = useState(() => buildInitialItems(post))
  const [customName, setCustomName] = useState('')
  const [customQty, setCustomQty] = useState('')
  const [error, setError] = useState(null)

  useEffect(() => {
    if (open) {
      setItems(buildInitialItems(post))
      setCustomName('')
      setCustomQty('')
      setError(null)
    }
  }, [open, post])

  if (!open || !post) return null

  function updateQty(index, qty) {
    setItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, qty: Math.max(Number(qty) || 0, 0) } : item)),
    )
  }

  function handleAddCustomItem(event) {
    event.preventDefault()
    const trimmedName = customName.trim()
    const numericQty = Number(customQty)
    if (!trimmedName || !numericQty || Number.isNaN(numericQty) || numericQty <= 0) {
      setError('Enter a name and quantity greater than zero')
      return
    }
    setItems((prev) => [...prev, { name: trimmedName, qty: numericQty, qtyNeeded: numericQty, qtyPledged: 0 }])
    setCustomName('')
    setCustomQty('')
    setError(null)
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
    <div
      className="fixed inset-0 z-40 flex items-end justify-center bg-slate-900/40 px-4 py-8 backdrop-blur-sm md:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="donate-item-title"
    >
      <form onSubmit={handleSubmit} className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 id="donate-item-title" className="text-lg font-semibold text-slate-900">
              Pledge items for {post.userName}
            </h2>
            <p className="text-sm text-slate-500">
              Choose quantities you can deliver. We’ll share drop-off details after confirmation.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1 text-slate-500 hover:bg-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
            aria-label="Close donate item modal"
          >
            ✕
          </button>
        </div>

        <div className="mt-6 space-y-4">
          {items.map((item, index) => (
            <div
              key={`${item.name}-${index}`}
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 p-4"
            >
              <div>
                <p className="text-sm font-semibold text-slate-800">{item.name}</p>
                <p className="text-xs text-slate-500">
                  Needed: {item.qtyPledged}/{item.qtyNeeded}
                </p>
              </div>
              <label className="flex items-center gap-2 text-sm text-slate-600">
                Qty
                <input
                  type="number"
                  min="0"
                  className="w-20 rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/30"
                  value={item.qty}
                  onChange={(event) => updateQty(index, event.target.value)}
                />
              </label>
            </div>
          ))}
        </div>

        <details className="mt-6 rounded-xl border border-dashed border-slate-300 p-4">
          <summary className="cursor-pointer text-sm font-semibold text-slate-700">
            Add custom item
          </summary>
          <div className="mt-4 flex flex-wrap items-end gap-3">
            <label className="flex-1 text-sm text-slate-600">
              Item name
              <input
                type="text"
                className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/30"
                value={customName}
                onChange={(event) => setCustomName(event.target.value)}
                placeholder="e.g. Flashlight"
              />
            </label>
            <label className="w-32 text-sm text-slate-600">
              Quantity
              <input
                type="number"
                min="1"
                className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/30"
                value={customQty}
                onChange={(event) => setCustomQty(event.target.value)}
              />
            </label>
            <button
              type="button"
              className="h-10 rounded-lg bg-slate-900 px-4 text-sm font-semibold text-white hover:bg-slate-800"
              onClick={handleAddCustomItem}
            >
              Add
            </button>
          </div>
        </details>

        {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}

        <div className="mt-6 flex flex-wrap gap-3">
          <button
            type="submit"
            className="h-12 flex-1 rounded-xl bg-blue-600 text-sm font-semibold text-white shadow-sm active:scale-[0.99]"
          >
            Confirm pledge
          </button>
          <button
            type="button"
            onClick={onClose}
            className="h-12 flex-1 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}

DonateItemModal.propTypes = {
  post: PropTypes.shape({
    id: PropTypes.string.isRequired,
    userName: PropTypes.string.isRequired,
    neededItems: PropTypes.arrayOf(
      PropTypes.shape({
        name: PropTypes.string.isRequired,
        qtyNeeded: PropTypes.number.isRequired,
        qtyPledged: PropTypes.number.isRequired,
      }),
    ),
  }),
  open: PropTypes.bool,
  onClose: PropTypes.func.isRequired,
  onConfirm: PropTypes.func.isRequired,
}

