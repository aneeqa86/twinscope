import clsx from 'clsx'
import Icon from '@/components/icons/Icon'

/**
 * Tool rail button. `active` = exclusive tool (solid accent), `open` = panel toggle
 * (accent wash). Labels hide in compact layouts but stay as the accessible name.
 */
const RailButton = ({ icon, label, active = false, open, showLabel = true, className, ...rest }) => (
  <button
    type="button"
    aria-pressed={open === undefined ? active : undefined}
    aria-expanded={open}
    aria-label={showLabel ? undefined : label}
    title={showLabel ? undefined : label}
    className={clsx(
      'ts-transition flex h-[52px] w-[52px] flex-col items-center justify-center gap-[3px] rounded-[10px]',
      active
        ? 'bg-accent text-accent-on'
        : open
        ? 'bg-accent-wash text-accent'
        : 'text-ink-2 hover:bg-hover hover:text-ink',
      className
    )}
    {...rest}
  >
    <Icon name={icon} size={20} />
    {showLabel && <span className="text-[10.5px] font-medium leading-none">{label}</span>}
  </button>
)

export default RailButton
