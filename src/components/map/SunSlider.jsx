const SunSlider = ({ value, onChange, sunTimes, cityName }) => {
  const formatHour = (h) => {
    const hours = Math.floor(h)
    const mins = Math.round((h % 1) * 60)
    const ampm = hours >= 12 ? 'PM' : 'AM'
    const display = hours % 12 === 0 ? 12 : hours % 12
    return `${display}:${mins.toString().padStart(2, '0')} ${ampm}`
  }

  const toPercent = (h) => `${Math.min(100, Math.max(0, ((h - 0) / 23) * 100))}%`

  const isDaytime = sunTimes
    ? value >= sunTimes.rise && value <= sunTimes.set
    : value >= 6 && value <= 19

  return (
    <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-50 w-80 bg-[#0a1628]/90 backdrop-blur-sm border border-cyan-900/40 rounded-xl px-5 py-4 shadow-2xl">

      <div className="flex items-center justify-between mb-3">
        <p className="text-xs text-cyan-400 font-mono tracking-widest">SUN SIMULATION</p>
        <p className="text-xs text-slate-300 font-mono">{formatHour(value)}</p>
      </div>

      {/* Sun arc visualization */}
      <div className="relative h-6 mb-3">
        <div className="absolute inset-x-0 bottom-0 h-px bg-slate-700" />

        {/* Daytime band */}
        {sunTimes && (
          <div
            className="absolute bottom-0 h-px bg-yellow-500/40"
            style={{
              left: toPercent(sunTimes.rise),
              width: `calc(${toPercent(sunTimes.set)} - ${toPercent(sunTimes.rise)})`,
            }}
          />
        )}

        {/* Sunrise marker */}
        {sunTimes && (
          <div
            className="absolute bottom-1 flex flex-col items-center"
            style={{ left: `calc(${toPercent(sunTimes.rise)} - 3px)` }}
          >
            <div className="w-1.5 h-1.5 rounded-full bg-orange-400" />
          </div>
        )}

        {/* Sunset marker */}
        {sunTimes && (
          <div
            className="absolute bottom-1 flex flex-col items-center"
            style={{ left: `calc(${toPercent(sunTimes.set)} - 3px)` }}
          >
            <div className="w-1.5 h-1.5 rounded-full bg-orange-600" />
          </div>
        )}

        {/* Sun position indicator */}
        <div
          className="absolute bottom-1 w-4 h-4 rounded-full shadow-lg transition-all"
          style={{
            left: `calc(${toPercent(value)} - 8px)`,
            background: isDaytime ? '#facc15' : '#1e3a5f',
            opacity: 1,
          }}
        />
      </div>

      <input
        type="range"
        min={0}
        max={23}
        step={0.25}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-cyan-500 cursor-pointer"
      />

      <div className="flex justify-between text-xs text-slate-600 mt-1">
        <span>12 AM</span>
        <span>6 AM</span>
        <span>12 PM</span>
        <span>6 PM</span>
        <span>12 AM</span>
      </div>

      {/* Sunrise / sunset times */}
      {sunTimes ? (
        <div className="flex justify-between mt-3 pt-3 border-t border-cyan-900/40">
          <div className="text-center">
            <p className="text-xs text-slate-500">Sunrise</p>
            <p className="text-xs text-orange-400 font-mono mt-0.5">{formatHour(sunTimes.rise)}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-slate-500">{cityName}</p>
            <p className="text-xs text-cyan-400 font-mono mt-0.5">Today</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-slate-500">Sunset</p>
            <p className="text-xs text-orange-600 font-mono mt-0.5">{formatHour(sunTimes.set)}</p>
          </div>
        </div>
      ) : (
        <div className="mt-3 pt-3 border-t border-cyan-900/40">
          <p className="text-xs text-slate-600 text-center">Fetching sun times…</p>
        </div>
      )}

    </div>
  )
}

export default SunSlider