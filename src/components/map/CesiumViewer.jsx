import * as Cesium from 'cesium'
import { useEffect, useRef } from 'react'
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

const CesiumViewer = ({
  onCameraMove,
  onBuildingClick,
  onLoad,
  onBuildingCount,
  activeLayer,
  flyTo,
  sunHour,
  measureMode,
  onMeasureResult,
}) => {
  const containerRef = useRef(null)
  const viewerRef = useRef(null)
  const tilesetRef = useRef(null)
  const mountedRef = useRef(true)
  const measurePointsRef = useRef([])
  const measureHandlerRef = useRef(null)
  const polylineCollectionRef = useRef(null)

  // Fly to city
  useEffect(() => {
    if (!flyTo || !viewerRef.current) return
    viewerRef.current.camera.flyTo({
      destination: Cartesian3.fromDegrees(flyTo.lat, flyTo.lng, flyTo.alt),
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

  // Disable shadows when sun mode off
  useEffect(() => {
    const viewer = viewerRef.current
    if (!viewer) return
    if (sunHour === null) {
      viewer.scene.shadows = false
    }
  }, [sunHour])

  // Measurement tool
  useEffect(() => {
    const viewer = viewerRef.current
    if (!viewer) return

    // Clean up previous
    if (measureHandlerRef.current) {
      measureHandlerRef.current.destroy()
      measureHandlerRef.current = null
    }
    if (polylineCollectionRef.current) {
      viewer.scene.primitives.remove(polylineCollectionRef.current)
      polylineCollectionRef.current = null
    }
    measurePointsRef.current = []

    if (!measureMode) return

    const polylines = new PolylineCollection()
    viewer.scene.primitives.add(polylines)
    polylineCollectionRef.current = polylines

    const handler = new ScreenSpaceEventHandler(viewer.scene.canvas)
    measureHandlerRef.current = handler

    handler.setInputAction((click) => {
      const cartesian = viewer.scene.pickPosition(click.position)
      if (!cartesian) return

      measurePointsRef.current.push(cartesian)

      if (measurePointsRef.current.length === 2) {
        const [p1, p2] = measurePointsRef.current

        polylines.add({
          positions: [p1, p2],
          width: 3,
          material: Cesium.Material.fromType('Color', {
            color: Color.CYAN,
          }),
        })

        const c1 = Cartographic.fromCartesian(p1)
        const c2 = Cartographic.fromCartesian(p2)
        const geodesic = new EllipsoidGeodesic(c1, c2)
        const distanceKm = (geodesic.surfaceDistance / 1000).toFixed(3)

        if (onMeasureResult) onMeasureResult(`${distanceKm} km`)

        measurePointsRef.current = []
      }
    }, ScreenSpaceEventType.LEFT_CLICK)

  }, [measureMode])

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

        // OSM Buildings
        const tileset = await Cesium3DTileset.fromIonAssetId(96188)
        if (!mountedRef.current || viewer.isDestroyed()) return
        viewer.scene.primitives.add(tileset)
        tilesetRef.current = tileset

        // Building count
        tileset.tileLoad.addEventListener(() => {
          if (onBuildingCount) {
            const count = tileset.statistics?.numberOfTilesWithContentReady ?? 0
            onBuildingCount(count)
          }
        })

        if (onLoad) onLoad()

        // Fly to Dubai Marina
        viewer.camera.flyTo({
          destination: Cartesian3.fromDegrees(55.1404, 25.0820, 600),
          orientation: {
            heading: CesiumMath.toRadians(0),
            pitch: CesiumMath.toRadians(-40),
            roll: 0,
          },
          duration: 3,
        })

        // Live camera coords
        viewer.camera.changed.addEventListener(() => {
          if (!onCameraMove) return
          const pos = viewer.camera.positionCartographic
          onCameraMove({
            lat: CesiumMath.toDegrees(pos.latitude).toFixed(4),
            lng: CesiumMath.toDegrees(pos.longitude).toFixed(4),
            alt: (pos.height / 1000).toFixed(1),
          })
        })

        // Building click
        viewer.screenSpaceEventHandler.setInputAction((click) => {
          if (measureMode) return
          const picked = viewer.scene.pick(click.position)
          if (!defined(picked) || !picked.getProperty) return

          const cartesian = viewer.scene.pickPosition(click.position)
          if (!cartesian) return
          const carto = Cartographic.fromCartesian(cartesian)

          const props = {
            name: picked.getProperty('name') ?? picked.getProperty('name:en') ?? 'Unknown',
            use: picked.getProperty('building') ?? 'Unknown',
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
}

export default CesiumViewer