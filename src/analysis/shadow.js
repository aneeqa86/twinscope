import { convexHull } from './geo'

/**
 * Ground shadow of a vertical prism (footprint ring in local metres, height in metres)
 * for a sun at elevation/azimuth degrees. Exact for convex footprints; for concave
 * ones the hull slightly over-states the shadow, which errs on the cautious side.
 */
export const prismShadow = (ring, height, sun) => {
  if (sun.elevation <= 0.5 || height <= 0) return null
  const length = Math.min(height / Math.tan((sun.elevation * Math.PI) / 180), 3000)
  const az = (sun.azimuth * Math.PI) / 180
  // Shadow falls away from the sun
  const dx = -Math.sin(az) * length
  const dy = -Math.cos(az) * length
  return convexHull([...ring, ...ring.map(([x, y]) => [x + dx, y + dy])])
}
