import * as Cesium from 'cesium'
import { useEffect, useRef, forwardRef, useImperativeHandle } from 'react'
import {
  Viewer,
  Cesium3DTileset,
  Cesium3DTileStyle,
  ScreenSpaceEventType,
  ScreenSpaceEventHandler,
  Ion,
  Cartesian3,
  Cartographic,
  Math as CesiumMath,
  Color,
  Terrain,
  defined,
  JulianDate,
  SunLight,
  EllipsoidGeodesic,
  PolylineCollection,
  PolygonHierarchy,
} from 'cesium'
import 'cesium/Build/Cesium/Widgets/widgets.css'
import { cssVar, HEIGHT_CLASSES, USE_CLASSES, ageClass } from '@/config/legends'
import { fetchWayFootprint } from '@/services/overpassService'
import { idCondition } from './draw'

const CESIUM_TOKEN = import.meta.env.VITE_CESIUM_ION_TOKEN

const tokenColor = (token, alpha = 1) => Color.fromCssColorString(cssVar(token)).withAlpha(alpha)

// ─── Building styles ─────────────────────────────────────────────────────
// The selected building is always the first condition so it wins in every style.

const HEIGHT_EXPR = '${feature["cesium#estimatedHeight"]}'
const USE_EXPR = '${feature["building"]}'

const styleConditions = (styleId) => {
  if (styleId === 'height') {
    return [...HEIGHT_CLASSES].reverse().map((c) => [
      c.min === 0 ? 'true' : `${HEIGHT_EXPR} >= ${c.min}`,
      `color("${cssVar(c.token)}")`,
    ])
  }
  if (styleId === 'use') {
    return USE_CLASSES.map((c) => [
      c.match.length ? c.match.map((m) => `${USE_EXPR} === "${m}"`).join(' || ') : 'true',
      `color("${cssVar(c.token)}")`,
    ])
  }
  return [['true', 'color("#e4dfd3")']]
}

/**
 * override: { classes: [{ ids, color }], fallback? } colours buildings by analysis
 * result; buildings outside every class keep the base style unless a fallback is given.
 */
const applyStyle = (tileset, styleId, selectedId, override) => {
  let conditions = styleConditions(styleId)
  if (override) {
    const classes = override.classes.map((c) => [idCondition(c.ids), `color("${c.color}")`])
    conditions = [...classes, ...(override.fallback ? [['true', `color("${override.fallback}")`]] : conditions)]
  }
  if (selectedId !== null && selectedId !== undefined) {
    conditions.unshift([`\${feature["elementId"]} === ${Number(selectedId)}`, `color("${cssVar('--ts-accent')}")`])
  }
  tileset.style = new Cesium3DTileStyle({ color: { conditions } })
}

// ─── Geometry helpers ────────────────────────────────────────────────────

const computePolygonAreaKm2 = (cartesians) => {
  const cartographics = cartesians.map((c) => Cartographic.fromCartesian(c))
  let area = 0
  const n = cartographics.length
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n
    const xi = CesiumMath.toDegrees(cartographics[i].longitude)
    const yi = CesiumMath.toDegrees(cartographics[i].latitude)
    const xj = CesiumMath.toDegrees(cartographics[j].longitude)
    const yj = CesiumMath.toDegrees(cartographics[j].latitude)
    area += xi * yj
    area -= xj * yi
  }
  const areaDeg2 = Math.abs(area) / 2
  const areaKm2 = areaDeg2 * 111.32 * 111.32
  return areaKm2
}

const lerp = (a, b, t) => a + (b - a) * t

const M_PER_DEG_LAT = 110540
const mPerDegLng = (lat) => 111320 * Math.cos(CesiumMath.toRadians(lat))

