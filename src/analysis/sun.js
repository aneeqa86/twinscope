// Solar position from the NOAA solar calculator equations (accurate to ~0.01°
// for dates between 1901 and 2099). Azimuth is clockwise from true north.

const rad = Math.PI / 180

/** Sun elevation and azimuth in degrees for a UTC Date at lng/lat. */
export const sunPosition = (date, lat, lng) => {
  const jd = date.getTime() / 86400000 + 2440587.5
  const t = (jd - 2451545) / 36525

  const L0 = (280.46646 + t * (36000.76983 + t * 0.0003032)) % 360
  const M = 357.52911 + t * (35999.05029 - 0.0001537 * t)
  const e = 0.016708634 - t * (0.000042037 + 0.0000001267 * t)
  const C =
    Math.sin(M * rad) * (1.914602 - t * (0.004817 + 0.000014 * t)) +
    Math.sin(2 * M * rad) * (0.019993 - 0.000101 * t) +
    Math.sin(3 * M * rad) * 0.000289
  const trueLong = L0 + C
  const omega = 125.04 - 1934.136 * t
  const lambda = trueLong - 0.00569 - 0.00478 * Math.sin(omega * rad)
  const eps0 = 23 + (26 + (21.448 - t * (46.815 + t * (0.00059 - t * 0.001813))) / 60) / 60
  const eps = eps0 + 0.00256 * Math.cos(omega * rad)
  const decl = Math.asin(Math.sin(eps * rad) * Math.sin(lambda * rad))

  const y = Math.tan((eps / 2) * rad) ** 2
  const eqTime =
    4 / rad *
    (y * Math.sin(2 * L0 * rad) -
      2 * e * Math.sin(M * rad) +
      4 * e * y * Math.sin(M * rad) * Math.cos(2 * L0 * rad) -
      0.5 * y * y * Math.sin(4 * L0 * rad) -
      1.25 * e * e * Math.sin(2 * M * rad))

  const minutes = date.getUTCHours() * 60 + date.getUTCMinutes() + date.getUTCSeconds() / 60
  const trueSolarTime = (((minutes + eqTime + 4 * lng) % 1440) + 1440) % 1440
  let hourAngle = trueSolarTime / 4 - 180
  if (hourAngle < -180) hourAngle += 360

  const latR = lat * rad
  const cosZenith = Math.sin(latR) * Math.sin(decl) + Math.cos(latR) * Math.cos(decl) * Math.cos(hourAngle * rad)
  const zenith = Math.acos(Math.min(1, Math.max(-1, cosZenith)))
  const elevation = 90 - zenith / rad

  const azDen = Math.cos(latR) * Math.sin(zenith)
  let azimuth
  if (Math.abs(azDen) < 1e-9) {
    azimuth = lat > 0 ? 180 : 0
  } else {
    const azRad = ((Math.sin(latR) * Math.cos(zenith) - Math.sin(decl)) / azDen)
    const a = Math.acos(Math.min(1, Math.max(-1, azRad))) / rad
    azimuth = hourAngle > 0 ? (a + 180) % 360 : (540 - a) % 360
  }
  return { elevation, azimuth }
}

/** A UTC Date for a local clock time in a city with a fixed UTC offset. */
export const cityTime = ({ year, month, day }, hour, tz) =>
  new Date(Date.UTC(year, month - 1, day, 0, 0, 0) + (hour - tz) * 3600 * 1000)

/** Study days used by shadow and solar analyses. */
export const studyDay = (key, year = new Date().getUTCFullYear()) => {
  const days = {
    jun: { month: 6, day: 21, label: '21 Jun · summer solstice' },
    mar: { month: 3, day: 20, label: '20 Mar · equinox' },
    sep: { month: 9, day: 22, label: '22 Sep · equinox' },
    dec: { month: 12, day: 21, label: '21 Dec · winter solstice' },
    aug: { month: 8, day: 15, label: '15 Aug · peak summer' },
  }
  return { year, ...days[key] }
}
