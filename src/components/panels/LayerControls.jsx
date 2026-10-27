import { useState } from 'react'
import clsx from 'clsx'
import Icon, { PoiGlyph } from '@/components/icons/Icon'
import { Segmented, Switch, Swatch, SectionLabel } from '@/components/primitives'
import {
  BUILDING_STYLES,
  HEIGHT_CLASSES,
  USE_CLASSES,
  AGE_CLASSES,
  ROAD_CLASSES,
  POI_CATEGORIES,
  OSM_LAYERS,
} from '@/config/legends'

// ─── Legends ─────────────────────────────────────────────────────────────

const HeightLegend = () => (
  <div>
    <div className="flex h-2.5 overflow-hidden rounded-[3px]" aria-hidden>
      {HEIGHT_CLASSES.map((c) => (
        <span key={c.token} className="flex-1" style={{ background: `var(${c.token})` }} />
      ))}
    </div>
    <div className="mt-1.5 grid grid-cols-4 font-mono text-[10.5px] text-ink-3">
      {HEIGHT_CLASSES.map((c, i) => (
        <span key={c.token} className={clsx(i === 3 && 'text-right', i > 0 && i < 3 && 'text-center')}>
          {c.label}
        </span>
      ))}
    </div>
  </div>
)

const SwatchGrid = ({ items }) => (
  <ul className="grid grid-cols-2 gap-x-3 gap-y-1.5">
    {items.map((c) => (
      <li key={c.label} className="flex items-center gap-2 text-[12px] text-ink-2">
        <Swatch token={c.token} />
        {c.label}
      </li>
    ))}
  </ul>
)

const PoiLegend = () => (
  <ul className="grid grid-cols-2 gap-x-3 gap-y-1.5">
    {POI_CATEGORIES.map((c) => (
      <li key={c.id} className="flex items-center gap-2 text-[12px] text-ink-2">
        <span
          className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full"
          style={{ background: `var(${c.token})`, color: 'var(--ts-void)' }}
        >
          <PoiGlyph name={c.id} size={11} />
        </span>
        {c.label}
      </li>
    ))}
  </ul>
)

const RoadLegend = () => (
  <ul className="flex flex-col gap-1.5">
    {ROAD_CLASSES.map((c) => (
      <li key={c.id} className="flex items-center gap-2.5 text-[12px] text-ink-2">
        <svg width="34" height="8" aria-hidden className="shrink-0">
          <line x1="1" y1="4" x2="33" y2="4" stroke={`var(${c.token})`} strokeWidth={c.width} strokeLinecap="round" />
        </svg>
        {c.label}
      </li>
    ))}
  </ul>
)

const OSM_LEGENDS = {
  poi: PoiLegend,
  roads: RoadLegend,
  age: () => <SwatchGrid items={AGE_CLASSES} />,
}

// ─── Sections ────────────────────────────────────────────────────────────

/** Building style segmented control + its legend. Building age overrides it when on. */
export const StyleSection = ({ activeLayer, onLayerChange, ageOverride }) => (
  <section>
    <SectionLabel className="mb-2.5">Building style</SectionLabel>
    <Segmented
      label="Building style"
      options={BUILDING_STYLES}
      value={activeLayer}
      onChange={onLayerChange}
    />
    {ageOverride ? (
      <p className="mt-3 text-[12px] text-ink-3">
        Building age is on, so buildings are coloured by construction era.
      </p>
    ) : activeLayer === 'height' ? (
      <div className="mt-3"><HeightLegend /></div>
    ) : activeLayer === 'use' ? (
      <div className="mt-3"><SwatchGrid items={USE_CLASSES} /></div>
    ) : (
      <p className="mt-3 text-[12px] text-ink-3">OSM buildings in neutral bone. Pick Height or Use to colour them.</p>
    )}
  </section>
)

const LayerRow = ({ layer, active, count, onToggle, large }) => {
  const [expanded, setExpanded] = useState(false)
  const Legend = OSM_LEGENDS[layer.id]
  const legendId = `legend-${layer.id}`

  return (
    <li className="border-t border-line first:border-t-0">
      <div className={clsx('flex items-center gap-3', large ? 'h-14' : 'h-[50px]')}>
        <Switch
          checked={active}
          onChange={() => onToggle(layer.id)}
          label={layer.label}
          size={large ? 'lg' : 'md'}
        />
        <button
          type="button"
          onClick={() => setExpanded((e) => !e)}
          aria-expanded={expanded}
          aria-controls={legendId}
          className="ts-transition flex h-full min-w-0 flex-1 items-center gap-2 rounded-control text-left hover:text-ink"
        >
          <span className={clsx('flex-1 truncate font-medium', large ? 'text-[15px]' : 'text-[13.5px]', active ? 'text-ink' : 'text-ink-2')}>
            {layer.label}
          </span>
          {active && count !== null && count !== undefined && (
            <span className="font-mono text-[11.5px] text-ink-3">{count.toLocaleString()}</span>
          )}
          <Icon
            name="chev"
            size={16}
            className="text-ink-3"
            style={{
              transform: expanded ? 'rotate(180deg)' : 'none',
              transition: 'transform var(--ts-dur-fast) var(--ts-ease-settle)',
            }}
          />
        </button>
      </div>
      {expanded && (
        <div id={legendId} className="pb-3 pl-12">
          <Legend />
        </div>
      )}
    </li>
  )
}

export const OsmLayersSection = ({ activeOsmLayers, onOsmLayerToggle, counts = {}, large = false, showLabel = true }) => (
  <section>
    {showLabel && <SectionLabel className="mb-1">OSM layers</SectionLabel>}
    <ul>
      {OSM_LAYERS.map((layer) => (
        <LayerRow
          key={layer.id}
          layer={layer}
          active={activeOsmLayers.includes(layer.id)}
          count={counts[layer.id]}
          onToggle={onOsmLayerToggle}
          large={large}
        />
      ))}
    </ul>
  </section>
)
