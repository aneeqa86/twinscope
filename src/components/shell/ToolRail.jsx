import { RailButton } from '@/components/primitives'
import { TOOLS } from './tools'

const Divider = () => <span aria-hidden className="mx-auto my-1 h-px w-8 bg-line" />

/** Slot B. Layers toggles the side panel; tools are exclusive; Reset is a plain action. */
const ToolRail = ({ activeTool, onToolChange, layersOpen, onLayersToggle, onReset, showLabels = true }) => (
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
    />
    <Divider />
    {TOOLS.map((t) => (
      <RailButton
        key={t.id}
        icon={t.icon}
        label={t.label}
        title={t.title}
        active={activeTool === t.id}
        onClick={() => onToolChange(activeTool === t.id ? null : t.id)}
        showLabel={showLabels}
      />
    ))}
    <Divider />
    <RailButton icon="reset" label="Reset" onClick={onReset} showLabel={showLabels} title="Reset camera" />
  </nav>
)

export default ToolRail
