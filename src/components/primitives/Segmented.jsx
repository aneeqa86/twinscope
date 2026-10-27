import clsx from 'clsx'

/**
 * Segmented control with one sliding pill. Items are equal width so the pill
 * moves by whole slots. `size="tab"` is the 36px mobile sheet tab variant.
 */
const Segmented = ({ options, value, onChange, label, size = 'md', className }) => {
  const index = Math.max(0, options.findIndex((o) => o.id === value))
  const isTab = size === 'tab'

  return (
    <div
      role={isTab ? 'tablist' : 'radiogroup'}
      aria-label={label}
      className={clsx('relative grid rounded-[11px] bg-subtle p-[3px]', className)}
      style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))`, gap: 2 }}
    >
      <span
        aria-hidden
        className="absolute bottom-[3px] left-[3px] top-[3px] rounded-control bg-selected"
        style={{
          width: `calc((100% - 6px - ${(options.length - 1) * 2}px) / ${options.length})`,
          transform: `translateX(calc(${index} * (100% + 2px)))`,
          transition: 'transform var(--ts-dur-panel-in) var(--ts-ease-settle)',
          boxShadow: 'inset 0 0 0 1px rgba(244,240,230,0.14)',
        }}
      />
      {options.map((o) => {
        const selected = o.id === value
        return (
          <button
            key={o.id}
            type="button"
            role={isTab ? 'tab' : 'radio'}
            aria-checked={isTab ? undefined : selected}
            aria-selected={isTab ? selected : undefined}
            onClick={() => onChange(o.id)}
            className={clsx(
              'ts-transition relative z-[1] rounded-control font-medium',
              isTab ? 'h-9 text-[13px]' : 'h-[30px] text-[12.5px]',
              selected ? 'text-ink' : 'text-ink-2 hover:text-ink'
            )}
          >
            {o.label}
          </button>
        )
      })}
    </div>
  )
}

export default Segmented
