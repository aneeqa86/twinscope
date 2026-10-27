import clsx from 'clsx'

/** Glass panel over the map. `pop` raises it to popover elevation. */
const Panel = ({ as: Tag = 'div', pop = false, className, children, ...rest }) => (
  <Tag className={clsx(pop ? 'ts-pop' : 'ts-panel', className)} {...rest}>
    {children}
  </Tag>
)

export default Panel
