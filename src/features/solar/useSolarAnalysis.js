import { useEffect, useRef, useState } from 'react'
import { useAreaOfInterest } from '@/hooks/useAreaOfInterest'
import { fetchBuildingFootprints } from '@/services/overpassService'
import { fetchAnnualGHI } from '@/services/solarService'
import { prepareBuildings, heightCoverage } from '@/analysis/buildings'
import { makeGrid } from '@/analysis/grid'
import { annualSunSamples, isShaded, yieldToUI } from '@/analysis/sunlight'
import { pointInPolygon } from '@/analysis/geo'
import { makeLayer, aoiOutline, squareBbox } from '@/components/map/draw'
import { cssVar } from '@/config/legends'

// Assumptions shown in the report
export const SOLAR_ASSUMPTIONS = {
  usableShare: 0.6,       // roof left after parapets, plant, access and setbacks
  efficiency: 0.2,        // modern mono-crystalline module
  performanceRatio: 0.8,  // inverter, wiring, soiling and heat losses
  minRoof: 30,            // m²; smaller roofs aren't worth a system
}

// MWh / year class breaks
export const SOLAR_CLASSES = [
  { max: 10,       token: '--ts-solar-1', label: '<10' },
  { max: 50,       token: '--ts-solar-2', label: '10–50' },
  { max: 150,      token: '--ts-solar-3', label: '50–150' },
  { max: 400,      token: '--ts-solar-4', label: '150–400' },
  { max: Infinity, token: '--ts-solar-5', label: '>400 MWh' },
]

const HALF = 450 // analysis square is 900 m across

const roofSamplePoints = (b) => {
  const [cx, cy] = b.centroid
  const step = Math.max(1, Math.floor(b.ring.length / 4))
  const pts = [[cx, cy]]
  for (let i = 0; i < b.ring.length && pts.length < 5; i += step) {
    const [vx, vy] = b.ring[i]
    const p = [cx + (vx - cx) * 0.6, cy + (vy - cy) * 0.6]
    if (pointInPolygon(p, b.ring)) pts.push(p)
  }
  return pts
}

/** Rooftop solar potential for every building in the area of interest. */
export function useSolarAnalysis(viewer, active, city, setStyleOverride) {
  const aoi = useAreaOfInterest(viewer, active, HALF)
  const [state, setState] = useState({ status: 'idle' })
  const runRef = useRef(0)
  const layerRef = useRef(null)

  useEffect(() => {
    if (!viewer) return
    layerRef.current = makeLayer(viewer)
    return () => layerRef.current?.clear()
  }, [viewer])

  useEffect(() => {
    if (!active) {
      layerRef.current?.clear()
      setStyleOverride(null)
      setState({ status: 'idle' })
      return
    }
    if (!aoi) return
    if (aoi.tooFar) {
      layerRef.current?.clear()
      setStyleOverride(null)
      setState({ status: 'too-far' })
      return
    }

    const run = ++runRef.current
    const stale = () => run !== runRef.current
    layerRef.current.clear()
    aoiOutline(layerRef.current, aoi.bbox)
    setState({ status: 'loading', step: 'Fetching footprints and irradiance' })

    ;(async () => {
      try {
        // Fetch a margin around the square so neighbours outside it still cast shade
        const [elements, ghi] = await Promise.all([
          fetchBuildingFootprints(squareBbox(aoi.centre, HALF + 150)),
          fetchAnnualGHI(city),
        ])
        if (stale()) return
        const { buildings } = prepareBuildings(elements, aoi.centre)
        const grid = makeGrid(40)
        let maxHeight = 0
        buildings.forEach((b) => {
          grid.insert(b, b.bounds)
          maxHeight = Math.max(maxHeight, b.height)
        })
        const inside = buildings.filter((b) => Math.abs(b.centroid[0]) <= HALF && Math.abs(b.centroid[1]) <= HALF)
        const samples = annualSunSamples(city)
        const totalWeight = samples.reduce((s, x) => s + x.weight, 0)
        const A = SOLAR_ASSUMPTIONS

        setState({ status: 'loading', step: `Tracing sun across ${inside.length.toLocaleString()} roofs` })
        const results = []
        for (let i = 0; i < inside.length; i++) {
          if (i % 150 === 0) {
            await yieldToUI()
            if (stale()) return
          }
          const b = inside[i]
          const usable = b.area >= A.minRoof ? b.area * A.usableShare : 0
          let shadeLoss = 0
          if (usable > 0) {
            const pts = roofSamplePoints(b)
            let blocked = 0
            for (const sun of samples) {
              let shadedPts = 0
              for (const p of pts) if (isShaded(p, b.height + 0.5, sun, grid, maxHeight, b.id)) shadedPts++
              blocked += (shadedPts / pts.length) * sun.weight
            }
            shadeLoss = blocked / totalWeight
          }
          const kwh = ghi.kwhPerM2Year * usable * A.efficiency * A.performanceRatio * (1 - shadeLoss)
          results.push({
            id: b.id,
            name: b.name,
            ll: b.ll,
            centroid: b.centroid,
            roof: b.area,
            usable,
            shadeLoss,
            mwh: kwh / 1000,
            heightSource: b.heightSource,
            cls: SOLAR_CLASSES.findIndex((c) => kwh / 1000 < c.max),
          })
        }
        if (stale()) return

        const withPanels = results.filter((r) => r.usable > 0)
        const mwh = withPanels.reduce((s, r) => s + r.mwh, 0)
        const usable = withPanels.reduce((s, r) => s + r.usable, 0)
        const totals = {
          analysed: results.length,
          suitable: withPanels.length,
          roof: results.reduce((s, r) => s + r.roof, 0),
          usable,
          capacityMWp: (usable * A.efficiency) / 1000,
          mwh,
          co2t: (mwh * 1000 * city.gridCO2) / 1000,
          shadeLoss: withPanels.length ? withPanels.reduce((s, r) => s + r.shadeLoss * r.usable, 0) / usable : 0,
          heightKnown: heightCoverage(inside),
        }
        const top = [...withPanels].sort((a, b) => b.mwh - a.mwh).slice(0, 5)

        setStyleOverride({
          classes: SOLAR_CLASSES.map((c, i) => ({
            ids: results.filter((r) => r.usable > 0 && r.cls === i).map((r) => r.id),
            color: cssVar(c.token),
          })).filter((c) => c.ids.length),
          fallback: '#3a3936',
        })
        setState({ status: 'ready', totals, top, ghi, centre: aoi.centre })
      } catch (err) {
        if (stale()) return
        console.error('Solar analysis failed:', err)
        setState({ status: 'error', error: 'Could not load building footprints from OpenStreetMap.' })
      }
    })()
  }, [active, aoi, city])

  return state
}

