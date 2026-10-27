import clsx from 'clsx'
import Icon from '@/components/icons/Icon'

const Compass = ({ heading, size }) => (
  <div
    className={clsx('ts-panel flex items-center justify-center !rounded-full', size)}
    role="img"
    aria-label={`Heading ${Math.round(((heading * 180) / Math.PI + 360) % 360)}°`}
  >
    <svg width="34" height="34" viewBox="0 0 34 34" aria-hidden>
      <g transform={`rotate(${(-heading * 180) / Math.PI}, 17, 17)`}>
        <text x="17" y="8.2" textAnchor="middle" fontSize="7" fontWeight="500" fontFamily="var(--ts-mono)" fill="var(--ts-text)">N</text>
        <polygon points="17,10 20,18 17,16.6 14,18" fill="var(--ts-accent)" />
        <polygon points="17,28 20,18 17,19.4 14,18" fill="var(--ts-text-3)" />
      </g>
    </svg>
  </div>
)

/** Slot D (desktop) and the mobile right column, which adds Reset. */
const MapControls = ({ heading = 0, onZoomIn, onZoomOut, onReset, className }) => {
  const btn = 'ts-transition flex h-11 w-11 items-center justify-center text-ink-2 hover:bg-hover hover:text-ink active:bg-selected focus-visible:outline-offset-[-3px]'
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
