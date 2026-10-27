import { useEffect, useMemo, useRef, useState } from 'react'
import * as Cesium from 'cesium'
import { fetchWayFootprint, fetchCoastline } from '@/services/overpassService'
import { makeProjection, openRing, centroid, segmentIntersect, haversine } from '@/analysis/geo'
import { FLOOR_HEIGHT } from '@/analysis/buildings'
import { makeLayer, color, terrainHeight, squareBbox, pickWorld } from '@/components/map/draw'
import { VIEW_LANDMARKS } from '@/config/cities'

const EYE = 1.6
const SAMPLES = 64
const SEA_RAYS = 36           // every 10°
const SEA_RANGE = 6000        // m
const TARGET_FRACTIONS = [0.5, 0.6, 0.7, 0.8, 0.9, 1]
const MAX_ROWS = 60

/** Where a ray from the footprint centroid leaves the footprint, plus a step outside. */
const exitPoint = (ring, [cx, cy], [dx, dy]) => {
  let tMax = 0
  const far = [dx * 400, dy * 400]
  for (let i = 0; i < ring.length; i++) {
    const a = ring[i]
    const b = ring[(i + 1) % ring.length]
    const t = segmentIntersect([cx, cy], far, a, [b[0] - a[0], b[1] - a[1]])
    if (t !== null && t > tMax) tMax = t
  }
  const d = tMax * 400 + 3
  return [cx + dx * d, cy + dy * d]
}

/** Is the straight 3D line from eye to target above every sampled surface point? */
const lineClear = (eye, target, samples) => {
  const p = new Cesium.Cartesian3()
  for (const s of samples) {
    if (s.height === undefined) continue
    Cesium.Cartesian3.lerp(eye, target, s.t, p)
    const h = Cesium.Cartographic.fromCartesian(p).height
    if (s.height > h + 0.5) return false
  }
  return true
}

