import { useState, useRef } from 'react'
import CesiumViewer from '@/components/map/CesiumViewer'
import Navbar from '@/components/layout/Navbar'
import SidePanel from '@/components/panels/SidePanel'
import BuildingPopup from '@/components/panels/BuildingPopup'
import LoadingScreen from '@/components/map/LoadingScreen'
import SunSlider from '@/components/map/SunSlider'
import MeasureTool from '@/components/map/MeasureTool'
import MapControls from '@/components/map/MapControls'
import ScaleBar from '@/components/map/ScaleBar'
import WeatherPanel from '@/components/panels/WeatherPanel'
import OsmLayers from '@/components/map/OsmLayers'
import BuildingHistogram from '@/components/panels/BuildingHistogram'
import LandmarkSearch from '@/components/map/LandmarkSearch'

const CITIES = [
  { name: 'Dubai',  lat: 25.0820, lng: 55.1404, alt: 1500, tz: 4 },
  { name: 'Riyadh', lat: 24.7136, lng: 46.6753, alt: 1500, tz: 3 },
  { name: 'Doha',   lat: 25.2854, lng: 51.5310, alt: 1500, tz: 3 },
]

const utcToDecimalHour = (utcString) => {
  if (!utcString) return null
  const date = new Date(utcString)
  return date.getUTCHours() + date.getUTCMinutes() / 60
}

