import { Link } from 'react-router-dom'
import logo from '@/assets/logo.svg'

const STACK = [
  { name: 'CesiumJS',         desc: '3D globe rendering & 3D tiles' },
  { name: 'Resium',           desc: 'React bindings for CesiumJS' },
  { name: 'Cesium ion',       desc: 'Terrain & OSM building streaming' },
  { name: 'React 18',         desc: 'UI framework' },
  { name: 'Vite',             desc: 'Build tooling' },
  { name: 'Tailwind CSS',     desc: 'Styling' },
  { name: 'Recharts',         desc: 'Data visualization' },
  { name: 'OpenStreetMap',    desc: 'Vector data via Overpass API' },
  { name: 'OpenWeatherMap',   desc: 'Live weather & AQI feeds' },
  { name: 'Vercel',           desc: 'Deployment & hosting' },
]

const FEATURES = [
  {
    icon: '🏙',
    title: '3D City Visualization',
    desc: 'Real OSM buildings streamed via Cesium ion, rendered in WebGL 2 on a photorealistic globe with world terrain.',
  },
  {
    icon: '🎨',
    title: 'Thematic Mapping',
    desc: 'Buildings colored dynamically by height or use type — standard GIS choropleth analysis applied in 3D.',
  },
  {
    icon: '☀',
    title: 'Sun & Shadow Simulation',
    desc: 'Time-of-day slider drives real solar position with accurate building shadows. Syncs to actual sunrise and sunset times per city via live API.',
  },
  {
    icon: '🗺',
    title: 'OSM Vector Layers',
    desc: 'Live Overpass API queries render POIs (hospitals, mosques, metro, hotels, restaurants), road networks by type, and building age footprints.',
  },
  {
    icon: '🌤',
    title: 'Live Weather & AQI',
    desc: 'Real-time temperature, humidity, wind, and visibility from OpenWeatherMap. Air quality index with PM2.5, PM10, and CO levels per city.',
  },
  {
    icon: '📏',
    title: 'Distance & Area Measurement',
    desc: 'Geodesic distance between two points, or draw a polygon to compute area — essential spatial analysis tools with automatic unit switching.',
  },
  {
    icon: '👁',
    title: 'Line of Sight Analysis',
    desc: 'Click an observer and target point. The app samples terrain and building heights along the path and draws a green (clear) or red (blocked) result line.',
  },
  {
    icon: '📊',
    title: 'Building Height Histogram',
    desc: 'Queries real building heights from Overpass API for the current view and renders a live height distribution chart — updates as the camera moves.',
  },
  {
    icon: '🏢',
    title: 'Building Intelligence',
    desc: 'Click any building to retrieve its OSM attributes: name, use type, height, floor count, and coordinates.',
  },
  {
    icon: '🔍',
    title: 'Landmark Search',
    desc: 'Curated landmark search for Dubai, Riyadh, and Doha. Select a landmark and the camera flies directly to it.',
  },
  {
    icon: '🧭',
    title: 'Navigation Controls',
    desc: 'Zoom in/out, compass rose reflecting camera heading, dynamic scale bar, and one-click camera reset per city.',
  },
  {
    icon: '🌍',
    title: 'Multi-City Support',
    desc: 'Instantly fly between Dubai, Riyadh, and Doha — the three key smart city markets in the Gulf region.',
  },
]

const DATA_SOURCES = [
  {
    source: 'Cesium World Terrain',
    detail: 'Global high-resolution terrain streamed from Cesium ion',
    badge: 'Cesium ion',
  },
  {
    source: 'OSM Buildings (Asset 96188)',
    detail: 'Global 3D building footprints from OpenStreetMap via Cesium ion',
    badge: 'Cesium ion',
  },
  {
    source: 'Overpass API',
    detail: 'Live OSM vector queries — POIs, roads, building ages in current view',
    badge: 'Real-time',
  },
  {
    source: 'OpenWeatherMap API',
    detail: 'Current weather conditions and air quality index per city',
    badge: 'Real-time',
  },
  {
    source: 'sunrise-sunset.org',
    detail: 'Astronomical sunrise and sunset times for accurate sun simulation',
    badge: 'Real-time',
  },
  {
    source: 'Bing Maps Imagery',
    detail: 'Satellite base imagery streamed via Cesium ion',
    badge: 'Cesium ion',
  },
]

const BADGE_COLORS = {
  'Real-time':  { bg: '#10b98120', color: '#10b981', border: '#10b98140' },
  'Cesium ion': { bg: '#06b6d420', color: '#06b6d4', border: '#06b6d440' },
}

