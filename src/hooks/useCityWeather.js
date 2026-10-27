import { useEffect, useState } from 'react'
import { AQI_LEVELS } from '@/config/legends'

const OWM_KEY = import.meta.env.VITE_OPENWEATHER_KEY
const REFRESH_MS = 10 * 60 * 1000

const fetchCity = async (city) => {
  const [wRes, aRes] = await Promise.all([
    fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${city.lat}&lon=${city.lng}&appid=${OWM_KEY}&units=metric`),
    fetch(`https://api.openweathermap.org/data/2.5/air_pollution?lat=${city.lat}&lon=${city.lng}&appid=${OWM_KEY}`),
  ])
  const wData = await wRes.json()
  const aData = await aRes.json()

  const weather = wData?.main
    ? {
        temp:        Math.round(wData.main.temp),
        feelsLike:   Math.round(wData.main.feels_like),
        humidity:    wData.main.humidity,
        wind:        (wData.wind.speed * 3.6).toFixed(1),
        visibility:  wData.visibility ? (wData.visibility / 1000).toFixed(1) : null,
        description: wData.weather?.[0]?.description ?? '',
      }
    : null

  const a = aData?.list?.[0]
  const aqi = a
    ? {
        index: a.main.aqi,
        ...AQI_LEVELS.find((l) => l.index === a.main.aqi),
        pm25: a.components.pm2_5.toFixed(1),
        pm10: a.components.pm10.toFixed(1),
        co:   a.components.co.toFixed(1),
      }
    : null

  return { weather, aqi }
}

/**
 * Live weather + air quality for every city, keyed by city name.
 * The city pill always shows temp + AQI, and the popover compares cities, so all are fetched.
 */
export function useCityWeather(cities) {
  const [data, setData] = useState({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!OWM_KEY) {
      setLoading(false)
      return
    }
    let cancelled = false
    const load = async () => {
      const results = await Promise.all(
        cities.map((c) =>
          fetchCity(c)
            .then((r) => [c.name, r])
            .catch((err) => {
              console.error(`Weather fetch failed for ${c.name}:`, err)
              return [c.name, null]
            })
        )
      )
      if (cancelled) return
      setData(Object.fromEntries(results))
      setLoading(false)
    }
    load()
    const t = setInterval(load, REFRESH_MS)
    return () => {
      cancelled = true
      clearInterval(t)
    }
  }, [cities])

  return { data, loading, configured: !!OWM_KEY }
}
