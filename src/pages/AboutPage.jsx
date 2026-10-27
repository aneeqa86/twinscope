import { useState } from 'react'
import { Link } from 'react-router-dom'
import Icon from '@/components/icons/Icon'
import Brand from '@/components/shell/Brand'
import { SectionLabel } from '@/components/primitives'

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
    icon: 'cube',
    title: 'Development Scenario & Zoning',
    desc: 'Draw a plot, set floors and setback, and test the proposed tower against height, floor-area-ratio and setback limits. An hourly shadow study shows which neighbours lose direct sun, and for how long.',
  },
  {
    icon: 'panel',
    title: 'Rooftop Solar Potential',
    desc: 'Every roof in view is scored for yearly yield from NASA POWER irradiance, roof area and shading traced from neighbouring buildings across the year. Totals in MWh, MWp and CO₂ avoided.',
  },
  {
    icon: 'rings',
    title: '15-Minute City Access',
    desc: 'Walking-time analysis on the real OSM street network: how many everyday needs a point reaches in 15 minutes, or a coverage map showing which streets are far from transit, schools or clinics.',
  },
  {
    icon: 'flame',
    title: 'Heat & Street Shade',
    desc: 'MODIS satellite land-surface temperature, plus the share of each walkable street in building shadow at any hour on peak-summer and solstice days.',
  },
  {
    icon: 'binoculars',
    title: 'View Score by Floor',
    desc: 'Click a tower to see, floor by floor, whether it sees the sea or a landmark. Sightlines sample terrain and every building in between, with Earth curvature.',
  },
  {
    icon: 'building',
    title: '3D City Visualization',
    desc: 'Real OSM buildings streamed via Cesium ion, rendered in WebGL 2 on a photorealistic globe with world terrain.',
  },
  {
    icon: 'layers',
    title: 'Thematic Mapping',
    desc: 'Buildings colored dynamically by height or use type · standard GIS choropleth analysis applied in 3D.',
  },
  {
    icon: 'sun',
    title: 'Sun & Shadow Simulation',
    desc: 'Time-of-day slider drives real solar position with accurate building shadows. Syncs to actual sunrise and sunset times per city via live API.',
  },
  {
    icon: 'pin',
    title: 'OSM Vector Layers',
    desc: 'Live Overpass API queries render POIs (hospitals, mosques, metro, hotels, restaurants), road networks by type, and building age footprints.',
  },
  {
    icon: 'thermo',
    title: 'Live Weather & AQI',
    desc: 'Real-time temperature, humidity, wind, and visibility from OpenWeatherMap. Air quality index with PM2.5, PM10, and CO levels per city.',
  },
  {
    icon: 'ruler',
    title: 'Distance & Area Measurement',
    desc: 'Geodesic distance between two points, or draw a polygon to compute area · essential spatial analysis tools with automatic unit switching.',
  },
  {
    icon: 'eye',
    title: 'Line of Sight Analysis',
    desc: 'Click an observer and target point. The app samples terrain and building heights along the path and draws a green (clear) or red (blocked) result line.',
  },
  {
    icon: 'chart',
    title: 'Building Height Histogram',
    desc: 'Queries real building heights from Overpass API for the current view and renders a live height distribution chart · updates as the camera moves.',
  },
  {
    icon: 'building',
    title: 'Building Intelligence',
    desc: 'Click any building to retrieve its OSM attributes: name, use type, height, floor count, and coordinates.',
  },
  {
    icon: 'search',
    title: 'Landmark Search',
    desc: 'Curated landmark search for Riyadh, Dubai and Doha. Select a landmark and the camera flies directly to it.',
  },
  {
    icon: 'reset',
    title: 'Navigation Controls',
    desc: 'Zoom in/out, compass rose reflecting camera heading, dynamic scale bar, and one-click camera reset per city.',
  },
  {
    icon: 'up',
    title: 'Multi-City Support',
    desc: 'Instantly fly between Riyadh, Dubai and Doha · the three key smart city markets in the Gulf region.',
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
    detail: 'Live OSM vector queries · POIs, roads, building ages in current view',
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
    source: 'NASA POWER',
    detail: 'Long-term global horizontal irradiance used for rooftop solar yield',
    badge: 'Live API',
  },
  {
    source: 'NASA GIBS · MODIS Terra',
    detail: 'Daytime land surface temperature (~1 km) for the heat analysis',
    badge: 'Live API',
  },
  {
    source: 'Bing Maps Imagery',
    detail: 'Satellite base imagery streamed via Cesium ion',
    badge: 'Cesium ion',
  },
]

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
  { title: 'Network Analysis',     desc: 'Multi-source Dijkstra on the walking network for isochrones and service coverage' },
  { title: 'Solar Geometry',       desc: 'NOAA solar position with ray-marched shading for roof yield and street shade' },
  { title: 'Scenario Testing',     desc: 'Massing, zoning compliance and shadow impact of a proposed building' },
  { title: 'Remote Sensing',       desc: 'MODIS land surface temperature draped over terrain' },
  { title: 'Visibility Analysis',  desc: 'Per-floor sightlines against terrain and 3D buildings, with Earth curvature' },
  { title: 'Spatial Indexing',     desc: 'Uniform grids for fast point-in-polygon tests over thousands of footprints' },
]

