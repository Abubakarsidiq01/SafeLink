import clsx from 'clsx'

export default function CardSkeleton({ className }) {
  return (
    <div
      className={clsx(
        'rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-100 animate-pulse',
        className,
      )}
      aria-hidden="true"
    >
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-full bg-slate-200" />
        <div className="space-y-2">
          <div className="h-3 w-32 rounded bg-slate-200" />
          <div className="h-3 w-24 rounded bg-slate-200" />
        </div>
      </div>
      <div className="mt-4 h-48 w-full rounded-xl bg-slate-200" />
      <div className="mt-4 h-4 w-3/4 rounded bg-slate-200" />
      <div className="mt-2 h-3 w-2/3 rounded bg-slate-200" />
      <div className="mt-4 h-3 w-full rounded bg-slate-200" />
      <div className="mt-3 h-12 rounded-xl bg-slate-200" />
      <div className="mt-3 grid grid-cols-2 gap-3">
        <div className="h-12 rounded-xl bg-slate-200" />
        <div className="h-12 rounded-xl bg-slate-200" />
      </div>
    </div>
  )
}

