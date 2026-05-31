import { Spinner } from '@/components/ui'
import { cn } from '@/utils'

/**
 * DataTable — generic paginated table
 *
 * @example
 * const columns = [
 *   { key: 'name',    label: 'Name' },
 *   { key: 'status',  label: 'Status', render: (v) => <Badge>{v}</Badge> },
 * ]
 * <DataTable columns={columns} rows={data} loading={loading} />
 */
export default function DataTable({
  columns = [],
  rows = [],
  loading = false,
  emptyMessage = 'No records found.',
  className,
}) {
  return (
    <div className={cn('overflow-hidden rounded-xl border border-gray-200 dark:border-gray-800', className)}>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
          <thead className="bg-gray-50 dark:bg-gray-900">
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400"
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white dark:divide-gray-800 dark:bg-gray-950">
            {loading ? (
              <tr>
                <td colSpan={columns.length} className="py-12 text-center">
                  <Spinner className="mx-auto" />
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="py-12 text-center text-sm text-gray-400 dark:text-gray-500">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              rows.map((row, rowIdx) => (
                <tr key={row.id ?? rowIdx} className="hover:bg-gray-50 dark:hover:bg-gray-900">
                  {columns.map((col) => (
                    <td key={col.key} className="whitespace-nowrap px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                      {col.render ? col.render(row[col.key], row) : row[col.key] ?? '—'}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
