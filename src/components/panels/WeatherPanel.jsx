import { useEffect, useState } from 'react'

const OWM_KEY = import.meta.env.VITE_OPENWEATHER_KEY

const AQI_LABELS = {
  1: { label: 'Good',      color: '#10b981' },
  2: { label: 'Fair',      color: '#06b6d4' },
  3: { label: 'Moderate',  color: '#f59e0b' },
  4: { label: 'Poor',      color: '#f97316' },
  5: { label: 'Very Poor', color: '#ef4444' },
}

const WeatherPanel = ({ city }) => {
  const [weather,   setWeather]   = useState(null)
  const [aqi,       setAqi]       = useState(null)
  const [loading,   setLoading]   = useState(false)
  const [collapsed, setCollapsed] = useState(false)

  useEffect(() => {
    if (!city) return
    const fetchData = async () => {
      setLoading(true)
      setWeather(null)
      setAqi(null)
      try {
        const [wRes, aRes] = await Promise.all([
          fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${city.lat}&lon=${city.lng}&appid=${OWM_KEY}&units=metric`),
          fetch(`https://api.openweathermap.org/data/2.5/air_pollution?lat=${city.lat}&lon=${city.lng}&appid=${OWM_KEY}`),
        ])
        const wData = await wRes.json()
        const aData = await aRes.json()

        setWeather({
          temp:        Math.round(wData.main.temp),
          feelsLike:   Math.round(wData.main.feels_like),
          humidity:    wData.main.humidity,
          wind:        (wData.wind.speed * 3.6).toFixed(1),
          visibility:  wData.visibility ? (wData.visibility / 1000).toFixed(1) : null,
          description: wData.weather[0].description,
          icon:        wData.weather[0].icon,
        })

        const aqiIndex = aData.list[0].main.aqi
        setAqi({
          index: aqiIndex,
          ...AQI_LABELS[aqiIndex],
          pm25: aData.list[0].components.pm2_5.toFixed(1),
          pm10: aData.list[0].components.pm10.toFixed(1),
          co:   aData.list[0].components.co.toFixed(1),
        })
      } catch (err) {
        console.error('Weather fetch failed:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [city])

  return (
    <div className="absolute right-16 top-20 z-50">
      {/* Toggle button */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -left-3 top-3 z-10 w-6 h-6 rounded-full bg-cyan-500 text-white text-xs flex items-center justify-center shadow-lg hover:bg-cyan-400 transition-colors"
      >
        {collapsed ? '‹' : '›'}
      </button>

      {!collapsed && (
        <div className="w-56 bg-[#0a1628]/90 backdrop-blur-sm border border-cyan-900/40 rounded-xl overflow-hidden shadow-2xl">

          <div className="px-4 py-3 border-b border-cyan-900/40">
            <p className="text-xs text-cyan-400 font-mono tracking-widest">LIVE WEATHER</p>
          </div>

          {loading && (
            <div className="px-4 py-6 text-center">
              <p className="text-xs text-slate-500">Fetching data…</p>
            </div>
          )}

          {!loading && weather && (
            <>
              {/* Main temp */}
              <div className="px-4 py-3 border-b border-cyan-900/40">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-3xl font-mono text-slate-100">
                      {weather.temp}°<span className="text-lg text-slate-400">C</span>
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5 capitalize">{weather.description}</p>
                  </div>
                  <img
                    src={`https://openweathermap.org/img/wn/${weather.icon}@2x.png`}
                    alt={weather.description}
                    className="w-12 h-12 opacity-90"
                  />
                </div>
              </div>

              {/* Weather details */}
              <div className="px-4 py-3 border-b border-cyan-900/40">
                <p className="text-xs text-slate-500 mb-2 tracking-wider">CONDITIONS</p>
                {[
                  { label: 'Feels like',  value: `${weather.feelsLike}°C` },
                  { label: 'Humidity',    value: `${weather.humidity}%` },
                  { label: 'Wind',        value: `${weather.wind} km/h` },
                  { label: 'Visibility',  value: weather.visibility ? `${weather.visibility} km` : '—' },
                ].map(({ label, value }) => (
                  <div key={label} className="flex justify-between text-xs mb-1.5">
                    <span className="text-slate-500">{label}</span>
                    <span className="text-slate-300 font-mono">{value}</span>
                  </div>
                ))}
              </div>

              {/* AQI */}
              {aqi && (
                <div className="px-4 py-3">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs text-slate-500 tracking-wider">AIR QUALITY</p>
                    <span
                      className="text-xs font-mono px-2 py-0.5 rounded-full"
                      style={{
                        background: aqi.color + '25',
                        color:      aqi.color,
                        border:     `1px solid ${aqi.color}40`,
                      }}
                    >
                      {aqi.label}
                    </span>
                  </div>

                  <div className="w-full h-1.5 bg-slate-800 rounded-full mb-3">
                    <div
                      className="h-1.5 rounded-full transition-all"
                      style={{ width: `${(aqi.index / 5) * 100}%`, background: aqi.color }}
                    />
                  </div>

                  {[
                    { label: 'PM2.5', value: `${aqi.pm25} μg/m³` },
                    { label: 'PM10',  value: `${aqi.pm10} μg/m³` },
                    { label: 'CO',    value: `${aqi.co} μg/m³` },
                  ].map(({ label, value }) => (
                    <div key={label} className="flex justify-between text-xs mb-1.5">
                      <span className="text-slate-500">{label}</span>
                      <span className="text-slate-300 font-mono">{value}</span>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}

export default WeatherPanel