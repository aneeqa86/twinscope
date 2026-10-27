import { RailButton } from '@/components/primitives'
import { TOOLS } from './tools'

const Divider = ({ label }) => (
  <span aria-hidden className="flex w-full flex-col items-center py-1">
    <span className="h-px w-8 bg-line" />
    {label && <span className="mt-1.5 font-mono text-[8.5px] uppercase tracking-[0.12em] text-ink-3">{label}</span>}
  </span>
)

/** Slot B. Layers toggles the side panel; Measure and Analyse tools are exclusive. */
const ToolRail = ({ activeTool, onToolChange, layersOpen, onLayersToggle, showLabels = true, dense = false }) => {
  const groups = [
    { id: 'measure', label: 'Measure' },
    { id: 'analyse', label: 'Analyse' },
  ]
  const size = dense ? 'h-12' : ''
  return (
    <nav
      aria-label="Map tools"
      className="ts-panel absolute left-5 top-[84px] z-20 flex w-16 flex-col items-center gap-1 p-1.5"
    >
      <RailButton
        icon="layers"
        label="Layers"
        open={layersOpen}
        onClick={onLayersToggle}
        showLabel={showLabels}
        aria-controls="layers-panel"
        className={size}
      />
      {groups.map((g) => (
        <div key={g.id} role="group" aria-label={g.label} className="flex flex-col items-center gap-1">
          <Divider label={showLabels && !dense ? g.label : null} />
          {TOOLS.filter((t) => t.group === g.id).map((t) => (
            <RailButton
              key={t.id}
              icon={t.icon}
              label={t.label}
              title={t.title}
              active={activeTool === t.id}
              onClick={() => onToolChange(activeTool === t.id ? null : t.id)}
              showLabel={showLabels}
              className={size}
            />
          ))}
        </div>
      ))}
    </nav>
  )
}

export default ToolRail
