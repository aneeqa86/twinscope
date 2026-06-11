import { useState, useRef, useEffect } from 'react'
import * as Cesium from 'cesium'

const LANDMARKS = {
  Dubai: [
    { name: 'Burj Khalifa',            lat: 25.1972, lng: 55.2744, alt: 500  },
    { name: 'Burj Al Arab',            lat: 25.1412, lng: 55.1853, alt: 300  },
    { name: 'Palm Jumeirah',           lat: 25.1124, lng: 55.1390, alt: 1500 },
    { name: 'Dubai Mall',              lat: 25.1975, lng: 55.2796, alt: 300  },
    { name: 'Dubai Frame',             lat: 25.2350, lng: 55.3000, alt: 300  },
    { name: 'Museum of the Future',    lat: 25.2197, lng: 55.2817, alt: 300  },
    { name: 'Dubai Marina',            lat: 25.0820, lng: 55.1404, alt: 800  },
    { name: 'Atlantis The Palm',       lat: 25.1304, lng: 55.1171, alt: 400  },
    { name: 'Dubai Creek',             lat: 25.2632, lng: 55.3072, alt: 600  },
    { name: 'Jumeirah Beach',          lat: 25.2048, lng: 55.2400, alt: 500  },
  ],
  Riyadh: [
    { name: 'Kingdom Centre Tower',    lat: 24.7114, lng: 46.6740, alt: 400  },
    { name: 'Al Faisaliah Tower',      lat: 24.6916, lng: 46.6836, alt: 400  },
    { name: 'KAFD',                    lat: 24.7748, lng: 46.6384, alt: 800  },
    { name: 'Diriyah',                 lat: 24.7340, lng: 46.5716, alt: 600  },
    { name: 'King Fahd Stadium',       lat: 24.7103, lng: 46.7731, alt: 500  },
    { name: 'Al Masmak Fortress',      lat: 24.6877, lng: 46.7138, alt: 300  },
    { name: 'King Abdullah Park',      lat: 24.7254, lng: 46.6319, alt: 400  },
    { name: 'Riyadh Zoo',              lat: 24.6496, lng: 46.7195, alt: 400  },
  ],
  Doha: [
    { name: 'The Pearl',               lat: 25.3694, lng: 51.5500, alt: 800  },
    { name: 'Aspire Tower',            lat: 25.2631, lng: 51.4480, alt: 400  },
    { name: 'Museum of Islamic Art',   lat: 25.2948, lng: 51.5389, alt: 300  },
    { name: 'Souq Waqif',             lat: 25.2867, lng: 51.5333, alt: 300  },
    { name: 'Lusail Stadium',          lat: 25.4319, lng: 51.4891, alt: 600  },
    { name: 'West Bay',                lat: 25.3282, lng: 51.5310, alt: 800  },
    { name: 'Katara Cultural Village', lat: 25.3580, lng: 51.5258, alt: 400  },
    { name: 'Education City',          lat: 25.3138, lng: 51.4355, alt: 600  },
  ],
}

const LandmarkSearch = ({ viewer, activeCity }) => {
  const [query,   setQuery]   = useState('')
  const [results, setResults] = useState([])
  const [focused, setFocused] = useState(false)
  const inputRef     = useRef(null)
  const containerRef = useRef(null)

  const cityLandmarks = LANDMARKS[activeCity] ?? []

  useEffect(() => {
    if (!query.trim()) { setResults([]); return }
    const q = query.toLowerCase()
    setResults(cityLandmarks.filter(l => l.name.toLowerCase().includes(q)))
  }, [query, activeCity])

  useEffect(() => {
    setQuery('')
    setResults([])
  }, [activeCity])

  useEffect(() => {
    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setFocused(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const flyTo = (landmark) => {
    if (!viewer) return
    viewer.camera.flyTo({
      destination: Cesium.Cartesian3.fromDegrees(landmark.lng, landmark.lat, landmark.alt),
      orientation: {
        heading: 0,
        pitch: -0.6,
        roll: 0,
      },
      duration: 2,
    })
    setQuery(landmark.name)
    setResults([])
    setFocused(false)
  }

  const showDropdown = focused && (results.length > 0 || query.trim() === '')
  const dropdownItems = query.trim() === '' ? cityLandmarks : results

  return (
    <div
      ref={containerRef}
      className="absolute top-20 left-1/2 -translate-x-1/2 z-50 w-72"
    >
      {/* Search input */}
      <div className="relative">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">
          ⌕
        </div>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setFocused(true)}
          placeholder={`Search ${activeCity} landmarks…`}
          className="w-full bg-[#0a1628]/90 backdrop-blur-sm border border-cyan-900/40 rounded-xl pl-8 pr-4 py-2.5 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500/60 shadow-2xl font-mono"
        />
        {query && (
          <button
            onClick={() => { setQuery(''); setResults([]); inputRef.current?.focus() }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 text-xs"
          >
            ✕
          </button>
        )}
      </div>

      {/* Dropdown */}
      {showDropdown && (
        <div className="mt-1 bg-[#0a1628]/95 backdrop-blur-sm border border-cyan-900/40 rounded-xl overflow-hidden shadow-2xl">
          {query.trim() === '' && (
            <div className="px-3 py-2 border-b border-cyan-900/40">
              <p className="text-xs text-slate-500 tracking-wider">
                LANDMARKS — {activeCity.toUpperCase()}
              </p>
            </div>
          )}
          {dropdownItems.length === 0 && (
            <div className="px-3 py-3">
              <p className="text-xs text-slate-500">No landmarks found</p>
            </div>
          )}
          {dropdownItems.map((landmark) => (
            <button
              key={landmark.name}
              onClick={() => flyTo(landmark)}
              className="w-full text-left px-3 py-2.5 text-sm text-slate-300 hover:bg-cyan-500/10 hover:text-cyan-400 transition-colors flex items-center gap-2 border-b border-cyan-900/20 last:border-0"
            >
              <span className="text-slate-600 text-xs">◎</span>
              {landmark.name}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default LandmarkSearch