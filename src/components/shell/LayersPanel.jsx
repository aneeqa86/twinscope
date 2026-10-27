import Icon from '@/components/icons/Icon'
import { IconButton, Presence } from '@/components/primitives'
import { StyleSection, OsmLayersSection } from '@/components/panels/LayerControls'

/** Slot C: opens beside the rail, never under it. */
const LayersPanel = ({ open, onClose, activeLayer, onLayerChange, activeOsmLayers, onOsmLayerToggle, counts }) => (
  <Presence
    show={open}
    motion="left"
    id="layers-panel"
    role="region"
    aria-label="Layers"
    className="ts-panel absolute bottom-[92px] left-24 top-[84px] z-20 flex w-[336px] flex-col overflow-hidden"
  >
    <header className="flex h-[52px] shrink-0 items-center justify-between border-b border-line pl-4 pr-2">
      <h2 className="text-[14px] font-semibold text-ink">Layers</h2>
      <IconButton onClick={onClose} aria-label="Close layers">
        <Icon name="close" size={17} />
      </IconButton>
    </header>
    <div className="ts-scroll flex flex-1 flex-col gap-6 overflow-y-auto px-4 py-4">
      <StyleSection
        activeLayer={activeLayer}
        onLayerChange={onLayerChange}
        ageOverride={activeOsmLayers.includes('age')}
      />
      <OsmLayersSection
        activeOsmLayers={activeOsmLayers}
        onOsmLayerToggle={onOsmLayerToggle}
        counts={counts}
      />
    </div>
  </Presence>
)

export default LayersPanel
