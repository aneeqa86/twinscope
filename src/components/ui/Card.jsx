import { cn } from '@/utils'

/**
 * Card — padded surface with optional header and footer slots
 *
 * @example
 * <Card>
 *   <Card.Header title="Users" />
 *   <Card.Body>…content…</Card.Body>
 * </Card>
 */
export default function Card({ className, children, ...props }) {
  return (
    <div className={cn('card', className)} {...props}>
      {children}
    </div>
  )
}

Card.Header = function CardHeader({ title, subtitle, action, className }) {
  return (
    <div className={cn('mb-4 flex items-start justify-between gap-4', className)}>
      <div>
        {title    && <h3 className="text-base font-semibold text-gray-900 dark:text-white">{title}</h3>}
        {subtitle && <p  className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">{subtitle}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  )
}

Card.Body = function CardBody({ className, children }) {
  return <div className={cn('', className)}>{children}</div>
}

Card.Footer = function CardFooter({ className, children }) {
  return (
    <div className={cn('mt-4 border-t border-gray-100 pt-4 dark:border-gray-800', className)}>
      {children}
    </div>
  )
}
