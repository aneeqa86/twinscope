// Annual global horizontal irradiance (GHI) for a location.
// Source: NASA POWER climatology (ALLSKY_SFC_SW_DWN, kWh/m²/day, long-term mean).

const cache = new Map()

// Used when NASA POWER can't be reached: rounded long-term GHI for each city,
// in line with the Global Solar Atlas. Labelled as a fallback in the UI.
const FALLBACK_GHI = { Riyadh: 2250, Dubai: 2150, Doha: 2100 }

export const fetchAnnualGHI = async (city) => {
  if (cache.has(city.name)) return cache.get(city.name)
  const url =
    'https://power.larc.nasa.gov/api/temporal/climatology/point' +
    `?parameters=ALLSKY_SFC_SW_DWN&community=RE&longitude=${city.lng.toFixed(3)}&latitude=${city.lat.toFixed(3)}&format=JSON`
  let result
  try {
    const res = await fetch(url)
    if (!res.ok) throw new Error(`NASA POWER ${res.status}`)
    const data = await res.json()
    const daily = data?.properties?.parameter?.ALLSKY_SFC_SW_DWN?.ANN
    if (typeof daily !== 'number' || daily <= 0) throw new Error('No GHI in response')
    result = { kwhPerM2Year: Math.round(daily * 365), source: 'NASA POWER climatology', fallback: false }
  } catch (err) {
    console.warn('GHI fetch failed, using fallback:', err)
    result = { kwhPerM2Year: FALLBACK_GHI[city.name] ?? 2150, source: 'Regional average (offline fallback)', fallback: true }
  }
  cache.set(city.name, result)
  return result
}
