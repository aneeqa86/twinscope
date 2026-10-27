import { useEffect, useRef, useState } from 'react'
import Icon from '@/components/icons/Icon'
import { Presence, Swatch } from '@/components/primitives'
import { CityList, CityConditions } from '@/components/panels/CityWeather'

/** City name + live temp + air quality. Opens a popover with the city list and full conditions. */
const CityPill = ({ cities, activeCity, weather, weatherConfigured, onCityChange, compact = false }) => {
  const [open, setOpen] = useState(false)
  const rootRef = useRef(null)
  const current = weather[activeCity.name]

  useEffect(() => {
    if (!open) return
    const onDown = (e) => { if (!rootRef.current?.contains(e.target)) setOpen(false) }
    const onKey = (e) => { if (e.key === 'Escape') { e.preventDefault(); setOpen(false) } }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-label={`City: ${activeCity.name}. Change city and see conditions`}
        className="ts-panel ts-transition flex h-11 items-center gap-3 !rounded-pill px-3.5 hover:bg-[rgba(30,31,35,0.9)]"
      >
        <span className="flex items-center gap-1.5">
          <span className="font-serif text-[23px] italic leading-none text-ink">{activeCity.name}</span>
          <Icon
            name="chev"
            size={15}
            className="text-ink-3"
            style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform var(--ts-dur-fast)' }}
          />
        </span>
        <span aria-hidden className="h-5 w-px bg-line" />
        <span className="flex items-center gap-1 font-mono text-[12.5px] text-ink">
          <Icon name="thermo" size={15} className="text-ink-3" />
          {current?.weather ? `${current.weather.temp}°` : '—'}
        </span>
        {current?.aqi && (
          <>
            <span aria-hidden className="h-5 w-px bg-line" />
            <span className="flex items-center gap-1.5 text-[12.5px] text-ink-2">
              <Swatch token={current.aqi.token} size={7} round />
              {!compact && <span>AQI {current.aqi.label}</span>}
            </span>
          </>
        )}
      </button>

      <Presence
        show={open}
        motion="down"
        className="ts-pop absolute left-0 top-[52px] z-30 w-[372px] max-w-[calc(100vw-40px)] origin-top-left p-3"
        role="dialog"
        aria-label="Cities and live conditions"
      >
        <CityList
          cities={cities}
          activeCity={activeCity}
          weather={weather}
          onSelect={(c) => { onCityChange(c); setOpen(false) }}
        />
        <div className="mt-3 border-t border-line px-1 pt-4">
          <CityConditions cityName={activeCity.name} data={current} configured={weatherConfigured} />
        </div>
      </Presence>
    </div>
  )
}

export default CityPill