/** Footprint ring → padded lon/lat rectangle in local metres (0.22 units larger, per spec ≈ 6% + 1.5 m). */
const paddedBounds = (ring, lat0) => {
  const lats = ring.map((p) => p.lat)
  const lngs = ring.map((p) => p.lon)
  let south = Math.min(...lats), north = Math.max(...lats)
  let west = Math.min(...lngs), east = Math.max(...lngs)
  const padLat = ((north - south) * 0.06) + 1.5 / M_PER_DEG_LAT
  const padLng = ((east - west) * 0.06) + 1.5 / mPerDegLng(lat0)
  return { south: south - padLat, north: north + padLat, west: west - padLng, east: east + padLng }
}

// Fly-to duration scales with distance: 1.8 s nearby, 3.2 s across the region
const flightDuration = (camera, lng, lat, alt) => {
  const dest = Cartesian3.fromDegrees(lng, lat, alt)
  const d = Cartesian3.distance(camera.positionWC, dest)
  return Math.min(3.2, Math.max(1.8, 1.8 + (d / 400000) * 1.4))
}

const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

const CesiumViewer = forwardRef(({
  onCameraMove,
  onBuildingClick,
  onLoad,
  onProgress,
  onError,
  onBuildingCount,
  activeLayer,
  selectedBuilding,
  styleOverride,
  initialCity,
  pickLocked = false,
  flyTo,
  sunHour,
  sunDate,
  timezone = 4,
  measureMode,
  onMeasureResult,
  viewshedMode,
  onViewshedResult,
}, ref) => {
  const containerRef           = useRef(null)
  const viewerRef              = useRef(null)
  const tilesetRef             = useRef(null)
  const mountedRef             = useRef(true)
  const measurePointsRef       = useRef([])
  const measureHandlerRef      = useRef(null)
  const polylineCollectionRef  = useRef(null)
  const areaPrimitiveRef       = useRef(null)
  const viewshedHandlerRef     = useRef(null)
  const viewshedPrimitivesRef  = useRef([])
  const viewshedMarkersRef     = useRef([])
  const viewshedPointsRef      = useRef([])
  const selectionEntitiesRef   = useRef([])
  // Read inside the long-lived click handler, so they must be refs, not closure values
  const modeRef                = useRef({ measureMode, viewshedMode, pickLocked })
  const styleRef               = useRef({ activeLayer, selectedId: null, override: null })
  const callbacksRef           = useRef({})

  modeRef.current = { measureMode, viewshedMode, pickLocked }
  callbacksRef.current = { onCameraMove, onBuildingClick, onLoad, onProgress, onError, onBuildingCount }

  const flyCamera = ({ lat, lng, alt, pitch = -40, heading = 0 }) => {
    const viewer = viewerRef.current
    if (!viewer) return
    viewer.camera.flyTo({
      destination: Cartesian3.fromDegrees(lng, lat, alt),
      orientation: {
        heading: CesiumMath.toRadians(heading),
        pitch: CesiumMath.toRadians(pitch),
        roll: 0,
      },
      duration: reducedMotion() ? 0 : flightDuration(viewer.camera, lng, lat, alt),
      easingFunction: Cesium.EasingFunction.CUBIC_IN_OUT,
    })
  }

  useImperativeHandle(ref, () => ({
    zoomIn: () => {
      if (viewerRef.current)
        viewerRef.current.camera.zoomIn(viewerRef.current.camera.positionCartographic.height * 0.3)
    },
    zoomOut: () => {
      if (viewerRef.current)
        viewerRef.current.camera.zoomOut(viewerRef.current.camera.positionCartographic.height * 0.3)
    },
    flyTo: flyCamera,
    clearViewshed: () => {
      const viewer = viewerRef.current
      if (!viewer) return
      viewshedPrimitivesRef.current.forEach(p => viewer.scene.primitives.remove(p))
      viewshedPrimitivesRef.current = []
      viewshedMarkersRef.current.forEach(e => viewer.entities.remove(e))
      viewshedMarkersRef.current = []
      viewshedPointsRef.current = []
    },
    clearMeasure: () => {
      const viewer = viewerRef.current
      if (!viewer) return
      polylineCollectionRef.current?.removeAll()
      if (areaPrimitiveRef.current) {
        viewer.entities.remove(areaPrimitiveRef.current)
        areaPrimitiveRef.current = null
      }
      measurePointsRef.current = []
    },
  }))

  // Fly to city / landmark
  useEffect(() => {
    if (!flyTo) return
    flyCamera(flyTo)
  }, [flyTo])

  // Building style + selection colour + analysis colouring
  useEffect(() => {
    styleRef.current = { activeLayer, selectedId: selectedBuilding?.elementId ?? null, override: styleOverride ?? null }
    if (!tilesetRef.current) return
    applyStyle(tilesetRef.current, activeLayer, styleRef.current.selectedId, styleRef.current.override)
  }, [activeLayer, selectedBuilding?.elementId, styleOverride])

  // Selection decoration: dashed accent bounding box + vertical height dimension line
  useEffect(() => {
    const viewer = viewerRef.current
    if (!viewer) return
    const clear = () => {
      selectionEntitiesRef.current.forEach((e) => viewer.entities.remove(e))
      selectionEntitiesRef.current = []
    }
    clear()
    if (!selectedBuilding || !selectedBuilding.heightM) return

    let cancelled = false
    const accent = tokenColor('--ts-accent')
    const dashed = new Cesium.PolylineDashMaterialProperty({ color: accent, dashLength: 10, dashPattern: 0xf0f0 })
    const base = selectedBuilding.groundHeight ?? 0
    const top = base + selectedBuilding.heightM
    const add = (entity) => selectionEntitiesRef.current.push(viewer.entities.add(entity))

    const line = (positions, material = dashed, width = 1.4) => add({
      polyline: { positions, width, material, arcType: Cesium.ArcType.NONE },
    })

    const drawDimension = (lng, lat) => {
      const tick = 3 / mPerDegLng(lat)
      line([Cartesian3.fromDegrees(lng, lat, base), Cartesian3.fromDegrees(lng, lat, top)], accent, 1.4)
      line([Cartesian3.fromDegrees(lng - tick, lat, base), Cartesian3.fromDegrees(lng + tick, lat, base)], accent, 1.4)
      line([Cartesian3.fromDegrees(lng - tick, lat, top), Cartesian3.fromDegrees(lng + tick, lat, top)], accent, 1.4)
      add({
        position: Cartesian3.fromDegrees(lng, lat, (base + top) / 2),
        label: {
          text: `${selectedBuilding.heightM.toFixed(1)} m`,
          font: '500 12px "Geist Mono", ui-monospace, monospace',
          fillColor: accent,
          showBackground: true,
          backgroundColor: Color.fromCssColorString('#0c0d0f').withAlpha(0.82),
          backgroundPadding: new Cesium.Cartesian2(6, 4),
          horizontalOrigin: Cesium.HorizontalOrigin.LEFT,
          pixelOffset: new Cesium.Cartesian2(8, 0),
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
        },
      })
    }

    // Fallback while (or if) the footprint loads: dimension line just east of the click point
    drawDimension(selectedBuilding.lng + 4 / mPerDegLng(selectedBuilding.lat), selectedBuilding.lat)

    if (selectedBuilding.elementType === 'way' && selectedBuilding.elementId) {
      fetchWayFootprint(selectedBuilding.elementId).then((ring) => {
        if (cancelled || !ring || ring.length < 3 || viewer.isDestroyed()) return
        clear()
        const b = paddedBounds(ring, selectedBuilding.lat)
        const corners = [[b.west, b.south], [b.east, b.south], [b.east, b.north], [b.west, b.north]]
        const ring3 = (h) => [...corners, corners[0]].map(([x, y]) => Cartesian3.fromDegrees(x, y, h))
        line(ring3(base))
        line(ring3(top))
        corners.forEach(([x, y]) => line([Cartesian3.fromDegrees(x, y, base), Cartesian3.fromDegrees(x, y, top)]))
        drawDimension(b.east + 4 / mPerDegLng(selectedBuilding.lat), (b.south + b.north) / 2)
      }).catch(() => {})
    }

    return () => { cancelled = true }
  }, [selectedBuilding])

  // Sun simulation — sunHour is local time in the active city
  useEffect(() => {
    const viewer = viewerRef.current
    if (!viewer) return
    if (sunHour === undefined || sunHour === null) {
      viewer.scene.shadows = false
      return
    }
    viewer.scene.shadows = true
    viewer.scene.globe.shadows = Cesium.ShadowMode.ENABLED
    const now = new Date()
    const utcMidnight = sunDate
      ? Date.UTC(sunDate.year, sunDate.month - 1, sunDate.day)
      : Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
    const when = new Date(utcMidnight + (sunHour - timezone) * 3600 * 1000)
    viewer.clock.currentTime = JulianDate.fromDate(when)
    if (!(viewer.scene.light instanceof SunLight)) viewer.scene.light = new SunLight()
  }, [sunHour, timezone, sunDate?.year, sunDate?.month, sunDate?.day])

  // Measurement tool
  useEffect(() => {
    const viewer = viewerRef.current
    if (!viewer) return

    if (measureHandlerRef.current) {
      measureHandlerRef.current.destroy()
      measureHandlerRef.current = null
    }
    if (polylineCollectionRef.current) {
      viewer.scene.primitives.remove(polylineCollectionRef.current)
      polylineCollectionRef.current = null
    }
    if (areaPrimitiveRef.current) {
      viewer.entities.remove(areaPrimitiveRef.current)
      areaPrimitiveRef.current = null
    }
    measurePointsRef.current = []

    if (!measureMode) return

    const accent = tokenColor('--ts-accent')
    const polylines = new PolylineCollection()
    viewer.scene.primitives.add(polylines)
    polylineCollectionRef.current = polylines

    const handler = new ScreenSpaceEventHandler(viewer.scene.canvas)
    measureHandlerRef.current = handler

    if (measureMode === 'distance') {
      handler.setInputAction((click) => {
        const cartesian = viewer.scene.pickPosition(click.position)
        if (!cartesian) return
        if (measurePointsRef.current.length === 0) polylines.removeAll()
        measurePointsRef.current.push(cartesian)

        if (measurePointsRef.current.length === 2) {
          const [p1, p2] = measurePointsRef.current
          polylines.add({
            positions: [p1, p2],
            width: 3,
            material: Cesium.Material.fromType('Color', { color: accent }),
          })
          const c1 = Cartographic.fromCartesian(p1)
          const c2 = Cartographic.fromCartesian(p2)
          const geodesic = new EllipsoidGeodesic(c1, c2)
          const metres = geodesic.surfaceDistance
          const distanceLabel = metres < 1000
            ? `${Math.round(metres)} m`
            : `${(metres / 1000).toFixed(3)} km`
          if (onMeasureResult) onMeasureResult(distanceLabel)
          measurePointsRef.current = []
        }
      }, ScreenSpaceEventType.LEFT_CLICK)
    }

    if (measureMode === 'area') {
      handler.setInputAction((click) => {
        const cartesian = viewer.scene.pickPosition(click.position)
        if (!cartesian) return
        measurePointsRef.current.push(cartesian)

        if (measurePointsRef.current.length >= 2) {
          const pts = measurePointsRef.current
          polylines.removeAll()
          for (let i = 0; i < pts.length - 1; i++) {
            polylines.add({
              positions: [pts[i], pts[i + 1]],
              width: 2,
              material: Cesium.Material.fromType('Color', { color: accent }),
            })
          }
        }
      }, ScreenSpaceEventType.LEFT_CLICK)

      handler.setInputAction(() => {
        const pts = measurePointsRef.current
        if (pts.length < 3) return

        polylines.add({
          positions: [pts[pts.length - 1], pts[0]],
          width: 2,
          material: Cesium.Material.fromType('Color', { color: accent }),
        })

        if (areaPrimitiveRef.current) viewer.entities.remove(areaPrimitiveRef.current)
        const entity = viewer.entities.add({
          polygon: {
            hierarchy: new PolygonHierarchy(pts),
            material: accent.withAlpha(0.18),
            outline: false,
            perPositionHeight: false,
          },
        })
        areaPrimitiveRef.current = entity

        const areaKm2 = computePolygonAreaKm2(pts)
        const areaM2 = areaKm2 * 1_000_000
        const label = areaM2 < 1_000_000
          ? `${Math.round(areaM2).toLocaleString()} m²`
          : `${areaKm2.toFixed(4)} km²`
        if (onMeasureResult) onMeasureResult(label)
        measurePointsRef.current = []
      }, ScreenSpaceEventType.LEFT_DOUBLE_CLICK)
    }
  }, [measureMode])

  // Viewshed tool
  useEffect(() => {
    const viewer = viewerRef.current
    if (!viewer) return

    // Cleanup previous viewshed
    if (viewshedHandlerRef.current) {
      viewshedHandlerRef.current.destroy()
      viewshedHandlerRef.current = null
    }
    viewshedPrimitivesRef.current.forEach(p => viewer.scene.primitives.remove(p))
    viewshedPrimitivesRef.current = []
    viewshedMarkersRef.current.forEach(e => viewer.entities.remove(e))
    viewshedMarkersRef.current = []
    viewshedPointsRef.current = []

    if (!viewshedMode) return

    const okColor  = tokenColor('--ts-ok', 0.9)
    const badColor = tokenColor('--ts-bad', 0.9)

    const handler = new ScreenSpaceEventHandler(viewer.scene.canvas)
    viewshedHandlerRef.current = handler

    handler.setInputAction(async (click) => {
      const cartesian = viewer.scene.pickPosition(click.position)
      if (!cartesian) return

      viewshedPointsRef.current.push(cartesian)
      const pts = viewshedPointsRef.current

      // Observer in bone, target in accent
      const carto = Cartographic.fromCartesian(cartesian)
      const isFirst = pts.length === 1
      const marker = viewer.entities.add({
        position: Cartesian3.fromDegrees(
          CesiumMath.toDegrees(carto.longitude),
          CesiumMath.toDegrees(carto.latitude),
          carto.height + 2
        ),
        ellipse: {
          semiMinorAxis: 8,
          semiMajorAxis: 8,
          material: isFirst ? tokenColor('--ts-text', 0.9) : tokenColor('--ts-accent', 0.9),
          classificationType: Cesium.ClassificationType.BOTH,
        },
      })
      viewshedMarkersRef.current.push(marker)

      if (pts.length < 2) return

      // Two points selected — run line-of-sight analysis
      const [p1, p2] = pts
      const c1 = Cartographic.fromCartesian(p1)
      const c2 = Cartographic.fromCartesian(p2)

      const SAMPLES = 24
      const sampleCartographics = []

      for (let i = 0; i <= SAMPLES; i++) {
        const t = i / SAMPLES
        const lon = lerp(c1.longitude, c2.longitude, t)
        const lat = lerp(c1.latitude,  c2.latitude,  t)
        sampleCartographics.push(new Cartographic(lon, lat))
      }

      // Sample scene height (terrain + buildings) at each point
      let sampledHeights
      try {
        const sampled = await viewer.scene.sampleHeightMostDetailed(sampleCartographics)
        sampledHeights = sampled.map(c => c.height ?? 0)
      } catch {
        // Fallback: use globe height only
        sampledHeights = sampleCartographics.map(() => 0)
      }

      // Observer height — 1.7m above ground
      const observerHeight = (sampledHeights[0] ?? 0) + 1.7
      const targetHeight   = (sampledHeights[SAMPLES] ?? 0) + 1.7

      // Check line of sight at each sample
      let blocked = false
      let blockedAt = -1

      for (let i = 1; i < SAMPLES; i++) {
        const t = i / SAMPLES
        // Height of straight line between observer and target at this t
        const losHeight = lerp(observerHeight, targetHeight, t)
        const sceneHeight = sampledHeights[i] ?? 0
        if (sceneHeight > losHeight) {
          blocked = true
          blockedAt = i
          break
        }
      }

      // Build result positions — elevate line slightly above ground
      const buildPositions = (fromIdx, toIdx) => {
        const result = []
        for (let i = fromIdx; i <= toIdx; i++) {
          const t = i / SAMPLES
          const lon = lerp(c1.longitude, c2.longitude, t)
          const lat = lerp(c1.latitude,  c2.latitude,  t)
          const h = lerp(observerHeight, targetHeight, t) + 2
          result.push(Cartesian3.fromDegrees(
            CesiumMath.toDegrees(lon),
            CesiumMath.toDegrees(lat),
            h
          ))
        }
        return result
      }

      const polylines = new PolylineCollection()

      if (!blocked) {
        polylines.add({
          positions: buildPositions(0, SAMPLES),
          width: 4,
          material: Cesium.Material.fromType('Color', { color: okColor }),
        })
      } else {
        // Clear up to the block point, blocked from there to the target
        if (blockedAt > 0) {
          polylines.add({
            positions: buildPositions(0, blockedAt),
            width: 4,
            material: Cesium.Material.fromType('Color', { color: okColor }),
          })
        }
        polylines.add({
          positions: buildPositions(blockedAt, SAMPLES),
          width: 4,
          material: Cesium.Material.fromType('Color', { color: badColor }),
        })
      }

      viewer.scene.primitives.add(polylines)
      viewshedPrimitivesRef.current.push(polylines)

      if (onViewshedResult) {
        onViewshedResult(blocked ? 'blocked' : 'clear')
      }

      // Reset for next analysis
      viewshedPointsRef.current = []
      viewshedMarkersRef.current.forEach(e => viewer.entities.remove(e))
      viewshedMarkersRef.current = []

    }, ScreenSpaceEventType.LEFT_CLICK)

  }, [viewshedMode])

  // Main init
  useEffect(() => {
    mountedRef.current = true
    if (!containerRef.current || viewerRef.current) return

    if (CESIUM_TOKEN) Ion.defaultAccessToken = CESIUM_TOKEN
    const progress = (value, stage) => callbacksRef.current.onProgress?.({ value, stage })

    const initViewer = async () => {
      try {
        progress(0.08, 0)
        const viewer = new Viewer(containerRef.current, {
          terrain: Terrain.fromWorldTerrain(),
          baseLayerPicker: false,
          navigationHelpButton: false,
          sceneModePicker: false,
          geocoder: false,
          homeButton: false,
          fullscreenButton: false,
          animation: false,
          timeline: false,
          shadows: false,
          infoBox: false,
          selectionIndicator: false,
          contextOptions: { requestWebgl2: true },
        })

        if (!mountedRef.current) { viewer.destroy(); return }
        viewerRef.current = viewer
        progress(0.33, 1)

        viewer.scene.globe.enableLighting = false
        viewer.scene.backgroundColor = Color.fromCssColorString(cssVar('--ts-void') || '#0c0d0f')
        viewer.scene.skyAtmosphere.show = true

        const tileset = await Cesium3DTileset.fromIonAssetId(96188)
        if (!mountedRef.current || viewer.isDestroyed()) return
        viewer.scene.primitives.add(tileset)
        tilesetRef.current = tileset
        applyStyle(tileset, styleRef.current.activeLayer, styleRef.current.selectedId, styleRef.current.override)
        progress(0.5, 1)

        tileset.tileLoad.addEventListener(() => {
          const count = tileset.statistics?.numberOfTilesWithContentReady ?? 0
          callbacksRef.current.onBuildingCount?.(count)
        })

        // Loading screen tracks the first full tile load, with a safety timeout
        let finished = false
        const finish = () => {
          if (finished || !mountedRef.current) return
          finished = true
          progress(1, 3)
          callbacksRef.current.onLoad?.(viewer)
        }
        let peakPending = 1
        const removeProgress = tileset.loadProgress.addEventListener((pending, processing) => {
          const outstanding = pending + processing
          peakPending = Math.max(peakPending, outstanding)
          if (!finished) progress(0.5 + 0.4 * (1 - outstanding / peakPending), 1)
        })
        const removeLoaded = tileset.allTilesLoaded.addEventListener(() => {
          progress(0.94, 2)
          removeProgress()
          removeLoaded()
          setTimeout(finish, 450)
        })
        setTimeout(finish, 15000)

        viewer.camera.percentageChanged = 0.02
        const start = initialCity ?? { lng: 46.6753, lat: 24.7136, alt: 1500 }
        viewer.camera.setView({
          destination: Cartesian3.fromDegrees(start.lng, start.lat, start.alt),
          orientation: {
            heading: CesiumMath.toRadians(0),
            pitch: CesiumMath.toRadians(-40),
            roll: 0,
          },
        })

        const reportCamera = () => {
          const pos = viewer.camera.positionCartographic
          callbacksRef.current.onCameraMove?.({
            lat: CesiumMath.toDegrees(pos.latitude),
            lng: CesiumMath.toDegrees(pos.longitude),
            alt: pos.height / 1000,
            heading: viewer.camera.heading,
          })
        }
        viewer.camera.changed.addEventListener(reportCamera)
        reportCamera()

        viewer.screenSpaceEventHandler.setInputAction((click) => {
          const { measureMode: m, viewshedMode: v, pickLocked: locked } = modeRef.current
          if (m || v || locked) return
          const picked = viewer.scene.pick(click.position)
          if (!defined(picked) || !picked.getProperty) {
            callbacksRef.current.onBuildingClick?.(null)
            return
          }

          const cartesian = viewer.scene.pickPosition(click.position)
          if (!cartesian) return
          const carto = Cartographic.fromCartesian(cartesian)
          const lat = CesiumMath.toDegrees(carto.latitude)
          const lng = CesiumMath.toDegrees(carto.longitude)

          const estimated = Number(picked.getProperty('cesium#estimatedHeight'))
          const tagged = parseFloat(picked.getProperty('height'))
          const heightM = !isNaN(estimated) && estimated > 0 ? estimated : !isNaN(tagged) ? tagged : null
          const startDate = picked.getProperty('start_date')

          callbacksRef.current.onBuildingClick?.({
            elementId:    picked.getProperty('elementId') ?? null,
            elementType:  picked.getProperty('elementType') ?? null,
            name:         picked.getProperty('name') ?? picked.getProperty('name:en') ?? 'Unnamed building',
            use:          picked.getProperty('building') ?? 'Unknown',
            heightM,
            levels:       picked.getProperty('building:levels') ?? picked.getProperty('building.levels') ?? null,
            era:          ageClass(startDate),
            startDate:    startDate ?? null,
            lat,
            lng,
            groundHeight: viewer.scene.globe.getHeight(Cartographic.fromDegrees(lng, lat)) ?? 0,
          })
        }, ScreenSpaceEventType.LEFT_CLICK)

      } catch (err) {
        console.error('CesiumViewer init error:', err)
        callbacksRef.current.onError?.(err?.message ?? String(err))
      }
    }

    initViewer()

    return () => {
      mountedRef.current = false
      if (measureHandlerRef.current) measureHandlerRef.current.destroy()
      if (viewshedHandlerRef.current) viewshedHandlerRef.current.destroy()
      if (viewerRef.current && !viewerRef.current.isDestroyed()) {
        viewerRef.current.destroy()
        viewerRef.current = null
      }
    }
  }, [])

  return (
    <div
      ref={containerRef}
      style={{ width: '100%', height: '100%', background: 'var(--ts-void)' }}
    />
  )
})

CesiumViewer.displayName = 'CesiumViewer'

export default CesiumViewer