/** Per-floor view score from a clicked building toward the sea or a landmark. */
export function useViewScore(viewer, active, city, targetId, setStyleOverride) {
  const [building, setBuilding] = useState(null)
  const [state, setState] = useState({ status: 'idle' })
  const [floor, setFloor] = useState(null)
  const layerRef = useRef(null)
  const runRef = useRef(0)

  useEffect(() => {
    if (!viewer) return
    layerRef.current = makeLayer(viewer)
    return () => layerRef.current?.clear()
  }, [viewer])

  useEffect(() => {
    if (active) return
    runRef.current++
    layerRef.current?.clear()
    setBuilding(null)
    setState({ status: 'idle' })
    setStyleOverride(null)
  }, [active])

  // Click a building to analyse it
  useEffect(() => {
    if (!viewer || !active) return
    const handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas)
    handler.setInputAction((click) => {
      const picked = viewer.scene.pick(click.position)
      if (!Cesium.defined(picked) || !picked.getProperty) return
      const id = picked.getProperty('elementId')
      const height = Number(picked.getProperty('cesium#estimatedHeight')) || parseFloat(picked.getProperty('height')) || 0
      if (!id || height < FLOOR_HEIGHT) return
      const cart = pickWorld(viewer, click.position)
      const c = cart && Cesium.Cartographic.fromCartesian(cart)
      setBuilding({
        id,
        type: picked.getProperty('elementType'),
        name: picked.getProperty('name') ?? picked.getProperty('name:en') ?? 'Selected building',
        height,
        lng: c ? Cesium.Math.toDegrees(c.longitude) : null,
        lat: c ? Cesium.Math.toDegrees(c.latitude) : null,
      })
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK)
    return () => handler.destroy()
  }, [viewer, active])

  const target = useMemo(() => {
    if (targetId === 'sea') return { kind: 'sea', name: 'the sea' }
    const lm = (VIEW_LANDMARKS[city.name] ?? []).find((l) => l.name === targetId)
    return lm ? { kind: 'landmark', ...lm } : null
  }, [targetId, city])

  // Run the analysis
  useEffect(() => {
    if (!viewer || !active || !building || !target) return
    const run = ++runRef.current
    const stale = () => run !== runRef.current
    layerRef.current.clear()
    setStyleOverride({ classes: [{ ids: [building.id], color: getComputedStyle(document.documentElement).getPropertyValue('--ts-accent').trim() }] })
    setState({ status: 'loading', step: 'Reading the footprint' })

    ;(async () => {
      try {
        // Footprint gives the facade the views start from; fall back to the click point
        let ringLL = null
        if (building.type === 'way') {
          const geom = await fetchWayFootprint(building.id).catch(() => null)
          if (geom?.length >= 4) ringLL = openRing(geom.map((g) => [g.lon, g.lat]))
        }
        if (stale()) return
        const origin = ringLL
          ? (() => {
              const p = makeProjection(ringLL[0][0], ringLL[0][1])
              return p.toLngLat(...centroid(ringLL.map(([x, y]) => p.toXY(x, y))))
            })()
          : [building.lng, building.lat]
        if (origin[0] === null) throw new Error('No position for building')
        const proj = makeProjection(origin[0], origin[1])
        const ring = ringLL ? ringLL.map(([x, y]) => proj.toXY(x, y)) : [[-4, -4], [4, -4], [4, 4], [-4, 4]]
        const c0 = [0, 0]
        const ground = await terrainHeight(viewer, origin[0], origin[1])
        if (stale()) return

        // Rays: one toward a landmark, or a fan toward the coastline
        const rays = []
        if (target.kind === 'landmark') {
          const [tx, ty] = proj.toXY(target.lng, target.lat)
          const D = Math.hypot(tx, ty)
          if (D < 80) {
            setState({ status: 'error', error: `This is ${target.name} itself. Pick a different building.` })
            return
          }
          const dir = [tx / D, ty / D]
          const start = exitPoint(ring, c0, dir)
          const tGround = await terrainHeight(viewer, target.lng, target.lat)
          rays.push({
            dir,
            start,
            end: [tx - dir[0] * 60, ty - dir[1] * 60],
            targets: TARGET_FRACTIONS.map((f) => ({ x: tx, y: ty, h: tGround + target.height * f })),
            distance: D,
          })
        } else {
          setState({ status: 'loading', step: 'Finding the coastline' })
          const coast = await fetchCoastline(squareBbox({ lng: origin[0], lat: origin[1] }, SEA_RANGE))
          if (stale()) return
          const segs = []
          for (const w of coast) {
            const pts = (w.geometry ?? []).map((g) => proj.toXY(g.lon, g.lat))
            for (let i = 0; i < pts.length - 1; i++) segs.push([pts[i], pts[i + 1]])
          }
          if (!segs.length) {
            setState({ status: 'no-coast' })
            return
          }
          for (let k = 0; k < SEA_RAYS; k++) {
            const az = (k * 360) / SEA_RAYS
            const dir = [Math.sin((az * Math.PI) / 180), Math.cos((az * Math.PI) / 180)]
            const start = exitPoint(ring, c0, dir)
            let best = Infinity
            const r = [dir[0] * SEA_RANGE, dir[1] * SEA_RANGE]
            for (const [a, b] of segs) {
              const t = segmentIntersect(start, r, a, [b[0] - a[0], b[1] - a[1]])
              if (t !== null && t < best) best = t
            }
            if (best === Infinity) continue
            const d = best * SEA_RANGE + 80
            const sea = [start[0] + dir[0] * d, start[1] + dir[1] * d]
            rays.push({ az, dir, start, end: sea, targets: [{ x: sea[0], y: sea[1], h: null }], distance: d })
          }
          if (!rays.length) {
            setState({ status: 'no-sea-in-range' })
            return
          }
        }

        // One height query for every sample on every ray
        setState({ status: 'loading', step: 'Sampling terrain and buildings along each sightline' })
        const cartos = []
        rays.forEach((ray) => {
          ray.samples = []
          for (let i = 0; i <= SAMPLES; i++) {
            const f = i / SAMPLES
            const x = ray.start[0] + (ray.end[0] - ray.start[0]) * f
            const y = ray.start[1] + (ray.end[1] - ray.start[1]) * f
            const [lng, lat] = proj.toLngLat(x, y)
            const carto = Cesium.Cartographic.fromDegrees(lng, lat)
            cartos.push(carto)
            ray.samples.push({ carto, x, y })
          }
        })
        let sampled
        try {
          sampled = await viewer.scene.sampleHeightMostDetailed(cartos)
        } catch {
          sampled = await Cesium.sampleTerrainMostDetailed(viewer.terrainProvider, cartos)
        }
        if (stale()) return
        let idx = 0
        rays.forEach((ray) => {
          ray.samples.forEach((s) => {
            s.height = sampled[idx++]?.height
          })
          // Sea surface height from the last sample (beyond the coastline)
          if (ray.targets[0].h === null) ray.targets[0].h = (ray.samples[ray.samples.length - 1].height ?? 0) + 1
        })

        // Score each floor
        const floors = Math.max(1, Math.round(building.height / FLOOR_HEIGHT))
        const stepF = Math.max(1, Math.ceil(floors / MAX_ROWS))
        const eyeLL = (ray) => proj.toLngLat(...ray.start)
        const rows = []
        for (let f = 1; f <= floors; f += stepF) {
          const eyeH = ground + (f - 1) * FLOOR_HEIGHT + EYE
          const visible = rays.map((ray) => {
            const [elng, elat] = eyeLL(ray)
            const eye = Cesium.Cartesian3.fromDegrees(elng, elat, eyeH)
            const D = Math.hypot(ray.end[0] - ray.start[0], ray.end[1] - ray.start[1]) || 1
            return ray.targets.map((tg) => {
              const [tlng, tlat] = proj.toLngLat(tg.x, tg.y)
              const tgt = Cesium.Cartesian3.fromDegrees(tlng, tlat, tg.h)
              const Dt = Math.hypot(tg.x - ray.start[0], tg.y - ray.start[1]) || 1
              // Sample positions as fractions of the eye→target line
              const samples = ray.samples.map((s, i) => ({ t: ((i / SAMPLES) * D) / Dt, height: s.height }))
              return lineClear(eye, tgt, samples)
            })
          })
          const score =
            target.kind === 'landmark'
              ? visible[0].filter(Boolean).length / TARGET_FRACTIONS.length
              : visible.filter((v) => v[0]).length / SEA_RAYS
          rows.push({ floor: f, eyeH, score, visible })
        }

        const firstAny = rows.find((r) => r.score > 0)?.floor ?? null
        const firstFull = target.kind === 'landmark' ? rows.find((r) => r.score === 1)?.floor ?? null : null
        const best = rows.reduce((a, b) => (b.score > a.score ? b : a), rows[0])
        setFloor(best.floor)
        setState({
          status: 'ready',
          target,
          rays,
          rows,
          firstAny,
          firstFull,
          best,
          floors,
          proj,
          distanceKm: target.kind === 'landmark' ? rays[0].distance / 1000 : null,
          name: building.name,
          height: building.height,
          originLL: origin,
          seaDirections: target.kind === 'sea' ? rays.length : null,
        })
      } catch (err) {
        if (stale()) return
        console.error('View analysis failed:', err)
        setState({ status: 'error', error: 'Could not complete the view analysis for this building.' })
      }
    })()
  }, [viewer, active, building, target])

  // Draw the sightlines for the chosen floor
  useEffect(() => {
    const layer = layerRef.current
    if (!layer || state.status !== 'ready' || floor === null) return
    layer.clear()
    const row = state.rows.reduce((a, b) => (Math.abs(b.floor - floor) < Math.abs(a.floor - floor) ? b : a), state.rows[0])
    const ok = color('--ts-ok', 0.9)
    const bad = color('--ts-bad', 0.45)
    state.rays.forEach((ray, ri) => {
      const [elng, elat] = state.proj.toLngLat(...ray.start)
      // Landmark: draw to the top target; sea: to the sea point
      const tg = ray.targets[ray.targets.length - 1]
      const [tlng, tlat] = state.proj.toLngLat(tg.x, tg.y)
      const seen = state.target.kind === 'landmark' ? row.visible[0].some(Boolean) : row.visible[ri][0]
      layer.entity({
        polyline: {
          positions: [Cesium.Cartesian3.fromDegrees(elng, elat, row.eyeH), Cesium.Cartesian3.fromDegrees(tlng, tlat, tg.h)],
          width: seen ? 2.5 : 1.2,
          material: seen ? ok : bad,
          arcType: Cesium.ArcType.NONE,
        },
      })
    })
    const [olng, olat] = state.originLL
    layer.entity({
      position: Cesium.Cartesian3.fromDegrees(olng, olat, row.eyeH),
      point: { pixelSize: 9, color: color('--ts-accent'), outlineColor: color('#0c0d0f'), outlineWidth: 2, disableDepthTestDistance: Number.POSITIVE_INFINITY },
    })
  }, [state, floor])

  const distanceTo = (lm) =>
    building?.lng ? haversine(building.lng, building.lat, lm.lng, lm.lat) / 1000 : null

  return { ...state, building, floor, setFloor, distanceTo }
}
