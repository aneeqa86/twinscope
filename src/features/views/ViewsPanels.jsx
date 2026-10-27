import clsx from 'clsx'
import { Segmented } from '@/components/primitives'
import { DockShell, Instruct } from '@/components/shell/ModeDock'
import { ReportCard, AnalysisStatus, Headline, fmt } from '@/components/shell/ReportCard'
import { VIEW_LANDMARKS } from '@/config/cities'

export const viewTargets = (city) => [
  ...(city.coastal ? [{ id: 'sea', label: 'Sea' }] : []),
  ...(VIEW_LANDMARKS[city.name] ?? []).map((l) => ({ id: l.name, label: l.name.replace(' Tower', '') })),
]

export const ViewsDock = ({ views, city, targetId, setTargetId, onClose, mobile }) => (
  <DockShell tool="views" onClose={onClose} mobile={mobile}>
    <p className="mb-1.5 text-[12px] text-ink-3">View toward</p>
    <Segmented label="View target" options={viewTargets(city)} value={targetId} onChange={setTargetId} />
    <div className="mt-3">
      <Instruct
        text={views.building ? `Scoring ${views.building.name}. Click another building to compare.` : 'Click a building to score the view from every floor'}
        hint="Sightlines sample terrain and every building in between"
      />
    </div>
  </DockShell>
)

const summary = (v) => {
  if (v.target.kind === 'landmark') {
    if (v.firstFull) return { value: `Floor ${v.firstFull}`, caption: `first floor with a full view of ${v.target.name}` }
    if (v.firstAny) return { value: `Floor ${v.firstAny}`, caption: `first floor that sees part of ${v.target.name}` }
    return { value: 'No view', caption: `${v.target.name} is hidden from every floor` }
  }
  if (v.firstAny) {
    return { value: `Floor ${v.firstAny}`, caption: `first floor with a sea view · widest ${fmt(v.best.score * 360)}° from floor ${v.best.floor}` }
  }
  return { value: 'No sea view', caption: 'The sea is hidden from every floor' }
}

export const ViewsReport = ({ views, onClose }) => {
  if (views.status !== 'ready') {
    const msg =
      views.status === 'no-coast' || views.status === 'no-sea-in-range'
        ? 'No coastline within 6 km of this building. Pick a landmark instead.'
        : null
    return (
      <ReportCard tool="views" onClose={onClose}>
        {views.status === 'idle' ? (
          <p className="text-[12.5px] leading-relaxed text-ink-2">Click a building to see, floor by floor, whether it sees the sea or a landmark.</p>
        ) : msg ? (
          <p className="text-[12.5px] text-ink-2">{msg}</p>
        ) : (
          <AnalysisStatus state={views} />
        )}
      </ReportCard>
    )
  }

  const s = summary(views)
  const isSea = views.target.kind === 'sea'
  const rows = [...views.rows].reverse()
  return (
    <ReportCard
      tool="views"
      title={views.name}
      subtitle={`${fmt(views.height)} m · ${views.floors} floors${views.distanceKm ? ` · ${fmt(views.distanceKm, 1)} km away` : ''}`}
      onClose={onClose}
      footer={
        isSea
          ? `Sea view = share of 36 sightlines (every 10°) that reach open water past the OSM coastline within 6 km. Eye height 1.6 m above each floor.`
          : `Score = share of the landmark's upper half visible (6 heights from 50% to the top). Earth curvature included.`
      }
    >
      <Headline value={s.value} caption={s.caption} />
      <p className="ts-label mb-1.5 mt-4">{isSea ? 'Sea view arc by floor' : 'Landmark visible by floor'}</p>
      <ul className="ts-scroll max-h-[220px] overflow-y-auto pr-1" aria-label="Score by floor">
        {rows.map((r) => {
          const on = r.floor === views.floor
          return (
            <li key={r.floor}>
              <button
                type="button"
                data-no-press
                onClick={() => views.setFloor(r.floor)}
                aria-pressed={on}
                className={clsx('ts-transition flex w-full items-center gap-2 rounded-[6px] px-1 py-[3px] text-left', on ? 'bg-selected' : 'hover:bg-hover')}
              >
                <span className="w-7 shrink-0 text-right font-mono text-[10.5px] text-ink-3">{r.floor}</span>
                <span className="h-2 flex-1 overflow-hidden rounded-full bg-subtle">
                  <span
                    className="block h-full rounded-full"
                    style={{ width: `${Math.round(r.score * 100)}%`, background: r.score > 0 ? 'var(--ts-ok)' : 'transparent' }}
                  />
                </span>
                <span className="w-10 shrink-0 text-right font-mono text-[10.5px] text-ink">
                  {isSea ? `${fmt(r.score * 360)}°` : `${fmt(r.score * 100)}%`}
                </span>
              </button>
            </li>
          )
        })}
      </ul>
      <p className="mt-2 text-[11.5px] text-ink-3">Pick a floor to draw its sightlines on the map.</p>
    </ReportCard>
  )
}
