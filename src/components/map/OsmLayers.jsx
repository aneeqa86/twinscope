import { useEffect, useRef } from 'react'
import * as Cesium from 'cesium'
import { fetchPOIs, fetchRoads, fetchBuildingAges } from '@/services/overpassService'

const POI_CATEGORIES = {
  hospital:   { color: '#ef4444', label: 'Hospital',   emoji: '🏥' },
  school:     { color: '#eab308', label: 'School',     emoji: '🏫' },
  mosque:     { color: '#10b981', label: 'Mosque',     emoji: '🕌' },
  metro:      { color: '#06b6d4', label: 'Metro',      emoji: '🚇' },
  mall:       { color: '#a855f7', label: 'Mall',       emoji: '🛍️' },
  park:       { color: '#22c55e', label: 'Park',       emoji: '🌳' },
  hotel:      { color: '#3b82f6', label: 'Hotel',      emoji: '🏨' },
  restaurant: { color: '#f97316', label: 'Restaurant', emoji: '🍽️' },
}

const ROAD_COLORS = {
  motorway:    '#ef4444',
  trunk:       '#f97316',
  primary:     '#eab308',
  secondary:   '#06b6d4',
  residential: '#475569',
}

const AGE_COLORS = [
  { before: 1970, color: '#ef4444' },
  { before: 1980, color: '#f97316' },
  { before: 1990, color: '#eab308' },
  { before: 2000, color: '#10b981' },
  { before: 2010, color: '#06b6d4' },
  { before: 2020, color: '#3b82f6' },
  { before: 9999, color: '#a855f7' },
]

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

const getAgeColor = (startDate) => {
  if (!startDate) return null
  const year = parseInt(startDate.toString().slice(0, 4))
  if (isNaN(year)) return null
  for (const entry of AGE_COLORS) {
    if (year < entry.before) return entry.color
  }
  return AGE_COLORS[AGE_COLORS.length - 1].color
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

const makePinCanvas = (emoji, color) => {
  const canvas = document.createElement('canvas')
  canvas.width = 36
  canvas.height = 36
  const ctx = canvas.getContext('2d')
  ctx.beginPath()
  ctx.arc(18, 18, 16, 0, Math.PI * 2)
  ctx.fillStyle = color + 'cc'
  ctx.fill()
  ctx.strokeStyle = color
  ctx.lineWidth = 2
  ctx.stroke()
  ctx.font = '18px serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(emoji, 18, 18)
  return canvas
}

const OsmLayers = ({ viewer, activeLayers, cameraPos }) => {
  const poiRef      = useRef([])
  const roadRef     = useRef([])
  const ageRef      = useRef([])
  const fetchedRef  = useRef({ poi: null, road: null, age: null })
  const debounceRef = useRef({})

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
        elements.forEach((el) => {
          const cat = getPOICategory(el)
          if (!cat) return
          const { color, emoji, label } = POI_CATEGORIES[cat]

          // Way-based POIs (e.g. park polygons) — draw filled footprint
          if (el.type === 'way' && el.geometry && el.geometry.length >= 3) {
            const positions = el.geometry.map(({ lat, lon }) =>
              Cesium.Cartesian3.fromDegrees(lon, lat)
            )
            const entity = viewer.entities.add({
              polygon: {
                hierarchy: new Cesium.PolygonHierarchy(positions),
                material: Cesium.Color.fromCssColorString(color).withAlpha(0.5),
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

          // Ground circle
          const circle = viewer.entities.add({
            position: Cesium.Cartesian3.fromDegrees(lon, lat),
            ellipse: {
              semiMinorAxis: 18,
              semiMajorAxis: 18,
              material: Cesium.Color.fromCssColorString(color).withAlpha(0.75),
              classificationType: Cesium.ClassificationType.BOTH,
            },
          })
          poiRef.current.push(circle)

          // Floating emoji billboard above circle
          const pin = viewer.entities.add({
            position: Cesium.Cartesian3.fromDegrees(lon, lat, 25),
            billboard: {
              image: makePinCanvas(emoji, color),
              width: 28,
              height: 28,
              verticalOrigin: Cesium.VerticalOrigin.CENTER,
              disableDepthTestDistance: Number.POSITIVE_INFINITY,
              scaleByDistance: new Cesium.NearFarScalar(100, 1.2, 2000, 0.3),
            },
            label: {
              text: el.tags?.name || label,
              font: '11px sans-serif',
              fillColor: Cesium.Color.WHITE,
              outlineColor: Cesium.Color.BLACK,
              outlineWidth: 2,
              style: Cesium.LabelStyle.FILL_AND_OUTLINE,
              pixelOffset: new Cesium.Cartesian2(0, -22),
              distanceDisplayCondition: new Cesium.DistanceDisplayCondition(0, 600),
              disableDepthTestDistance: Number.POSITIVE_INFINITY,
            },
          })
          poiRef.current.push(pin)
        })
      }).catch(console.error)
    })
  }, [viewer, activeLayers.includes('poi'), cameraPos?.lat, cameraPos?.lng])

  // Road layer
  useEffect(() => {
    if (!viewer) return
    if (!activeLayers.includes('roads')) {
      clearRoads(viewer)
      fetchedRef.current.road = null
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
        elements.forEach((el) => {
          if (!el.geometry) return
          const highway = el.tags?.highway
          const color = ROAD_COLORS[highway] ?? ROAD_COLORS.residential
          const positions = el.geometry.map(({ lat, lon }) =>
            Cesium.Cartesian3.fromDegrees(lon, lat, 3)
          )
          if (positions.length < 2) return

          const polylines = new Cesium.PolylineCollection()
          polylines.add({
            positions,
            width: highway === 'motorway' || highway === 'trunk' ? 4 : 2,
            material: Cesium.Material.fromType('Color', {
              color: Cesium.Color.fromCssColorString(color).withAlpha(0.85),
            }),
          })
          viewer.scene.primitives.add(polylines)
          roadRef.current.push(polylines)
        })
      }).catch(console.error)
    })
  }, [viewer, activeLayers.includes('roads'), cameraPos?.lat, cameraPos?.lng])

  // Building age layer — footprint polygons
  useEffect(() => {
    if (!viewer) return
    if (!activeLayers.includes('age')) {
      clearAge(viewer)
      fetchedRef.current.age = null
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
        elements.forEach((el) => {
          const startDate = el.tags?.start_date
          const color = getAgeColor(startDate)
          if (!color || !el.geometry || el.geometry.length < 3) return

          const positions = el.geometry.map(({ lat, lon }) =>
            Cesium.Cartesian3.fromDegrees(lon, lat)
          )

          const entity = viewer.entities.add({
            polygon: {
              hierarchy: new Cesium.PolygonHierarchy(positions),
              material: Cesium.Color.fromCssColorString(color).withAlpha(0.6),
              classificationType: Cesium.ClassificationType.BOTH,
            },
          })
          ageRef.current.push(entity)
        })
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