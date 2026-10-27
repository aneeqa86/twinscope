import { useEffect, useState } from 'react'
import { viewCentre, squareBbox } from '@/components/map/draw'
import { haversine } from '@/analysis/geo'

/**
 * A square analysis area around where the camera is looking. It only moves once
 * the camera settles and the centre has shifted by a third of the area, so small
 * nudges don't restart a running analysis. `tooFar` when zoomed too far out.
 */
export function useAreaOfInterest(viewer, active, halfSize = 600, maxAltKm = 6) {
  const [aoi, setAoi] = useState(null)

  useEffect(() => {
    if (!viewer || !active) {
      setAoi(null)
      return
    }
    const update = () => {
      const altKm = viewer.camera.positionCartographic.height / 1000
      if (altKm > maxAltKm) {
        setAoi((prev) => (prev?.tooFar ? prev : { tooFar: true }))
        return
      }
      const centre = viewCentre(viewer)
      if (!centre) return
      setAoi((prev) => {
        if (prev?.centre && haversine(prev.centre.lng, prev.centre.lat, centre.lng, centre.lat) < halfSize / 3) return prev
        return { centre, bbox: squareBbox(centre, halfSize), halfSize, tooFar: false }
      })
    }
    update()
    const remove = viewer.camera.moveEnd.addEventListener(update)
    return () => remove()
  }, [viewer, active, halfSize, maxAltKm])

  return aoi
}
