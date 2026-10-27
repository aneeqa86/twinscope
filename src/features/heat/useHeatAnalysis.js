import { useEffect, useMemo, useRef, useState } from 'react'
import * as Cesium from 'cesium'
import { useAreaOfInterest } from '@/hooks/useAreaOfInterest'
import { fetchBuildingFootprints, fetchWalkNetwork } from '@/services/overpassService'
import { prepareBuildings, heightCoverage } from '@/analysis/buildings'
import { buildGraph } from '@/analysis/network'
import { prismShadow } from '@/analysis/shadow'
import { indexPolygons } from '@/analysis/grid'
import { pointInPolygon } from '@/analysis/geo'
import { sunPosition, cityTime, studyDay } from '@/analysis/sun'
import { makeLayer, groundLines, color, aoiOutline, squareBbox } from '@/components/map/draw'

export const SHADE_CLASSES = [
  { max: 0.25, token: '--ts-shade-sun',  label: 'Exposed (<25% shade)' },
  { max: 0.75, token: '--ts-shade-part', label: 'Partly shaded' },
  { max: 1.01, token: '--ts-shade-full', label: 'Shaded (>75%)' },
]

const HALF = 500
const SAMPLE_M = 8

const isoDay = (d) => d.toISOString().slice(0, 10)

/** MODIS acquisition date to show: last 15 August, or a few days ago for "recent". */
export const lstDate = (preset) => {
  const now = new Date()
  if (preset === 'recent') return isoDay(new Date(now.getTime() - 3 * 86400000))
  const year = now.getUTCMonth() > 7 || (now.getUTCMonth() === 7 && now.getUTCDate() > 20) ? now.getUTCFullYear() : now.getUTCFullYear() - 1
  return `${year}-08-15`
}

/** Satellite land-surface temperature plus street-level shade at a chosen hour. */
export function useHeatAnalysis(viewer, active, city, { hour, dayKey, lstOn, lstPreset }) {
  const aoi = useAreaOfInterest(viewer, active, HALF)
  const [data, setData] = useState({ status: 'idle' })
  const [lstStatus, setLstStatus] = useState('off')
  const layerRef = useRef(null)
  const runRef = useRef(0)

  useEffect(() => {
    if (!viewer) return
    layerRef.current = makeLayer(viewer)
    return () => layerRef.current?.clear()
  }, [viewer])

  // Land-surface temperature imagery (NASA GIBS, MODIS Terra daytime LST, ~1 km)
  useEffect(() => {
    if (!viewer || !active || !lstOn) {
      setLstStatus('off')
      return
    }
    const date = lstDate(lstPreset)
    const provider = new Cesium.WebMapTileServiceImageryProvider({
      url: 'https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/MODIS_Terra_Land_Surface_Temp_Day/default/{Time}/GoogleMapsCompatible_Level7/{TileMatrix}/{TileRow}/{TileCol}.png',
      layer: 'MODIS_Terra_Land_Surface_Temp_Day',
      style: 'default',
      format: 'image/png',
      tileMatrixSetID: 'GoogleMapsCompatible_Level7',
      maximumLevel: 7,
      dimensions: { Time: date },
      credit: new Cesium.Credit('Land surface temperature: NASA GIBS / MODIS Terra'),
    })
    let errors = 0
    const removeErr = provider.errorEvent.addEventListener(() => {
      errors++
      if (errors === 4) setLstStatus('error')
    })
    const layer = viewer.imageryLayers.addImageryProvider(provider)
    layer.alpha = 0.55
    setLstStatus(`on:${date}`)
    return () => {
      removeErr()
      if (!viewer.isDestroyed()) viewer.imageryLayers.remove(layer, true)
    }
  }, [viewer, active, lstOn, lstPreset])

  // Fetch buildings and streets for the area
  useEffect(() => {
    if (!active) {
      runRef.current++
      layerRef.current?.clear()
      setData({ status: 'idle' })
      return
    }
    if (!aoi) return
    if (aoi.tooFar) {
      layerRef.current?.clear()
      setData({ status: 'too-far' })
      return
    }
    const run = ++runRef.current
    setData({ status: 'loading', step: 'Loading buildings and walkable streets' })
    Promise.all([fetchBuildingFootprints(squareBbox(aoi.centre, HALF + 200)), fetchWalkNetwork(aoi.bbox)])
      .then(([elements, ways]) => {
        if (run !== runRef.current) return
        const { buildings, proj } = prepareBuildings(elements, aoi.centre)
        setData({ status: 'ready', aoi, buildings, proj, graph: buildGraph(ways) })
      })
      .catch((err) => {
        if (run !== runRef.current) return
        console.error('Heat analysis failed:', err)
        setData({ status: 'error', error: 'Could not load buildings and streets from OpenStreetMap.' })
      })
  }, [active, aoi])

  // Shade at the chosen hour: cheap enough to redo on every slider move
  const result = useMemo(() => {
    if (data.status !== 'ready') return null
    const { buildings, proj, graph, aoi: area } = data
    const day = studyDay(dayKey)
    const sun = sunPosition(cityTime(day, hour, city.tz), area.centre.lat, area.centre.lng)
    if (sun.elevation <= 0) return { sun, night: true }

    const shadows = buildings.map((b) => prismShadow(b.ring, b.height, sun)).filter(Boolean)
    // Footprints count as shade too: the street under an arcade or overhang is covered
    const grid = indexPolygons([...shadows, ...buildings.map((b) => b.ring)])
    const shaded = (p) => grid.at(p).some((poly) => pointInPolygon(p, poly))

    const segs = SHADE_CLASSES.map(() => [])
    const km = SHADE_CLASSES.map(() => 0)
    for (const seg of graph.segments) {
      const a = graph.nodes.get(seg.a)
      const b = graph.nodes.get(seg.b)
      const pa = proj.toXY(a.lng, a.lat)
      const pb = proj.toXY(b.lng, b.lat)
      const n = Math.max(1, Math.round(seg.len / SAMPLE_M))
      let inShade = 0
      for (let i = 0; i <= n; i++) {
        const t = i / n
        if (shaded([pa[0] + (pb[0] - pa[0]) * t, pa[1] + (pb[1] - pa[1]) * t])) inShade++
      }
      const share = inShade / (n + 1)
      const cls = SHADE_CLASSES.findIndex((c) => share < c.max)
      segs[cls].push([[a.lng, a.lat], [b.lng, b.lat]])
      km[cls] += seg.len / 1000
    }
    const total = km.reduce((x, y) => x + y, 0) || 1
    return {
      sun,
      segs,
      classes: SHADE_CLASSES.map((c, i) => ({ ...c, km: km[i], share: km[i] / total })),
      totalKm: total,
      buildings: buildings.length,
      heightKnown: heightCoverage(buildings),
    }
  }, [data, hour, dayKey, city])

  // Draw
  useEffect(() => {
    const layer = layerRef.current
    if (!layer) return
    layer.clear()
    if (data.status !== 'ready' || !result) return
    aoiOutline(layer, data.aoi.bbox)
    if (result.night) return
    const lines = []
    result.segs.forEach((segs, i) => {
      const c = color(SHADE_CLASSES[i].token, 0.95)
      segs.forEach((coords) => lines.push({ coords, color: c, width: 3.5 }))
    })
    layer.primitive(groundLines(lines))
  }, [data, result])

  return { ...data, result, lstStatus }
}
