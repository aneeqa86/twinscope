import { bounds } from './geo'

/** Uniform-grid spatial index of items with local-metre bounds. */
export const makeGrid = (cell = 60) => {
  const cells = new Map()
  const key = (cx, cy) => `${cx},${cy}`
  return {
    insert(item, b) {
      for (let cx = Math.floor(b.minX / cell); cx <= Math.floor(b.maxX / cell); cx++) {
        for (let cy = Math.floor(b.minY / cell); cy <= Math.floor(b.maxY / cell); cy++) {
          const k = key(cx, cy)
          if (!cells.has(k)) cells.set(k, [])
          cells.get(k).push(item)
        }
      }
    },
    /** Items whose cells touch the point. */
    at([x, y]) {
      return cells.get(key(Math.floor(x / cell), Math.floor(y / cell))) ?? []
    },
    /** Items whose cells touch the box (deduplicated). */
    near(b) {
      const out = new Set()
      for (let cx = Math.floor(b.minX / cell); cx <= Math.floor(b.maxX / cell); cx++) {
        for (let cy = Math.floor(b.minY / cell); cy <= Math.floor(b.maxY / cell); cy++) {
          for (const it of cells.get(key(cx, cy)) ?? []) out.add(it)
        }
      }
      return [...out]
    },
  }
}

/** Index shadow polygons so point-in-shadow tests only check nearby ones. */
export const indexPolygons = (polys, cell = 40) => {
  const grid = makeGrid(cell)
  polys.forEach((ring) => ring && grid.insert(ring, bounds(ring)))
  return grid
}
