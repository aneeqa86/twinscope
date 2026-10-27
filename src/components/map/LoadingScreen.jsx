import { useEffect, useState } from 'react'
import clsx from 'clsx'
import Icon from '@/components/icons/Icon'
import { BrandMark } from '@/components/shell/Brand'

const STAGES = ['Initializing 3D engine', 'Streaming OSM buildings', 'Calibrating digital twin']

// A fixed skyline: [x, width, height]
const TOWERS = [
  [0, 22, 38], [24, 16, 62], [42, 26, 48], [70, 14, 92], [86, 24, 70], [112, 18, 54],
  [132, 12, 118], [146, 26, 84], [174, 20, 60], [196, 16, 104], [214, 28, 74], [244, 18, 50],
  [264, 22, 88], [288, 14, 64], [304, 26, 42], [332, 28, 56],
]
const W = 360
const H = 124

const Skyline = ({ solid }) => (
  <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} fill="none" aria-hidden className="block">
    {TOWERS.map(([x, w, h], i) =>
      solid ? (
        <rect key={i} x={x} y={H - h} width={w} height={h} rx="1.5" fill="var(--ts-text)" opacity={0.86 - (i % 3) * 0.08} />
      ) : (
        <rect key={i} x={x + 0.5} y={H - h + 0.5} width={w - 1} height={h - 1} rx="1.5" stroke="var(--ts-text-3)" strokeWidth="1" strokeDasharray="3 3" />
      )
    )}
  </svg>
)

/**
 * Wireframe city with a solid layer wiped left→right by real load progress.
 * Fades out over 300 ms once loading finishes.
 */
const LoadingScreen = ({ visible, progress = 0, stage = 0, error }) => {
  const [mounted, setMounted] = useState(visible)

  useEffect(() => {
    if (visible) { setMounted(true); return }
    const t = setTimeout(() => setMounted(false), 300)
    return () => clearTimeout(t)
  }, [visible])

  if (!mounted) return null
  const pct = Math.round(Math.min(1, Math.max(0, progress)) * 100)

  return (
    <div
      className="absolute inset-0 z-[100] flex flex-col items-center justify-center gap-10 bg-void px-6"
      style={{ opacity: visible ? 1 : 0, transition: 'opacity 300ms var(--ts-ease-settle)' }}
      role="status"
      aria-live="polite"
      aria-label={error ? 'TwinScope failed to load' : `Loading TwinScope, ${pct}%`}
    >
      <div className="flex items-center gap-3 motion-safe:animate-[ts-in-up_1.2s_var(--ts-ease-settle)_both]">
        <BrandMark size={38} />
        <span className="text-[26px] tracking-[-0.01em] text-ink">
          <span className="font-semibold">Twin</span>
          <span className="font-light">Scope</span>
        </span>
      </div>

      <div className="relative w-full max-w-[360px]">
        <div className="relative overflow-hidden" style={{ height: H }}>
          <div className="absolute inset-0"><Skyline solid={false} /></div>
          <div
            className="absolute inset-0 motion-reduce:hidden"
            style={{ clipPath: `inset(0 ${100 - pct}% 0 0)`, transition: 'clip-path 400ms linear' }}
          >
            <Skyline solid />
          </div>
          <span
            aria-hidden
            className="absolute bottom-0 top-0 w-px bg-accent motion-reduce:hidden"
            style={{ left: `${pct}%`, transition: 'left 400ms linear', boxShadow: '0 0 12px var(--ts-accent)' }}
          />
        </div>
        <div className="h-px bg-line-strong" />
        {/* Reduced motion: a plain bar instead of the wipe */}
        <div className="mt-2 hidden h-1 overflow-hidden rounded-full bg-subtle motion-reduce:block">
          <div className="h-full bg-accent" style={{ width: `${pct}%` }} />
        </div>
      </div>

      {error ? (
        <div className="max-w-[360px] text-center">
          <p className="text-[14px] font-medium text-bad">The 3D engine could not start</p>
          <p className="mt-1.5 font-mono text-[11.5px] text-ink-3">{error}</p>
          <p className="mt-3 text-[12.5px] text-ink-2">Check VITE_CESIUM_ION_TOKEN and that WebGL 2 is available, then reload.</p>
        </div>
      ) : (
        <ol className="flex w-full max-w-[360px] flex-col gap-2">
          {STAGES.map((label, i) => {
            const done = stage > i
            const current = stage === i
            return (
              <li key={label} className={clsx('flex items-center gap-3 font-mono text-[12px]', done ? 'text-ink-2' : current ? 'text-ink' : 'text-ink-3')}>
                <span className={clsx('flex h-4 w-4 items-center justify-center rounded-full', done ? 'bg-accent text-accent-on' : 'border border-line-strong')}>
                  {done && <Icon name="check" size={11} strokeWidth={2.4} />}
                  {current && <span className="h-1.5 w-1.5 rounded-full bg-accent motion-safe:animate-pulse" />}
                </span>
                <span className="flex-1">{label}</span>
                {current && <span className="tabular-nums text-ink-3">{pct}%</span>}
              </li>
            )
          })}
        </ol>
      )}
    </div>
  )
}

export default LoadingScreen
