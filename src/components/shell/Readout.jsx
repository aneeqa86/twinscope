import { Link } from 'react-router-dom'
import { formatLat, formatLng, formatAlt } from '@/utils'

/** Live camera position, mono. `showCoords` drops lat/lng when space is tight. */
const Readout = ({ cameraPos, showCoords = true }) => (
  <div className="flex h-11 shrink-0 items-center gap-2">
    <div
      className="ts-panel flex h-11 items-center gap-3.5 !rounded-pill px-3.5 font-mono text-[12px] tabular-nums"
      aria-label="Camera position"
    >
      {showCoords && (
        <>
          <span className="text-ink">{formatLat(cameraPos?.lat)}</span>
          <span className="text-ink">{formatLng(cameraPos?.lng)}</span>
        </>
      )}
      <span className="text-ink-3">
        ALT <span className="text-ink">{formatAlt(cameraPos?.alt)}</span>
      </span>
    </div>
    <Link
      to="/about"
      className="ts-panel ts-transition flex h-11 items-center !rounded-pill px-4 text-[12.5px] font-medium text-ink-2 hover:text-ink"
    >
      About
    </Link>
  </div>
)

export default Readout
