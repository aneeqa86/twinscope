import clsx from 'clsx'
import Icon from '@/components/icons/Icon'
import { IconButton } from '@/components/primitives'
import { TOOL_BY_ID } from './tools'

/** Inspector card for an analysis tool's results. Same header rhythm as the dock. */
export const ReportCard = ({ tool, title, subtitle, onClose, children, footer, className }) => {
  const meta = TOOL_BY_ID[tool]
  return (
    <section aria-label={`${title ?? meta.title} results`} className={clsx('ts-panel px-4 py-3.5', className)}>
      <header className="flex items-start gap-3">
        <span className="mt-0.5 flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-control bg-subtle text-ink">
          <Icon name={meta.icon} size={17} />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-[14px] font-semibold text-ink">{title ?? meta.title}</h2>
          {subtitle && <p className="mt-0.5 truncate font-mono text-[11.5px] text-ink-3">{subtitle}</p>}
        </div>
        {onClose && (
          <IconButton onClick={onClose} aria-label={`Close ${meta.title.toLowerCase()}`} className="-mr-1.5 -mt-1">
            <Icon name="close" size={17} />
          </IconButton>
        )}
      </header>
      <div className="mt-3" aria-live="polite">{children}</div>
      {footer && <footer className="mt-3 border-t border-line pt-2.5 text-[11.5px] leading-snug text-ink-3">{footer}</footer>}
    </section>
  )
}

/** Loading / zoom-in / error lines shared by every analysis. Returns null when ready. */
export const AnalysisStatus = ({ state, zoomHint = 'Zoom in below 6 km to run this analysis.' }) => {
  if (!state || state.status === 'ready' || state.status === 'idle') return null
  if (state.status === 'loading') {
    return (
      <p className="flex items-center gap-2 font-mono text-[12px] text-ink-2">
        <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-accent motion-safe:animate-pulse" />
        {state.step ?? 'Working…'}
      </p>
    )
  }
  if (state.status === 'too-far') return <p className="text-[12.5px] text-ink-2">{zoomHint}</p>
  if (state.status === 'error') return <p className="text-[12.5px] text-bad">{state.error}</p>
  return null
}

/** Big headline number with unit and caption. */
export const Headline = ({ value, unit, caption }) => (
  <div>
    <p className="font-mono leading-none tracking-[-0.02em]">
      <span className="text-[30px] text-ink">{value}</span>
      {unit && <span className="text-[15px] text-ink-3"> {unit}</span>}
    </p>
    {caption && <p className="mt-1.5 text-[12px] text-ink-2">{caption}</p>}
  </div>
)

/** Horizontal share bars with a swatch per class. */
export const ShareBars = ({ items }) => (
  <ul className="flex flex-col gap-2">
    {items.map((it) => (
      <li key={it.label}>
        <div className="mb-1 flex items-center justify-between text-[12px]">
          <span className="flex items-center gap-2 text-ink-2">
            <span aria-hidden className="h-2.5 w-2.5 rounded-[3px]" style={{ background: `var(${it.token})` }} />
            {it.label}
          </span>
          <span className="font-mono text-ink">{it.value}</span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-subtle">
          <div className="h-full rounded-full" style={{ width: `${Math.round(it.share * 100)}%`, background: `var(${it.token})` }} />
        </div>
      </li>
    ))}
  </ul>
)

export const fmt = (n, digits = 0) =>
  n === null || n === undefined || isNaN(n) ? '—' : n.toLocaleString(undefined, { maximumFractionDigits: digits, minimumFractionDigits: digits })
