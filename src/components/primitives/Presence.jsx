import { useEffect, useState } from 'react'

const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

/**
 * Keeps children mounted through their exit animation.
 * `motion` picks the keyframe pair in index.css: left | right | up | down | fade.
 */
const Presence = ({ show, motion = 'up', exitMs = 160, className = '', style, children, ...rest }) => {
  const [mounted, setMounted] = useState(show)
  const [lastChildren, setLastChildren] = useState(children)

  useEffect(() => {
    if (show) {
      setMounted(true)
      return
    }
    if (prefersReducedMotion()) {
      setMounted(false)
      return
    }
    const t = setTimeout(() => setMounted(false), exitMs)
    return () => clearTimeout(t)
  }, [show, exitMs])

  // Hold on to the last visible content so the exit animation has something to show
  useEffect(() => {
    if (show) setLastChildren(children)
  }, [show, children])

  if (!mounted) return null

  return (
    <div
      data-state={show ? 'open' : 'closed'}
      className={`ts-motion-${motion} ${className}`}
      style={style}
      {...rest}
    >
      {show ? children : lastChildren}
    </div>
  )
}

export default Presence
