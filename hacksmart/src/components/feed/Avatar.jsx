import PropTypes from 'prop-types'
import clsx from 'clsx'

const FALLBACK_COLORS = ['bg-sky-500', 'bg-emerald-500', 'bg-amber-500', 'bg-rose-500']

function getInitials(name) {
  if (!name) return '?'
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0]?.[0]?.toUpperCase() || '?'
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

function pickColor(seed) {
  const index = seed.charCodeAt(0) % FALLBACK_COLORS.length
  return FALLBACK_COLORS[index]
}

export default function Avatar({ src, alt, size = 40 }) {
  const dimensionStyle = { width: size, height: size }
  const initials = getInitials(alt)
  const fallbackColor = pickColor(initials)

  if (src) {
    return (
      <img
        src={src}
        alt={alt}
        className="rounded-full object-cover"
        width={size}
        height={size}
      />
    )
  }

  return (
    <div
      className={clsx(
        'rounded-full flex items-center justify-center text-sm font-semibold text-white',
        fallbackColor,
      )}
      style={dimensionStyle}
      aria-hidden="true"
    >
      {initials}
    </div>
  )
}

Avatar.propTypes = {
  src: PropTypes.string,
  alt: PropTypes.string.isRequired,
  size: PropTypes.number,
}

