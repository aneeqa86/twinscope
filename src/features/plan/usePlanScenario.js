import { useEffect, useMemo, useRef, useState } from 'react'
import * as Cesium from 'cesium'
import { fetchBuildingFootprints } from '@/services/overpassService'
import { prepareBuildings, FLOOR_HEIGHT } from '@/analysis/buildings'
import { makeProjection, pointInPolygon, polygonArea } from '@/analysis/geo'
import { prismShadow } from '@/analysis/shadow'
import { sunPosition, cityTime, studyDay } from '@/analysis/sun'
import { makeLayer, groundPolygons, color, terrainHeight, squareBbox } from '@/components/map/draw'
import { cssVar } from '@/config/legends'

export const IMPACT_CLASSES = [
  { min: 1, token: '--ts-impact-1', label: '1–2 h' },
  { min: 3, token: '--ts-impact-2', label: '3–4 h' },
  { min: 5, token: '--ts-impact-3', label: '5 h +' },
]

// Example limits so the check has something to test against. They are not any
// city's actual regulation; the user edits them to match the plot's zoning.
export const DEFAULT_LIMITS = { maxHeight: 120, maxFar: 5, minSetback: 5 }

const pickLngLat = (viewer, position) => {
  const cart = viewer.scene.pickPosition(position) ?? viewer.camera.pickEllipsoid(position)
  if (!cart) return null
  const c = Cesium.Cartographic.fromCartesian(cart)
  return [Cesium.Math.toDegrees(c.longitude), Cesium.Math.toDegrees(c.latitude)]
}

const rectRing = ([x1, y1], [x2, y2]) => [
  [Math.min(x1, x2), Math.min(y1, y2)],
  [Math.max(x1, x2), Math.min(y1, y2)],
  [Math.max(x1, x2), Math.max(y1, y2)],
  [Math.min(x1, x2), Math.max(y1, y2)],
]

