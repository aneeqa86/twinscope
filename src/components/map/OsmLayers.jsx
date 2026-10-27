import { useEffect, useRef } from 'react'
import * as Cesium from 'cesium'
import { fetchPOIs, fetchRoads, fetchBuildingAges } from '@/services/overpassService'
import { cssVar, POI_CATEGORIES, ROAD_CLASSES, ageClass } from '@/config/legends'
import { POI_GLYPHS } from '@/components/icons/iconData'
import { groundLines } from './draw'

const POI_BY_ID = Object.fromEntries(POI_CATEGORIES.map((c) => [c.id, c]))
const ROAD_BY_ID = Object.fromEntries(ROAD_CLASSES.map((c) => [c.id, c]))

const getPOICategory = (el) => {
  const t = el.tags || {}
  if (t.amenity === 'hospital') return 'hospital'
  if (t.amenity === 'school') return 'school'
  if (t.amenity === 'place_of_worship' && t.religion === 'muslim') return 'mosque'
  if (t.station === 'subway') return 'metro'
  if (t.shop === 'mall') return 'mall'
  if (t.leisure === 'park') return 'park'
  if (t.tourism === 'hotel') return 'hotel'
  if (t.amenity === 'restaurant') return 'restaurant'
  return null
}

const getBbox = (viewer) => {
  const rect = viewer.camera.computeViewRectangle()
  if (!rect) return null
  return {
    south: Cesium.Math.toDegrees(rect.south),
    west:  Cesium.Math.toDegrees(rect.west),
    north: Cesium.Math.toDegrees(rect.north),
    east:  Cesium.Math.toDegrees(rect.east),
  }
}

const roundBbox = (bbox) => ({
  south: Math.round(bbox.south * 1000) / 1000,
  west:  Math.round(bbox.west  * 1000) / 1000,
  north: Math.round(bbox.north * 1000) / 1000,
  east:  Math.round(bbox.east  * 1000) / 1000,
})

// Teardrop pin in the category colour with the category glyph inside (dark stroke).
// Drawn at 2x for crisp billboards; cached per category.
const pinCache = {}
const makePinCanvas = (category, color) => {
  if (pinCache[category]) return pinCache[category]
  const S = 2
  const canvas = document.createElement('canvas')
  canvas.width = 28 * S
  canvas.height = 36 * S
  const ctx = canvas.getContext('2d')
  ctx.scale(S, S)

  // Teardrop: circle r=12 at (14,13) tapering to a point at (14,34)
  ctx.beginPath()
  ctx.moveTo(14, 34)
  ctx.bezierCurveTo(10, 28, 2, 21, 2, 13)
  ctx.arc(14, 13, 12, Math.PI, 0)
  ctx.bezierCurveTo(26, 21, 18, 28, 14, 34)
  ctx.closePath()
  ctx.fillStyle = color
  ctx.fill()
  ctx.lineWidth = 1.5
  ctx.strokeStyle = '#0c0d0f'
  ctx.stroke()

  // Glyph on the 10px grid, scaled to 14px and centred in the head
  ctx.save()
  ctx.translate(7, 6)
  ctx.scale(1.4, 1.4)
  ctx.strokeStyle = '#0c0d0f'
  ctx.lineWidth = 1.25
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  POI_GLYPHS[category].forEach((d) => ctx.stroke(new Path2D(d)))
  ctx.restore()

  pinCache[category] = canvas
  return canvas
}

