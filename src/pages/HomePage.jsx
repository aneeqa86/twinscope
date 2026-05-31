import { useState } from 'react'
import CesiumViewer from '@/components/map/CesiumViewer'
import Navbar from '@/components/layout/Navbar'
import SidePanel from '@/components/panels/SidePanel'
import BuildingPopup from '@/components/panels/BuildingPopup'
import LoadingScreen from '@/components/map/LoadingScreen'
import SunSlider from '@/components/map/SunSlider'
import MeasureTool from '@/components/map/MeasureTool'

const HomePage = () => {
  const [cameraPos, setCameraPos] = useState(null)
  const [selectedBuilding, setSelectedBuilding] = useState(null)
  const [activeLayer, setActiveLayer] = useState('default')
  const [flyTo, setFlyTo] = useState(null)
  const [loading, setLoading] = useState(true)
  const [buildingCount, setBuildingCount] = useState(null)
  const [sunMode, setSunMode] = useState(false)
  const [sunHour, setSunHour] = useState(12)
  const [measureMode, setMeasureMode] = useState(false)
  const [measureResult, setMeasureResult] = useState(null)

  const handleCityChange = (city) => {
    setFlyTo({ lat: city.lat, lng: city.lng, alt: city.alt })
    setSelectedBuilding(null)
    setMeasureResult(null)
  }

  const handleSunToggle = () => {
    setSunMode((prev) => !prev)
    if (measureMode) setMeasureMode(false)
  }

  const handleMeasureToggle = () => {
    setMeasureMode((prev) => !prev)
    setMeasureResult(null)
    if (sunMode) setSunMode(false)
  }

  return (
    <div className="w-screen h-screen overflow-hidden bg-[#0a1628] relative">
      <LoadingScreen visible={loading} />

      <Navbar cameraPos={cameraPos} />

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
      />

      <CesiumViewer
        onCameraMove={setCameraPos}
        onBuildingClick={setSelectedBuilding}
        onLoad={() => setLoading(false)}
        onBuildingCount={setBuildingCount}
        activeLayer={activeLayer}
        flyTo={flyTo}
        sunHour={sunMode ? sunHour : null}
        measureMode={measureMode}
        onMeasureResult={setMeasureResult}
      />

      {!measureMode && (
        <BuildingPopup
          building={selectedBuilding}
          onClose={() => setSelectedBuilding(null)}
        />
      )}

      {sunMode && (
        <SunSlider
          value={sunHour}
          onChange={setSunHour}
        />
      )}

      <MeasureTool
        active={measureMode}
        onToggle={handleMeasureToggle}
        result={measureResult}
        onClear={() => setMeasureResult(null)}
      />
    </div>
  )
}

export default HomePage