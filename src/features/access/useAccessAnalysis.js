import { useEffect, useRef, useState } from 'react'
import * as Cesium from 'cesium'
import { useAreaOfInterest } from '@/hooks/useAreaOfInterest'
import { fetchWalkNetwork, fetchEverydayServices } from '@/services/overpassService'
import { buildGraph, nearestNode, shortestDistances } from '@/analysis/network'
import { makeLayer, groundLines, color, aoiOutline, squareBbox, pickLngLat } from '@/components/map/draw'
import { ACCESS_CATEGORIES, ACCESS_BANDS, WALK_M_PER_MIN, categorise } from './categories'

const LIMIT_M = 15 * WALK_M_PER_MIN // 1,200 m
const SNAP_M = 150
const COVERAGE_HALF = 700
const COVERAGE_MARGIN = 800 // services just outside the area still serve it

const bandFor = (metres) => ACCESS_BANDS.findIndex((b) => metres / WALK_M_PER_MIN <= b.maxMin)

const servicePoints = (elements) =>
  elements
    .map((el) => ({
      id: `${el.type}/${el.id}`,
      name: el.tags?.name ?? el.tags?.['name:en'] ?? null,
      lat: el.lat ?? el.center?.lat,
      lng: el.lon ?? el.center?.lon,
      cats: categorise(el.tags),
    }))
    .filter((s) => s.lat && s.lng && s.cats.length)

// Small cache so switching category or re-clicking nearby doesn't refetch
const cache = new Map()
const loadArea = async (bbox) => {
  const key = Object.values(bbox).map((v) => v.toFixed(3)).join(',')
  if (cache.has(key)) return cache.get(key)
  const [ways, services] = await Promise.all([fetchWalkNetwork(bbox), fetchEverydayServices(bbox)])
  const value = { graph: buildGraph(ways), services: servicePoints(services) }
  cache.clear()
  cache.set(key, value)
  return value
}

const drawSegments = (layer, graph, dist, inBbox) => {
  const byBand = ACCESS_BANDS.map(() => [])
  for (const seg of graph.segments) {
    const a = graph.nodes.get(seg.a)
    const b = graph.nodes.get(seg.b)
    if (inBbox && !inBbox(a) && !inBbox(b)) continue
    const da = dist.get(seg.a) ?? Infinity
    const db = dist.get(seg.b) ?? Infinity
    const band = bandFor(Math.max(da, db))
    if (band < 0) continue
    byBand[band].push({ coords: [[a.lng, a.lat], [b.lng, b.lat]], len: seg.len })
  }
  const lines = []
  byBand.forEach((segs, i) => {
    const c = color(ACCESS_BANDS[i].token, i === ACCESS_BANDS.length - 1 ? 0.7 : 0.95)
    segs.forEach(({ coords }) => lines.push({ coords, color: c, width: i === ACCESS_BANDS.length - 1 ? 2 : 3.5 }))
  })
  layer.primitive(groundLines(lines))
  return byBand
}

/**
 * 15-minute city analysis on the OSM walking network.
 * mode 'origin': click a start point, see what's reachable in 5/10/15 minutes.
 * mode 'coverage': colour every street by walking time to the nearest service of a type.
 */
