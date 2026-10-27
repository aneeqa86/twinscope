// Batched Cesium drawing helpers for analysis overlays. Everything is clamped to
// terrain, so overlays sit correctly in Riyadh (~600 m up) as well as on the coast.
import * as Cesium from 'cesium'
import { cssVar } from '@/config/legends'

export const color = (tokenOrHex, alpha = 1) =>
  Cesium.Color.fromCssColorString(tokenOrHex.startsWith('--') ? cssVar(tokenOrHex) : tokenOrHex).withAlpha(alpha)

const flat = (coords) => coords.flatMap(([lng, lat]) => [lng, lat])

/**
 * Many ground polylines in one primitive. lines: [{ coords: [[lng, lat], ...], color: Cesium.Color, width }]
 * Returns the primitive (add/remove it on viewer.scene.primitives).
 */
export const groundLines = (lines) => {
  const instances = lines
    .filter((l) => l.coords.length >= 2)
    .map((l) =>
      new Cesium.GeometryInstance({
        geometry: new Cesium.GroundPolylineGeometry({
          positions: Cesium.Cartesian3.fromDegreesArray(flat(l.coords)),
          width: l.width ?? 3,
        }),
        attributes: { color: Cesium.ColorGeometryInstanceAttribute.fromColor(l.color) },
      })
    )
  if (!instances.length) return null
  return new Cesium.GroundPolylinePrimitive({
    geometryInstances: instances,
    appearance: new Cesium.PolylineColorAppearance(),
    asynchronous: true,
  })
}

/** Many terrain-draped polygons in one primitive. polys: [{ ring: [[lng, lat], ...], color }] */
export const groundPolygons = (polys) => {
  const instances = polys
    .filter((p) => p.ring.length >= 3)
    .map((p) =>
      new Cesium.GeometryInstance({
        geometry: new Cesium.PolygonGeometry({
          polygonHierarchy: new Cesium.PolygonHierarchy(Cesium.Cartesian3.fromDegreesArray(flat(p.ring))),
        }),
        attributes: { color: Cesium.ColorGeometryInstanceAttribute.fromColor(p.color) },
      })
    )
  if (!instances.length) return null
  return new Cesium.GroundPrimitive({
    geometryInstances: instances,
    appearance: new Cesium.PerInstanceColorAppearance({ flat: true, translucent: true }),
    classificationType: Cesium.ClassificationType.TERRAIN,
    asynchronous: true,
  })
}

/** Tracks primitives and entities an analysis adds, so it can clear them in one call. */
export const makeLayer = (viewer) => {
  const primitives = []
  const entities = []
  return {
    primitive(p) {
      if (p && !viewer.isDestroyed()) {
        viewer.scene.primitives.add(p)
        primitives.push(p)
      }
      return p
    },
    entity(e) {
      if (viewer.isDestroyed()) return null
      const added = viewer.entities.add(e)
      entities.push(added)
      return added
    },
    clear() {
      if (viewer.isDestroyed()) return
      primitives.splice(0).forEach((p) => viewer.scene.primitives.remove(p))
      entities.splice(0).forEach((e) => viewer.entities.remove(e))
    },
  }
}

/** Dashed outline of the analysis area, so it is clear what was analysed. */
export const aoiOutline = (layer, bbox) => {
  const { south, west, north, east } = bbox
  layer.entity({
    polyline: {
      positions: Cesium.Cartesian3.fromDegreesArray([west, south, east, south, east, north, west, north, west, south]),
      clampToGround: true,
      width: 2,
      material: new Cesium.PolylineDashMaterialProperty({ color: color('--ts-text', 0.75), dashLength: 14 }),
    },
  })
}

/** Ground height at a point, from the most detailed terrain available. */
export const terrainHeight = async (viewer, lng, lat) => {
  try {
    const [c] = await Cesium.sampleTerrainMostDetailed(viewer.terrainProvider, [Cesium.Cartographic.fromDegrees(lng, lat)])
    return c.height ?? 0
  } catch {
    return viewer.scene.globe.getHeight(Cesium.Cartographic.fromDegrees(lng, lat)) ?? 0
  }
}

/** Area of interest: a square around the point the camera looks at. */
export const viewCentre = (viewer) => {
  const canvas = viewer.scene.canvas
  const centre = new Cesium.Cartesian2(canvas.clientWidth / 2, canvas.clientHeight / 2)
  const ray = viewer.camera.getPickRay(centre)
  const hit = ray && (viewer.scene.globe.pick(ray, viewer.scene) ?? viewer.camera.pickEllipsoid(centre))
  if (!hit) return null
  const c = Cesium.Cartographic.fromCartesian(hit)
  return { lng: Cesium.Math.toDegrees(c.longitude), lat: Cesium.Math.toDegrees(c.latitude) }
}

export const squareBbox = ({ lng, lat }, halfSizeM) => {
  const dLat = halfSizeM / 110540
  const dLng = halfSizeM / (111320 * Math.cos((lat * Math.PI) / 180))
  return { south: lat - dLat, north: lat + dLat, west: lng - dLng, east: lng + dLng }
}

/** Fly the camera to look at a lng/lat from the south. */
export const flyToPoint = (viewer, lng, lat, range = 600) => {
  viewer.camera.flyToBoundingSphere(new Cesium.BoundingSphere(Cesium.Cartesian3.fromDegrees(lng, lat), 40), {
    offset: new Cesium.HeadingPitchRange(0, Cesium.Math.toRadians(-38), range),
    duration: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 1.8,
  })
}

/** OSM element ids → a 3D Tiles style condition matching those buildings. */
export const idCondition = (ids) =>
  `regExp('^(${ids.join('|')})$').test(String(\${feature["elementId"]}))`
