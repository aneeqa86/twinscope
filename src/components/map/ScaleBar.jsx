const ScaleBar = ({ altitudeKm = 1 }) => {
  const h = altitudeKm * 1000
  const fovRad = (60 * Math.PI) / 180
  const metersPerPx = (h * Math.tan(fovRad / 2) * 2) / window.innerWidth

  const rawMeters = metersPerPx * 100
  let displayVal, displayLabel
  if (rawMeters >= 1000) {
    const km = parseFloat((rawMeters / 1000).toFixed(1))
    displayVal = km
    displayLabel = `${km} km`
  } else {
    const m = Math.round(rawMeters)
    displayVal = m
    displayLabel = `${m} m`
  }

  return (
    <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center gap-1">
      <div
        className="border-l-2 border-r-2 border-b-2 border-cyan-500/60"
        style={{ width: '100px', height: '6px' }}
      />
      <span className="text-cyan-400 font-mono text-xs">{displayLabel}</span>
    </div>
  )
}

export default ScaleBar