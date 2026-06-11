import { useEffect, useState, useRef } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import * as Cesium from 'cesium'

const OVERPASS_URL = 'https://overpass-api.de/api/interpreter'

const BUCKETS = [
  { label: '0–10m',    min: 0,   max: 10  },
  { label: '10–20m',   min: 10,  max: 20  },
  { label: '20–50m',   min: 20,  max: 50  },
  { label: '50–100m',  min: 50,  max: 100 },
  { label: '100–200m', min: 100, max: 200 },
  { label: '200m+',    min: 200, max: Infinity },
]

const BUCKET_COLORS = ['#64748b', '#8b5cf6', '#3b82f6', '#06b6d4', '#10b981', '#ef4444']

const fetchHeights = async (bbox) => {
  const { south, west, north, east } = bbox
  const query = `
    [out:json][timeout:25];
    (
      way["building"]["height"](${south},${west},${north},${east});
      way["building"]["building:levels"](${south},${west},${north},${east});
    );
    out tags;
  `
  const res = await fetch(OVERPASS_URL, {
    method: 'POST',
    body: `data=${encodeURIComponent(query)}`,
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  })
  const data = await res.json()
  return data.elements ?? []
}

const parseHeight = (el) => {
  const h = parseFloat(el.tags?.height)
  if (!isNaN(h) && h > 0) return h
  const levels = parseFloat(el.tags?.['building:levels'])
  if (!isNaN(levels) && levels > 0) return levels * 3.5
  return null
}

const buildChartData = (elements) => {
  const counts = BUCKETS.map(() => 0)
  elements.forEach((el) => {
    const h = parseHeight(el)
    if (h === null) return
    const idx = BUCKETS.findIndex((b) => h >= b.min && h < b.max)
    if (idx !== -1) counts[idx]++
  })
  return BUCKETS.map((b, i) => ({ label: b.label, count: counts[i], color: BUCKET_COLORS[i] }))
}

const getBbox = (viewer) => {
  const rect = viewer.camera.computeViewRectangle()
  if (!rect) return null
  return {
    south: Cesium.Math.toDegrees(rect.south),
    west:  Cesium.Math.toDegrees(rect.west),
    north: Cesium.Math.toDegrees(rect.north),
    east:  Cesium.Math.toDegrees(rect.east),
  }
}

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-[#0a1628] border border-cyan-900/40 rounded-lg px-3 py-2 text-xs">
      <p className="text-slate-400">{payload[0].payload.label}</p>
      <p className="text-cyan-400 font-mono">{payload[0].value} buildings</p>
    </div>
  )
}

const BuildingHistogram = ({ viewer, active, cameraPos }) => {
  const [chartData,  setChartData]  = useState([])
  const [loading,    setLoading]    = useState(false)
  const [total,      setTotal]      = useState(0)
  const [collapsed,  setCollapsed]  = useState(false)
  const debounceRef  = useRef(null)
  const fetchedRef   = useRef(null)

  useEffect(() => {
    if (!viewer || !active) return

    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      const bbox = getBbox(viewer)
      if (!bbox) return

      const key = `${bbox.south.toFixed(3)},${bbox.west.toFixed(3)},${bbox.north.toFixed(3)},${bbox.east.toFixed(3)}`
      if (fetchedRef.current === key) return
      fetchedRef.current = key

      setLoading(true)
      try {
        const elements = await fetchHeights(bbox)
        const data = buildChartData(elements)
        setChartData(data)
        setTotal(elements.filter(el => parseHeight(el) !== null).length)
      } catch (err) {
        console.error('Histogram fetch failed:', err)
      } finally {
        setLoading(false)
      }
    }, 800)

    return () => clearTimeout(debounceRef.current)
  }, [viewer, active, cameraPos?.lat, cameraPos?.lng])

  if (!active) return null

  return (
    <div className="absolute bottom-16 right-16 z-50 w-72">
      <div className="bg-[#0a1628]/90 backdrop-blur-sm border border-cyan-900/40 rounded-xl overflow-hidden shadow-2xl">

        {/* Header */}
        <div className="px-4 py-3 border-b border-cyan-900/40 flex items-center justify-between">
          <div>
            <p className="text-xs text-cyan-400 font-mono tracking-widest">HEIGHT DISTRIBUTION</p>
            {!loading && total > 0 && (
              <p className="text-xs text-slate-500 mt-0.5">{total} buildings in view</p>
            )}
          </div>
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="text-slate-500 hover:text-slate-300 text-xs transition-colors w-5 h-5 flex items-center justify-center"
          >
            {collapsed ? '▴' : '▾'}
          </button>
        </div>

        {!collapsed && (
          <div className="px-4 py-3">
            {loading && (
              <div className="h-32 flex items-center justify-center">
                <p className="text-xs text-slate-500">Analysing buildings…</p>
              </div>
            )}

            {!loading && chartData.length > 0 && (
              <>
                <ResponsiveContainer width="100%" height={140}>
                  <BarChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                    <XAxis
                      dataKey="label"
                      tick={{ fill: '#64748b', fontSize: 9 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fill: '#64748b', fontSize: 9 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(6,182,212,0.05)' }} />
                    <Bar dataKey="count" radius={[3, 3, 0, 0]}>
                      {chartData.map((entry, i) => (
                        <Cell key={i} fill={entry.color} fillOpacity={0.85} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>

                {/* Tallest bucket callout */}
                {(() => {
                  const peak = chartData.reduce((a, b) => b.count > a.count ? b : a, chartData[0])
                  return peak.count > 0 ? (
                    <div className="mt-2 pt-2 border-t border-cyan-900/40 flex justify-between text-xs">
                      <span className="text-slate-500">Most common</span>
                      <span className="text-cyan-400 font-mono">{peak.label}</span>
                    </div>
                  ) : null
                })()}
              </>
            )}

            {!loading && chartData.every(d => d.count === 0) && (
              <div className="h-32 flex items-center justify-center">
                <p className="text-xs text-slate-500">No height data in current view</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default BuildingHistogram