import Icon from '@/components/icons/Icon'
import { Swatch } from '@/components/primitives'
import LandmarkSearch from '@/components/shell/LandmarkSearch'
import { formatAlt } from '@/utils'

/** Top row (menu + search) and city row (city chip + altitude chip). */
const MobileTopBar = ({ activeCity, weather, cameraPos, onMenu, onCity, onLandmark }) => {
  const current = weather[activeCity.name]
  return (
    <>
      <div className="absolute left-3 right-3 top-4 z-30 flex gap-2" style={{ top: 'max(16px, env(safe-area-inset-top))' }}>
        <button
          type="button"
          onClick={onMenu}
          aria-label="Open layers panel"
          className="ts-panel ts-transition flex h-12 w-12 shrink-0 items-center justify-center !rounded-pill text-ink"
        >
          <Icon name="menu" size={20} />
        </button>
        <LandmarkSearch cityName={activeCity.name} onPick={onLandmark} mobile className="min-w-0 flex-1" />
      </div>

      <div className="absolute left-3 right-3 top-[72px] z-20 flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={onCity}
          aria-label={`City: ${activeCity.name}. Change city and see conditions`}
          className="ts-panel ts-transition flex h-11 items-center gap-2.5 !rounded-pill px-3.5"
        >
          <span className="font-serif text-[21px] italic leading-none text-ink">{activeCity.name}</span>
          <span className="font-mono text-[12.5px] text-ink">{current?.weather ? `${current.weather.temp}°` : '—'}</span>
          {current?.aqi && (
            <span className="flex items-center gap-1.5 text-[12.5px] text-ink-2">
              <Swatch token={current.aqi.token} size={7} round />
              {current.aqi.label}
            </span>
          )}
        </button>
        <span className="ts-panel flex h-11 items-center !rounded-pill px-3 font-mono text-[12px] text-ink-3">
          ALT&nbsp;<span className="text-ink">{formatAlt(cameraPos?.alt)}</span>
        </span>
      </div>
    </>
  )
}

export default MobileTopBar
