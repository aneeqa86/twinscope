import { useState } from 'react'
import clsx from 'clsx'

const CITIES = [
  { name: 'Dubai', lat: 55.1404, lng: 25.0820, alt: 600 },
  { name: 'Riyadh', lat: 46.6753, lng: 24.7136, alt: 600 },
  { name: 'Doha', lat: 51.5310, lng: 25.2854, alt: 600 },
]

const LAYERS = [
  { id: 'default', label: 'Default' },
  { id: 'height', label: 'By Height' },
  { id: 'use', label: 'By Use Type' },
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

const SidePanel = ({ onCityChange, onLayerChange, activeLayer, cameraPos, buildingCount, sunMode, onSunToggle, measureMode, onMeasureToggle }) => {
  const [activeCity, setActiveCity] = useState('Dubai')
  const [collapsed, setCollapsed] = useState(false)

  const handleCity = (city) => {
    setActiveCity(city.name)
    onCityChange(city)
  }

  const legend = activeLayer === 'height'
    ? HEIGHT_LEGEND
    : activeLayer === 'use'
    ? USE_LEGEND
    : null

  return (
    <div className={clsx(
      'absolute left-4 top-20 z-50 transition-all duration-300',
      collapsed ? 'w-10' : 'w-64'
    )}>
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-3 z-10 w-6 h-6 rounded-full bg-cyan-500 text-white text-xs flex items-center justify-center shadow-lg hover:bg-cyan-400 transition-colors"
      >
        {collapsed ? '›' : '‹'}
      </button>

      {!collapsed && (
        <div className="bg-[#0a1628]/90 backdrop-blur-sm border border-cyan-900/40 rounded-xl overflow-hidden shadow-2xl">

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

          {/* Layer */}
          <div className="px-4 py-3 border-b border-cyan-900/40">
            <p className="text-xs text-slate-500 mb-2 tracking-wider">LAYER</p>
            <div className="flex flex-col gap-1">
              {LAYERS.map((layer) => (
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
          </div>

          {/* Legend */}
          {legend && (
            <div className="px-4 py-3 border-b border-cyan-900/40">
              <p className="text-xs text-slate-500 mb-2 tracking-wider">LEGEND</p>
              <div className="flex flex-col gap-1.5">
                {legend.map((item) => (
                  <div key={item.label} className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-sm shrink-0" style={{ background: item.color }} />
                    <span className="text-xs text-slate-400">{item.label}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

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
                onClick={onMeasureToggle}
                className={clsx(
                  'text-left px-3 py-2 rounded-lg text-sm transition-colors',
                  measureMode
                    ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40'
                    : 'text-slate-400 hover:bg-white/5'
                )}
              >
                ⟺ Measure Distance
              </button>
            </div>
          </div>

          {/* Scene stats */}
          <div className="px-4 py-3">
            <p className="text-xs text-slate-500 mb-2 tracking-wider">SCENE</p>
            {[
              { label: 'Tiles loaded', value: buildingCount ?? '—' },
              { label: 'Data source', value: 'OSM' },
              { label: 'Terrain', value: 'Cesium World' },
              { label: 'Renderer', value: 'WebGL 2' },
            ].map(({ label, value }) => (
              <div key={label} className="flex justify-between text-xs mb-1">
                <span className="text-slate-500">{label}</span>
                <span className="text-cyan-400 font-mono">{value}</span>
              </div>
            ))}
          </div>

        </div>
      )}
    </div>
  )
}

export default SidePanel