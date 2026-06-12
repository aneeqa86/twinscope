import { useState } from 'react'
import clsx from 'clsx'

const CITIES = [
  { name: 'Dubai',  lat: 25.0820, lng: 55.1404, alt: 1500 },
  { name: 'Riyadh', lat: 24.7136, lng: 46.6753, alt: 1500 },
  { name: 'Doha',   lat: 25.2854, lng: 51.5310, alt: 1500 },
]

const BUILDING_LAYERS = [
  { id: 'default', label: 'Default' },
  { id: 'height',  label: 'By Height' },
  { id: 'use',     label: 'By Use Type' },
]

const OSM_LAYERS = [
  { id: 'poi',   label: 'Points of Interest', color: '#06b6d4' },
  { id: 'roads', label: 'Road Network',        color: '#f97316' },
  { id: 'age',   label: 'Building Age',        color: '#a855f7' },
]

const HEIGHT_LEGEND = [
  { color: '#06b6d4', label: '> 100m' },
  { color: '#3b82f6', label: '50 – 100m' },
  { color: '#8b5cf6', label: '20 – 50m' },
  { color: '#64748b', label: '< 20m' },
]

const USE_LEGEND = [
  { color: '#06b6d4', label: 'Commercial / Office' },
  { color: '#10b981', label: 'Residential' },
  { color: '#f59e0b', label: 'Industrial' },
  { color: '#94a3b8', label: 'Unknown' },
]

const AGE_LEGEND = [
  { color: '#ef4444', label: 'Before 1970' },
  { color: '#f97316', label: '1970s' },
  { color: '#eab308', label: '1980s' },
  { color: '#10b981', label: '1990s' },
  { color: '#06b6d4', label: '2000s' },
  { color: '#3b82f6', label: '2010s' },
  { color: '#a855f7', label: '2020s+' },
]

const POI_LEGEND = [
  { color: '#ef4444', label: 'Hospital' },
  { color: '#eab308', label: 'School' },
  { color: '#10b981', label: 'Mosque' },
  { color: '#06b6d4', label: 'Metro' },
  { color: '#a855f7', label: 'Mall' },
  { color: '#22c55e', label: 'Park' },
  { color: '#3b82f6', label: 'Hotel' },
  { color: '#f97316', label: 'Restaurant' },
]

const ROAD_LEGEND = [
  { color: '#ef4444', label: 'Motorway' },
  { color: '#f97316', label: 'Trunk' },
  { color: '#eab308', label: 'Primary' },
  { color: '#06b6d4', label: 'Secondary' },
  { color: '#475569', label: 'Residential' },
]

const OSM_LEGENDS = {
  poi:   { title: 'POI TYPES',        items: POI_LEGEND,  dot: true },
  roads: { title: 'ROAD TYPES',       items: ROAD_LEGEND, dot: false },
  age:   { title: 'CONSTRUCTION ERA', items: AGE_LEGEND,  dot: true },
}

