import { DockShell, Instruct } from '@/components/shell/ModeDock'
import { ReportCard, AnalysisStatus, Headline, fmt } from '@/components/shell/ReportCard'
import { Swatch } from '@/components/primitives'
import { SOLAR_CLASSES, SOLAR_ASSUMPTIONS } from './useSolarAnalysis'

export const SolarDock = ({ solar, onClose, mobile }) => (
  <DockShell tool="solar" onClose={onClose} mobile={mobile}>
    {/* Errors show in the results card; the dock keeps the instruction */}
    {solar.status !== 'loading' && solar.status !== 'too-far' ? (
      <Instruct
        text="Rooftops in the dashed square are coloured by yearly solar yield"
        hint="Pan the map to analyse another 900 m square"
      />
    ) : (
      <AnalysisStatus state={solar} />
    )}
  </DockShell>
)

const energy = (mwh) => (mwh >= 1000 ? { value: fmt(mwh / 1000, 1), unit: 'GWh / yr' } : { value: fmt(mwh), unit: 'MWh / yr' })

export const SolarReport = ({ solar, city, onClose, onFlyTo }) => {
  const A = SOLAR_ASSUMPTIONS
  if (solar.status !== 'ready') {
    return (
      <ReportCard tool="solar" onClose={onClose}>
        <AnalysisStatus state={solar} />
      </ReportCard>
    )
  }
  const { totals, top, ghi } = solar
  const e = energy(totals.mwh)
  return (
    <ReportCard
      tool="solar"
      subtitle={`${fmt(totals.suitable)} of ${fmt(totals.analysed)} roofs suitable`}
      onClose={onClose}
      footer={
        <>
          Irradiance {fmt(ghi.kwhPerM2Year)} kWh/m²/yr ({ghi.source}). Assumes {A.usableShare * 100}% of each roof usable,{' '}
          {A.efficiency * 100}% module efficiency, {A.performanceRatio * 100}% performance ratio. Shading traced hourly on
          the equinoxes and solstices. {totals.heightKnown}% of building heights come from OSM; the rest assume 2 floors.
        </>
      }
    >
      <Headline value={e.value} unit={e.unit} caption={`Potential generation in this square of ${city.name}`} />
      <div className="mt-3 grid grid-cols-2 gap-2">
        {[
          ['Usable roof', `${fmt(totals.usable / 1000, 1)}k m²`],
          ['Capacity', `${fmt(totals.capacityMWp, 1)} MWp`],
          ['CO₂ avoided', `${fmt(totals.co2t)} t / yr`],
          ['Shading loss', `${fmt(totals.shadeLoss * 100, 1)}%`],
        ].map(([k, v]) => (
          <div key={k} className="rounded-[9px] bg-subtle px-2.5 py-2">
            <p className="text-[10.5px] text-ink-3">{k}</p>
            <p className="mt-0.5 font-mono text-[12.5px] text-ink">{v}</p>
          </div>
        ))}
      </div>

      <p className="ts-label mb-1.5 mt-4">Yield per building</p>
      <div className="flex h-2.5 overflow-hidden rounded-[3px]" aria-hidden>
        {SOLAR_CLASSES.map((c) => <span key={c.token} className="flex-1" style={{ background: `var(${c.token})` }} />)}
      </div>
      <div className="mt-1 grid grid-cols-5 font-mono text-[10px] text-ink-3">
        {SOLAR_CLASSES.map((c, i) => (
          <span key={c.token} className={i === 4 ? 'text-right' : i ? 'text-center' : ''}>{c.label}</span>
        ))}
      </div>

      {top.length > 0 && (
        <>
          <p className="ts-label mb-1 mt-4">Best roofs</p>
          <ul>
            {top.map((r) => (
              <li key={r.id}>
                <button
                  type="button"
                  data-no-press
                  onClick={() => onFlyTo(r.ll)}
                  className="ts-transition flex w-full items-center justify-between gap-3 rounded-control border-t border-line px-1 py-[7px] text-left text-[12px] hover:bg-hover active:bg-selected"
                >
                  <span className="flex min-w-0 items-center gap-2">
                    <Swatch token={SOLAR_CLASSES[r.cls].token} />
                    <span className="truncate text-ink-2">{r.name ?? `OSM ${r.id}`}</span>
                  </span>
                  <span className="shrink-0 font-mono text-ink">{fmt(r.mwh)} MWh</span>
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
      <p className="mt-2 text-[11px] text-ink-3">CO₂ uses an approximate grid factor of {city.gridCO2} kg/kWh for {city.name}.</p>
    </ReportCard>
  )
}
