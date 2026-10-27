import { useRef, useState } from 'react'
import clsx from 'clsx'
import Icon from '@/components/icons/Icon'
import { Segmented } from '@/components/primitives'
import { TOOLS } from '@/components/shell/tools'

export const SHEET_PEEK = 116
export const SHEET_HALF = 540

const TABS = [
  { id: 'layers', label: 'Layers' },
  { id: 'style',  label: 'Style' },
  { id: 'city',   label: 'City' },
]

/**
 * Mobile bottom sheet. Peek shows the tool row; half shows the Layers / Style / City tabs.
 * Drag the handle (or tap it) to move between detents.
 */
const BottomSheet = ({ detent, onDetentChange, tab, onTabChange, activeTool, onToolChange, children }) => {
  const [dragHeight, setDragHeight] = useState(null)
  const dragRef = useRef(null)
  const maxHalf = Math.min(SHEET_HALF, window.innerHeight - 140)
  const target = detent === 'half' ? maxHalf : SHEET_PEEK
  const height = dragHeight ?? target

  const onPointerDown = (e) => {
    dragRef.current = { startY: e.clientY, startH: target, moved: false }
    e.currentTarget.setPointerCapture(e.pointerId)
  }
  const onPointerMove = (e) => {
    const d = dragRef.current
    if (!d) return
    const dy = d.startY - e.clientY
    if (Math.abs(dy) > 4) d.moved = true
    if (d.moved) setDragHeight(Math.max(SHEET_PEEK - 20, Math.min(maxHalf + 20, d.startH + dy)))
  }
  const onPointerUp = () => {
    const d = dragRef.current
    dragRef.current = null
    if (!d) return
    if (!d.moved) {
      onDetentChange(detent === 'half' ? 'peek' : 'half')
    } else {
      const h = dragHeight ?? target
      onDetentChange(h > (SHEET_PEEK + maxHalf) / 2 ? 'half' : 'peek')
    }
    setDragHeight(null)
  }

  const toolButton = 'ts-transition flex h-[60px] w-14 flex-col items-center justify-center gap-1 rounded-[12px] text-[11px] font-medium'

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-20 flex flex-col overflow-hidden rounded-t-sheet border-t border-line shadow-sheet"
      style={{
        height,
        background: 'var(--ts-glass-sheet)',
        backdropFilter: 'var(--ts-blur)',
        WebkitBackdropFilter: 'var(--ts-blur)',
        transition: dragHeight === null ? 'height var(--ts-dur-sheet) var(--ts-ease-settle)' : 'none',
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}
      role="region"
      aria-label="Map controls"
    >
      <button
        type="button"
        aria-label={detent === 'half' ? 'Collapse panel' : 'Expand panel'}
        aria-expanded={detent === 'half'}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        className="flex h-[22px] w-full shrink-0 touch-none items-center justify-center"
      >
        <span aria-hidden className="h-1 w-10 rounded-full bg-[rgba(244,240,230,0.28)]" />
      </button>

      <nav aria-label="Map tools" className="flex shrink-0 justify-between px-3">
        <button
          type="button"
          onClick={() => { onTabChange('layers'); onDetentChange(detent === 'half' && tab === 'layers' ? 'peek' : 'half') }}
          aria-expanded={detent === 'half'}
          className={clsx(toolButton, detent === 'half' ? 'bg-accent-wash text-accent' : 'text-ink-2')}
        >
          <Icon name="layers" size={22} />
          Layers
        </button>
        {TOOLS.map((t) => (
          <button
            key={t.id}
            type="button"
            aria-pressed={activeTool === t.id}
            title={t.title}
            onClick={() => { onToolChange(activeTool === t.id ? null : t.id); onDetentChange('peek') }}
            className={clsx(toolButton, activeTool === t.id ? 'bg-accent text-accent-on' : 'text-ink-2')}
          >
            <Icon name={t.icon} size={22} />
            {t.label}
          </button>
        ))}
      </nav>

      {detent === 'half' && (
        <div className="flex min-h-0 flex-1 flex-col px-4 pt-3">
          <Segmented size="tab" label="Panel" options={TABS} value={tab} onChange={onTabChange} />
          <div className="ts-scroll mt-3 min-h-0 flex-1 overflow-y-auto pb-6" role="tabpanel">
            {children}
          </div>
        </div>
      )}
    </div>
  )
}

export default BottomSheet
