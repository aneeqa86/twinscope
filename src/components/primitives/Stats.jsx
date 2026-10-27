import clsx from 'clsx'

export const Swatch = ({ token, color, size = 10, round = false, className }) => (
  <span
    aria-hidden
    className={clsx('inline-block shrink-0', round ? 'rounded-full' : 'rounded-[3px]', className)}
    style={{ width: size, height: size, background: color ?? `var(${token})` }}
  />
)

/** Label left, mono value right, 1px top rule. */
export const StatRow = ({ label, value, swatch, className }) => (
  <div className={clsx('flex items-center justify-between gap-4 border-t border-line py-[7px]', className)}>
    <span className="text-[12px] text-ink-3">{label}</span>
    <span className="flex min-w-0 items-center gap-2 text-right font-mono text-[12px] text-ink">
      {swatch && <Swatch token={swatch} />}
      <span className="truncate">{value}</span>
    </span>
  </div>
)

export const StatTile = ({ label, value, unit, className }) => (
  <div className={clsx('rounded-[10px] bg-subtle px-3 py-2', className)}>
    <p className="text-[11px] text-ink-3">{label}</p>
    <p className="mt-0.5 font-mono text-[13.5px] text-ink">
      {value}
      {unit && <span className="text-ink-3"> {unit}</span>}
    </p>
  </div>
)

export const SectionLabel = ({ children, className, as: Tag = 'p', ...rest }) => (
  <Tag className={clsx('ts-label', className)} {...rest}>{children}</Tag>
)
