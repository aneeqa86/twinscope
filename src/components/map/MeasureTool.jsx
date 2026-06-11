const MeasureTool = ({ active, onToggle, result, onClear, measureMode }) => {
  if (!active) return null

  return (
    <div className="absolute bottom-24 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center gap-2">

      {/* Instruction */}
      {!result && (
        <div className="bg-[#0a1628]/90 backdrop-blur-sm border border-cyan-500/30 rounded-lg px-4 py-2 shadow-lg">
          <p className="text-xs text-slate-400 font-mono">
            {measureMode === 'area'
              ? 'Click points to draw polygon · Double-click to close'
              : 'Click two points on the map'}
          </p>
        </div>
      )}

      {/* Result */}
      {result && (
        <div className="bg-[#0a1628]/90 backdrop-blur-sm border border-cyan-900/40 rounded-lg px-4 py-3 shadow-lg flex items-center gap-4">
          <div>
            <p className="text-xs text-slate-500 tracking-wider mb-0.5">
              {measureMode === 'area' ? 'AREA' : 'DISTANCE'}
            </p>
            <p className="text-sm text-cyan-400 font-mono">{result}</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={onClear}
              className="text-xs bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white px-3 py-1.5 rounded-lg transition-colors border border-white/10"
            >
              Again
            </button>
            <button
              onClick={() => { onClear(); onToggle() }}
              className="text-xs bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white px-3 py-1.5 rounded-lg transition-colors border border-white/10"
            >
              Done
            </button>
          </div>
        </div>
      )}

    </div>
  )
}

export default MeasureTool