const OsmLayers = ({ viewer, activeLayers, cameraPos, onCounts }) => {
  const poiRef      = useRef([])
  const roadRef     = useRef([])
  const ageRef      = useRef([])
  const fetchedRef  = useRef({ poi: null, road: null, age: null })
  const debounceRef = useRef({})
  const countsRef   = useRef({ poi: null, roads: null, age: null })

  const reportCount = (key, n) => {
    countsRef.current = { ...countsRef.current, [key]: n }
    onCounts?.(countsRef.current)
  }

  const clearPOIs  = (v) => { poiRef.current.forEach(e => v.entities.remove(e));           poiRef.current = [] }
  const clearRoads = (v) => { roadRef.current.forEach(p => v.scene.primitives.remove(p));  roadRef.current = [] }
  const clearAge   = (v) => { ageRef.current.forEach(e => v.entities.remove(e));           ageRef.current = [] }

  const debounce = (key, fn, delay = 800) => {
    clearTimeout(debounceRef.current[key])
    debounceRef.current[key] = setTimeout(fn, delay)
  }

  // POI layer
  useEffect(() => {
    if (!viewer) return
    if (!activeLayers.includes('poi')) {
      clearPOIs(viewer)
      fetchedRef.current.poi = null
      if (countsRef.current.poi !== null) reportCount('poi', null)
      return
    }

    debounce('poi', () => {
      const bbox = getBbox(viewer)
      if (!bbox) return
      const key = JSON.stringify(roundBbox(bbox))
      if (fetchedRef.current.poi === key) return
      fetchedRef.current.poi = key
      clearPOIs(viewer)

      fetchPOIs(bbox).then((elements) => {
        let count = 0
        elements.forEach((el) => {
          const cat = getPOICategory(el)
          if (!cat) return
          count++
          const { token, label } = POI_BY_ID[cat]
          const color = cssVar(token)

          // Way-based POIs (e.g. park polygons) — draw filled footprint
          if (el.type === 'way' && el.geometry && el.geometry.length >= 3) {
            const positions = el.geometry.map(({ lat, lon }) =>
              Cesium.Cartesian3.fromDegrees(lon, lat)
            )
            const entity = viewer.entities.add({
              polygon: {
                hierarchy: new Cesium.PolygonHierarchy(positions),
                material: Cesium.Color.fromCssColorString(color).withAlpha(0.35),
                classificationType: Cesium.ClassificationType.BOTH,
              },
            })
            poiRef.current.push(entity)
            return
          }

          // Node-based POIs — draw ground circle + floating label
          const lat = el.lat ?? el.center?.lat
          const lon = el.lon ?? el.center?.lon
          if (!lat || !lon) return

          // Small ground disc marks the exact location under the pin
          const circle = viewer.entities.add({
            position: Cesium.Cartesian3.fromDegrees(lon, lat),
            ellipse: {
              semiMinorAxis: 10,
              semiMajorAxis: 10,
              material: Cesium.Color.fromCssColorString(color).withAlpha(0.55),
              classificationType: Cesium.ClassificationType.BOTH,
            },
          })
          poiRef.current.push(circle)

          const pin = viewer.entities.add({
            position: Cesium.Cartesian3.fromDegrees(lon, lat, 25),
            billboard: {
              image: makePinCanvas(cat, color),
              width: 28,
              height: 36,
              verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
              heightReference: Cesium.HeightReference.RELATIVE_TO_GROUND,
              disableDepthTestDistance: Number.POSITIVE_INFINITY,
              scaleByDistance: new Cesium.NearFarScalar(100, 1.1, 2000, 0.45),
            },
            label: {
              text: el.tags?.name || label,
              font: '500 11px Geist, system-ui, sans-serif',
              fillColor: Cesium.Color.fromCssColorString(cssVar('--ts-text')),
              outlineColor: Cesium.Color.fromCssColorString('#0c0d0f'),
              outlineWidth: 3,
              style: Cesium.LabelStyle.FILL_AND_OUTLINE,
              verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
              pixelOffset: new Cesium.Cartesian2(0, -40),
              heightReference: Cesium.HeightReference.RELATIVE_TO_GROUND,
              distanceDisplayCondition: new Cesium.DistanceDisplayCondition(0, 600),
              disableDepthTestDistance: Number.POSITIVE_INFINITY,
            },
          })
          poiRef.current.push(pin)
        })
        reportCount('poi', count)
      }).catch(console.error)
    })
  }, [viewer, activeLayers.includes('poi'), cameraPos?.lat, cameraPos?.lng])

  // Road layer
  useEffect(() => {
    if (!viewer) return
    if (!activeLayers.includes('roads')) {
      clearRoads(viewer)
      fetchedRef.current.road = null
      if (countsRef.current.roads !== null) reportCount('roads', null)
      return
    }

    debounce('roads', () => {
      const bbox = getBbox(viewer)
      if (!bbox) return
      const key = JSON.stringify(roundBbox(bbox))
      if (fetchedRef.current.road === key) return
      fetchedRef.current.road = key
      clearRoads(viewer)

      fetchRoads(bbox).then((elements) => {
        reportCount('roads', elements.length)
        // One ground-clamped primitive: follows terrain (Riyadh sits ~600 m up)
        const lines = []
        elements.forEach((el) => {
          if (!el.geometry || el.geometry.length < 2) return
          const road = ROAD_BY_ID[el.tags?.highway] ?? ROAD_BY_ID.residential
          lines.push({
            coords: el.geometry.map(({ lat, lon }) => [lon, lat]),
            color: Cesium.Color.fromCssColorString(cssVar(road.token)).withAlpha(0.9),
            width: road.width,
          })
        })
        const prim = groundLines(lines)
        if (prim) {
          viewer.scene.primitives.add(prim)
          roadRef.current.push(prim)
        }
      }).catch(console.error)
    })
  }, [viewer, activeLayers.includes('roads'), cameraPos?.lat, cameraPos?.lng])

  // Building age layer — footprint polygons
  useEffect(() => {
    if (!viewer) return
    if (!activeLayers.includes('age')) {
      clearAge(viewer)
      fetchedRef.current.age = null
      if (countsRef.current.age !== null) reportCount('age', null)
      return
    }

    debounce('age', () => {
      const bbox = getBbox(viewer)
      if (!bbox) return
      const key = JSON.stringify(roundBbox(bbox))
      if (fetchedRef.current.age === key) return
      fetchedRef.current.age = key
      clearAge(viewer)

      fetchBuildingAges(bbox).then((elements) => {
        let count = 0
        elements.forEach((el) => {
          const era = ageClass(el.tags?.start_date)
          if (!era || !el.geometry || el.geometry.length < 3) return
          count++
          const color = cssVar(era.token)

          const positions = el.geometry.map(({ lat, lon }) =>
            Cesium.Cartesian3.fromDegrees(lon, lat)
          )

          const entity = viewer.entities.add({
            polygon: {
              hierarchy: new Cesium.PolygonHierarchy(positions),
              material: Cesium.Color.fromCssColorString(color).withAlpha(0.7),
              classificationType: Cesium.ClassificationType.BOTH,
            },
          })
          ageRef.current.push(entity)
        })
        reportCount('age', count)
      }).catch(console.error)
    })
  }, [viewer, activeLayers.includes('age'), cameraPos?.lat, cameraPos?.lng])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      Object.values(debounceRef.current).forEach(clearTimeout)
      if (!viewer) return
      clearPOIs(viewer)
      clearRoads(viewer)
      clearAge(viewer)
    }
  }, [viewer])

  return null
}

export default OsmLayers