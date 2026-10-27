import clsx from 'clsx'
import Icon from '@/components/icons/Icon'

const Compass = ({ heading, size }) => (
  <div
    className={clsx('ts-panel flex items-center justify-center !rounded-full', size)}
    role="img"
    aria-label={`Heading ${Math.round(((heading * 180) / Math.PI + 360) % 360)}°`}
  >
    <svg width="30" height="30" viewBox="0 0 30 30" aria-hidden>
      <g transform={`rotate(${(-heading * 180) / Math.PI}, 15, 15)`}>
        <polygon points="15,4 18,15 15,13.2 12,15" fill="var(--ts-accent)" />
        <polygon points="15,26 18,15 15,16.8 12,15" fill="var(--ts-text-3)" />
        <text x="15" y="3.6" textAnchor="middle" fontSize="5.5" fontFamily="var(--ts-mono)" fill="var(--ts-text-2)">N</text>
      </g>
    </svg>
  </div>
)

/** Slot D (desktop) and the mobile right column, which adds Reset. */
const MapControls = ({ heading = 0, onZoomIn, onZoomOut, onReset, className }) => {
  const btn = 'ts-transition flex h-11 w-11 items-center justify-center text-ink-2 hover:bg-hover hover:text-ink'
  return (
    <div className={clsx('absolute z-20 flex flex-col items-center gap-3', className)}>
      <Compass heading={heading} size="h-11 w-11" />
      <div className="ts-panel flex flex-col overflow-hidden !rounded-pill">
        <button type="button" onClick={onZoomIn} aria-label="Zoom in" className={btn}>
          <Icon name="plus" size={18} />
        </button>
        <span aria-hidden className="mx-2 h-px bg-line" />
        <button type="button" onClick={onZoomOut} aria-label="Zoom out" className={btn}>
          <Icon name="minus" size={18} />
        </button>
      </div>
      {onReset && (
        <button type="button" onClick={onReset} aria-label="Reset camera" className={clsx('ts-panel !rounded-pill', btn)}>
          <Icon name="reset" size={18} />
        </button>
      )}
    </div>
  )
}

export default MapControls
