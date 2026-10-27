// Map legend definitions. Colours are token names so the UI (var(--…)) and Cesium
// (cssVar(…) at paint time) read the same values from tokens.css.

/** Resolve a token like '--ts-accent' to its hex value for Cesium. */
export const cssVar = (name) =>
  getComputedStyle(document.documentElement).getPropertyValue(name).trim()

export const BUILDING_STYLES = [
  { id: 'default', label: 'Default' },
  { id: 'height',  label: 'Height' },
  { id: 'use',     label: 'Use' },
]

// Lower bound in metres, ascending
export const HEIGHT_CLASSES = [
  { min: 0,   token: '--ts-height-1', label: '<20',    range: 'Under 20 m' },
  { min: 20,  token: '--ts-height-2', label: '20–50',  range: '20–50 m' },
  { min: 50,  token: '--ts-height-3', label: '50–100', range: '50–100 m' },
  { min: 100, token: '--ts-height-4', label: '>100 m', range: 'Over 100 m' },
]

export const heightClass = (h) => {
  if (h === null || h === undefined || isNaN(h)) return null
  return [...HEIGHT_CLASSES].reverse().find((c) => h >= c.min)
}

export const USE_CLASSES = [
  { id: 'commercial',  token: '--ts-use-commercial',  label: 'Commercial / office', match: ['commercial', 'office', 'retail'] },
  { id: 'residential', token: '--ts-use-residential', label: 'Residential',         match: ['residential', 'apartments', 'house'] },
  { id: 'industrial',  token: '--ts-use-industrial',  label: 'Industrial',          match: ['industrial', 'warehouse'] },
  { id: 'unknown',     token: '--ts-use-unknown',     label: 'Unknown',             match: [] },
]

// `before` is the exclusive upper year
export const AGE_CLASSES = [
  { before: 1970, token: '--ts-age-1', label: 'Before 1970' },
  { before: 1980, token: '--ts-age-2', label: '1970s' },
  { before: 1990, token: '--ts-age-3', label: '1980s' },
  { before: 2000, token: '--ts-age-4', label: '1990s' },
  { before: 2010, token: '--ts-age-5', label: '2000s' },
  { before: 2020, token: '--ts-age-6', label: '2010s' },
  { before: 9999, token: '--ts-age-7', label: '2020s+' },
]

export const ageClass = (startDate) => {
  if (!startDate) return null
  const year = parseInt(startDate.toString().slice(0, 4))
  if (isNaN(year)) return null
  return AGE_CLASSES.find((c) => year < c.before)
}

export const ROAD_CLASSES = [
  { id: 'motorway',    token: '--ts-road-motorway',    label: 'Motorway',    width: 4.6 },
  { id: 'trunk',       token: '--ts-road-trunk',       label: 'Trunk',       width: 3.4 },
  { id: 'primary',     token: '--ts-road-primary',     label: 'Primary',     width: 2.4 },
  { id: 'secondary',   token: '--ts-road-secondary',   label: 'Secondary',   width: 1.7 },
  { id: 'residential', token: '--ts-road-residential', label: 'Residential', width: 1.1 },
]

export const POI_CATEGORIES = [
  { id: 'hospital',   token: '--ts-poi-hospital',   label: 'Hospital' },
  { id: 'school',     token: '--ts-poi-school',     label: 'School' },
  { id: 'mosque',     token: '--ts-poi-mosque',     label: 'Mosque' },
  { id: 'metro',      token: '--ts-poi-metro',      label: 'Metro' },
  { id: 'mall',       token: '--ts-poi-mall',       label: 'Mall' },
  { id: 'park',       token: '--ts-poi-park',       label: 'Park' },
  { id: 'hotel',      token: '--ts-poi-hotel',      label: 'Hotel' },
  { id: 'restaurant', token: '--ts-poi-restaurant', label: 'Restaurant' },
]

export const OSM_LAYERS = [
  { id: 'poi',   label: 'Points of interest' },
  { id: 'roads', label: 'Road network' },
  { id: 'age',   label: 'Building age' },
]

// OpenWeatherMap AQI 1-5
export const AQI_LEVELS = [
  { index: 1, label: 'Good',      token: '--ts-aqi-1' },
  { index: 2, label: 'Fair',      token: '--ts-aqi-2' },
  { index: 3, label: 'Moderate',  token: '--ts-aqi-3' },
  { index: 4, label: 'Poor',      token: '--ts-aqi-4' },
  { index: 5, label: 'Very poor', token: '--ts-aqi-5' },
]
