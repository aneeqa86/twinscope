import { Fragment, useEffect, useRef } from 'react'
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

const FLICK_VELOCITY = 0.11 // px/ms: a quick flick is enough, whatever the distance
const SHEET_TRANSITION = 'transform var(--ts-dur-sheet) cubic-bezier(0.32, 0.72, 0, 1)'

// Past either detent the sheet keeps moving, but with growing resistance
const rubberBand = (overshoot) => Math.sign(overshoot) * Math.sqrt(Math.abs(overshoot)) * 4

/**
 * Mobile bottom sheet. The sheet is always the half height and slides with transform,
 * so dragging never triggers layout. Peek shows the tool row; half shows the tabs.
 */
const BottomSheet = ({ detent, onDetentChange, tab, onTabChange, activeTool, onToolChange, children }) => {
  const sheetRef = useRef(null)
  const dragRef = useRef(null)
  const half = Math.min(SHEET_HALF, window.innerHeight - 140)
  const peekOffset = half - SHEET_PEEK
  const offsetFor = (d) => (d === 'half' ? 0 : peekOffset)

  // Keep the DOM in sync when the detent changes from outside (menu button, city chip)
  useEffect(() => {
    const el = sheetRef.current
    if (!el || dragRef.current) return
    el.style.transition = SHEET_TRANSITION
    el.style.transform = `translateY(${offsetFor(detent)}px)`
  }, [detent, peekOffset])

  const onPointerDown = (e) => {
    if (dragRef.current) return // ignore a second finger mid-drag
    dragRef.current = {
      id: e.pointerId,
      startY: e.clientY,
      startOffset: offsetFor(detent),
      lastY: e.clientY,
      lastT: e.timeStamp,
      velocity: 0,
      moved: false,
    }
    e.currentTarget.setPointerCapture(e.pointerId)
    sheetRef.current.style.transition = 'none'
  }

  const onPointerMove = (e) => {
    const d = dragRef.current
    if (!d || e.pointerId !== d.id) return
    const dy = e.clientY - d.startY
    if (Math.abs(dy) > 4) d.moved = true
    const dt = e.timeStamp - d.lastT
    if (dt > 0) d.velocity = (e.clientY - d.lastY) / dt
    d.lastY = e.clientY
    d.lastT = e.timeStamp
    if (!d.moved) return

    let next = d.startOffset + dy
    if (next < 0) next = rubberBand(next)
    else if (next > peekOffset) next = peekOffset + rubberBand(next - peekOffset)
    sheetRef.current.style.transform = `translateY(${next}px)`
  }

  const onPointerUp = (e) => {
    const d = dragRef.current
    if (!d || e.pointerId !== d.id) return
    dragRef.current = null

    let target
    if (!d.moved) {
      target = detent === 'half' ? 'peek' : 'half'
    } else if (Math.abs(d.velocity) > FLICK_VELOCITY) {
      target = d.velocity < 0 ? 'half' : 'peek'
    } else {
      const current = d.startOffset + (e.clientY - d.startY)
      target = current < peekOffset / 2 ? 'half' : 'peek'
    }

    const el = sheetRef.current
    el.style.transition = SHEET_TRANSITION
    el.style.transform = `translateY(${offsetFor(target)}px)`
    if (target !== detent) onDetentChange(target)
  }

  const isHalf = detent === 'half'
  const toolButton = 'ts-transition flex h-[60px] w-14 shrink-0 snap-start flex-col items-center justify-center gap-1 rounded-[12px] text-[11px] font-medium'

  return (
    <div
      ref={sheetRef}
      className="fixed inset-x-0 bottom-0 z-20 flex flex-col overflow-hidden rounded-t-sheet border-t border-line shadow-sheet"
      style={{
        height: half,
        transform: `translateY(${offsetFor(detent)}px)`,
        transition: SHEET_TRANSITION,
        background: 'var(--ts-glass-sheet)',
        backdropFilter: 'var(--ts-blur)',
        WebkitBackdropFilter: 'var(--ts-blur)',
        willChange: 'transform',
      }}
      role="region"
      aria-label="Map controls"
    >
      <button
        type="button"
        data-no-press
        aria-label={isHalf ? 'Collapse panel' : 'Expand panel'}
        aria-expanded={isHalf}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        className="flex h-[22px] w-full shrink-0 cursor-grab touch-none items-center justify-center active:cursor-grabbing"
      >
        <span aria-hidden className="h-1 w-10 rounded-full bg-[rgba(244,240,230,0.28)]" />
      </button>

      {/* Ten tools: the row scrolls sideways, snapping to buttons */}
      <nav
        aria-label="Map tools"
        className="ts-scroll flex shrink-0 snap-x snap-mandatory gap-1 overflow-x-auto px-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        style={{ touchAction: 'pan-x' }}
      >
        <button
          type="button"
          onClick={() => { onTabChange('layers'); onDetentChange(isHalf && tab === 'layers' ? 'peek' : 'half') }}
          aria-expanded={isHalf}
          className={clsx(toolButton, isHalf ? 'bg-accent-wash text-accent' : 'text-ink-2 active:bg-hover')}
        >
          <Icon name="layers" size={22} />
          Layers
        </button>
        {TOOLS.map((t, i) => (
          <Fragment key={t.id}>
            {(i === 0 || t.group !== TOOLS[i - 1].group) && <span aria-hidden className="my-3 w-px shrink-0 bg-line" />}
            <button
              type="button"
              aria-pressed={activeTool === t.id}
              title={t.title}
              onClick={() => { onToolChange(activeTool === t.id ? null : t.id); onDetentChange('peek') }}
              className={clsx(toolButton, activeTool === t.id ? 'bg-accent text-accent-on' : 'text-ink-2 active:bg-hover')}
            >
              <Icon name={t.icon} size={22} />
              {t.label}
            </button>
          </Fragment>
        ))}
      </nav>

      {/* Always mounted so it slides in with the sheet; inert while only the tool row shows */}
      <div
        className="flex min-h-0 flex-1 flex-col px-4 pt-3"
        style={{ opacity: isHalf ? 1 : 0, transition: `opacity ${isHalf ? 240 : 120}ms var(--ts-ease-settle)` }}
        aria-hidden={!isHalf}
        {...(!isHalf ? { inert: '' } : {})}
      >
        <Segmented size="tab" label="Panel" options={TABS} value={tab} onChange={onTabChange} />
        <div
          className="ts-scroll mt-3 min-h-0 flex-1 overflow-y-auto"
          role="tabpanel"
          style={{ paddingBottom: 'calc(24px + env(safe-area-inset-bottom, 0px))' }}
        >
          {children}
        </div>
      </div>
    </div>
  )
}

export default BottomSheet
