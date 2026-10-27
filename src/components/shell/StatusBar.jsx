import clsx from 'clsx'

const NICE = [1, 2, 5]

/** Pick a round distance whose bar length lands between 60 and 130 px. */
const niceScale = (altitudeKm, viewportWidth) => {
  const h = Math.max(altitudeKm, 0.01) * 1000
  const fovRad = (60 * Math.PI) / 180
  const metersPerPx = (h * Math.tan(fovRad / 2) * 2) / viewportWidth
  const target = metersPerPx * 104
  const exp = Math.pow(10, Math.floor(Math.log10(target)))
  let best = exp
  for (const n of [...NICE, 10]) {
    if (n * exp <= target * 1.25) best = n * exp
  }
  const px = Math.max(40, Math.min(140, best / metersPerPx))
  const label = best >= 1000 ? `${best / 1000} km` : `${best} m`
  return { px, label }
}

export const ScaleBar = ({ altitudeKm, className }) => {
  const { px, label } = niceScale(altitudeKm ?? 1, window.innerWidth)
  return (
    <div className={clsx('flex items-end gap-2', className)} aria-label={`Scale: ${label}`}>
      <span
        aria-hidden
        className="block h-[7px] border-x-[1.5px] border-b-[1.5px] border-[var(--ts-text-2)]"
        style={{ width: px, transition: 'width var(--ts-dur-fast)' }}
      />
      <span className="font-mono text-[11px] leading-none text-ink">{label}</span>
    </div>
  )
}

/** Slot G: scale bar + scene stats caption. */
const StatusBar = ({ altitudeKm, tileCount }) => (
  <div className="pointer-events-none absolute bottom-6 left-24 z-10 flex flex-col gap-2 [text-shadow:0_1px_3px_rgba(0,0,0,0.8)]">
    <ScaleBar altitudeKm={altitudeKm} />
    <p className="font-mono text-[10.5px] text-ink-2">
      {tileCount !== null && tileCount !== undefined ? tileCount.toLocaleString() : '—'} tiles · OSM · Cesium World · WebGL 2
    </p>
  </div>
)

export default StatusBar