const HomePage = () => {
  const cesiumRef = useRef(null)
  const [viewer, setViewer] = useState(null)

  const [cameraPos,        setCameraPos]        = useState(null)
  const [selectedBuilding, setSelectedBuilding] = useState(null)
  const [activeLayer,      setActiveLayer]      = useState('default')
  const [flyTo,            setFlyTo]            = useState(null)
  const [loading,          setLoading]          = useState(true)
  const [buildingCount,    setBuildingCount]    = useState(null)
  const [sunMode,          setSunMode]          = useState(false)
  const [sunHour,          setSunHour]          = useState(12)
  const [measureMode,      setMeasureMode]      = useState(null)
  const [measureResult,    setMeasureResult]    = useState(null)
  const [activeCity,       setActiveCity]       = useState(CITIES[0])
  const [sunTimes,         setSunTimes]         = useState(null)
  const [activeOsmLayers,  setActiveOsmLayers]  = useState([])
  const [histogramActive,  setHistogramActive]  = useState(false)
  const [viewshedMode,     setViewshedMode]     = useState(false)
  const [viewshedResult,   setViewshedResult]   = useState(null)

  const fetchSunTimes = async (city) => {
    try {
      const res = await fetch(
        `https://api.sunrise-sunset.org/json?lat=${city.lat}&lng=${city.lng}&date=today&formatted=0`
      )
      const data = await res.json()
      if (data.status !== 'OK') return
      const rise = utcToDecimalHour(data.results.sunrise) + city.tz
      const set  = utcToDecimalHour(data.results.sunset)  + city.tz
      setSunTimes({ rise, set })
    } catch (err) {
      console.error('Sunrise fetch failed:', err)
    }
  }

  const handleCityChange = (city) => {
    setActiveCity(city)
    setFlyTo({ lat: city.lat, lng: city.lng, alt: city.alt })
    setSelectedBuilding(null)
    setMeasureResult(null)
    setViewshedResult(null)
    if (sunMode) fetchSunTimes(city)
  }

  const handleSunToggle = () => {
    const next = !sunMode
    setSunMode(next)
    if (next) {
      const localHour = new Date().getUTCHours() + activeCity.tz
      setSunHour(Math.min(23, Math.max(0, localHour)))
      fetchSunTimes(activeCity)
    } else {
      setSunTimes(null)
    }
    if (measureMode) setMeasureMode(null)
    if (viewshedMode) setViewshedMode(false)
  }

  const handleMeasureToggle = (mode) => {
    setMeasureMode((prev) => (prev === mode ? null : mode))
    setMeasureResult(null)
    if (sunMode) setSunMode(false)
    if (viewshedMode) setViewshedMode(false)
  }

  const handleResetCamera = () => {
    setFlyTo({ ...activeCity, _reset: Date.now() })
    setSelectedBuilding(null)
    setMeasureResult(null)
    setViewshedResult(null)
  }

  const handleOsmLayerToggle = (layerId) => {
    setActiveOsmLayers((prev) =>
      prev.includes(layerId)
        ? prev.filter((l) => l !== layerId)
        : [...prev, layerId]
    )
  }

  const handleViewshedToggle = () => {
    setViewshedMode((prev) => !prev)
    setViewshedResult(null)
    if (measureMode) setMeasureMode(null)
    if (sunMode) setSunMode(false)
  }

  return (
    <div className="w-screen h-screen overflow-hidden bg-[#0a1628] relative">
      <LoadingScreen visible={loading} />

      <Navbar cameraPos={cameraPos} />

      <LandmarkSearch
        viewer={viewer}
        activeCity={activeCity.name}
      />

      <SidePanel
        onCityChange={handleCityChange}
        onLayerChange={setActiveLayer}
        activeLayer={activeLayer}
        cameraPos={cameraPos}
        buildingCount={buildingCount}
        sunMode={sunMode}
        onSunToggle={handleSunToggle}
        measureMode={measureMode}
        onMeasureToggle={handleMeasureToggle}
        onResetCamera={handleResetCamera}
        activeOsmLayers={activeOsmLayers}
        onOsmLayerToggle={handleOsmLayerToggle}
        histogramActive={histogramActive}
        onHistogramToggle={() => setHistogramActive((prev) => !prev)}
        viewshedMode={viewshedMode}
        onViewshedToggle={handleViewshedToggle}
      />

      <CesiumViewer
        ref={cesiumRef}
        onCameraMove={setCameraPos}
        onBuildingClick={setSelectedBuilding}
        onLoad={(v) => { setLoading(false); setViewer(v) }}
        onBuildingCount={setBuildingCount}
        activeLayer={activeLayer}
        flyTo={flyTo}
        sunHour={sunMode ? sunHour : null}
        measureMode={measureMode}
        onMeasureResult={setMeasureResult}
        viewshedMode={viewshedMode}
        onViewshedResult={setViewshedResult}
      />

      <OsmLayers
        viewer={viewer}
        activeLayers={activeOsmLayers}
        cameraPos={cameraPos}
      />

      <MapControls
        onZoomIn={() => cesiumRef.current?.zoomIn()}
        onZoomOut={() => cesiumRef.current?.zoomOut()}
        heading={cameraPos?.heading ?? 0}
        altitudeKm={parseFloat(cameraPos?.alt ?? 1)}
      />

      <ScaleBar altitudeKm={parseFloat(cameraPos?.alt ?? 1)} />

      <WeatherPanel city={activeCity} />

      <BuildingHistogram
        viewer={viewer}
        active={histogramActive}
        cameraPos={cameraPos}
      />

      {!measureMode && !viewshedMode && (
        <BuildingPopup
          building={selectedBuilding}
          onClose={() => setSelectedBuilding(null)}
        />
      )}

      {sunMode && (
        <SunSlider
          value={sunHour}
          onChange={setSunHour}
          sunTimes={sunTimes}
          cityName={activeCity.name}
        />
      )}

      <MeasureTool
        active={!!measureMode}
        onToggle={() => handleMeasureToggle(measureMode)}
        result={measureResult}
        onClear={() => setMeasureResult(null)}
        measureMode={measureMode}
      />

     {viewshedMode && (
      <div className="absolute bottom-24 left-1/2 -translate-x-1/2 z-50">
        <div className="bg-[#0a1628]/90 backdrop-blur-sm border border-cyan-900/40 rounded-xl px-4 py-2.5 shadow-2xl">
          {!viewshedResult ? (
            <p className="text-xs text-slate-400 font-mono">
              Click observer point, then target point
            </p>
          ) : (
            <div className="flex items-center gap-3">
              <div
                className="w-2 h-2 rounded-full"
                style={{ background: viewshedResult === 'clear' ? '#10b981' : '#ef4444' }}
              />
              <p
                className="text-xs font-mono"
                style={{ color: viewshedResult === 'clear' ? '#10b981' : '#ef4444' }}
              >
                {viewshedResult === 'clear' ? 'Line of sight — CLEAR' : 'Line of sight — BLOCKED'}
              </p>
              <button
                onClick={() => {
                  cesiumRef.current?.clearViewshed()
                  setViewshedResult(null)
                }}
                className="text-slate-500 hover:text-slate-300 text-xs ml-2 border border-slate-700 rounded px-2 py-0.5 hover:border-slate-500 transition-colors"
              >
                Clear
              </button>
            </div>
          )}
        </div>
      </div>
    )}

    </div>
  )
}

export default HomePage