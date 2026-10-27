import { sunPosition, cityTime, studyDay } from './sun'
import { pointInPolygon } from './geo'

const rad = Math.PI / 180

/**
 * Sun samples across the year: equinox (weighted ×2 for both), solstices, hourly.
 * Each sample carries a weight ∝ sin(elevation), a proxy for irradiance on a flat roof.
 */
export const annualSunSamples = (city) => {
  const days = [['mar', 2], ['jun', 1], ['dec', 1]]
  const samples = []
  for (const [key, dayWeight] of days) {
    const day = studyDay(key)
    for (let h = 6.5; h <= 18.5; h += 1) {
      const s = sunPosition(cityTime(day, h, city.tz), city.lat, city.lng)
      if (s.elevation < 5) continue
      samples.push({ ...s, weight: Math.sin(s.elevation * rad) * dayWeight })
    }
  }
  return samples
}

/**
 * Is a point at height z shaded by any building, for one sun position?
 * Marches from the point toward the sun; blocked when a footprint under the ray
 * rises above the ray. `grid` indexes buildings by their local bounds.
 */
export const isShaded = ([x, y], z, sun, grid, maxHeight, selfId, step = 4) => {
  const tanE = Math.tan(sun.elevation * rad)
  const reach = Math.min((maxHeight - z) / tanE, 600)
  if (reach <= 0) return false
  const ax = Math.sin(sun.azimuth * rad)
  const ay = Math.cos(sun.azimuth * rad)
  for (let s = step; s <= reach; s += step) {
    const px = x + ax * s
    const py = y + ay * s
    const rayZ = z + s * tanE
    for (const b of grid.at([px, py])) {
      if (b.id === selfId || b.height <= rayZ) continue
      if (px < b.bounds.minX || px > b.bounds.maxX || py < b.bounds.minY || py > b.bounds.maxY) continue
      if (pointInPolygon([px, py], b.ring)) return true
    }
  }
  return false
}

export const yieldToUI = () => new Promise((r) => setTimeout(r, 0))
