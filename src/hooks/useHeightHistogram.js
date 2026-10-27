import { useEffect, useRef, useState } from 'react'
import * as Cesium from 'cesium'
import { fetchBuildingHeights } from '@/services/overpassService'

// Lower bound in metres; X labels show the lower bound
export const HEIGHT_BUCKETS = [0, 10, 20, 30, 50, 75, 100, 150, 200]

const bucketLabel = (i) => {
  const lo = HEIGHT_BUCKETS[i]
  const hi = HEIGHT_BUCKETS[i + 1]
  return hi === undefined ? `${lo}+ m` : `${lo}–${hi} m`
}

const parseHeight = (el) => {
  const h = parseFloat(el.tags?.height)
  if (!isNaN(h) && h > 0) return h
  const levels = parseFloat(el.tags?.['building:levels'])
  if (!isNaN(levels) && levels > 0) return levels * 3.5
  return null
}

const getBbox = (viewer) => {
  const rect = viewer.camera.computeViewRectangle()
  if (!rect) return null
  return {
    south: Cesium.Math.toDegrees(rect.south),
    west:  Cesium.Math.toDegrees(rect.west),
    north: Cesium.Math.toDegrees(rect.north),
    east:  Cesium.Math.toDegrees(rect.east),
  }
}

/** Building height distribution for the current view, refetched as the camera settles. */
export function useHeightHistogram(viewer, active, cameraPos) {
  const [data, setData] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const debounceRef = useRef(null)
  const fetchedRef = useRef(null)

  useEffect(() => {
    if (!active) fetchedRef.current = null
    if (!viewer || !active) return

    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      const bbox = getBbox(viewer)
      if (!bbox) return
      const key = `${bbox.south.toFixed(3)},${bbox.west.toFixed(3)},${bbox.north.toFixed(3)},${bbox.east.toFixed(3)}`
      if (fetchedRef.current === key) return
      fetchedRef.current = key

      setLoading(true)
      try {
        const elements = await fetchBuildingHeights(bbox)
        const counts = HEIGHT_BUCKETS.map(() => 0)
        let n = 0
        elements.forEach((el) => {
          const h = parseHeight(el)
          if (h === null) return
          n++
          let idx = 0
          HEIGHT_BUCKETS.forEach((lo, i) => { if (h >= lo) idx = i })
          counts[idx]++
        })
        setData(HEIGHT_BUCKETS.map((lo, i) => ({ lo: String(lo), range: bucketLabel(i), count: counts[i] })))
        setTotal(n)
      } catch (err) {
        console.error('Histogram fetch failed:', err)
      } finally {
        setLoading(false)
      }
    }, 800)

    return () => clearTimeout(debounceRef.current)
  }, [viewer, active, cameraPos?.lat, cameraPos?.lng])

  return { data, total, loading }
}