// ─── Hero compare: surveyed city (solid) vs its twin (dashed outline) ────

const SKYLINE = [
  [0, 46, 70], [50, 34, 132], [88, 52, 96], [144, 28, 196], [176, 48, 150], [228, 36, 112],
  [268, 24, 252], [296, 56, 176], [356, 40, 122], [400, 30, 218], [434, 58, 156], [496, 36, 104],
  [536, 46, 188], [586, 28, 136], [618, 54, 92], [676, 44, 124],
]
const SW = 720
const SH = 260

const Skyline = ({ variant }) => (
  <svg viewBox={`0 -20 ${SW} ${SH + 20}`} className="absolute inset-0 h-full w-full" preserveAspectRatio="xMidYMax meet" aria-hidden>
    {SKYLINE.map(([x, w, h], i) => {
      const y = SH - h
      if (variant === 'city') {
        return (
          <g key={i}>
            <rect x={x} y={y} width={w} height={h} rx="2" fill="var(--ts-text)" opacity={0.92 - (i % 4) * 0.07} />
            {Array.from({ length: Math.floor(h / 22) }).map((_, r) => (
              <rect key={r} x={x + 6} y={y + 10 + r * 22} width={w - 12} height="3" rx="1" fill="var(--ts-void)" opacity="0.18" />
            ))}
          </g>
        )
      }
      return (
        <g key={i}>
          <rect x={x + 0.75} y={y + 0.75} width={w - 1.5} height={h - 1.5} rx="2" fill="none" stroke="var(--ts-accent)" strokeWidth="1.3" strokeDasharray="4 4" />
          <text x={x + w / 2} y={y - 6} textAnchor="middle" fontSize="10" fontFamily="var(--ts-mono)" fill="var(--ts-text-3)">
            {Math.round(h * 1.6)}
          </text>
        </g>
      )
    })}
    <line x1="0" y1={SH - 0.5} x2={SW} y2={SH - 0.5} stroke="var(--ts-line-strong)" />
  </svg>
)

const TwinCompare = () => {
  const [split, setSplit] = useState(52)
  return (
    <figure className="relative mx-auto w-full max-w-[880px]">
      <div className="relative aspect-[720/280] w-full overflow-hidden rounded-panel border border-line bg-panel">
        <div className="absolute inset-x-6 bottom-6 top-8">
          <Skyline variant="twin" />
          <div className="absolute inset-0" style={{ clipPath: `inset(0 ${100 - split}% 0 0)` }}>
            <Skyline variant="city" />
          </div>
        </div>
        <span aria-hidden className="absolute bottom-0 top-0 w-px bg-accent" style={{ left: `${split}%` }}>
          <span className="absolute left-1/2 top-1/2 flex h-9 w-9 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-accent bg-void text-accent">
            <Icon name="chev" size={16} style={{ transform: 'rotate(90deg)' }} />
          </span>
        </span>
        <span className="absolute left-4 top-3 font-mono text-[11px] uppercase tracking-[0.12em] text-ink-2">City</span>
        <span className="absolute right-4 top-3 font-mono text-[11px] uppercase tracking-[0.12em] text-accent">Twin</span>
        <input
          type="range"
          min={0}
          max={100}
          value={split}
          onChange={(e) => setSplit(Number(e.target.value))}
          aria-label="Compare surveyed city and digital twin"
          className="absolute inset-0 h-full w-full cursor-ew-resize opacity-0"
        />
      </div>
      <figcaption className="mt-3 text-center text-[12.5px] text-ink-3">
        Drag to compare the surveyed city with its model. Filled is surveyed; dashed is the twin.
      </figcaption>
    </figure>
  )
}

const Badge = ({ children, live }) => (
  <span
    className="rounded-full px-2 py-0.5 font-mono text-[10.5px]"
    style={live
      ? { color: 'var(--ts-ok)', background: 'rgba(79,211,154,0.12)' }
      : { color: 'var(--ts-text-2)', background: 'var(--ts-fill-hover)' }}
  >
    {children}
  </span>
)

