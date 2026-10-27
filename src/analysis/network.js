import { haversine } from './geo'

/** Walkable street graph from Overpass ways (`out body geom`). */
export const buildGraph = (ways) => {
  const nodes = new Map() // id -> { lng, lat, edges: [{ to, len }] }
  const segments = []     // { a, b, len, wayId }
  for (const w of ways) {
    if (!w.nodes || !w.geometry || w.nodes.length !== w.geometry.length) continue
    for (let i = 0; i < w.nodes.length; i++) {
      const id = w.nodes[i]
      if (!nodes.has(id)) nodes.set(id, { id, lng: w.geometry[i].lon, lat: w.geometry[i].lat, edges: [] })
    }
    for (let i = 0; i < w.nodes.length - 1; i++) {
      const a = nodes.get(w.nodes[i])
      const b = nodes.get(w.nodes[i + 1])
      const len = haversine(a.lng, a.lat, b.lng, b.lat)
      a.edges.push({ to: b.id, len })
      b.edges.push({ to: a.id, len })
      segments.push({ a: a.id, b: b.id, len, wayId: w.id })
    }
  }
  // ~110 m buckets for nearest-node lookups
  const index = new Map()
  for (const n of nodes.values()) {
    const k = `${Math.floor(n.lat / CELL)},${Math.floor(n.lng / CELL)}`
    if (!index.has(k)) index.set(k, [])
    index.get(k).push(n)
  }
  return { nodes, segments, index }
}

const CELL = 0.001

/** Nearest graph node to a point, within maxDist metres (searches neighbouring buckets). */
export const nearestNode = (graph, lng, lat, maxDist = 200) => {
  const r = Math.ceil(maxDist / 100)
  const ci = Math.floor(lat / CELL)
  const cj = Math.floor(lng / CELL)
  let best = null
  let bestD = maxDist
  for (let di = -r; di <= r; di++) {
    for (let dj = -r; dj <= r; dj++) {
      for (const n of graph.index.get(`${ci + di},${cj + dj}`) ?? []) {
        const d = haversine(lng, lat, n.lng, n.lat)
        if (d < bestD) {
          bestD = d
          best = n
        }
      }
    }
  }
  return best ? { node: best, dist: bestD } : null
}

/** Multi-source Dijkstra; sources are [{ id, cost }]. Returns Map id -> metres. */
export const shortestDistances = (graph, sources, limit = Infinity) => {
  const dist = new Map()
  const heap = []
  const push = (id, d) => {
    heap.push([d, id])
    let i = heap.length - 1
    while (i > 0) {
      const p = (i - 1) >> 1
      if (heap[p][0] <= heap[i][0]) break
      ;[heap[p], heap[i]] = [heap[i], heap[p]]
      i = p
    }
  }
  const pop = () => {
    const top = heap[0]
    const last = heap.pop()
    if (heap.length) {
      heap[0] = last
      let i = 0
      for (;;) {
        const l = 2 * i + 1
        const r = l + 1
        let m = i
        if (l < heap.length && heap[l][0] < heap[m][0]) m = l
        if (r < heap.length && heap[r][0] < heap[m][0]) m = r
        if (m === i) break
        ;[heap[m], heap[i]] = [heap[i], heap[m]]
        i = m
      }
    }
    return top
  }

  for (const { id, cost } of sources) {
    if (!dist.has(id) || cost < dist.get(id)) {
      dist.set(id, cost)
      push(id, cost)
    }
  }
  while (heap.length) {
    const [d, id] = pop()
    if (d > dist.get(id) || d > limit) continue
    for (const e of graph.nodes.get(id).edges) {
      const nd = d + e.len
      if (nd < (dist.get(e.to) ?? Infinity)) {
        dist.set(e.to, nd)
        push(e.to, nd)
      }
    }
  }
  return dist
}
