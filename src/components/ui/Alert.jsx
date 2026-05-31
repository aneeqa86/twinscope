import { cn } from '@/utils'

const styles = {
  info:    'bg-blue-50   border-blue-200  text-blue-800  dark:bg-blue-950  dark:border-blue-800  dark:text-blue-300',
  success: 'bg-green-50  border-green-200 text-green-800 dark:bg-green-950 dark:border-green-800 dark:text-green-300',
  warning: 'bg-yellow-50 border-yellow-200 text-yellow-800 dark:bg-yellow-950 dark:border-yellow-800 dark:text-yellow-300',
  error:   'bg-red-50    border-red-200   text-red-800   dark:bg-red-950   dark:border-red-800   dark:text-red-300',
}

/**
 * Alert — inline status message
 *
 * @example
 * <Alert variant="error">{errorMessage}</Alert>
 * <Alert variant="success">Saved successfully!</Alert>
 */
export default function Alert({ variant = 'info', className, children }) {
  return (
    <div
      role="alert"
      className={cn(
        'rounded-lg border px-4 py-3 text-sm',
        styles[variant],
        className
      )}
    >
      {children}
    </div>
  )
}
