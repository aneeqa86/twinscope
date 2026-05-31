const SunSlider = ({ value, onChange }) => {
  const formatHour = (h) => {
    const hours = Math.floor(h)
    const mins = Math.round((h % 1) * 60)
    const ampm = hours >= 12 ? 'PM' : 'AM'
    const display = hours % 12 === 0 ? 12 : hours % 12
    return `${display}:${mins.toString().padStart(2, '0')} ${ampm}`
  }

  return (
    <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-50 w-80 bg-[#0a1628]/90 backdrop-blur-sm border border-cyan-900/40 rounded-xl px-5 py-4 shadow-2xl">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs text-cyan-400 font-mono tracking-widest">SUN SIMULATION</p>
        <p className="text-xs text-slate-300 font-mono">{formatHour(value)}</p>
      </div>

      {/* Sun arc visualization */}
      <div className="relative h-6 mb-3">
        <div className="absolute inset-x-0 bottom-0 h-px bg-slate-700" />
        {/* Sun position indicator */}
        <div
          className="absolute bottom-1 w-4 h-4 rounded-full bg-yellow-400 shadow-lg transition-all"
          style={{
            left: `calc(${((value - 5) / 14) * 100}% - 8px)`,
            opacity: value >= 6 && value <= 19 ? 1 : 0.2,
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
    </div>
  )
}

export default SunSlider