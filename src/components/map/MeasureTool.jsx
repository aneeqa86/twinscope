const MeasureTool = ({ active, onToggle, result, onClear }) => {
  return (
    <div className="absolute top-20 right-4 z-50 flex flex-col gap-2">

      <button
        onClick={onToggle}
        className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-mono transition-colors border shadow-lg ${
          active
            ? 'bg-cyan-500/20 border-cyan-500/60 text-cyan-400'
            : 'bg-[#0a1628]/90 border-cyan-900/40 text-slate-400 hover:text-cyan-400'
        }`}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M2 12h20M2 12l4-4M2 12l4 4M22 12l-4-4M22 12l-4 4"/>
        </svg>
        {active ? 'MEASURING...' : 'MEASURE'}
      </button>

      {active && !result && (
        <div className="bg-[#0a1628]/90 backdrop-blur-sm border border-cyan-500/20 rounded-lg px-3 py-2 shadow-lg">
          <p className="text-xs text-slate-500">Click point 1 on the map</p>
        </div>
      )}

      {result && (
        <div className="bg-[#0a1628]/90 backdrop-blur-sm border border-cyan-900/40 rounded-lg px-3 py-2 shadow-lg">
          <p className="text-xs text-slate-500 mb-1 tracking-wider">DISTANCE</p>
          <p className="text-sm text-cyan-400 font-mono mb-2">{result}</p>
          <div className="flex gap-2">
            <button
              onClick={onClear}
              className="flex-1 text-xs bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white px-2 py-1.5 rounded-lg transition-colors border border-white/10"
            >
              Measure again
            </button>
            <button
              onClick={() => { onClear(); onToggle() }}
              className="flex-1 text-xs bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white px-2 py-1.5 rounded-lg transition-colors border border-white/10"
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