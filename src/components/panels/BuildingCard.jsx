import Icon from '@/components/icons/Icon'
import { Button, IconButton, StatRow, StatTile } from '@/components/primitives'
import { heightClass } from '@/config/legends'
import { formatLat, formatLng } from '@/utils'

const TowerGlyph = () => (
  <svg width="38" height="44" viewBox="0 0 38 44" fill="none" aria-hidden>
    <rect x="4" y="8" width="13" height="32" rx="1.5" fill="var(--ts-text)" opacity="0.9" />
    <rect x="20" y="16" width="13" height="24" rx="1.5" stroke="var(--ts-accent)" strokeWidth="1.3" strokeDasharray="3 3" />
    <path d="M1 40.5h36" stroke="var(--ts-text-3)" strokeWidth="1" />
  </svg>
)

const prettyUse = (use) => (use && use !== 'yes' ? use.charAt(0).toUpperCase() + use.slice(1).replace(/_/g, ' ') : 'Building')

/** Inspector top card for the selected building. `mobile` renders the phone layout. */
const BuildingCard = ({ building, onClose, onFlyTo, mobile = false }) => {
  const hClass = heightClass(building.heightM)
  const height = building.heightM !== null && building.heightM !== undefined ? building.heightM.toFixed(1) : null
  const coords = `${formatLat(building.lat)}  ${formatLng(building.lng)}`

  const header = (
    <header className="flex items-start gap-3">
      <div className="min-w-0 flex-1">
        <h2 className="truncate text-[17px] font-semibold leading-tight text-ink">{building.name}</h2>
        <p className="mt-0.5 text-[12.5px] text-ink-2">{prettyUse(building.use)}</p>
      </div>
      <IconButton onClick={onClose} aria-label="Close building details" size={mobile ? 'lg' : 'md'} className="-mr-1.5 -mt-1">
        <Icon name="close" size={17} />
      </IconButton>
    </header>
  )

  const footer = (
    <footer className="mt-3 flex items-center justify-between gap-3 border-t border-line pt-3">
      <p className="font-mono text-[10.5px] leading-snug text-ink-3">Source: OpenStreetMap<br />via Cesium ion</p>
      <Button variant="secondary" size={mobile ? 'lg' : 'md'} onClick={onFlyTo}>
        <Icon name="up" size={15} />
        Fly to
      </Button>
    </footer>
  )

  if (mobile) {
    return (
      <section aria-label="Building details" className="ts-panel px-4 py-3.5">
        {header}
        <div className="mt-3 grid grid-cols-3 gap-2">
          <StatTile label="Height" value={height ?? '—'} unit={height ? 'm' : undefined} />
          <StatTile label="Levels" value={building.levels ?? '—'} />
          <StatTile label="Era" value={building.era?.label ?? '—'} />
        </div>
        <p className="mt-3 font-mono text-[11.5px] text-ink-2">{coords}</p>
        {footer}
      </section>
    )
  }

  return (
    <section aria-label="Building details" className="ts-panel px-4 py-3.5">
      {header}
      <div className="mt-3 flex items-end justify-between">
        <div>
          <p className="font-mono leading-none tracking-[-0.02em]">
            <span className="text-[30px] text-ink">{height ?? '—'}</span>
            {height && <span className="text-[15px] text-ink-3"> m</span>}
          </p>
          <p className="mt-1.5 text-[12px] text-ink-3">
            {building.levels ? <><span className="font-mono text-ink-2">{building.levels}</span> levels</> : 'Levels unknown'}
          </p>
        </div>
        <TowerGlyph />
      </div>
      <div className="mt-3">
        <StatRow label="Height class" value={hClass?.range ?? 'Unknown'} swatch={hClass?.token} />
        <StatRow label="Era" value={building.era?.label ?? 'Unknown'} swatch={building.era?.token} />
        <StatRow label="Coordinates" value={coords} />
      </div>
      {footer}
    </section>
  )
}

export default BuildingCard
