import PropTypes from 'prop-types'
import clsx from 'clsx'

export const variantStyles = {
  urgent: 'bg-red-500 text-white',
  medical: 'bg-blue-500 text-white',
  shelter: 'bg-indigo-500 text-white',
  food: 'bg-emerald-500 text-white',
  donation: 'bg-amber-500 text-gray-900',
  recent: 'bg-slate-700 text-white',
  default: 'bg-gray-100 text-gray-800',
}

export default function TagChip({
  label,
  variant = 'default',
  as = 'span',
  className,
  showHash = false,
  icon,
  ...rest
}) {
  const Component = as
  const styles = variantStyles[variant] || variantStyles.default

  return (
    <Component
      className={clsx(
        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium transition-colors',
        styles,
        className,
      )}
      {...rest}
    >
      {icon ? <span aria-hidden="true">{icon}</span> : null}
      <span aria-label={`${label} tag`}>
        {showHash ? '#' : ''}
        {label}
      </span>
    </Component>
  )
}

TagChip.propTypes = {
  label: PropTypes.string.isRequired,
  variant: PropTypes.string,
  as: PropTypes.elementType,
  className: PropTypes.string,
  showHash: PropTypes.bool,
  icon: PropTypes.node,
}

