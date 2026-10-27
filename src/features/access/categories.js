// Six everyday needs a 15-minute neighbourhood should meet on foot.
export const ACCESS_CATEGORIES = [
  {
    id: 'transit', label: 'Transit', glyph: 'metro', token: '--ts-poi-metro',
    match: (t) => t.railway === 'station' || t.station === 'subway' || t.station === 'light_rail' || t.highway === 'bus_stop',
  },
  {
    id: 'education', label: 'Schools', glyph: 'school', token: '--ts-poi-school',
    match: (t) => ['school', 'kindergarten', 'college'].includes(t.amenity),
  },
  {
    id: 'health', label: 'Health', glyph: 'hospital', token: '--ts-poi-hospital',
    match: (t) => ['hospital', 'clinic', 'doctors', 'pharmacy'].includes(t.amenity) || !!t.healthcare,
  },
  {
    id: 'green', label: 'Parks', glyph: 'park', token: '--ts-poi-park',
    match: (t) => ['park', 'garden', 'playground'].includes(t.leisure),
  },
  {
    id: 'groceries', label: 'Groceries', glyph: 'mall', token: '--ts-poi-mall',
    match: (t) => ['supermarket', 'convenience', 'greengrocer', 'bakery'].includes(t.shop),
  },
  {
    id: 'worship', label: 'Mosques', glyph: 'mosque', token: '--ts-poi-mosque',
    match: (t) => t.amenity === 'place_of_worship' && t.religion === 'muslim',
  },
]

export const WALK_M_PER_MIN = 80 // 4.8 km/h
export const BAND_MIN = [5, 10, 15]
export const ACCESS_BANDS = [
  { maxMin: 5,  token: '--ts-iso-1', label: '0–5 min' },
  { maxMin: 10, token: '--ts-iso-2', label: '5–10 min' },
  { maxMin: 15, token: '--ts-iso-3', label: '10–15 min' },
  { maxMin: Infinity, token: '--ts-iso-gap', label: 'Over 15 min' },
]

export const categorise = (tags = {}) => ACCESS_CATEGORIES.filter((c) => c.match(tags)).map((c) => c.id)
