import { useState, useRef, useCallback, useEffect, useMemo } from 'react'
import CesiumViewer from '@/components/map/CesiumViewer'
import OsmLayers from '@/components/map/OsmLayers'
import LoadingScreen from '@/components/map/LoadingScreen'
import { flyToPoint } from '@/components/map/draw'
import Brand from '@/components/shell/Brand'
import CityPill from '@/components/shell/CityPill'
import LandmarkSearch from '@/components/shell/LandmarkSearch'
import Readout from '@/components/shell/Readout'
import ToolRail from '@/components/shell/ToolRail'
import LayersPanel from '@/components/shell/LayersPanel'
import MapControls from '@/components/shell/MapControls'
import StatusBar, { ScaleBar } from '@/components/shell/StatusBar'
import { SunDock, MeasureDock, SightDock } from '@/components/shell/ModeDock'
import { DOCK_TOOLS, REPORT_TOOLS, PICK_TOOLS } from '@/components/shell/tools'
import BuildingCard from '@/components/panels/BuildingCard'
import HeightHistogram from '@/components/panels/HeightHistogram'
import { StyleSection, OsmLayersSection } from '@/components/panels/LayerControls'
import { CityList, CityConditions } from '@/components/panels/CityWeather'
import BottomSheet, { SHEET_PEEK } from '@/components/mobile/BottomSheet'
import MobileTopBar from '@/components/mobile/MobileTopBar'
import { Presence } from '@/components/primitives'
import { useSolarAnalysis } from '@/features/solar/useSolarAnalysis'
import { SolarDock, SolarReport } from '@/features/solar/SolarPanels'
import { usePlanScenario, DEFAULT_LIMITS } from '@/features/plan/usePlanScenario'
import { PlanDock, PlanReport } from '@/features/plan/PlanPanels'
import { useAccessAnalysis } from '@/features/access/useAccessAnalysis'
import { AccessDock, AccessReport } from '@/features/access/AccessPanels'
import { useHeatAnalysis } from '@/features/heat/useHeatAnalysis'
import { HeatDock, HeatReport } from '@/features/heat/HeatPanels'
import { useViewScore } from '@/features/views/useViewScore'
import { ViewsDock, ViewsReport, viewTargets } from '@/features/views/ViewsPanels'
import { studyDay } from '@/analysis/sun'
import { CITIES, DEFAULT_CITY } from '@/config/cities'
import {
  useBreakpoint,
  useViewportWidth,
  useViewportHeight,
  useCityWeather,
  useSunTimes,
  useHeightHistogram,
} from '@/hooks'

// Slot geometry (layout spec, 1440×900 reference)
const RAIL_RIGHT = 84 + 12           // rail ends at 84, plus gap
const PANEL_RIGHT = 96 + 336 + 12    // side panel ends at 432, plus gap
const STATUS_RIGHT = 96 + 270 + 12   // scale bar + scene stats caption, beside the rail
const DOCK_MIN = 360
const CONTROLS_BOTTOM = 84 + 44 + 12 + 89 + 12 + 44 // compass, zoom, reset

const DOCK_WIDTH = { sun: 580, plan: 560, heat: 560, access: 560, views: 520 }
// Analyses tied to the place on screen: changing city closes them
const PLACE_TOOLS = ['measure', 'los', 'plan', 'solar', 'access', 'heat', 'views']
const OVERRIDE_TOOLS = ['solar', 'plan', 'views']

const localHour = (city) => {
  const now = new Date()
  const h = now.getUTCHours() + now.getUTCMinutes() / 60 + city.tz
  return Math.round((((h % 24) + 24) % 24) * 4) / 4
}

const defaultViewTarget = (city) => viewTargets(city)[0]?.id ?? null

