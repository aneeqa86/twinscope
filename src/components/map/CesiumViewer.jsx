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

const CESIUM_TOKEN = import.meta.env.VITE_CESIUM_ION_TOKEN

const applyHeightStyle = (tileset) => {
  tileset.style = new Cesium3DTileStyle({
    color: {
      conditions: [
        ['${feature["cesium#estimatedHeight"]} >= 100', 'color("#06b6d4")'],
        ['${feature["cesium#estimatedHeight"]} >= 50', 'color("#3b82f6")'],
        ['${feature["cesium#estimatedHeight"]} >= 20', 'color("#8b5cf6")'],
        ['true', 'color("#64748b")'],
      ],
    },
  })
}

const applyUseStyle = (tileset) => {
  tileset.style = new Cesium3DTileStyle({
    color: {
      conditions: [
        ['${feature["building"]} === "commercial" || ${feature["building"]} === "office"', 'color("#06b6d4")'],
        ['${feature["building"]} === "residential" || ${feature["building"]} === "apartments"', 'color("#10b981")'],
        ['${feature["building"]} === "industrial"', 'color("#f59e0b")'],
        ['true', 'color("#94a3b8")'],
      ],
    },
  })
}

const applyDefaultStyle = (tileset) => {
  tileset.style = undefined
}

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

