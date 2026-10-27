import { useState, useRef, useCallback } from 'react'
import CesiumViewer from '@/components/map/CesiumViewer'
import OsmLayers from '@/components/map/OsmLayers'
import LoadingScreen from '@/components/map/LoadingScreen'
import Brand from '@/components/shell/Brand'
import CityPill from '@/components/shell/CityPill'
import LandmarkSearch from '@/components/shell/LandmarkSearch'
import Readout from '@/components/shell/Readout'
import ToolRail from '@/components/shell/ToolRail'
import LayersPanel from '@/components/shell/LayersPanel'
import MapControls from '@/components/shell/MapControls'
import StatusBar, { ScaleBar } from '@/components/shell/StatusBar'
import { SunDock, MeasureDock, SightDock } from '@/components/shell/ModeDock'
import BuildingCard from '@/components/panels/BuildingCard'
import HeightHistogram from '@/components/panels/HeightHistogram'
import { StyleSection, OsmLayersSection } from '@/components/panels/LayerControls'
import { CityList, CityConditions } from '@/components/panels/CityWeather'
import BottomSheet, { SHEET_PEEK } from '@/components/mobile/BottomSheet'
import MobileTopBar from '@/components/mobile/MobileTopBar'
import { Presence } from '@/components/primitives'
import { CITIES } from '@/config/cities'
import {
  useBreakpoint,
  useViewportWidth,
  useCityWeather,
  useSunTimes,
  useHeightHistogram,
} from '@/hooks'

const DOCK_TOOLS = ['sun', 'dist', 'area', 'los']

// Slot geometry (layout spec, 1440×900 reference)
const RAIL_RIGHT = 84 + 12           // rail ends at 84, plus gap
const PANEL_RIGHT = 96 + 336 + 12    // side panel ends at 432, plus gap
const STATUS_RIGHT = 300             // scale bar + scene stats caption
const DOCK_MIN = 360

const localHour = (city) => {
  const now = new Date()
  const h = now.getUTCHours() + now.getUTCMinutes() / 60 + city.tz
  return Math.round((((h % 24) + 24) % 24) * 4) / 4
}

