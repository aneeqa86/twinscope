import { forwardRef } from 'react'
import clsx from 'clsx'

const VARIANTS = {
  primary:   'bg-accent text-accent-on font-semibold hover:brightness-110',
  secondary: 'border border-line-strong bg-subtle text-ink font-medium hover:bg-hover',
  ghost:     'text-ink-2 font-medium hover:bg-hover hover:text-ink',
}

/** Text button. `size="lg"` is the 44px mobile size. */
export const Button = forwardRef(({ variant = 'secondary', size = 'md', className, children, ...rest }, ref) => (
  <button
    ref={ref}
    type="button"
    className={clsx(
      'ts-transition inline-flex items-center justify-center gap-1.5 whitespace-nowrap',
      size === 'lg' ? 'h-11 rounded-[11px] px-4 text-[14px]' : 'h-[34px] rounded-[9px] px-3 text-[12.5px]',
      VARIANTS[variant],
      className
    )}
    {...rest}
  >
    {children}
  </button>
))
Button.displayName = 'Button'

/** Square icon-only button. Always give it an aria-label. */
export const IconButton = forwardRef(({ size = 'md', className, children, ...rest }, ref) => (
  <button
    ref={ref}
    type="button"
    className={clsx(
      'ts-transition inline-flex items-center justify-center text-ink-2 hover:bg-hover hover:text-ink',
      size === 'lg' ? 'h-11 w-11 rounded-[11px]' : 'h-[34px] w-[34px] rounded-[9px]',
      className
    )}
    {...rest}
  >
    {children}
  </button>
))
IconButton.displayName = 'IconButton'
