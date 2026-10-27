import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, LabelList } from 'recharts'
import Icon from '@/components/icons/Icon'
import { IconButton } from '@/components/primitives'

const BONE = 'rgba(244,240,230,'
const AXIS_TICK = { fill: 'var(--ts-text-3)', fontSize: 10, fontFamily: 'var(--ts-mono)' }

const ChartTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  return (
    <div className="ts-pop !rounded-[10px] px-3 py-2 font-mono text-[11.5px]">
      <p className="text-ink-3">{d.range}</p>
      <p className="text-ink">{d.count.toLocaleString()} buildings</p>
    </div>
  )
}

/** Inspector card: height distribution for the current view. Only the peak bar is accent, and labelled. */
const HeightHistogram = ({ data, total, loading, onClose, bare = false }) => {
  const peakIndex = data.reduce((best, d, i) => (d.count > (data[best]?.count ?? -1) ? i : best), 0)
  const peak = data[peakIndex]
  const hasData = total > 0

  return (
    <section aria-label="Height distribution" className={bare ? '' : 'ts-panel px-4 py-3.5'}>
      <header className="flex items-start justify-between gap-2">
        <div>
          <h2 className="text-[14px] font-semibold text-ink">Height distribution</h2>
          <p className="mt-0.5 font-mono text-[11.5px] text-ink-3">
            {loading ? 'Analysing view…' : hasData ? `${total.toLocaleString()} buildings in view` : 'Buildings in view'}
          </p>
        </div>
        {onClose && (
          <IconButton onClick={onClose} aria-label="Close height distribution" className="-mr-1.5 -mt-1">
            <Icon name="close" size={17} />
          </IconButton>
        )}
      </header>

      <div className="mt-3 h-[132px]" aria-busy={loading}>
        {!hasData && !loading ? (
          <p className="flex h-full items-center justify-center text-[12.5px] text-ink-3">No height data in the current view</p>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 16, right: 0, left: -24, bottom: 0 }} barCategoryGap="30%">
              <CartesianGrid vertical={false} stroke={`${BONE}0.08)`} strokeDasharray="2 4" />
              <XAxis dataKey="lo" tick={AXIS_TICK} axisLine={{ stroke: `${BONE}0.3)` }} tickLine={false} interval={0} />
              <YAxis tick={AXIS_TICK} axisLine={false} tickLine={false} allowDecimals={false} width={44} />
              <Tooltip content={<ChartTooltip />} cursor={{ fill: `${BONE}0.05)` }} />
              <Bar dataKey="count" radius={[3, 3, 0, 0]} isAnimationActive={false}>
                {data.map((d, i) => (
                  <Cell key={d.lo} fill={i === peakIndex ? 'var(--ts-accent)' : `${BONE}0.34)`} />
                ))}
                <LabelList
                  dataKey="count"
                  content={({ x, y, width, index, value }) =>
                    index === peakIndex && value > 0 ? (
                      <text x={x + width / 2} y={y - 5} textAnchor="middle" fontSize={10} fontFamily="var(--ts-mono)" fill="var(--ts-accent)">
                        {value}
                      </text>
                    ) : null
                  }
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {hasData && peak && (
        <p className="mt-2 flex justify-between border-t border-line pt-2.5 text-[12px]">
          <span className="text-ink-3">Most common</span>
          <span className="font-mono text-ink">
            {peak.range} · {Math.round((peak.count / total) * 100)}%
          </span>
        </p>
      )}
    </section>
  )
}

export default HeightHistogram
