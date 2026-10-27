import clsx from 'clsx'

const Switch = ({ checked, onChange, label, size = 'md', className, ...rest }) => {
  const lg = size === 'lg'
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={clsx(
        'relative shrink-0 rounded-full ts-transition',
        lg ? 'h-[26px] w-11' : 'h-[22px] w-9',
        checked ? 'bg-accent' : 'bg-[rgba(244,240,230,0.18)]',
        className
      )}
      {...rest}
    >
      <span
        aria-hidden
        className={clsx('absolute left-[3px] top-[3px] rounded-full', lg ? 'h-5 w-5' : 'h-4 w-4')}
        style={{
          background: checked ? 'var(--ts-on-accent)' : 'var(--ts-text)',
          transform: checked ? `translateX(${lg ? 18 : 14}px)` : 'none',
          transition: 'transform 180ms var(--ts-ease-settle), background-color 180ms',
        }}
      />
    </button>
  )
}

export default Switch
