const BuildingPopup = ({ building, onClose }) => {
  if (!building) return null

  const rows = [
    { label: 'Name',        value: building.name },
    { label: 'Use',         value: building.use },
    { label: 'Height',      value: building.height ? `${building.height}m` : 'Unknown' },
    { label: 'Levels',      value: building.levels },
    { label: 'Coordinates', value: building.coords },
  ]

  return (
    // Mobile: full width minus margins, sits above bottom nav area
    // Desktop: fixed w-72 at bottom-right as before
    <div className="absolute bottom-8 right-4 z-50 w-[calc(100vw-2rem)] sm:w-72 bg-[#0a1628]/95 backdrop-blur-sm border border-cyan-900/40 rounded-xl overflow-hidden shadow-2xl">

      <div className="flex items-center justify-between px-4 py-3 border-b border-cyan-900/40">
        <p className="text-xs text-cyan-400 font-mono tracking-widest">BUILDING INFO</p>
        <button
          onClick={onClose}
          className="text-slate-500 hover:text-white transition-colors text-xl leading-none"
        >
          ×
        </button>
      </div>

      <div className="px-4 py-3 flex flex-col gap-2.5">
        {rows.map(({ label, value }) => (
          <div key={label} className="flex justify-between items-start gap-4">
            <span className="text-xs text-slate-500 shrink-0">{label}</span>
            <span className="text-xs text-slate-200 text-right font-mono break-all">{value}</span>
          </div>
        ))}
      </div>

      <div className="px-4 py-2 bg-cyan-500/5 border-t border-cyan-900/40">
        <p className="text-xs text-slate-500">Source: OpenStreetMap via Cesium ion</p>
      </div>

    </div>
  )
}

export default BuildingPopup