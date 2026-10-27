import clsx from 'clsx'
import Icon from '@/components/icons/Icon'
import { Button, Segmented, Swatch } from '@/components/primitives'
import { DockShell, Instruct } from '@/components/shell/ModeDock'
import { ReportCard, Headline, fmt } from '@/components/shell/ReportCard'
import { IMPACT_CLASSES } from './usePlanScenario'

const DAYS = [
  { id: 'dec', label: '21 Dec' },
  { id: 'mar', label: 'Equinox' },
  { id: 'jun', label: '21 Jun' },
]

const Slider = ({ label, value, min, max, step = 1, unit, onChange }) => (
  <label className="block">
    <span className="flex items-baseline justify-between text-[12px]">
      <span className="text-ink-3">{label}</span>
      <span className="font-mono text-[13px] text-ink">
        {value}
        {unit && <span className="text-ink-3"> {unit}</span>}
      </span>
    </span>
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      className="ts-range ts-range-sm mt-0.5 block"
    />
  </label>
)

export const PlanDock = ({ plan, params, setParams, onClose, mobile }) => {
  const { phase } = plan
  return (
    <DockShell
      tool="plan"
      onClose={onClose}
      mobile={mobile}
      actions={phase === 'ready' && (
        <Button variant="secondary" size={mobile ? 'lg' : 'md'} onClick={plan.reset}>
          <Icon name="reset" size={15} />
          New site
        </Button>
      )}
    >
      {phase === 'corner-1' && <Instruct text="Click the first corner of the site" hint="Step 1 of 2 · the plot boundary" />}
      {phase === 'corner-2' && <Instruct text="Click the opposite corner" hint="Step 2 of 2 · the tower fills the site inside the setback" />}
      {phase === 'ready' && (
        <div className="grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2">
          <Slider label="Floors" value={params.floors} min={1} max={120} unit={`· ${(params.floors * 3.5).toFixed(0)} m`} onChange={(floors) => setParams((p) => ({ ...p, floors }))} />
          <Slider label="Setback" value={params.setback} min={0} max={20} unit="m" onChange={(setback) => setParams((p) => ({ ...p, setback }))} />
          <div className="sm:col-span-2">
            <p className="mb-1.5 text-[12px] text-ink-3">Shadow study day</p>
            <Segmented label="Shadow study day" options={DAYS} value={params.dayKey} onChange={(dayKey) => setParams((p) => ({ ...p, dayKey }))} />
          </div>
        </div>
      )}
    </DockShell>
  )
}

const LimitInput = ({ label, value, unit, step, onChange }) => (
  <label className="flex items-center justify-between gap-3 py-1 text-[12px]">
    <span className="text-ink-3">{label}</span>
    <span className="flex items-center gap-1.5">
      <input
        type="number"
        inputMode="decimal"
        value={value}
        step={step}
        min={0}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-8 w-[72px] rounded-control border border-line bg-raised px-2 text-right font-mono text-[12.5px] text-ink focus:border-line-strong focus:outline-none"
      />
      <span className="w-6 font-mono text-ink-3">{unit}</span>
    </span>
  </label>
)