const HomePage = () => {
  const cesiumRef = useRef(null)
  const bp = useBreakpoint()
  const vw = useViewportWidth()
  const vh = useViewportHeight()
  const mobile = bp === 'mobile'

  const [viewer,           setViewer]           = useState(null)
  const [load,             setLoad]             = useState({ progress: 0, stage: 0, done: false, error: null })
  const [cameraPos,        setCameraPos]        = useState(null)
  const [tileCount,        setTileCount]        = useState(null)
  const [activeCity,       setActiveCity]       = useState(DEFAULT_CITY)
  const [flyTo,            setFlyTo]            = useState(null)

  const [activeTool,       setActiveTool]       = useState(null)
  const [layersOpen,       setLayersOpen]       = useState(false)
  const [selectedBuilding, setSelectedBuilding] = useState(null)

  const [activeLayer,      setActiveLayer]      = useState('default')
  const [activeOsmLayers,  setActiveOsmLayers]  = useState([])
  const [osmCounts,        setOsmCounts]        = useState({})

  // Measure + sight + sun
  const [sunHour,          setSunHour]          = useState(12)
  const [measureKind,      setMeasureKind]      = useState('distance')
  const [measureResult,    setMeasureResult]    = useState(null)
  const [losResult,        setLosResult]        = useState(null)

  // Analyses
  const [planParams,       setPlanParams]       = useState({ floors: 30, setback: 5, dayKey: 'dec', limits: DEFAULT_LIMITS })
  const [accessMode,       setAccessMode]       = useState('origin')
  const [accessCategory,   setAccessCategory]   = useState('transit')
  const [heatParams,       setHeatParams]       = useState({ hour: 14, dayKey: 'aug', lstOn: false, lstPreset: 'summer' })
  const [viewTarget,       setViewTarget]       = useState(() => defaultViewTarget(DEFAULT_CITY))
  const [overrides,        setOverrides]        = useState({})

  // Mobile sheet
  const [sheetDetent,      setSheetDetent]      = useState('peek')
  const [sheetTab,         setSheetTab]         = useState('layers')

  // Each analysis owns its own building colouring; only the active tool's is shown
  const overrideSetters = useMemo(
    () => Object.fromEntries(OVERRIDE_TOOLS.map((k) => [k, (v) => setOverrides((o) => (o[k] === v ? o : { ...o, [k]: v }))])),
    []
  )
  const styleOverride = overrides[activeTool] ?? null

  const { data: weather, configured: weatherConfigured } = useCityWeather(CITIES)
  const sunTimes = useSunTimes(activeCity, activeTool === 'sun')
  const histogram = useHeightHistogram(viewer, activeTool === 'hist', cameraPos)
  const solar = useSolarAnalysis(viewer, activeTool === 'solar', activeCity, overrideSetters.solar)
  const plan = usePlanScenario(viewer, activeTool === 'plan', activeCity, planParams, overrideSetters.plan)
  const access = useAccessAnalysis(viewer, activeTool === 'access', accessMode, accessCategory)
  const heat = useHeatAnalysis(viewer, activeTool === 'heat', activeCity, heatParams)
  const views = useViewScore(viewer, activeTool === 'views', activeCity, viewTarget, overrideSetters.views)

  // ─── Layout maths: where the dock may sit without touching panel or inspector ──
  const inspectorWidth = bp === 'compact' ? 280 : 320
  // A results card appears once there is something to report; the dock covers the idle state
  const reportReady = {
    hist: true,
    plan: plan.phase === 'ready',
    solar: solar.status !== 'idle',
    access: access.status !== 'idle',
    heat: heat.status !== 'idle',
    views: views.status !== 'idle',
  }
  const hasReport = REPORT_TOOLS.includes(activeTool) && !!reportReady[activeTool]
  const inspectorVisible = !!selectedBuilding || hasReport
  const dockRightReserve = inspectorVisible ? 20 + inspectorWidth + 12 : 20
  const dockLeft = (open) => Math.max(open ? PANEL_RIGHT : RAIL_RIGHT, STATUS_RIGHT)
  const fitsBoth = vw - dockLeft(true) - dockRightReserve >= DOCK_MIN

  // ─── Handlers ────────────────────────────────────────────────────────
  const handleToolChange = (tool) => {
    setActiveTool(tool)
    setMeasureResult(null)
    setLosResult(null)
    if (tool === 'sun') setSunHour(localHour(activeCity))
    // Tools that take map clicks would fight with a selected building's card
    if (PICK_TOOLS.includes(tool)) setSelectedBuilding(null)
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
    setViewTarget(defaultViewTarget(city))
    if (PLACE_TOOLS.includes(activeTool)) setActiveTool(null)
    if (activeTool === 'sun') setSunHour(localHour(city))
    setSheetDetent('peek')
  }

  const handleResetCamera = () => {
    setFlyTo({ ...activeCity, _reset: Date.now() })
    setSelectedBuilding(null)
    setMeasureResult(null)
    setLosResult(null)
  }

  // Frame the landmark from the south; `alt` sets how far back the camera stands
  const handleLandmark = (l) => {
    if (viewer) flyToPoint(viewer, l.lng, l.lat, Math.max(500, l.alt * 2.2), Math.min(150, l.alt * 0.25))
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

  // Fly to a footprint from a results list
  const flyToRing = (ring) => {
    if (!viewer || !ring?.length) return
    const lng = ring.reduce((s, p) => s + p[0], 0) / ring.length
    const lat = ring.reduce((s, p) => s + p[1], 0) / ring.length
    flyToPoint(viewer, lng, lat, 450)
  }

  const handleOsmLayerToggle = (layerId) => {
    setActiveOsmLayers((prev) =>
      prev.includes(layerId) ? prev.filter((l) => l !== layerId) : [...prev, layerId]
    )
  }

  const handleProgress = useCallback(({ value, stage }) => {
    setLoad((l) => ({ ...l, progress: Math.max(l.progress, value), stage: Math.max(l.stage, stage) }))
  }, [])

  // Escape backs out one level: active tool, then selection, then the layers panel
  useEffect(() => {
    const onKey = (e) => {
      if (e.key !== 'Escape' || e.defaultPrevented) return
      const tag = document.activeElement?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA') return
      if (activeTool) setActiveTool(null)
      else if (selectedBuilding) setSelectedBuilding(null)
      else if (layersOpen) setLayersOpen(false)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [activeTool, selectedBuilding, layersOpen])

  const closeTool = () => handleToolChange(null)
  const measureAgain = () => { cesiumRef.current?.clearMeasure(); setMeasureResult(null) }
  const clearSight = () => { cesiumRef.current?.clearViewshed(); setLosResult(null) }
  const changeMeasureKind = (kind) => { setMeasureKind(kind); setMeasureResult(null) }

  // Building age colours footprints, so it overrides the style colouring
  const effectiveStyle = activeOsmLayers.includes('age') ? 'default' : activeLayer

  // Sun lighting: the sun tool, or the heat tool's study hour and day
  const viewerSunHour = activeTool === 'sun' ? sunHour : activeTool === 'heat' ? heatParams.hour : null
  const viewerSunDate = activeTool === 'heat' ? studyDay(heatParams.dayKey) : undefined

  // ─── Per-tool pieces ─────────────────────────────────────────────────
  const dockFor = (tool, isMobile) => {
    switch (tool) {
      case 'sun':
        return <SunDock value={sunHour} onChange={setSunHour} sunTimes={sunTimes} cityName={activeCity.name} onClose={closeTool} mobile={isMobile} />
      case 'measure':
        return <MeasureDock kind={measureKind} onKindChange={changeMeasureKind} result={measureResult} onAgain={measureAgain} onDone={closeTool} mobile={isMobile} />
      case 'los':
        return <SightDock result={losResult} onClear={clearSight} onClose={closeTool} mobile={isMobile} />
      case 'plan':
        return <PlanDock plan={plan} params={planParams} setParams={setPlanParams} onClose={closeTool} mobile={isMobile} />
      case 'solar':
        return <SolarDock solar={solar} onClose={closeTool} mobile={isMobile} />
      case 'access':
        return <AccessDock access={access} mode={accessMode} setMode={setAccessMode} category={accessCategory} setCategory={setAccessCategory} onClose={closeTool} mobile={isMobile} />
      case 'heat':
        return <HeatDock heatParams={heatParams} setHeatParams={setHeatParams} onCityView={() => setFlyTo({ lat: activeCity.lat - 0.28, lng: activeCity.lng, alt: 32000, pitch: -58, _t: Date.now() })} onClose={closeTool} mobile={isMobile} />
      case 'views':
        return <ViewsDock views={views} city={activeCity} targetId={viewTarget} setTargetId={setViewTarget} onClose={closeTool} mobile={isMobile} />
      default:
        return null
    }
  }

  // The dock already has a close button, so analysis reports don't repeat it
  const reportFor = (tool) => {
    switch (tool) {
      case 'hist':
        return <HeightHistogram {...histogram} onClose={closeTool} />
      case 'plan':
        return <PlanReport plan={plan} params={planParams} setParams={setPlanParams} onFlyTo={flyToRing} />
      case 'solar':
        return <SolarReport solar={solar} city={activeCity} onFlyTo={flyToRing} />
      case 'access':
        return <AccessReport access={access} />
      case 'heat':
        return <HeatReport heat={heat} heatParams={heatParams} />
      case 'views':
        return <ViewsReport views={views} />
      default:
        return null
    }
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
          initialCity={DEFAULT_CITY}
          onCameraMove={setCameraPos}
          onBuildingClick={setSelectedBuilding}
          onLoad={(v) => { setViewer(v); setLoad((l) => ({ ...l, progress: 1, stage: 3, done: true })) }}
          onProgress={handleProgress}
          onError={(error) => setLoad((l) => ({ ...l, error }))}
          onBuildingCount={setTileCount}
          activeLayer={effectiveStyle}
          selectedBuilding={selectedBuilding}
          styleOverride={styleOverride}
          pickLocked={PICK_TOOLS.includes(activeTool)}
          flyTo={flyTo}
          sunHour={viewerSunHour}
          sunDate={viewerSunDate}
          timezone={activeCity.tz}
          measureMode={activeTool === 'measure' ? measureKind : null}
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

          {/* The half sheet covers this column, so hide it rather than leave it half-buried */}
          <Presence show={sheetDetent === 'peek'} motion="fade">
            <MapControls
              heading={cameraPos?.heading ?? 0}
              onZoomIn={() => cesiumRef.current?.zoomIn()}
              onZoomOut={() => cesiumRef.current?.zoomOut()}
              onReset={handleResetCamera}
              className="right-3 top-32"
            />
          </Presence>

          {/* Mode card slot: the tool's controls and results above the sheet; hidden while the sheet is half open */}
          {sheetDetent === 'peek' && (
            <div className="absolute inset-x-3 z-20" style={{ bottom: SHEET_PEEK + 12 }}>
              {activeTool ? (
                <Presence key={activeTool} show motion="up">
                  <div
                    className="ts-scroll flex flex-col gap-2 overflow-y-auto rounded-panel"
                    style={{ maxHeight: `calc(100dvh - ${SHEET_PEEK + 12 + 344}px)` }}
                  >
                    {dockFor(activeTool, true)}
                    {hasReport && reportFor(activeTool)}
                  </div>
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
            showLabels={bp === 'full'}
            dense={vh < 860}
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
            onReset={handleResetCamera}
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
                style={{ maxWidth: DOCK_WIDTH[dockTool] ?? 480 }}
              >
                {dockFor(dockTool, false)}
              </Presence>
            )}
          </div>

          {/* F: inspector stack — building card above the active tool's results */}
          <div
            className="ts-scroll absolute bottom-7 right-5 z-20 flex flex-col gap-3 overflow-y-auto"
            style={{ width: inspectorWidth, maxHeight: `calc(100dvh - ${CONTROLS_BOTTOM + 12 + 28}px)` }}
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
            <Presence show={hasReport} motion="up" key={hasReport ? activeTool : 'none'}>
              {hasReport && reportFor(activeTool)}
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
