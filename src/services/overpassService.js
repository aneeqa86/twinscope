const OVERPASS_URL = 'https://overpass-api.de/api/interpreter'

// Serial queue — prevents simultaneous requests to Overpass. A failed request
// rejects for its caller but never blocks the requests queued behind it.
let queue = Promise.resolve()
const enqueue = (fn) => {
  const run = queue.then(() => fn())
  queue = run.catch(() => {})
  return run
}

const post = (query) =>
  enqueue(() =>
    fetch(OVERPASS_URL, {
      method: 'POST',
      body: `data=${encodeURIComponent(query)}`,
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    }).then((res) => {
      if (!res.ok) throw new Error(`Overpass ${res.status}`)
      return res.json()
    })
  )

export const fetchPOIs = async (bbox) => {
  const { south, west, north, east } = bbox
  const query = `
    [out:json][timeout:25];
    (
      node["amenity"="hospital"](${south},${west},${north},${east});
      node["amenity"="school"](${south},${west},${north},${east});
      node["amenity"="place_of_worship"]["religion"="muslim"](${south},${west},${north},${east});
      node["station"="subway"](${south},${west},${north},${east});
      node["shop"="mall"](${south},${west},${north},${east});
      node["leisure"="park"](${south},${west},${north},${east});
      node["tourism"="hotel"](${south},${west},${north},${east});
      node["amenity"="restaurant"](${south},${west},${north},${east});
      way["leisure"="park"](${south},${west},${north},${east});
    );
    out center;
  `
  const data = await post(query)
  return data?.elements ?? []
}

export const fetchRoads = async (bbox) => {
  const { south, west, north, east } = bbox
  const query = `
    [out:json][timeout:25];
    (
      way["highway"~"^(motorway|trunk|primary|secondary|residential)$"](${south},${west},${north},${east});
    );
    out geom;
  `
  const data = await post(query)
  return data?.elements ?? []
}

export const fetchBuildingAges = async (bbox) => {
  const { south, west, north, east } = bbox
  const query = `
    [out:json][timeout:25];
    (
      way["building"]["start_date"](${south},${west},${north},${east});
    );
    out geom tags;
  `
  const data = await post(query)
  return data?.elements ?? []
}
export const fetchBuildingHeights = async (bbox) => {
  const { south, west, north, east } = bbox
  const query = `
    [out:json][timeout:25];
    (
      way["building"]["height"](${south},${west},${north},${east});
      way["building"]["building:levels"](${south},${west},${north},${east});
    );
    out tags;
  `
  const data = await post(query)
  return data?.elements ?? []
}

/** Footprint ring of one OSM way, used to draw the selection box. */
export const fetchWayFootprint = async (wayId) => {
  const query = `[out:json][timeout:15]; way(${wayId}); out geom;`
  const data = await post(query)
  return data?.elements?.[0]?.geometry ?? null
}

const bboxStr = ({ south, west, north, east }) => `${south},${west},${north},${east}`

/** Building footprints with height tags, for shadow and solar analyses. */
export const fetchBuildingFootprints = async (bbox) => {
  const query = `[out:json][timeout:40]; way["building"](${bboxStr(bbox)}); out geom;`
  const data = await post(query)
  return data?.elements ?? []
}

/** Streets and paths a pedestrian can use (motorways and trunk roads excluded). */
export const fetchWalkNetwork = async (bbox) => {
  const query = `
    [out:json][timeout:40];
    way["highway"~"^(footway|pedestrian|path|living_street|residential|service|unclassified|tertiary|tertiary_link|secondary|secondary_link|primary|primary_link|steps|cycleway|track|corridor)$"]
       ["foot"!="no"]["access"!~"^(private|no)$"](${bboxStr(bbox)});
    out body geom;
  `
  const data = await post(query)
  return data?.elements ?? []
}

/** Everyday services for 15-minute-city analysis. */
export const fetchEverydayServices = async (bbox) => {
  const b = bboxStr(bbox)
  const query = `
    [out:json][timeout:40];
    (
      nwr["amenity"~"^(school|kindergarten|college)$"](${b});
      nwr["amenity"~"^(hospital|clinic|doctors|pharmacy)$"](${b});
      nwr["healthcare"~"^(hospital|clinic|doctor|pharmacy)$"](${b});
      nwr["railway"="station"]["station"~"^(subway|light_rail)$"](${b});
      nwr["station"="subway"](${b});
      node["highway"="bus_stop"](${b});
      nwr["leisure"~"^(park|garden|playground)$"](${b});
      nwr["shop"~"^(supermarket|convenience|greengrocer|bakery)$"](${b});
      nwr["amenity"="place_of_worship"]["religion"="muslim"](${b});
    );
    out center tags;
  `
  const data = await post(query)
  return data?.elements ?? []
}

export const fetchCoastline = async (bbox) => {
  const query = `[out:json][timeout:30]; way["natural"="coastline"](${bboxStr(bbox)}); out geom;`
  const data = await post(query)
  return data?.elements ?? []
}
