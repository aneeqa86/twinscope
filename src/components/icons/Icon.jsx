import { UI_ICONS, POI_GLYPHS } from './iconData'

const renderShapes = (shapes) =>
  shapes.map((s, i) =>
    Array.isArray(s)
      ? <circle key={i} cx={s[0]} cy={s[1]} r={s[2]} />
      : <path key={i} d={s} />
  )

/** UI icon on the 24px grid. Decorative by default; pass `label` to expose it to screen readers. */
export const Icon = ({ name, size = 20, strokeWidth = 1.6, label, className, style }) => {
  const shapes = UI_ICONS[name]
  if (!shapes) return null
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={{ flexShrink: 0, ...style }}
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    >
      {renderShapes(shapes)}
    </svg>
  )
}

/** POI category glyph on the 10px grid. */
export const PoiGlyph = ({ name, size = 12, strokeWidth = 1.2, className }) => {
  const shapes = POI_GLYPHS[name]
  if (!shapes) return null
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 10 10"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      {renderShapes(shapes)}
    </svg>
  )
}

export default Icon