export function useAccessAnalysis(viewer, active, mode, category) {
  const [state, setState] = useState({ status: 'idle' })
  const [origin, setOrigin] = useState(null)
  const layerRef = useRef(null)
  const runRef = useRef(0)
  const aoi = useAreaOfInterest(viewer, active && mode === 'coverage', COVERAGE_HALF, 5)

  useEffect(() => {
    if (!viewer) return
    layerRef.current = makeLayer(viewer)
    return () => layerRef.current?.clear()
  }, [viewer])

  useEffect(() => {
    runRef.current++
    layerRef.current?.clear()
    setState({ status: 'idle' })
    if (!active) setOrigin(null)
  }, [active, mode])

  // Origin mode: clicks set the start point
  useEffect(() => {
    if (!viewer || !active || mode !== 'origin') return
    const handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas)
    handler.setInputAction((click) => {
      const ll = pickLngLat(viewer, click.position)
      if (ll) setOrigin(ll)
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK)
    return () => handler.destroy()
  }, [viewer, active, mode])

  // Origin analysis
  useEffect(() => {
    if (!viewer || !active || mode !== 'origin' || !origin) return
    const run = ++runRef.current
    const stale = () => run !== runRef.current
    const layer = layerRef.current
    layer.clear()
    layer.entity({
      position: Cesium.Cartesian3.fromDegrees(origin.lng, origin.lat),
      point: {
        pixelSize: 14,
        color: color('--ts-accent'),
        outlineColor: color('#0c0d0f'),
        outlineWidth: 3,
        heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
        disableDepthTestDistance: Number.POSITIVE_INFINITY,
      },
    })
    setState({ status: 'loading', step: 'Loading streets and services within 1.5 km' })

    loadArea(squareBbox(origin, 1500))
      .then(({ graph, services }) => {
        if (stale()) return
        const start = nearestNode(graph, origin.lng, origin.lat, 250)
        if (!start) {
          setState({ status: 'error', error: 'No walkable street within 250 m of that point. Try a spot on or near a street.' })
          return
        }
        const dist = shortestDistances(graph, [{ id: start.node.id, cost: start.dist }], LIMIT_M + 50)
        drawSegments(layer, graph, dist)

        const perCat = Object.fromEntries(ACCESS_CATEGORIES.map((c) => [c.id, { count: 0, nearest: Infinity, nearestName: null }]))
        const reached = []
        for (const s of services) {
          const snap = nearestNode(graph, s.lng, s.lat, SNAP_M)
          if (!snap) continue
          const d = (dist.get(snap.node.id) ?? Infinity) + snap.dist
          if (d > LIMIT_M) continue
          reached.push(s)
          for (const c of s.cats) {
            const pc = perCat[c]
            pc.count++
            if (d < pc.nearest) {
              pc.nearest = d
              pc.nearestName = s.name
            }
          }
        }
        reached.forEach((s) => {
          const cat = ACCESS_CATEGORIES.find((c) => c.id === s.cats[0])
          layer.entity({
            position: Cesium.Cartesian3.fromDegrees(s.lng, s.lat),
            point: {
              pixelSize: 8,
              color: color(cat.token),
              outlineColor: color('#0c0d0f'),
              outlineWidth: 1.5,
              heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
              disableDepthTestDistance: Number.POSITIVE_INFINITY,
            },
          })
        })

        const categories = ACCESS_CATEGORIES.map((c) => ({
          ...c,
          count: perCat[c.id].count,
          minutes: perCat[c.id].nearest === Infinity ? null : perCat[c.id].nearest / WALK_M_PER_MIN,
          nearestName: perCat[c.id].nearestName,
        }))
        const score = categories.filter((c) => c.count > 0).length
        let reachLen = 0
        for (const seg of graph.segments) {
          if ((dist.get(seg.a) ?? Infinity) <= LIMIT_M && (dist.get(seg.b) ?? Infinity) <= LIMIT_M) reachLen += seg.len
        }
        setState({ status: 'ready', mode: 'origin', categories, score, reachKm: reachLen / 1000, snapM: start.dist })
      })
      .catch((err) => {
        if (stale()) return
        console.error('Access analysis failed:', err)
        setState({ status: 'error', error: 'Could not load the street network from OpenStreetMap.' })
      })
  }, [viewer, active, mode, origin])

  // Coverage analysis
  useEffect(() => {
    if (!viewer || !active || mode !== 'coverage') return
    if (!aoi) return
    const layer = layerRef.current
    if (aoi.tooFar) {
      layer.clear()
      setState({ status: 'too-far' })
      return
    }
    const run = ++runRef.current
    const stale = () => run !== runRef.current
    layer.clear()
    aoiOutline(layer, aoi.bbox)
    const cat = ACCESS_CATEGORIES.find((c) => c.id === category)
    setState({ status: 'loading', step: `Routing every street to the nearest ${cat.label.toLowerCase()}` })

    loadArea(squareBbox(aoi.centre, COVERAGE_HALF + COVERAGE_MARGIN))
      .then(({ graph, services }) => {
        if (stale()) return
        const sources = []
        for (const s of services) {
          if (!s.cats.includes(category)) continue
          const snap = nearestNode(graph, s.lng, s.lat, SNAP_M)
          if (snap) sources.push({ id: snap.node.id, cost: snap.dist })
        }
        const dist = sources.length ? shortestDistances(graph, sources, LIMIT_M * 1.5) : new Map()
        const { south, west, north, east } = aoi.bbox
        const inBbox = (n) => n.lat >= south && n.lat <= north && n.lng >= west && n.lng <= east
        const byBand = drawSegments(layer, graph, dist, inBbox)
        const lengths = byBand.map((segs) => segs.reduce((sum, s) => sum + s.len, 0))
        const total = lengths.reduce((a, b) => a + b, 0) || 1
        setState({
          status: 'ready',
          mode: 'coverage',
          category: cat,
          services: sources.length,
          bands: ACCESS_BANDS.map((b, i) => ({ ...b, km: lengths[i] / 1000, share: lengths[i] / total })),
          totalKm: total / 1000,
        })
      })
      .catch((err) => {
        if (stale()) return
        console.error('Coverage analysis failed:', err)
        setState({ status: 'error', error: 'Could not load the street network from OpenStreetMap.' })
      })
  }, [viewer, active, mode, category, aoi])

  return { ...state, origin }
}