const SidePanel = ({
  onCityChange,
  onLayerChange,
  activeLayer,
  cameraPos,
  buildingCount,
  sunMode,
  onSunToggle,
  measureMode,
  onMeasureToggle,
  onResetCamera,
  activeOsmLayers,
  onOsmLayerToggle,
  histogramActive,
  onHistogramToggle,
  viewshedMode,
  onViewshedToggle,
  // mobile
  mobileOpen,
  onMobileClose,
}) => {
  const [activeCity,      setActiveCity]      = useState('Dubai')
  const [collapsed,       setCollapsed]       = useState(false)
  const [expandedLegends, setExpandedLegends] = useState({})

  const handleCity = (city) => {
    setActiveCity(city.name)
    onCityChange(city)
  }

  const toggleLegend = (id) => {
    setExpandedLegends((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  const buildingLegend = activeLayer === 'height'
    ? HEIGHT_LEGEND
    : activeLayer === 'use'
    ? USE_LEGEND
    : null

  // ─── Shared panel content ────────────────────────────────────────────
  const PanelContent = () => (
    <div
      className="bg-[#0a1628]/95 backdrop-blur-sm border border-cyan-900/40 rounded-xl overflow-hidden shadow-2xl"
      style={{ maxHeight: 'calc(100vh - 6rem)', overflowY: 'auto' }}
    >
      <div className="px-4 py-3 border-b border-cyan-900/40">
        <p className="text-xs text-cyan-400 font-mono tracking-widest">CONTROL PANEL</p>
      </div>

      {/* Camera */}
      <div className="px-4 py-3 border-b border-cyan-900/40">
        <p className="text-xs text-slate-500 mb-2 tracking-wider">CAMERA</p>
        <div className="grid grid-cols-3 gap-1 text-center">
          {[
            { val: cameraPos?.lat, label: 'LAT' },
            { val: cameraPos?.lng, label: 'LNG' },
            { val: cameraPos?.alt, label: 'KM' },
          ].map(({ val, label }) => (
            <div key={label} className="bg-[#0d1f38] rounded-lg p-2">
              <p className="text-cyan-400 font-mono text-xs">{val ?? '—'}</p>
              <p className="text-slate-500 text-xs mt-0.5">{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* City */}
      <div className="px-4 py-3 border-b border-cyan-900/40">
        <p className="text-xs text-slate-500 mb-2 tracking-wider">CITY</p>
        <div className="flex flex-col gap-1">
          {CITIES.map((city) => (
            <button
              key={city.name}
              onClick={() => handleCity(city)}
              className={clsx(
                'text-left px-3 py-2 rounded-lg text-sm transition-colors',
                activeCity === city.name
                  ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40'
                  : 'text-slate-400 hover:bg-white/5'
              )}
            >
              {city.name}
            </button>
          ))}
        </div>
      </div>

      {/* Building style */}
      <div className="px-4 py-3 border-b border-cyan-900/40">
        <p className="text-xs text-slate-500 mb-2 tracking-wider">BUILDING STYLE</p>
        <div className="flex flex-col gap-1">
          {BUILDING_LAYERS.map((layer) => (
            <button
              key={layer.id}
              onClick={() => onLayerChange(layer.id)}
              className={clsx(
                'text-left px-3 py-2 rounded-lg text-sm transition-colors',
                activeLayer === layer.id
                  ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40'
                  : 'text-slate-400 hover:bg-white/5'
              )}
            >
              {layer.label}
            </button>
          ))}
        </div>

        {buildingLegend && (
          <div className="mt-3 pt-3 border-t border-cyan-900/40">
            <div className="flex flex-col gap-1.5">
              {buildingLegend.map((item) => (
                <div key={item.label} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-sm shrink-0" style={{ background: item.color }} />
                  <span className="text-xs text-slate-400">{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* OSM layers */}
      <div className="px-4 py-3 border-b border-cyan-900/40">
        <p className="text-xs text-slate-500 mb-2 tracking-wider">OSM LAYERS</p>
        <div className="flex flex-col gap-1">
          {OSM_LAYERS.map((layer) => {
            const active   = activeOsmLayers.includes(layer.id)
            const legend   = OSM_LEGENDS[layer.id]
            const expanded = expandedLegends[layer.id]

            return (
              <div key={layer.id}>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => onOsmLayerToggle(layer.id)}
                    className={clsx(
                      'flex-1 text-left px-3 py-2 rounded-lg text-sm transition-colors flex items-center gap-2',
                      active ? 'bg-white/10 border border-white/20' : 'text-slate-400 hover:bg-white/5'
                    )}
                    style={active ? { color: layer.color, borderColor: layer.color + '60' } : {}}
                  >
                    <div
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ background: active ? layer.color : '#475569' }}
                    />
                    {layer.label}
                  </button>

                  {active && (
                    <button
                      onClick={() => toggleLegend(layer.id)}
                      className="w-6 h-6 flex items-center justify-center text-slate-500 hover:text-slate-300 transition-colors text-xs"
                    >
                      {expanded ? '▴' : '▾'}
                    </button>
                  )}
                </div>

                {active && expanded && legend && (
                  <div className="mt-1.5 mb-1 pl-3">
                    {legend.dot ? (
                      <div className="grid grid-cols-2 gap-1">
                        {legend.items.map((item) => (
                          <div key={item.label} className="flex items-center gap-1.5">
                            <div className="w-2 h-2 rounded-full shrink-0" style={{ background: item.color }} />
                            <span className="text-xs text-slate-500">{item.label}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="flex flex-col gap-1">
                        {legend.items.map((item) => (
                          <div key={item.label} className="flex items-center gap-2">
                            <div className="w-5 h-0.5 shrink-0" style={{ background: item.color }} />
                            <span className="text-xs text-slate-500">{item.label}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Tools */}
      <div className="px-4 py-3 border-b border-cyan-900/40">
        <p className="text-xs text-slate-500 mb-2 tracking-wider">TOOLS</p>
        <div className="flex flex-col gap-1">
          <button
            onClick={onSunToggle}
            className={clsx(
              'text-left px-3 py-2 rounded-lg text-sm transition-colors',
              sunMode
                ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/40'
                : 'text-slate-400 hover:bg-white/5'
            )}
          >
            ☀ Sun Simulation
          </button>
          <button
            onClick={() => onMeasureToggle('distance')}
            className={clsx(
              'text-left px-3 py-2 rounded-lg text-sm transition-colors',
              measureMode === 'distance'
                ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40'
                : 'text-slate-400 hover:bg-white/5'
            )}
          >
            ⟺ Measure Distance
          </button>
          <button
            onClick={() => onMeasureToggle('area')}
            className={clsx(
              'text-left px-3 py-2 rounded-lg text-sm transition-colors',
              measureMode === 'area'
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                : 'text-slate-400 hover:bg-white/5'
            )}
          >
            ⬡ Measure Area
          </button>
          <button
            onClick={onResetCamera}
            className="text-left px-3 py-2 rounded-lg text-sm text-slate-400 hover:bg-white/5 transition-colors"
          >
            ⌂ Reset Camera
          </button>
          <button
            onClick={onHistogramToggle}
            className={clsx(
              'text-left px-3 py-2 rounded-lg text-sm transition-colors',
              histogramActive
                ? 'bg-purple-500/20 text-purple-400 border border-purple-500/40'
                : 'text-slate-400 hover:bg-white/5'
            )}
          >
            ▦ Height Histogram
          </button>
          <button
            onClick={onViewshedToggle}
            className={clsx(
              'text-left px-3 py-2 rounded-lg text-sm transition-colors',
              viewshedMode
                ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                : 'text-slate-400 hover:bg-white/5'
            )}
          >
            ◉ Line of Sight
          </button>
        </div>
      </div>

      {/* Scene stats */}
      <div className="px-4 py-3">
        <p className="text-xs text-slate-500 mb-2 tracking-wider">SCENE</p>
        {[
          { label: 'Tiles loaded', value: buildingCount ?? '—' },
          { label: 'Data source',  value: 'OSM' },
          { label: 'Terrain',      value: 'Cesium World' },
          { label: 'Renderer',     value: 'WebGL 2' },
        ].map(({ label, value }) => (
          <div key={label} className="flex justify-between text-xs mb-1">
            <span className="text-slate-500">{label}</span>
            <span className="text-cyan-400 font-mono">{value}</span>
          </div>
        ))}
      </div>
    </div>
  )

  return (
    <>
      {/* ── DESKTOP: fixed side panel with collapse toggle (sm+) ─────── */}
      <div className={clsx(
        'hidden sm:block absolute left-4 top-20 z-50 transition-all duration-300',
        collapsed ? 'w-10' : 'w-64'
      )}>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-3 z-10 w-6 h-6 rounded-full bg-cyan-500 text-white text-xs flex items-center justify-center shadow-lg hover:bg-cyan-400 transition-colors"
        >
          {collapsed ? '›' : '‹'}
        </button>

        {!collapsed && <PanelContent />}
      </div>

      {/* ── MOBILE: full-height slide-in drawer (< sm) ───────────────── */}
      {/* Backdrop */}
      {mobileOpen && (
        <div
          className="sm:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
          onClick={onMobileClose}
        />
      )}

      {/* Drawer */}
      <div className={clsx(
        'sm:hidden fixed left-0 top-0 bottom-0 z-50 w-72 transition-transform duration-300 ease-in-out pt-16',
        mobileOpen ? 'translate-x-0' : '-translate-x-full'
      )}>
        {/* Close button */}
        <button
          onClick={onMobileClose}
          className="absolute top-[4.5rem] right-3 z-10 w-7 h-7 rounded-full bg-cyan-500 text-white text-sm flex items-center justify-center shadow-lg hover:bg-cyan-400 transition-colors"
        >
          ✕
        </button>
        <div className="h-full overflow-y-auto px-3 pb-6">
          <PanelContent />
        </div>
      </div>
    </>
  )
}

export default SidePanel