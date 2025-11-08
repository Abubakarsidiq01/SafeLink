import { formatDistanceToNowStrict, parseISO } from 'date-fns'

export function formatCurrency(value, locale = navigator.language || 'en-US', currency = 'USD') {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: value < 1 ? 2 : 0,
    maximumFractionDigits: 0,
  }).format(value)
}

export function formatRelativeTime(input) {
  const date =
    typeof input === 'number'
      ? new Date(input)
      : typeof input === 'string'
        ? parseISO(input)
        : input?.toDate
          ? input.toDate()
          : null

  if (!date || Number.isNaN(date.getTime())) {
    return 'Just now'
  }

  return `${formatDistanceToNowStrict(date, { addSuffix: true })}`
}

export function extractTitleFromCaption(caption) {
  if (!caption) return ''
  const match = caption.match(/(.+?[\.\!\?])(\s|$)/)
  if (match) return match[1].trim()
  return caption.length > 60 ? `${caption.slice(0, 57)}…` : caption
}