const AboutPage = () => (
  <div className="min-h-screen bg-void text-ink">
    <header className="sticky top-0 z-10 border-b border-line bg-[rgba(12,13,15,0.82)] backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-[1120px] items-center justify-between px-4 sm:px-6">
        <Brand />
        <Link
          to="/"
          className="ts-transition ts-press inline-flex h-11 items-center gap-1.5 rounded-[11px] bg-accent px-4 text-[13px] font-semibold text-accent-on hover:brightness-110"
        >
          Open the map
          <Icon name="up" size={15} />
        </Link>
      </div>
    </header>

    <main>
      {/* Hero */}
      <section className="mx-auto max-w-[1120px] px-4 pb-16 pt-14 text-center sm:px-6 sm:pt-20">
        <p className="ts-label">3D urban digital twin · Gulf cities</p>
        <h1 className="mx-auto mt-4 max-w-[780px] text-[34px] font-semibold leading-[1.08] tracking-[-0.02em] sm:text-[52px]">
          Every building in{' '}
          <span className="font-serif font-normal italic">Riyadh</span>,{' '}
          <span className="font-serif font-normal italic">Dubai</span> and{' '}
          <span className="font-serif font-normal italic">Doha</span>, surveyed in 3D.
        </h1>
        <p className="mx-auto mt-5 max-w-[620px] text-[15px] leading-relaxed text-ink-2">
          TwinScope streams OpenStreetMap buildings onto a real globe and turns them into answers: whether a proposed
          tower fits the zoning and whose sun it takes, which roofs should carry solar, which streets are a 15-minute
          walk from transit, where pedestrians bake in the afternoon sun, and which floors see the sea.
        </p>
        <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
          <Link
            to="/"
            className="ts-transition ts-press inline-flex h-11 items-center gap-1.5 rounded-[11px] bg-accent px-5 text-[14px] font-semibold text-accent-on hover:brightness-110"
          >
            Launch TwinScope
          </Link>
          <a
            href="https://github.com/aneeqa86/twinscope"
            target="_blank"
            rel="noopener noreferrer"
            className="ts-transition ts-press inline-flex h-11 items-center gap-1.5 rounded-[11px] border border-line-strong bg-subtle px-5 text-[14px] font-medium text-ink hover:bg-hover"
          >
            Source on GitHub
            <Icon name="up" size={15} />
          </a>
        </div>
        <div className="mt-12">
          <TwinCompare />
        </div>
      </section>

      <div className="mx-auto flex max-w-[1120px] flex-col gap-16 px-4 pb-16 sm:px-6">
        {/* Features */}
        <section aria-labelledby="features">
          <div className="mb-6 flex items-baseline justify-between">
            <h2 id="features" className="text-[22px] font-semibold tracking-[-0.01em]">What it does</h2>
            <SectionLabel>{FEATURES.length} features</SectionLabel>
          </div>
          <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f) => (
              <li key={f.title} className="rounded-panel border border-line bg-panel p-5">
                <span className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-subtle text-ink">
                  <Icon name={f.icon} size={19} />
                </span>
                <h3 className="mt-4 text-[14.5px] font-semibold">{f.title}</h3>
                <p className="mt-1.5 text-[13px] leading-relaxed text-ink-2">{f.desc}</p>
              </li>
            ))}
          </ul>
        </section>

        {/* Stack + sources */}
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1fr_1.2fr]">
          <section aria-labelledby="stack">
            <h2 id="stack" className="mb-5 text-[22px] font-semibold tracking-[-0.01em]">Stack</h2>
            <dl className="rounded-panel border border-line bg-panel px-5 py-2">
              {STACK.map((s) => (
                <div key={s.name} className="flex items-center justify-between gap-4 border-t border-line py-2.5 first:border-t-0">
                  <dt className="font-mono text-[12.5px] text-ink">{s.name}</dt>
                  <dd className="text-right text-[12.5px] text-ink-3">{s.desc}</dd>
                </div>
              ))}
            </dl>
          </section>

          <section aria-labelledby="sources">
            <h2 id="sources" className="mb-5 text-[22px] font-semibold tracking-[-0.01em]">Data sources</h2>
            <ul className="rounded-panel border border-line bg-panel px-5 py-2">
              {DATA_SOURCES.map(({ source, detail, badge }) => (
                <li key={source} className="border-t border-line py-3 first:border-t-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-[13.5px] font-medium">{source}</p>
                    <Badge live={badge !== 'Cesium ion'}>{badge}</Badge>
                  </div>
                  <p className="mt-1 text-[12.5px] text-ink-3">{detail}</p>
                </li>
              ))}
            </ul>
          </section>
        </div>

        {/* GIS concepts */}
        <section aria-labelledby="gis">
          <h2 id="gis" className="mb-5 text-[22px] font-semibold tracking-[-0.01em]">GIS concepts demonstrated</h2>
          <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {GIS_CONCEPTS.map(({ title, desc }) => (
              <li key={title} className="rounded-[12px] border border-line px-4 py-3.5">
                <p className="font-mono text-[12.5px] text-ink">{title}</p>
                <p className="mt-1 text-[12.5px] leading-relaxed text-ink-3">{desc}</p>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </main>

    <footer className="border-t border-line">
      <div className="mx-auto flex max-w-[1120px] flex-col gap-1 px-4 py-8 font-mono text-[11.5px] text-ink-3 sm:px-6">
        <p>Built with CesiumJS · Data © OpenStreetMap contributors</p>
        <p>OpenWeatherMap · Cesium ion · sunrise-sunset.org</p>
      </div>
    </footer>
  </div>
)

export default AboutPage