export const PlanReport = ({ plan, params, setParams, onClose, onFlyTo }) => {
  const { scenario, context, phase } = plan
  if (phase !== 'ready' || !scenario) {
    return (
      <ReportCard tool="plan" onClose={onClose}>
        <p className="text-[12.5px] leading-relaxed text-ink-2">
          Draw a site to test a proposed tower against zoning limits and see whose sunlight it takes.
        </p>
      </ReportCard>
    )
  }
  const { metrics, checks, affected, onSite, valid, day } = scenario
  const allPass = checks.every((c) => c.pass)
  const byClass = IMPACT_CLASSES.map((c, i) => ({
    ...c,
    count: affected.filter((a) => a.hours >= c.min && (i === IMPACT_CLASSES.length - 1 || a.hours < IMPACT_CLASSES[i + 1].min)).length,
  }))
  const setLimit = (key) => (v) => setParams((p) => ({ ...p, limits: { ...p.limits, [key]: v } }))

  return (
    <ReportCard
      tool="plan"
      title="Scenario report"
      subtitle={`${fmt(metrics.siteW)} × ${fmt(metrics.siteD)} m site · ${params.floors} floors`}
      onClose={onClose}
      footer="Shadows are cast on the ground plane, hourly 07:00–17:00. A neighbour counts as overshadowed in an hour when its centre is in shadow."
    >
      {!valid ? (
        <p className="text-[12.5px] text-bad">The setback leaves no buildable footprint. Reduce the setback or draw a larger site.</p>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-2">
            {[
              ['Height', `${fmt(metrics.height)} m`],
              ['GFA', `${fmt(metrics.gfa)} m²`],
              ['FAR', fmt(metrics.far, 2)],
              ['Site', `${fmt(metrics.siteArea)} m²`],
              ['Footprint', `${fmt(metrics.footprintArea)} m²`],
              ['Coverage', `${fmt(metrics.coverage * 100)}%`],
            ].map(([k, v]) => (
              <div key={k} className="rounded-[9px] bg-subtle px-2.5 py-2">
                <p className="text-[10.5px] text-ink-3">{k}</p>
                <p className="mt-0.5 truncate font-mono text-[12.5px] text-ink">{v}</p>
              </div>
            ))}
          </div>

          <div className="mt-4">
            <div className="mb-1.5 flex items-center justify-between">
              <p className="ts-label">Zoning check</p>
              <span className={clsx('font-mono text-[11.5px]', allPass ? 'text-ok' : 'text-bad')}>
                {allPass ? 'All limits met' : `${checks.filter((c) => !c.pass).length} limit${checks.filter((c) => !c.pass).length > 1 ? 's' : ''} exceeded`}
              </span>
            </div>
            <ul>
              {checks.map((c) => (
                <li key={c.id} className="flex items-center justify-between gap-2 border-t border-line py-[7px] text-[12px]">
                  <span className="text-ink-2">{c.label}</span>
                  <span className="flex items-center gap-2 font-mono">
                    <span className="text-ink">{c.value}</span>
                    <span className="text-ink-3">{c.limit}</span>
                    <span
                      className="flex h-5 w-5 items-center justify-center rounded-full"
                      style={{ color: c.pass ? 'var(--ts-ok)' : 'var(--ts-bad)', background: c.pass ? 'rgba(79,211,154,0.16)' : 'rgba(255,107,122,0.16)' }}
                      aria-label={c.pass ? 'Pass' : 'Fail'}
                    >
                      <Icon name={c.pass ? 'check' : 'close'} size={12} strokeWidth={2.2} />
                    </span>
                  </span>
                </li>
              ))}
            </ul>
            <details className="group mt-1">
              <summary className="cursor-pointer list-none py-1 text-[12px] text-ink-3 hover:text-ink-2">
                <span className="inline-flex items-center gap-1">
                  Edit limits <Icon name="chev" size={13} className="transition-transform group-open:rotate-180" />
                </span>
              </summary>
              <div className="pb-1">
                <LimitInput label="Max height" value={params.limits.maxHeight} unit="m" step={5} onChange={setLimit('maxHeight')} />
                <LimitInput label="Max floor area ratio" value={params.limits.maxFar} unit="" step={0.5} onChange={setLimit('maxFar')} />
                <LimitInput label="Min setback" value={params.limits.minSetback} unit="m" step={1} onChange={setLimit('minSetback')} />
                <p className="mt-1 text-[11px] text-ink-3">Example limits. Set them to the plot's zoning before relying on the check.</p>
              </div>
            </details>
          </div>

          <div className="mt-4">
            <p className="ts-label mb-2">Shadow impact · {day.label}</p>
            {context?.status === 'loading' ? (
              <p className="font-mono text-[12px] text-ink-3">Loading neighbouring buildings…</p>
            ) : context?.status === 'error' ? (
              <p className="text-[12.5px] text-bad">
                Couldn't load neighbouring buildings from OpenStreetMap, so shadow impact can't be measured. The
                shadow study is still drawn on the map. Try New site in a moment.
              </p>
            ) : (
              <>
                <Headline
                  value={fmt(affected.length)}
                  unit={affected.length === 1 ? 'building' : 'buildings'}
                  caption={affected.length ? 'overshadowed for at least an hour' : 'No neighbouring building loses direct sun'}
                />
                {affected.length > 0 && (
                  <>
                    <div className="mt-3 flex gap-3">
                      {byClass.map((c) => (
                        <span key={c.token} className="flex items-center gap-1.5 text-[12px] text-ink-2">
                          <Swatch token={c.token} />
                          <span className="font-mono text-ink">{c.count}</span> {c.label}
                        </span>
                      ))}
                    </div>
                    <ul className="mt-2.5">
                      {affected.slice(0, 5).map((a) => (
                        <li key={a.id}>
                          <button
                            type="button"
                            data-no-press
                            onClick={() => onFlyTo(a.ll)}
                            className="ts-transition flex w-full items-center justify-between gap-3 rounded-control border-t border-line px-1 py-[7px] text-left text-[12px] hover:bg-hover active:bg-selected"
                          >
                            <span className="min-w-0 truncate text-ink-2">{a.name ?? `${a.use ?? 'Building'} · OSM ${a.id}`}</span>
                            <span className="shrink-0 font-mono text-ink">{a.hours} h</span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  </>
                )}
                {onSite.length > 0 && (
                  <p className="mt-2 text-[11.5px] text-ink-3">{onSite.length} existing building{onSite.length > 1 ? 's' : ''} on the site, shown faded, assumed cleared.</p>
                )}
              </>
            )}
          </div>
        </>
      )}
    </ReportCard>
  )
}
