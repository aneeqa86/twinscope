import clsx from 'clsx'
import Icon from '@/components/icons/Icon'
import { Button, IconButton } from '@/components/primitives'
import { formatHour24 } from '@/utils'
import { TOOLS } from './tools'

const TOOL_BY_ID = Object.fromEntries(TOOLS.map((t) => [t.id, t]))

/** Header / body / actions shell shared by every analysis mode. */
const DockShell = ({ tool, aside, onClose, children, actions, mobile }) => {
  const meta = TOOL_BY_ID[tool]
  return (
    <section
      aria-label={meta.title}
      className={clsx('ts-panel w-full', mobile ? 'px-4 py-3.5' : 'px-[18px] py-3.5')}
    >
      <header className="flex items-center gap-3">
        <span className="flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-control bg-accent-wash text-accent">
          <Icon name={meta.icon} size={17} />
        </span>
        <h2 className="flex-1 text-[14px] font-semibold text-ink">{meta.title}</h2>
        {aside}
        <IconButton onClick={onClose} aria-label={`Close ${meta.title.toLowerCase()}`} size={mobile ? 'lg' : 'md'}>
          <Icon name="close" size={17} />
        </IconButton>
      </header>
      <div className="mt-3">{children}</div>
      {actions && <div className="mt-3 flex justify-end gap-2">{actions}</div>}
    </section>
  )
}

const Instruct = ({ text, hint }) => (
  <div aria-live="polite">
    <p className="text-[15px] text-ink">{text}</p>
    {hint && <p className="mt-1 font-mono text-[11.5px] text-ink-3">{hint}</p>}
  </div>
)

// ─── Sun ─────────────────────────────────────────────────────────────────

const pct = (h) => `${(Math.min(24, Math.max(0, h)) / 24) * 100}%`

export const SunDock = ({ value, onChange, sunTimes, cityName, onClose, mobile }) => {
  const isDay = sunTimes ? value >= sunTimes.rise && value <= sunTimes.set : value >= 6 && value <= 19

  return (
    <DockShell
      tool="sun"
      onClose={onClose}
      mobile={mobile}
      aside={
        <span className="font-mono text-[26px] leading-none tracking-[-0.02em] text-ink tabular-nums" aria-live="polite">
          {formatHour24(value)}
        </span>
      }
    >
      {/* 24h track: hairline, daylight band between real sunrise and sunset, native range on top (1:1 with pointer) */}
      <div className="relative h-8">
        <span aria-hidden className="absolute inset-x-0 top-1/2 h-[3px] -translate-y-1/2 rounded-full bg-[rgba(244,240,230,0.14)]" />
        {/* Inset by half the thumb so the band lines up with where the thumb centre lands */}
        {sunTimes && (
          <span aria-hidden className="absolute inset-y-0 left-[11px] right-[11px]">
          <span
            className="absolute top-1/2 h-[5px] -translate-y-1/2 rounded-full"
            style={{
              left: pct(sunTimes.rise),
              width: `calc(${pct(sunTimes.set)} - ${pct(sunTimes.rise)})`,
              background: 'linear-gradient(90deg, rgba(255,122,77,0.35), var(--ts-accent) 50%, rgba(255,122,77,0.35))',
            }}
          />
          </span>
        )}
        <input
          type="range"
          min={0}
          max={24}
          step={0.25}
          value={value}
          onChange={(e) => onChange(Math.min(23.75, Number(e.target.value)))}
          aria-label={`Time of day in ${cityName}`}
          aria-valuetext={`${formatHour24(value)}, ${isDay ? 'daylight' : 'night'}`}
          className="ts-range absolute inset-0"
        />
      </div>
      <div className="mt-1 flex justify-between font-mono text-[10.5px] text-ink-3" aria-hidden>
        {['00', '06', '12', '18', '24'].map((t) => <span key={t}>{t}</span>)}
      </div>

      <div className="mt-3 flex items-center justify-between border-t border-line pt-3 text-[12px]">
        <span className="flex items-center gap-1.5 text-ink-3">
          <Icon name="sunrise" size={16} />
          Sunrise <span className="font-mono text-ink">{sunTimes ? formatHour24(sunTimes.rise) : '—'}</span>
        </span>
        <span className="text-ink-3">
          <span className="font-serif text-[15px] italic text-ink-2">{cityName}</span> · today
        </span>
        <span className="flex items-center gap-1.5 text-ink-3">
          Sunset <span className="font-mono text-ink">{sunTimes ? formatHour24(sunTimes.set) : '—'}</span>
          <Icon name="sunset" size={16} />
        </span>
      </div>
    </DockShell>
  )
}

// ─── Measure distance / area ─────────────────────────────────────────────

export const MeasureDock = ({ mode, result, onAgain, onDone, mobile }) => {
  const isArea = mode === 'area'
  return (
    <DockShell
      tool={isArea ? 'area' : 'dist'}
      onClose={onDone}
      mobile={mobile}
      actions={
        result && (
          <>
            <Button variant="secondary" size={mobile ? 'lg' : 'md'} onClick={onAgain}>Again</Button>
            <Button variant="primary" size={mobile ? 'lg' : 'md'} onClick={onDone}>Done</Button>
          </>
        )
      }
    >
      {!result ? (
        <Instruct
          text={isArea ? 'Click points, double-click to close' : 'Click two points on the map'}
          hint={isArea ? 'Step 1 of 2 · at least 3 points' : 'Step 1 of 2 · geodesic surface distance'}
        />
      ) : (
        <div aria-live="polite">
          <p className="ts-label">{isArea ? 'Area' : 'Distance'}</p>
          <p className="mt-1 font-mono text-[30px] leading-none tracking-[-0.02em] text-ink">{result}</p>
          <p className="mt-1.5 text-[12px] text-ink-3">{isArea ? 'Planar area of the drawn polygon' : 'Along the ellipsoid surface'}</p>
        </div>
      )}
    </DockShell>
  )
}

// ─── Line of sight ───────────────────────────────────────────────────────

export const SightDock = ({ result, onClear, onClose, mobile }) => {
  const clear = result === 'clear'
  return (
    <DockShell
      tool="los"
      onClose={onClose}
      mobile={mobile}
      actions={result && <Button variant="primary" size={mobile ? 'lg' : 'md'} onClick={onClear}>Clear</Button>}
    >
      {!result ? (
        <Instruct text="Click observer point, then target point" hint="Step 1 of 2 · eye height 1.7 m" />
      ) : (
        <div aria-live="polite" className="flex flex-wrap items-center gap-3">
          <span
            className="inline-flex h-8 items-center gap-1.5 rounded-control px-2.5 font-mono text-[13px] font-medium tracking-[0.06em]"
            style={{
              color: clear ? 'var(--ts-ok)' : 'var(--ts-bad)',
              background: clear ? 'rgba(79,211,154,0.16)' : 'rgba(255,107,122,0.16)',
            }}
          >
            <Icon name={clear ? 'check' : 'close'} size={15} />
            {clear ? 'CLEAR' : 'BLOCKED'}
          </span>
          <p className="text-[12.5px] text-ink-2">
            {clear ? 'Nothing between observer and target.' : 'Terrain or a building blocks the view.'}
          </p>
        </div>
      )}
    </DockShell>
  )
}
