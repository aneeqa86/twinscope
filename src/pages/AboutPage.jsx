import { Link } from 'react-router-dom'
import logo from '@/assets/logo.svg'

const STACK = [
  { name: 'CesiumJS', desc: '3D globe rendering & 3D tiles' },
  { name: 'Resium', desc: 'React bindings for CesiumJS' },
  { name: 'Cesium ion', desc: 'Terrain & OSM building streaming' },
  { name: 'React 18', desc: 'UI framework' },
  { name: 'Vite', desc: 'Build tooling' },
  { name: 'Tailwind CSS', desc: 'Styling' },
  { name: 'OpenStreetMap', desc: 'Building attribute data' },
  { name: 'Vercel', desc: 'Deployment' },
]

const FEATURES = [
  { icon: '🏙', title: '3D City Visualization', desc: 'Real OSM buildings streamed via Cesium ion, rendered in WebGL 2 on a photorealistic globe.' },
  { icon: '🎨', title: 'Thematic Mapping', desc: 'Buildings colored dynamically by height or use type — standard GIS choropleth analysis in 3D.' },
  { icon: '☀', title: 'Sun & Shadow Simulation', desc: 'Time-of-day slider drives real solar position, casting accurate building shadows for environmental analysis.' },
  { icon: '📏', title: 'Distance Measurement', desc: 'Click two points on the globe to compute geodesic distance — essential for spatial analysis workflows.' },
  { icon: '🏢', title: 'Building Intelligence', desc: 'Click any building to retrieve its OSM attributes: name, use type, height, floor count, and coordinates.' },
  { icon: '🌍', title: 'Multi-City Support', desc: 'Instantly fly between Dubai, Riyadh, and Doha — key smart city markets in the Gulf region.' },
]

const AboutPage = () => {
  return (
    <div className="min-h-screen bg-[#0a1628] text-white">

      {/* Hero */}
      <div className="border-b border-cyan-900/30 px-8 py-12 flex flex-col items-center text-center gap-6">
        <img src={logo} alt="TwinScope" className="h-14" />
        <p className="text-slate-400 max-w-xl text-sm leading-relaxed">
          A 3D urban digital twin platform built to demonstrate real-world geospatial
          development skills — combining live OSM data, WebGL rendering, and spatial
          analysis tools in a production-ready web application.
        </p>
        <Link
          to="/"
          className="px-5 py-2 rounded-lg bg-cyan-500/20 border border-cyan-500/40 text-cyan-400 text-sm hover:bg-cyan-500/30 transition-colors"
        >
          Launch TwinScope →
        </Link>
      </div>

      <div className="max-w-4xl mx-auto px-8 py-12 flex flex-col gap-12">

        {/* Features */}
        <section>
          <p className="text-xs text-cyan-400 font-mono tracking-widest mb-6">FEATURES</p>
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
          <div className="bg-[#0d1f38] border border-cyan-900/30 rounded-xl p-6 flex flex-col gap-3">
            {[
              { source: 'Cesium World Terrain', detail: 'Global high-resolution terrain — streamed from Cesium ion' },
              { source: 'Cesium OSM Buildings', detail: 'Global 3D building footprints from OpenStreetMap (ion asset 96188)' },
              { source: 'Bing Maps Imagery', detail: 'Satellite base imagery via Cesium ion' },
            ].map(({ source, detail }) => (
              <div key={source} className="flex gap-4 items-start">
                <div className="w-2 h-2 rounded-full bg-cyan-500 mt-1.5 shrink-0" />
                <div>
                  <p className="text-sm text-white">{source}</p>
                  <p className="text-xs text-slate-500">{detail}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Footer */}
        <div className="text-center text-xs text-slate-600 pb-4">
          Built with CesiumJS · Data © OpenStreetMap contributors
        </div>

      </div>
    </div>
  )
}

export default AboutPage