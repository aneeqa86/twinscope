import { cn } from '@/utils'

/**
 * StatsCard — displays a single KPI metric
 *
 * @example
 * <StatsCard label="Total Records" value="1,284" delta="+12%" positive />
 */
export default function StatsCard({ label, value, delta, positive, icon, className }) {
  return (
    <div className={cn('card flex flex-col gap-3', className)}>
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-500 dark:text-gray-400">{label}</span>
        {icon && (
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-50 text-primary-600 dark:bg-primary-950 dark:text-primary-400">
            {icon}
          </span>
        )}
      </div>
      <div className="flex items-end justify-between">
        <span className="text-2xl font-bold text-gray-900 dark:text-white">{value}</span>
        {delta && (
          <span
            className={cn(
              'text-sm font-medium',
              positive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
            )}
          >
            {delta}
          </span>
        )}
      </div>
    </div>
  )
}