const CesiumViewer = forwardRef(({
  onCameraMove,
  onBuildingClick,
  onLoad,
  onBuildingCount,
  activeLayer,
  flyTo,
  sunHour,
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

  useImperativeHandle(ref, () => ({
    zoomIn: () => {
      if (viewerRef.current)
        viewerRef.current.camera.zoomIn(viewerRef.current.camera.positionCartographic.height * 0.3)
    },
    zoomOut: () => {
      if (viewerRef.current)
        viewerRef.current.camera.zoomOut(viewerRef.current.camera.positionCartographic.height * 0.3)
    },
    clearViewshed: () => {
      const viewer = viewerRef.current
      if (!viewer) return
      viewshedPrimitivesRef.current.forEach(p => viewer.scene.primitives.remove(p))
      viewshedPrimitivesRef.current = []
      viewshedMarkersRef.current.forEach(e => viewer.entities.remove(e))
      viewshedMarkersRef.current = []
      viewshedPointsRef.current = []
    },
  }))

  // Fly to city
  useEffect(() => {
    if (!flyTo || !viewerRef.current) return
    viewerRef.current.camera.flyTo({
      destination: Cartesian3.fromDegrees(flyTo.lng, flyTo.lat, flyTo.alt),
      orientation: {
        heading: CesiumMath.toRadians(0),
        pitch: CesiumMath.toRadians(-40),
        roll: 0,
      },
      duration: 2,
    })
  }, [flyTo])

  // Layer style
  useEffect(() => {
    if (!tilesetRef.current) return
    if (activeLayer === 'height') applyHeightStyle(tilesetRef.current)
    else if (activeLayer === 'use') applyUseStyle(tilesetRef.current)
    else applyDefaultStyle(tilesetRef.current)
  }, [activeLayer])

  // Sun simulation
  useEffect(() => {
    const viewer = viewerRef.current
    if (!viewer || sunHour === undefined || sunHour === null) return
    viewer.scene.shadows = true
    viewer.scene.globe.shadows = Cesium.ShadowMode.ENABLED
    const now = new Date()
    now.setHours(Math.floor(sunHour), Math.round((sunHour % 1) * 60), 0)
    viewer.clock.currentTime = JulianDate.fromDate(now)
    viewer.scene.light = new SunLight()
  }, [sunHour])

  useEffect(() => {
    const viewer = viewerRef.current
    if (!viewer) return
    if (sunHour === null) viewer.scene.shadows = false
  }, [sunHour])

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

    const polylines = new PolylineCollection()
    viewer.scene.primitives.add(polylines)
    polylineCollectionRef.current = polylines

    const handler = new ScreenSpaceEventHandler(viewer.scene.canvas)
    measureHandlerRef.current = handler

    if (measureMode === 'distance') {
      handler.setInputAction((click) => {
        const cartesian = viewer.scene.pickPosition(click.position)
        if (!cartesian) return
        measurePointsRef.current.push(cartesian)

        if (measurePointsRef.current.length === 2) {
          const [p1, p2] = measurePointsRef.current
          polylines.add({
            positions: [p1, p2],
            width: 3,
            material: Cesium.Material.fromType('Color', { color: Color.CYAN }),
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
              material: Cesium.Material.fromType('Color', {
                color: Color.fromCssColorString('#10b981'),
              }),
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
          material: Cesium.Material.fromType('Color', {
            color: Color.fromCssColorString('#10b981'),
          }),
        })

        const entity = viewer.entities.add({
          polygon: {
            hierarchy: new PolygonHierarchy(pts),
            material: Color.fromCssColorString('#10b981').withAlpha(0.25),
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

    const handler = new ScreenSpaceEventHandler(viewer.scene.canvas)
    viewshedHandlerRef.current = handler

    handler.setInputAction(async (click) => {
      const cartesian = viewer.scene.pickPosition(click.position)
      if (!cartesian) return

      viewshedPointsRef.current.push(cartesian)
      const pts = viewshedPointsRef.current

      // Add marker dot
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
          material: isFirst
            ? Color.fromCssColorString('#06b6d4').withAlpha(0.9)
            : Color.fromCssColorString('#f59e0b').withAlpha(0.9),
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
        // Full green line
        polylines.add({
          positions: buildPositions(0, SAMPLES),
          width: 4,
          material: Cesium.Material.fromType('Color', {
            color: Color.fromCssColorString('#10b981').withAlpha(0.9),
          }),
        })
      } else {
        // Green up to block point, red from block point to end
        if (blockedAt > 0) {
          polylines.add({
            positions: buildPositions(0, blockedAt),
            width: 4,
            material: Cesium.Material.fromType('Color', {
              color: Color.fromCssColorString('#10b981').withAlpha(0.9),
            }),
          })
        }
        polylines.add({
          positions: buildPositions(blockedAt, SAMPLES),
          width: 4,
          material: Cesium.Material.fromType('Color', {
            color: Color.fromCssColorString('#ef4444').withAlpha(0.9),
          }),
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

    Ion.defaultAccessToken = CESIUM_TOKEN

    const initViewer = async () => {
      try {
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

        viewer.scene.globe.enableLighting = false
        viewer.scene.backgroundColor = Color.fromCssColorString('#0a1628')
        viewer.scene.skyAtmosphere.show = true

        const tileset = await Cesium3DTileset.fromIonAssetId(96188)
        if (!mountedRef.current || viewer.isDestroyed()) return
        viewer.scene.primitives.add(tileset)
        tilesetRef.current = tileset

        tileset.tileLoad.addEventListener(() => {
          if (onBuildingCount) {
            const count = tileset.statistics?.numberOfTilesWithContentReady ?? 0
            onBuildingCount(count)
          }
        })

        if (onLoad) onLoad(viewer)

        viewer.camera.flyTo({
          destination: Cartesian3.fromDegrees(55.1404, 25.0820, 1500),
          orientation: {
            heading: CesiumMath.toRadians(0),
            pitch: CesiumMath.toRadians(-40),
            roll: 0,
          },
          duration: 3,
        })

        viewer.camera.changed.addEventListener(() => {
          if (!onCameraMove) return
          const pos = viewer.camera.positionCartographic
          onCameraMove({
            lat: CesiumMath.toDegrees(pos.latitude).toFixed(4),
            lng: CesiumMath.toDegrees(pos.longitude).toFixed(4),
            alt: (pos.height / 1000).toFixed(1),
            heading: viewer.camera.heading,
          })
        })

        viewer.screenSpaceEventHandler.setInputAction((click) => {
          if (measureMode || viewshedMode) return
          const picked = viewer.scene.pick(click.position)
          if (!defined(picked) || !picked.getProperty) return

          const cartesian = viewer.scene.pickPosition(click.position)
          if (!cartesian) return
          const carto = Cartographic.fromCartesian(cartesian)

          const props = {
            name:   picked.getProperty('name') ?? picked.getProperty('name:en') ?? 'Unknown',
            use:    picked.getProperty('building') ?? 'Unknown',
            height: picked.getProperty('cesium#estimatedHeight')
              ? Number(picked.getProperty('cesium#estimatedHeight')).toFixed(1)
              : picked.getProperty('height') ?? null,
            levels: picked.getProperty('building:levels') ?? picked.getProperty('building.levels') ?? 'Unknown',
            coords: `${CesiumMath.toDegrees(carto.latitude).toFixed(5)}°, ${CesiumMath.toDegrees(carto.longitude).toFixed(5)}°`,
          }

          if (onBuildingClick) onBuildingClick(props)
        }, ScreenSpaceEventType.LEFT_CLICK)

      } catch (err) {
        console.error('CesiumViewer init error:', err)
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
      style={{ width: '100%', height: '100%', background: '#0a1628' }}
    />
  )
})

CesiumViewer.displayName = 'CesiumViewer'

export default CesiumViewer