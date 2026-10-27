// Planar geometry on a local tangent plane. Over the few kilometres an analysis
// covers, an equirectangular projection around the area's centre is accurate to
// well under a metre, which is all the analyses below need.

const M_PER_DEG_LAT = 110540
const R_EARTH = 6371008.8

/** Projector between lon/lat degrees and local metres (x east, y north). */
export const makeProjection = (lng0, lat0) => {
  const kx = 111320 * Math.cos((lat0 * Math.PI) / 180)
  return {
    lng0,
    lat0,
    toXY: (lng, lat) => [(lng - lng0) * kx, (lat - lat0) * M_PER_DEG_LAT],
    toLngLat: (x, y) => [lng0 + x / kx, lat0 + y / M_PER_DEG_LAT],
  }
}

export const haversine = (lng1, lat1, lng2, lat2) => {
  const toRad = Math.PI / 180
  const dLat = (lat2 - lat1) * toRad
  const dLng = (lng2 - lng1) * toRad
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * toRad) * Math.cos(lat2 * toRad) * Math.sin(dLng / 2) ** 2
  return 2 * R_EARTH * Math.asin(Math.sqrt(a))
}

/** Signed shoelace area; positive when counter-clockwise. Ring may or may not repeat its first point. */
export const signedArea = (ring) => {
  let a = 0
  for (let i = 0, n = ring.length; i < n; i++) {
    const [x1, y1] = ring[i]
    const [x2, y2] = ring[(i + 1) % n]
    a += x1 * y2 - x2 * y1
  }
  return a / 2
}

export const polygonArea = (ring) => Math.abs(signedArea(ring))

export const centroid = (ring) => {
  const a = signedArea(ring)
  if (Math.abs(a) < 1e-9) {
    const n = ring.length
    return ring.reduce(([sx, sy], [x, y]) => [sx + x / n, sy + y / n], [0, 0])
  }
  let cx = 0
  let cy = 0
  for (let i = 0, n = ring.length; i < n; i++) {
    const [x1, y1] = ring[i]
    const [x2, y2] = ring[(i + 1) % n]
    const f = x1 * y2 - x2 * y1
    cx += (x1 + x2) * f
    cy += (y1 + y2) * f
  }
  return [cx / (6 * a), cy / (6 * a)]
}

export const bounds = (ring) => {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
  for (const [x, y] of ring) {
    if (x < minX) minX = x
    if (y < minY) minY = y
    if (x > maxX) maxX = x
    if (y > maxY) maxY = y
  }
  return { minX, minY, maxX, maxY }
}

/** Ray-casting point-in-polygon. */
export const pointInPolygon = ([px, py], ring) => {
  let inside = false
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i]
    const [xj, yj] = ring[j]
    if ((yi > py) !== (yj > py) && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi) inside = !inside
  }
  return inside
}

/** Andrew's monotone chain convex hull, counter-clockwise. */
export const convexHull = (points) => {
  const pts = [...points].sort((a, b) => a[0] - b[0] || a[1] - b[1])
  if (pts.length < 3) return pts
  const cross = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0])
  const lower = []
  for (const p of pts) {
    while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], p) <= 0) lower.pop()
    lower.push(p)
  }
  const upper = []
  for (let i = pts.length - 1; i >= 0; i--) {
    const p = pts[i]
    while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], p) <= 0) upper.pop()
    upper.push(p)
  }
  upper.pop()
  lower.pop()
  return lower.concat(upper)
}

/** Intersection of segment p→p+r with segment q→q+s; returns t along the first, or null. */
export const segmentIntersect = (p, r, q, s) => {
  const rxs = r[0] * s[1] - r[1] * s[0]
  if (Math.abs(rxs) < 1e-12) return null
  const qp = [q[0] - p[0], q[1] - p[1]]
  const t = (qp[0] * s[1] - qp[1] * s[0]) / rxs
  const u = (qp[0] * r[1] - qp[1] * r[0]) / rxs
  return t >= 0 && t <= 1 && u >= 0 && u <= 1 ? t : null
}

/** Drop the closing duplicate point OSM rings carry. */
export const openRing = (ring) => {
  if (ring.length > 1) {
    const a = ring[0]
    const b = ring[ring.length - 1]
    if (a[0] === b[0] && a[1] === b[1]) return ring.slice(0, -1)
  }
  return ring
}
