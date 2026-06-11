const MapControls = ({ onZoomIn, onZoomOut, heading = 0, altitudeKm = 0 }) => {
  return (
    <div className="absolute right-4 top-1/3 z-50 flex flex-col items-center gap-3">

      {/* Compass */}
      <div className="w-10 h-10 rounded-full bg-[#0a1628]/90 border border-cyan-900/40 flex items-center justify-center relative">
        <svg width="28" height="28" viewBox="0 0 28 28">
          <g transform={`rotate(${(heading * 180) / Math.PI}, 14, 14)`}>
            <polygon points="14,3 17,14 14,12 11,14" fill="#06b6d4" />
            <polygon points="14,25 17,14 14,16 11,14" fill="#64748b" />
          </g>
        </svg>
        <span
          className="absolute text-cyan-400 font-mono"
          style={{ fontSize: '8px', top: '2px', left: '50%', transform: 'translateX(-50%)' }}
        >N</span>
      </div>

      {/* Zoom In */}
      <button
        onClick={onZoomIn}
        className="w-10 h-10 rounded-lg bg-[#0a1628]/90 border border-cyan-900/40 text-cyan-400 text-lg flex items-center justify-center hover:bg-cyan-500/20 transition-colors"
        title="Zoom in"
      >+</button>

      {/* Zoom Out */}
      <button
        onClick={onZoomOut}
        className="w-10 h-10 rounded-lg bg-[#0a1628]/90 border border-cyan-900/40 text-cyan-400 text-lg flex items-center justify-center hover:bg-cyan-500/20 transition-colors"
        title="Zoom out"
      >−</button>

    </div>
  )
}

export default MapControls