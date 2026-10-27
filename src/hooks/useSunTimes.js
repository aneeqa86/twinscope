import { useEffect, useState } from 'react'

const utcToDecimalHour = (utcString) => {
  if (!utcString) return null
  const date = new Date(utcString)
  return date.getUTCHours() + date.getUTCMinutes() / 60
}

const wrap24 = (h) => ((h % 24) + 24) % 24

/** Today's sunrise and sunset for a city, as decimal hours in the city's local time. */
export function useSunTimes(city, enabled) {
  const [sunTimes, setSunTimes] = useState(null)

  useEffect(() => {
    if (!enabled || !city) return
    let cancelled = false
    setSunTimes(null)
    fetch(`https://api.sunrise-sunset.org/json?lat=${city.lat}&lng=${city.lng}&date=today&formatted=0`)
      .then((res) => res.json())
      .then((data) => {
        if (cancelled || data.status !== 'OK') return
        setSunTimes({
          rise: wrap24(utcToDecimalHour(data.results.sunrise) + city.tz),
          set:  wrap24(utcToDecimalHour(data.results.sunset) + city.tz),
        })
      })
      .catch((err) => console.error('Sunrise fetch failed:', err))
    return () => { cancelled = true }
  }, [city, enabled])

  return sunTimes
}
