import { makeProjection, openRing, polygonArea, centroid, bounds } from './geo'

export const FLOOR_HEIGHT = 3.5
const ASSUMED_FLOORS = 2

const parseMetres = (v) => {
  if (v === undefined || v === null) return NaN
  const n = parseFloat(String(v).replace(',', '.'))
  return String(v).includes('ft') ? n * 0.3048 : n
}

/**
 * OSM building ways → analysis-ready buildings in local metres.
 * Height comes from the height tag, else floors × 3.5 m, else an assumed 2 floors,
 * and each building records which, so reports can say how much was assumed.
 */
export const prepareBuildings = (elements, centre) => {
  const proj = makeProjection(centre.lng, centre.lat)
  const out = []
  for (const el of elements) {
    if (el.type !== 'way' || !el.geometry || el.geometry.length < 4) continue
    const ll = openRing(el.geometry.map((g) => [g.lon, g.lat]))
    if (ll.length < 3) continue
    const ring = ll.map(([lng, lat]) => proj.toXY(lng, lat))
    const t = el.tags ?? {}
    let height = parseMetres(t.height)
    let heightSource = 'tag'
    if (!(height > 0)) {
      const levels = parseFloat(t['building:levels'])
      if (levels > 0) {
        height = levels * FLOOR_HEIGHT
        heightSource = 'levels'
      } else {
        height = ASSUMED_FLOORS * FLOOR_HEIGHT
        heightSource = 'assumed'
      }
    }
    out.push({
      id: el.id,
      name: t.name ?? t['name:en'] ?? null,
      use: t.building && t.building !== 'yes' ? t.building : null,
      ll,
      ring,
      height,
      heightSource,
      area: polygonArea(ring),
      centroid: centroid(ring),
      bounds: bounds(ring),
    })
  }
  return { buildings: out, proj }
}

export const heightCoverage = (buildings) => {
  const n = buildings.length || 1
  const known = buildings.filter((b) => b.heightSource !== 'assumed').length
  return Math.round((known / n) * 100)
}
