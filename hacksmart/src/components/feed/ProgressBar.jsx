import PropTypes from 'prop-types'
import clsx from 'clsx'

export default function ProgressBar({ value, max = 1, className }) {
  const safeMax = max > 0 ? max : 1
  const percentage = Math.min(100, Math.round((value / safeMax) * 100))

  return (
    <div className={clsx('px-4', className)}>
      <div className="h-3 w-full overflow-hidden rounded-full bg-slate-200" aria-hidden="true">
        <div
          className="h-full bg-gradient-to-r from-orange-400 via-yellow-400 to-green-500 transition-all"
          style={{ width: `${percentage}%` }}
          role="progressbar"
          aria-valuenow={value}
          aria-valuemax={max}
          aria-valuemin={0}
        />
      </div>
    </div>
  )
}

ProgressBar.propTypes = {
  value: PropTypes.number.isRequired,
  max: PropTypes.number,
  className: PropTypes.string,
}

