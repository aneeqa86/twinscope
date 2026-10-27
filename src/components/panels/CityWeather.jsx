import clsx from 'clsx'
import Icon from '@/components/icons/Icon'
import { AqiBar, StatRow, SectionLabel, Swatch } from '@/components/primitives'

const aqiToken = (aqi) => aqi?.token ?? '--ts-text-3'

/** City list: serif italic names with live temp + AQI per city. */
export const CityList = ({ cities, activeCity, weather, onSelect, large = false }) => (
  <div role="radiogroup" aria-label="City" className="flex flex-col gap-1">
    {cities.map((city) => {
      const w = weather[city.name]
      const active = city.name === activeCity.name
      return (
        <button
          key={city.name}
          type="button"
          role="radio"
          aria-checked={active}
          data-no-press
          onClick={() => onSelect(city)}
          className={clsx(
            'ts-transition flex items-center justify-between gap-3 rounded-[10px] px-3 text-left',
            large ? 'h-14' : 'h-12',
            active ? 'bg-selected' : 'hover:bg-hover active:bg-selected'
          )}
        >
          <span className="flex items-center gap-2.5">
            <span
              aria-hidden
              className={clsx('h-1.5 w-1.5 rounded-full', active ? 'bg-accent' : 'bg-transparent')}
            />
            <span className="font-serif text-[22px] italic leading-none text-ink">{city.name}</span>
          </span>
          <span className="flex items-center gap-3 font-mono text-[12px] text-ink-2">
            <span>{w?.weather ? `${w.weather.temp}°C` : '—'}</span>
            <span className="flex items-center gap-1.5">
              <Swatch token={aqiToken(w?.aqi)} size={7} round />
              <span>{w?.aqi?.label ?? '—'}</span>
            </span>
          </span>
        </button>
      )
    })}
  </div>
)

/** Live conditions + air quality for one city. */
export const CityConditions = ({ cityName, data, configured }) => {
  const w = data?.weather
  const aqi = data?.aqi

  if (!configured) {
    return <p className="text-[12.5px] text-ink-3">Live weather needs an OpenWeatherMap key (VITE_OPENWEATHER_KEY).</p>
  }
  if (!w && !aqi) {
    return <p className="font-mono text-[12px] text-ink-3">Fetching conditions for {cityName}…</p>
  }

  return (
    <div className="flex flex-col gap-4">
      {w && (
        <div>
          <div className="mb-2 flex items-baseline justify-between">
            <SectionLabel>Live conditions</SectionLabel>
            <span className="text-[12px] capitalize text-ink-2">{w.description}</span>
          </div>
          <div className="mb-2 flex items-baseline gap-1 font-mono">
            <span className="text-[30px] leading-none tracking-[-0.02em] text-ink">{w.temp}</span>
            <span className="text-[15px] text-ink-3">°C</span>
          </div>
          <StatRow label={<span className="flex items-center gap-1.5"><Icon name="thermo" size={14} />Feels like</span>} value={`${w.feelsLike}°C`} />
          <StatRow label={<span className="flex items-center gap-1.5"><Icon name="drop" size={14} />Humidity</span>} value={`${w.humidity}%`} />
          <StatRow label={<span className="flex items-center gap-1.5"><Icon name="wind" size={14} />Wind</span>} value={`${w.wind} km/h`} />
          <StatRow label={<span className="flex items-center gap-1.5"><Icon name="eye" size={14} />Visibility</span>} value={w.visibility ? `${w.visibility} km` : '—'} />
        </div>
      )}

      {aqi && (
        <div>
          <div className="mb-2 flex items-center justify-between">
            <SectionLabel>Air quality</SectionLabel>
            <span className="flex items-center gap-2 text-[12.5px]">
              <span className="font-medium" style={{ color: `var(${aqi.token})` }}>{aqi.label}</span>
              <span className="font-mono text-ink-3">{aqi.index} / 5</span>
            </span>
          </div>
          <AqiBar index={aqi.index} className="mb-3" />
          <div className="grid grid-cols-3 gap-2 font-mono">
            {[
              ['PM2.5', aqi.pm25],
              ['PM10', aqi.pm10],
              ['CO', aqi.co],
            ].map(([k, v]) => (
              <div key={k} className="rounded-[9px] bg-subtle px-2.5 py-2">
                <p className="text-[10.5px] text-ink-3">{k}</p>
                <p className="mt-0.5 text-[12.5px] text-ink">{v}</p>
                <p className="text-[10px] text-ink-3">µg/m³</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