const GIS_CONCEPTS = [
  { title: '3D Tile Streaming',    desc: 'Cesium 3D Tiles spec for streaming large building datasets' },
  { title: 'Geodesic Measurement', desc: 'Ellipsoidal surface distance using EllipsoidGeodesic' },
  { title: 'Overpass Queries',     desc: 'Bounding-box spatial queries against OSM via Overpass API' },
  { title: 'Line of Sight',        desc: 'Terrain + building height sampling for viewshed analysis' },
  { title: 'Choropleth Styling',   desc: 'Conditional 3D tile styling by attribute value' },
  { title: 'Solar Simulation',     desc: 'Astronomical sun position driving real-time shadow casting' },
  { title: 'GeoJSON Rendering',    desc: 'Vector road and POI data rendered as Cesium primitives' },
  { title: 'Camera Analytics',     desc: 'Live bounding box computation for viewport-aware queries' },
  { title: 'Height Profiling',     desc: 'Building height distribution analysis from real OSM data' },
]

const AboutPage = () => {
  return (
    <div className="min-h-screen bg-[#0a1628] text-white">

      {/* Hero */}
      <div className="border-b border-cyan-900/30 px-8 py-12 flex flex-col items-center text-center gap-6">
        <img src={logo} alt="TwinScope" className="h-14" />
        <p className="text-slate-400 max-w-xl text-sm leading-relaxed">
          A 3D urban digital twin platform built to demonstrate real-world geospatial
          development skills — combining live API data, WebGL rendering, spatial analysis,
          and GIS tooling in a production-ready web application targeting Gulf smart city markets.
        </p>
        <div className="flex items-center gap-3">
          <Link
            to="/"
            className="px-5 py-2 rounded-lg bg-cyan-500/20 border border-cyan-500/40 text-cyan-400 text-sm hover:bg-cyan-500/30 transition-colors"
          >
            Launch TwinScope →
          </Link>
          <a
            href="https://github.com/aneeqa86/twinscope"
            target="_blank"
            rel="noopener noreferrer"
            className="px-5 py-2 rounded-lg bg-white/5 border border-white/10 text-slate-400 text-sm hover:bg-white/10 transition-colors"
          >
            GitHub ↗
          </a>
        </div>
        <div className="flex items-center gap-2">
          {['Dubai', 'Riyadh', 'Doha'].map((city) => (
            <span
              key={city}
              className="text-xs px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 font-mono"
            >
              {city}
            </span>
          ))}
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-8 py-12 flex flex-col gap-12">

        {/* Features */}
        <section>
          <p className="text-xs text-cyan-400 font-mono tracking-widest mb-6">
            FEATURES — {FEATURES.length} IMPLEMENTED
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="bg-[#0d1f38] border border-cyan-900/30 rounded-xl p-5 flex gap-4"
              >
                <span className="text-2xl shrink-0">{f.icon}</span>
                <div>
                  <p className="text-sm font-medium text-white mb-1">{f.title}</p>
                  <p className="text-xs text-slate-400 leading-relaxed">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Tech stack */}
        <section>
          <p className="text-xs text-cyan-400 font-mono tracking-widest mb-6">TECH STACK</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {STACK.map((s) => (
              <div
                key={s.name}
                className="bg-[#0d1f38] border border-cyan-900/30 rounded-xl p-4"
              >
                <p className="text-sm font-mono text-cyan-400 mb-1">{s.name}</p>
                <p className="text-xs text-slate-500">{s.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Data sources */}
        <section>
          <p className="text-xs text-cyan-400 font-mono tracking-widest mb-6">DATA SOURCES</p>
          <div className="bg-[#0d1f38] border border-cyan-900/30 rounded-xl p-6 flex flex-col gap-4">
            {DATA_SOURCES.map(({ source, detail, badge }) => {
              const style = BADGE_COLORS[badge] ?? BADGE_COLORS['Cesium ion']
              return (
                <div key={source} className="flex gap-4 items-start">
                  <div className="w-2 h-2 rounded-full bg-cyan-500 mt-1.5 shrink-0" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                      <p className="text-sm text-white">{source}</p>
                      <span
                        className="text-xs px-2 py-0.5 rounded-full font-mono"
                        style={{
                          background: style.bg,
                          color: style.color,
                          border: `1px solid ${style.border}`,
                        }}
                      >
                        {badge}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500">{detail}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </section>

        {/* GIS concepts */}
        <section>
          <p className="text-xs text-cyan-400 font-mono tracking-widest mb-6">
            GIS CONCEPTS DEMONSTRATED
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {GIS_CONCEPTS.map(({ title, desc }) => (
              <div
                key={title}
                className="bg-[#0d1f38] border border-cyan-900/30 rounded-xl p-4"
              >
                <p className="text-xs font-mono text-slate-300 mb-1">{title}</p>
                <p className="text-xs text-slate-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Footer */}
        <div className="text-center text-xs text-slate-600 pb-4 flex flex-col gap-1">
          <p>Built with CesiumJS · Data © OpenStreetMap contributors</p>
          <p>OpenWeatherMap · Cesium ion · sunrise-sunset.org</p>
        </div>

      </div>
    </div>
  )
}

export default AboutPage