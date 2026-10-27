import clsx from 'clsx'
import { PoiGlyph } from '@/components/icons/Icon'
import { Segmented } from '@/components/primitives'
import { DockShell, Instruct } from '@/components/shell/ModeDock'
import { ReportCard, AnalysisStatus, Headline, ShareBars, fmt } from '@/components/shell/ReportCard'
import { ACCESS_CATEGORIES, ACCESS_BANDS } from './categories'

const MODES = [
  { id: 'origin', label: 'From a point' },
  { id: 'coverage', label: 'Coverage' },
]

const BandLegend = () => (
  <div className="flex flex-wrap gap-x-3 gap-y-1">
    {ACCESS_BANDS.map((b) => (
      <span key={b.token} className="flex items-center gap-1.5 text-[11.5px] text-ink-2">
        <span aria-hidden className="h-[3px] w-4 rounded-full" style={{ background: `var(${b.token})` }} />
        {b.label}
      </span>
    ))}
  </div>
)

export const AccessDock = ({ access, mode, setMode, category, setCategory, onClose, mobile }) => (
  <DockShell
    tool="access"
    onClose={onClose}
    mobile={mobile}
    aside={<Segmented label="Mode" options={MODES} value={mode} onChange={setMode} className="w-[208px]" />}
  >
    {mode === 'origin' ? (
      <Instruct
        text={access.origin ? 'Click another point to compare' : 'Click a start point on a street'}
        hint="Walking at 4.8 km/h along OSM streets and paths"
      />
    ) : (
      <div>
        <p className="mb-2 text-[12px] text-ink-3">Walking time to the nearest</p>
        <div role="radiogroup" aria-label="Service" className="flex flex-wrap gap-1.5">
          {ACCESS_CATEGORIES.map((c) => {
            const on = c.id === category
            return (
              <button
                key={c.id}
                type="button"
                role="radio"
                aria-checked={on}
                onClick={() => setCategory(c.id)}
                className={clsx(
                  'ts-transition flex h-8 items-center gap-1.5 rounded-full border px-2.5 text-[12px] font-medium',
                  on ? 'border-line-strong bg-selected text-ink' : 'border-line text-ink-2 hover:bg-hover'
                )}
              >
                <span className="flex h-4 w-4 items-center justify-center rounded-full" style={{ background: `var(${c.token})`, color: 'var(--ts-void)' }}>
                  <PoiGlyph name={c.glyph} size={9} />
                </span>
                {c.label}
              </button>
            )
          })}
        </div>
      </div>
    )}
    <div className="mt-3"><BandLegend /></div>
  </DockShell>
)

export const AccessReport = ({ access, onClose }) => {
  if (access.status !== 'ready') {
    return (
      <ReportCard tool="access" onClose={onClose}>
        {access.status === 'idle' ? (
          <p className="text-[12.5px] leading-relaxed text-ink-2">
            Click a point to see which everyday needs are within a 15-minute walk, or switch to Coverage to find gaps.
          </p>
        ) : (
          <AnalysisStatus state={access} />
        )}
      </ReportCard>
    )
  }

  if (access.mode === 'origin') {
    return (
      <ReportCard
        tool="access"
        title="15-minute score"
        subtitle={`${fmt(access.reachKm, 1)} km of street within 15 min`}
        onClose={onClose}
        footer="Distances run along OpenStreetMap streets and paths; motorways and trunk roads are excluded. Services are snapped to the nearest street within 150 m."
      >
        <Headline value={`${access.score} / 6`} caption="everyday needs within a 15-minute walk" />
        <ul className="mt-3">
          {access.categories.map((c) => (
            <li key={c.id} className="flex items-center justify-between gap-3 border-t border-line py-[7px] text-[12px]">
              <span className="flex min-w-0 items-center gap-2">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full" style={{ background: `var(${c.token})`, color: 'var(--ts-void)' }}>
                  <PoiGlyph name={c.glyph} size={11} />
                </span>
                <span className="text-ink-2">{c.label}</span>
                {c.count > 0 && <span className="font-mono text-ink-3">×{c.count}</span>}
              </span>
              {c.minutes !== null ? (
                <span className="shrink-0 font-mono text-ink">{Math.max(1, Math.round(c.minutes))} min</span>
              ) : (
                <span className="shrink-0 font-mono text-bad">over 15 min</span>
              )}
            </li>
          ))}
        </ul>
      </ReportCard>
    )
  }

  const within = access.bands.slice(0, 3).reduce((s, b) => s + b.share, 0)
  return (
    <ReportCard
      tool="access"
      title={`Coverage · ${access.category.label}`}
      subtitle={`${fmt(access.services)} locations · ${fmt(access.totalKm, 1)} km of street`}
      onClose={onClose}
      footer="Services up to 800 m outside the square are included, so streets near its edge are not penalised."
    >
      <Headline value={`${fmt(within * 100)}%`} caption={`of streets within a 15-minute walk of ${access.category.label.toLowerCase()}`} />
      <div className="mt-3">
        <ShareBars items={access.bands.map((b) => ({ label: b.label, token: b.token, share: b.share, value: `${fmt(b.share * 100)}%` }))} />
      </div>
      {access.services === 0 && <p className="mt-2 text-[12px] text-bad">No {access.category.label.toLowerCase()} found in or near this area in OSM.</p>}
    </ReportCard>
  )
}
