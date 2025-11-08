import PropTypes from 'prop-types'
import clsx from 'clsx'
import { useId } from 'react'

const FILTER_CHIPS = [
  { value: 'all', label: 'All' },
  { value: 'food', label: 'Food' },
  { value: 'medical', label: 'Medical' },
  { value: 'shelter', label: 'Shelter' },
  { value: 'donation', label: 'Donation' },
  { value: 'rescue', label: 'Rescue' },
  { value: 'recent', label: 'Recent' },
  { value: 'urgent', label: 'Urgent' },
]

export default function FiltersBar({ active, urgencyOnly = false, onChange, className }) {
  const groupId = useId()

  function handleChipClick(value) {
    if (value === 'urgent') {
      onChange({
        helpType: urgencyOnly ? undefined : active.helpType,
        urgency: active.urgency === 1 ? undefined : 1,
        mine: undefined,
      })
      return
    }

    if (value === 'recent') {
      onChange({
        helpType: undefined,
        urgency: undefined,
        mine: true,
      })
      return
    }

    onChange({
      helpType: value === 'all' ? undefined : value,
      urgency: active.urgency,
      mine: undefined,
    })
  }

  return (
    <div
      className={clsx(
        'no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 pb-3 pt-2 md:mx-0 md:px-0 md:pt-0',
        className,
      )}
      role="group"
      aria-labelledby={`${groupId}-label`}
    >
      <span id={`${groupId}-label`} className="sr-only">
        Filter posts
      </span>
      {FILTER_CHIPS.map((chip) => {
        const isActive =
          chip.value === 'urgent'
            ? active.urgency === 1
            : chip.value === 'recent'
              ? active.mine === true
            : chip.value === 'all'
              ? !active.helpType
              : active.helpType === chip.value

        return (
          <button
            key={chip.value}
            type="button"
            className={clsx(
              'rounded-full px-4 py-1.5 text-sm font-semibold transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand',
              'bg-white text-slate-600 shadow-sm ring-1 ring-slate-200/70 hover:bg-slate-50 data-[active=true]:bg-brand data-[active=true]:text-white data-[active=true]:shadow-lg',
            )}
            data-active={isActive}
            onClick={() => handleChipClick(chip.value)}
          >
            {chip.label}
          </button>
        )
      })}
    </div>
  )
}

FiltersBar.propTypes = {
  active: PropTypes.shape({
    helpType: PropTypes.string,
    urgency: PropTypes.number,
  }).isRequired,
  urgencyOnly: PropTypes.bool,
  onChange: PropTypes.func.isRequired,
  className: PropTypes.string,
}

