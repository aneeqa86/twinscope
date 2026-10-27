import { Link } from 'react-router-dom'

/** Solid tower (the surveyed city) beside its dashed twin. */
export const BrandMark = ({ size = 30 }) => (
  <svg width={size} height={size} viewBox="0 0 30 30" fill="none" aria-hidden>
    <rect x="5" y="7" width="9" height="19" rx="1.2" fill="var(--ts-text)" />
    <rect x="7.5" y="3" width="4" height="5" rx="0.8" fill="var(--ts-text)" />
    <rect x="16.5" y="11" width="8.5" height="15" rx="1.2" stroke="var(--ts-accent)" strokeWidth="1.4" strokeDasharray="2.4 2" />
    <path d="M2 26.5h26" stroke="var(--ts-text-3)" strokeWidth="1" strokeLinecap="round" />
  </svg>
)

const Brand = ({ compact = false }) => (
  <Link to="/" className="flex h-11 shrink-0 items-center gap-2.5 rounded-pill pr-1" aria-label="TwinScope home">
    <BrandMark />
    {!compact && (
      <span className="flex flex-col leading-none">
        <span className="text-[19px] tracking-[-0.01em] text-ink">
          <span className="font-semibold">Twin</span>
          <span className="font-light">Scope</span>
        </span>
        <span className="mt-1 font-mono text-[9.5px] uppercase tracking-[0.14em] text-ink-3">Urban digital twin</span>
      </span>
    )}
  </Link>
)

export default Brand