const HomePage = () => {
  const cesiumRef = useRef(null)
  const bp = useBreakpoint()
  const vw = useViewportWidth()
  const mobile = bp === 'mobile'

  const [viewer,           setViewer]           = useState(null)
  const [load,             setLoad]             = useState({ progress: 0, stage: 0, done: false, error: null })
  const [cameraPos,        setCameraPos]        = useState(null)
  const [tileCount,        setTileCount]        = useState(null)
  const [activeCity,       setActiveCity]       = useState(CITIES[0])
  const [flyTo,            setFlyTo]            = useState(null)

  const [activeTool,       setActiveTool]       = useState(null)   // 'sun' | 'dist' | 'area' | 'los' | 'hist' | null
  const [layersOpen,       setLayersOpen]       = useState(false)
  const [selectedBuilding, setSelectedBuilding] = useState(null)

  const [activeLayer,      setActiveLayer]      = useState('default')
  const [activeOsmLayers,  setActiveOsmLayers]  = useState([])
  const [osmCounts,        setOsmCounts]        = useState({})

  const [sunHour,          setSunHour]          = useState(12)
  const [measureResult,    setMeasureResult]    = useState(null)
  const [losResult,        setLosResult]        = useState(null)

  // Mobile sheet
  const [sheetDetent,      setSheetDetent]      = useState('peek')
  const [sheetTab,         setSheetTab]         = useState('layers')

  const { data: weather, configured: weatherConfigured } = useCityWeather(CITIES)
  const sunTimes = useSunTimes(activeCity, activeTool === 'sun')
  const histogram = useHeightHistogram(viewer, activeTool === 'hist', cameraPos)

  // ─── Layout maths: where the dock may sit without touching panel or inspector ──
  const inspectorWidth = bp === 'compact' ? 280 : 320
  const inspectorVisible = !!selectedBuilding || activeTool === 'hist'
  const dockRightReserve = inspectorVisible ? 20 + inspectorWidth + 12 : 20
  const dockLeft = (open) => Math.max(open ? PANEL_RIGHT : RAIL_RIGHT, STATUS_RIGHT)
  const fitsBoth = vw - dockLeft(true) - dockRightReserve >= DOCK_MIN

  // ─── Handlers ────────────────────────────────────────────────────────
  const handleToolChange = (tool) => {
    setActiveTool(tool)
    setMeasureResult(null)
    setLosResult(null)
    if (tool === 'sun') setSunHour(localHour(activeCity))
    // Where the screen is too narrow for side panel + dock, the newest one wins
    if (!mobile && DOCK_TOOLS.includes(tool) && !fitsBoth) setLayersOpen(false)
  }

  const handleLayersToggle = () => {
    const next = !layersOpen
    setLayersOpen(next)
    if (next && DOCK_TOOLS.includes(activeTool) && !fitsBoth) setActiveTool(null)
  }

  const handleCityChange = (city) => {
    setActiveCity(city)
    setFlyTo({ lat: city.lat, lng: city.lng, alt: city.alt })
    setSelectedBuilding(null)
    setMeasureResult(null)
    setLosResult(null)
    if (activeTool === 'sun') setSunHour(localHour(city))
    setSheetDetent('peek')
  }

  const handleResetCamera = () => {
    setFlyTo({ ...activeCity, _reset: Date.now() })
    setSelectedBuilding(null)
    setMeasureResult(null)
    setLosResult(null)
  }

  const handleLandmark = (l) => {
    setFlyTo({ lat: l.lat, lng: l.lng, alt: l.alt, pitch: -34, _t: Date.now() })
  }

  const handleFlyToBuilding = () => {
    const b = selectedBuilding
    if (!b) return
    // Stand off to the south, looking north and down at 35°
    const range = Math.max(320, (b.heightM ?? 40) * 2.6)
    const pitch = 35
    const alt = (b.groundHeight ?? 0) + range * Math.sin((pitch * Math.PI) / 180)
    const south = (range * Math.cos((pitch * Math.PI) / 180)) / 110540
    setFlyTo({ lat: b.lat - south, lng: b.lng, alt, pitch: -pitch, _t: Date.now() })
  }

  const handleOsmLayerToggle = (layerId) => {
    setActiveOsmLayers((prev) =>
      prev.includes(layerId) ? prev.filter((l) => l !== layerId) : [...prev, layerId]
    )
  }

  const handleProgress = useCallback(({ value, stage }) => {
    setLoad((l) => ({ ...l, progress: Math.max(l.progress, value), stage: Math.max(l.stage, stage) }))
  }, [])

  const closeTool = () => handleToolChange(null)
  const measureAgain = () => { cesiumRef.current?.clearMeasure(); setMeasureResult(null) }
  const clearSight = () => { cesiumRef.current?.clearViewshed(); setLosResult(null) }

  // Building age colours footprints, so it overrides the style colouring
  const effectiveStyle = activeOsmLayers.includes('age') ? 'default' : activeLayer

  // ─── Shared pieces ───────────────────────────────────────────────────
  const dockFor = (tool, isMobile) => {
    if (tool === 'sun') {
      return (
        <SunDock
          value={sunHour}
          onChange={setSunHour}
          sunTimes={sunTimes}
          cityName={activeCity.name}
          onClose={closeTool}
          mobile={isMobile}
        />
      )
    }
    if (tool === 'dist' || tool === 'area') {
      return (
        <MeasureDock
          mode={tool === 'area' ? 'area' : 'distance'}
          result={measureResult}
          onAgain={measureAgain}
          onDone={closeTool}
          mobile={isMobile}
        />
      )
    }
    if (tool === 'los') {
      return <SightDock result={losResult} onClear={clearSight} onClose={closeTool} mobile={isMobile} />
    }
    return null
  }

  const dockTool = DOCK_TOOLS.includes(activeTool) ? activeTool : null
  const dockLeftPx = dockLeft(layersOpen)

  return (
    <div className="relative h-[100dvh] w-screen overflow-hidden bg-void">
      <h1 className="sr-only">TwinScope 3D urban digital twin — {activeCity.name}</h1>

      <LoadingScreen visible={!load.done} progress={load.progress} stage={load.stage} error={load.error} />

      <div className="absolute inset-0">
        <CesiumViewer
          ref={cesiumRef}
          onCameraMove={setCameraPos}
          onBuildingClick={setSelectedBuilding}
          onLoad={(v) => { setViewer(v); setLoad((l) => ({ ...l, progress: 1, stage: 3, done: true })) }}
          onProgress={handleProgress}
          onError={(error) => setLoad((l) => ({ ...l, error }))}
          onBuildingCount={setTileCount}
          activeLayer={effectiveStyle}
          selectedBuilding={selectedBuilding}
          flyTo={flyTo}
          sunHour={activeTool === 'sun' ? sunHour : null}
          timezone={activeCity.tz}
          measureMode={activeTool === 'dist' ? 'distance' : activeTool === 'area' ? 'area' : null}
          onMeasureResult={setMeasureResult}
          viewshedMode={activeTool === 'los'}
          onViewshedResult={setLosResult}
        />
      </div>

      <OsmLayers viewer={viewer} activeLayers={activeOsmLayers} cameraPos={cameraPos} onCounts={setOsmCounts} />

      {mobile ? (
        <>
          <MobileTopBar
            activeCity={activeCity}
            weather={weather}
            cameraPos={cameraPos}
            onMenu={() => { setSheetTab('layers'); setSheetDetent('half') }}
            onCity={() => { setSheetTab('city'); setSheetDetent('half') }}
            onLandmark={handleLandmark}
          />

          <MapControls
            heading={cameraPos?.heading ?? 0}
            onZoomIn={() => cesiumRef.current?.zoomIn()}
            onZoomOut={() => cesiumRef.current?.zoomOut()}
            onReset={handleResetCamera}
            className="right-3 top-32"
          />

          {/* Mode card slot: one card above the sheet; hidden while the sheet is half open */}
          {sheetDetent === 'peek' && (
            <div className="absolute inset-x-3 z-20" style={{ bottom: SHEET_PEEK + 12 }}>
              {dockTool ? (
                <Presence key={dockTool} show motion="up">{dockFor(dockTool, true)}</Presence>
              ) : activeTool === 'hist' ? (
                <Presence key="hist" show motion="up">
                  <HeightHistogram {...histogram} onClose={closeTool} />
                </Presence>
              ) : selectedBuilding ? (
                <Presence key="building" show motion="up">
                  <BuildingCard
                    mobile
                    building={selectedBuilding}
                    onClose={() => setSelectedBuilding(null)}
                    onFlyTo={handleFlyToBuilding}
                  />
                </Presence>
              ) : (
                <div className="pointer-events-none [text-shadow:0_1px_3px_rgba(0,0,0,0.8)]">
                  <ScaleBar altitudeKm={cameraPos?.alt} />
                </div>
              )}
            </div>
          )}

          <BottomSheet
            detent={sheetDetent}
            onDetentChange={setSheetDetent}
            tab={sheetTab}
            onTabChange={setSheetTab}
            activeTool={activeTool}
            onToolChange={handleToolChange}
          >
            {sheetTab === 'layers' && (
              <OsmLayersSection
                activeOsmLayers={activeOsmLayers}
                onOsmLayerToggle={handleOsmLayerToggle}
                counts={osmCounts}
                large
              />
            )}
            {sheetTab === 'style' && (
              <StyleSection
                activeLayer={activeLayer}
                onLayerChange={setActiveLayer}
                ageOverride={activeOsmLayers.includes('age')}
              />
            )}
            {sheetTab === 'city' && (
              <div className="flex flex-col gap-4">
                <CityList cities={CITIES} activeCity={activeCity} weather={weather} onSelect={handleCityChange} large />
                <div className="border-t border-line pt-4">
                  <CityConditions cityName={activeCity.name} data={weather[activeCity.name]} configured={weatherConfigured} />
                </div>
              </div>
            )}
          </BottomSheet>
        </>
      ) : (
        <>
          {/* A: top bar */}
          <header
            className="absolute left-5 right-5 top-5 z-30 grid items-start gap-4"
            style={{ gridTemplateColumns: 'minmax(max-content, 1fr) minmax(180px, 400px) minmax(max-content, 1fr)' }}
          >
            <div className="flex items-center gap-5">
              <Brand compact={vw < 1360} />
              <CityPill
                cities={CITIES}
                activeCity={activeCity}
                weather={weather}
                weatherConfigured={weatherConfigured}
                onCityChange={handleCityChange}
                compact={bp === 'compact'}
              />
            </div>
            <LandmarkSearch cityName={activeCity.name} onPick={handleLandmark} />
            <div className="flex justify-end">
              <Readout cameraPos={cameraPos} showCoords={vw >= 1200} />
            </div>
          </header>

          {/* B + C */}
          <ToolRail
            activeTool={activeTool}
            onToolChange={handleToolChange}
            layersOpen={layersOpen}
            onLayersToggle={handleLayersToggle}
            onReset={handleResetCamera}
            showLabels={bp === 'full'}
          />
          <LayersPanel
            open={layersOpen}
            onClose={() => setLayersOpen(false)}
            activeLayer={activeLayer}
            onLayerChange={setActiveLayer}
            activeOsmLayers={activeOsmLayers}
            onOsmLayerToggle={handleOsmLayerToggle}
            counts={osmCounts}
          />

          {/* D */}
          <MapControls
            heading={cameraPos?.heading ?? 0}
            onZoomIn={() => cesiumRef.current?.zoomIn()}
            onZoomOut={() => cesiumRef.current?.zoomOut()}
            className="right-5 top-[84px]"
          />

          {/* E: mode dock, centred in the free space between panel/status and inspector */}
          <div
            className="pointer-events-none absolute bottom-7 z-20 flex justify-center"
            style={{ left: dockLeftPx, right: dockRightReserve }}
          >
            {dockTool && (
              <Presence
                key={dockTool}
                show
                motion="up"
                className="pointer-events-auto w-full"
                style={{ maxWidth: dockTool === 'sun' ? 580 : 480 }}
              >
                {dockFor(dockTool, false)}
              </Presence>
            )}
          </div>

          {/* F: inspector stack — building card above histogram */}
          <div
            className="ts-scroll absolute bottom-7 right-5 z-20 flex flex-col gap-3 overflow-y-auto"
            style={{ width: inspectorWidth, maxHeight: 'calc(100dvh - 268px)' }}
          >
            <Presence show={!!selectedBuilding} motion="up">
              {selectedBuilding && (
                <BuildingCard
                  building={selectedBuilding}
                  onClose={() => setSelectedBuilding(null)}
                  onFlyTo={handleFlyToBuilding}
                />
              )}
            </Presence>
            <Presence show={activeTool === 'hist'} motion="up">
              <HeightHistogram {...histogram} onClose={closeTool} />
            </Presence>
          </div>

          {/* G */}
          <StatusBar altitudeKm={cameraPos?.alt} tileCount={tileCount} />
        </>
      )}
    </div>
  )
}

export default HomePage