/** Proposed-building scenario: site, massing, zoning checks and shadow impact. */
export function usePlanScenario(viewer, active, city, params, setStyleOverride) {
  const { floors, setback, dayKey, limits } = params
  const [site, setSite] = useState(null)         // { a, b } lng/lat corners
  const [phase, setPhase] = useState('corner-1') // corner-1 | corner-2 | ready
  const [context, setContext] = useState(null)   // { ground, buildings, status }
  const layerRef = useRef(null)
  const previewRef = useRef(null)
  const cornerRef = useRef(null)
  const hoverRef = useRef(null)

  useEffect(() => {
    if (!viewer) return
    layerRef.current = makeLayer(viewer)
    return () => layerRef.current?.clear()
  }, [viewer])

  const reset = () => {
    setSite(null)
    setContext(null)
    setPhase('corner-1')
    cornerRef.current = null
  }

  // Leaving the tool clears everything
  useEffect(() => {
    if (!active) {
      reset()
      layerRef.current?.clear()
      setStyleOverride(null)
    }
  }, [active])

  // Site drawing: two clicks, with a live rubber-band rectangle after the first
  useEffect(() => {
    if (!viewer || !active || phase === 'ready') return
    const handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas)
    handler.setInputAction((click) => {
      const ll = pickLngLat(viewer, click.position)
      if (!ll) return
      if (!cornerRef.current) {
        cornerRef.current = ll
        hoverRef.current = ll
        previewRef.current = viewer.entities.add({
          polyline: {
            positions: new Cesium.CallbackProperty(() => {
              const [a, b] = [cornerRef.current, hoverRef.current]
              if (!a || !b) return []
              return Cesium.Cartesian3.fromDegreesArray([a[0], a[1], b[0], a[1], b[0], b[1], a[0], b[1], a[0], a[1]])
            }, false),
            clampToGround: true,
            width: 2,
            material: new Cesium.PolylineDashMaterialProperty({ color: color('--ts-accent'), dashLength: 12 }),
          },
        })
        setPhase('corner-2')
      } else {
        const a = cornerRef.current
        if (previewRef.current) viewer.entities.remove(previewRef.current)
        previewRef.current = null
        setSite({ a, b: ll })
        setPhase('ready')
      }
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK)
    handler.setInputAction((move) => {
      if (!cornerRef.current) return
      const ll = pickLngLat(viewer, move.endPosition)
      if (ll) hoverRef.current = ll
    }, Cesium.ScreenSpaceEventType.MOUSE_MOVE)
    return () => {
      handler.destroy()
      if (previewRef.current && !viewer.isDestroyed()) viewer.entities.remove(previewRef.current)
      previewRef.current = null
    }
  }, [viewer, active, phase])

  // Load site context once per site: ground height and surrounding buildings
  useEffect(() => {
    if (!viewer || !site) return
    let cancelled = false
    const centre = { lng: (site.a[0] + site.b[0]) / 2, lat: (site.a[1] + site.b[1]) / 2 }
    setContext({ status: 'loading', centre })
    Promise.all([terrainHeight(viewer, centre.lng, centre.lat), fetchBuildingFootprints(squareBbox(centre, 700))])
      .then(([ground, elements]) => {
        if (cancelled) return
        const { buildings } = prepareBuildings(elements, centre)
        setContext({ status: 'ready', centre, ground, buildings })
      })
      .catch((err) => {
        if (cancelled) return
        console.error('Site context failed:', err)
        setContext({ status: 'error', centre, ground: 0, buildings: [] })
      })
    return () => { cancelled = true }
  }, [viewer, site])

  // Massing, checks and shadow study
  const scenario = useMemo(() => {
    if (!site || !context?.centre) return null
    const proj = makeProjection(context.centre.lng, context.centre.lat)
    const siteRing = rectRing(proj.toXY(...site.a), proj.toXY(...site.b))
    const [minX, minY] = siteRing[0]
    const [maxX, maxY] = siteRing[2]
    const siteW = maxX - minX
    const siteD = maxY - minY
    const fw = siteW - 2 * setback
    const fd = siteD - 2 * setback
    const valid = fw >= 6 && fd >= 6
    const footprint = valid ? rectRing([minX + setback, minY + setback], [maxX - setback, maxY - setback]) : null
    const height = floors * FLOOR_HEIGHT
    const siteArea = siteW * siteD
    const footprintArea = valid ? polygonArea(footprint) : 0
    const gfa = footprintArea * floors
    const far = siteArea > 0 ? gfa / siteArea : 0

    const metrics = { siteArea, siteW, siteD, footprintArea, height, gfa, far, coverage: siteArea ? footprintArea / siteArea : 0 }
    const checks = [
      { id: 'height',  label: 'Height',     value: `${height.toFixed(0)} m`, limit: `≤ ${limits.maxHeight} m`, pass: height <= limits.maxHeight },
      { id: 'far',     label: 'Floor area ratio', value: far.toFixed(2), limit: `≤ ${limits.maxFar}`, pass: far <= limits.maxFar },
      { id: 'setback', label: 'Setback',    value: `${setback} m`, limit: `≥ ${limits.minSetback} m`, pass: setback >= limits.minSetback },
    ]

    // Hourly shadows for the study day
    const day = studyDay(dayKey)
    const shadows = []
    if (valid) {
      for (let h = 7; h <= 17; h++) {
        const sun = sunPosition(cityTime(day, h, city.tz), context.centre.lat, context.centre.lng)
        if (sun.elevation < 3) continue
        const poly = prismShadow(footprint, height, sun)
        if (poly) shadows.push({ hour: h, poly })
      }
    }

    // Neighbours: hours their centroid sits in the new building's shadow
    const onSite = []
    const affected = []
    for (const b of context.buildings ?? []) {
      if (pointInPolygon(b.centroid, siteRing)) {
        onSite.push(b.id)
        continue
      }
      let hours = 0
      for (const s of shadows) if (pointInPolygon(b.centroid, s.poly)) hours++
      if (hours > 0) affected.push({ id: b.id, name: b.name, use: b.use, hours, ll: b.ll })
    }
    affected.sort((x, y) => y.hours - x.hours)

    return { proj, siteRing, footprint, valid, metrics, checks, shadows, affected, onSite, day }
  }, [site, context, floors, setback, dayKey, limits, city])

  // Draw scenario
  useEffect(() => {
    const layer = layerRef.current
    if (!layer) return
    layer.clear()
    if (!scenario || !context) {
      setStyleOverride(null)
      return
    }
    const { proj, siteRing, footprint, valid, shadows, metrics } = scenario
    const toLL = (ring) => ring.map(([x, y]) => proj.toLngLat(x, y))
    const ground = context.ground ?? 0
    const accent = color('--ts-accent')

    layer.primitive(groundPolygons(shadows.map((s) => ({ ring: toLL(s.poly), color: color('#000000', 0.16) }))))

    const siteLL = toLL(siteRing)
    layer.entity({
      polyline: {
        positions: Cesium.Cartesian3.fromDegreesArray([...siteLL, siteLL[0]].flat()),
        clampToGround: true,
        width: 2,
        material: new Cesium.PolylineDashMaterialProperty({ color: color('--ts-text', 0.85), dashLength: 12 }),
      },
    })

    if (valid) {
      const fp = toLL(footprint)
      const top = ground + metrics.height
      layer.entity({
        polygon: {
          hierarchy: new Cesium.PolygonHierarchy(Cesium.Cartesian3.fromDegreesArray(fp.flat())),
          height: ground,
          extrudedHeight: top,
          material: accent.withAlpha(0.3),
        },
      })
      // Dashed edges: the model, not the surveyed city
      const dashed = new Cesium.PolylineDashMaterialProperty({ color: accent, dashLength: 10 })
      const edge = (pts) => layer.entity({ polyline: { positions: pts, width: 1.6, material: dashed, arcType: Cesium.ArcType.NONE } })
      const ring = (h) => Cesium.Cartesian3.fromDegreesArrayHeights([...fp, fp[0]].flatMap(([x, y]) => [x, y, h]))
      edge(ring(ground + 0.3))
      edge(ring(top))
      fp.forEach(([x, y]) => edge(Cesium.Cartesian3.fromDegreesArrayHeights([x, y, ground, x, y, top])))
      const [lx, ly] = fp[1]
      layer.entity({
        position: Cesium.Cartesian3.fromDegrees(lx, ly, top),
        label: {
          text: `${metrics.height.toFixed(0)} m · ${floors} floors`,
          font: '500 12px "Geist Mono", ui-monospace, monospace',
          fillColor: accent,
          showBackground: true,
          backgroundColor: color('#0c0d0f', 0.82),
          backgroundPadding: new Cesium.Cartesian2(6, 4),
          pixelOffset: new Cesium.Cartesian2(10, -10),
          horizontalOrigin: Cesium.HorizontalOrigin.LEFT,
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
        },
      })
    }

    setStyleOverride({
      classes: [
        ...IMPACT_CLASSES.map((c, i) => ({
          ids: scenario.affected
            .filter((a) => a.hours >= c.min && (i === IMPACT_CLASSES.length - 1 || a.hours < IMPACT_CLASSES[i + 1].min))
            .map((a) => a.id),
          color: cssVar(c.token),
        })),
        // Existing buildings inside the site are assumed cleared: show them as ghosts
        { ids: scenario.onSite, color: 'rgba(244,240,230,0.12)' },
      ].filter((c) => c.ids.length),
    })
  }, [scenario, context])

  return { phase, site, context, scenario, reset }
}
