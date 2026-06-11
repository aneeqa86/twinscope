const OVERPASS_URL = 'https://overpass-api.de/api/interpreter'

// Serial queue — prevents simultaneous requests to Overpass
let queue = Promise.resolve()
const enqueue = (fn) => {
  queue = queue.then(() => fn()).catch(() => {})
  return queue
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