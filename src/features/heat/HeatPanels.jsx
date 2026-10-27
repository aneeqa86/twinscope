import Icon from '@/components/icons/Icon'
import { Button, Segmented, Switch } from '@/components/primitives'
import { DockShell } from '@/components/shell/ModeDock'
import { ReportCard, AnalysisStatus, Headline, ShareBars, fmt } from '@/components/shell/ReportCard'
import { formatHour24 } from '@/utils'
import { lstDate } from './useHeatAnalysis'

const DAYS = [
  { id: 'aug', label: '15 Aug' },
  { id: 'jun', label: '21 Jun' },
  { id: 'dec', label: '21 Dec' },
]

const LST_PRESETS = [
  { id: 'summer', label: 'Peak summer' },
  { id: 'recent', label: 'Recent' },
]

export const HeatDock = ({ heatParams, setHeatParams, onCityView, onClose, mobile }) => {
  const set = (k) => (v) => setHeatParams((p) => ({ ...p, [k]: v }))
  return (
    <DockShell
      tool="heat"
      onClose={onClose}
      mobile={mobile}
      aside={
        <span className="font-mono text-[26px] leading-none tracking-[-0.02em] text-ink tabular-nums" aria-live="polite">
          {formatHour24(heatParams.hour)}
        </span>
      }
    >
      <input
        type="range"
        min={6}
        max={19}
        step={0.5}
        value={heatParams.hour}
        onChange={(e) => set('hour')(Number(e.target.value))}
        aria-label="Time of day for street shade"
        className="ts-range ts-range-sm block"
      />
      <div className="mt-0.5 flex justify-between font-mono text-[10.5px] text-ink-3" aria-hidden>
        {['06', '09', '12', '15', '18'].map((t) => <span key={t}>{t}</span>)}
      </div>
      <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <p className="mb-1.5 text-[12px] text-ink-3">Day</p>
          <Segmented label="Day" options={DAYS} value={heatParams.dayKey} onChange={set('dayKey')} />
        </div>
        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <p className="text-[12px] text-ink-3">Satellite surface temp.</p>
            <Switch checked={heatParams.lstOn} onChange={set('lstOn')} label="Satellite land surface temperature" />
          </div>
          <Segmented label="Satellite date" options={LST_PRESETS} value={heatParams.lstPreset} onChange={set('lstPreset')} className={heatParams.lstOn ? '' : 'pointer-events-none opacity-40'} />
        </div>
      </div>
      {heatParams.lstOn && (
        <div className="mt-3 flex items-center justify-between gap-3 border-t border-line pt-3">
          <p className="text-[12px] leading-snug text-ink-3">Satellite cells are ~1 km wide, so the heat pattern reads at city scale.</p>
          <Button variant="secondary" size={mobile ? 'lg' : 'md'} onClick={onCityView}>
            <Icon name="up" size={15} />
            City-wide view
          </Button>
        </div>
      )}
    </DockShell>
  )
}

export const HeatReport = ({ heat, heatParams, onClose }) => {
  const r = heat.result
  const lstNote =
    heat.lstStatus === 'error'
      ? 'Satellite tiles for that date did not load. Try the other date.'
      : heatParams.lstOn
      ? `Satellite layer: MODIS Terra daytime land surface temperature, ${lstDate(heatParams.lstPreset)}, ~1 km cells, coloured with the NASA GIBS temperature scale.`
      : null

  return (
    <ReportCard
      tool="heat"
      title="Street shade"
      subtitle={r && !r.night ? `Sun ${fmt(r.sun.elevation)}° high · ${fmt(r.sun.azimuth)}° bearing` : undefined}
      onClose={onClose}
      footer={
        <>
          Every building's shadow is cast for the chosen time and day, then each walkable street is sampled every 8 m.
          {r?.heightKnown !== undefined && ` ${r.heightKnown}% of heights from OSM; the rest assume 2 floors.`}
          {lstNote && <span className="mt-1.5 block">{lstNote}</span>}
        </>
      }
    >
      {heat.status !== 'ready' ? (
        <AnalysisStatus state={heat} zoomHint="Street shade runs at district scale. Zoom in below 6 km to see it; the satellite layer reads best zoomed out." />
      ) : r?.night ? (
        <p className="text-[12.5px] text-ink-2">The sun is below the horizon at {formatHour24(heatParams.hour)}.</p>
      ) : r ? (
        <>
          <Headline
            value={`${fmt(r.classes[2].share * 100)}%`}
            caption={`of ${fmt(r.totalKm, 1)} km of walkable street is shaded at ${formatHour24(heatParams.hour)}`}
          />
          <div className="mt-3">
            <ShareBars items={r.classes.map((c) => ({ label: c.label, token: c.token, share: c.share, value: `${fmt(c.km, 1)} km` }))} />
          </div>
        </>
      ) : null}
    </ReportCard>
  )
}

