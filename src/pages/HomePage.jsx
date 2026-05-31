import { useEffect, useState } from 'react'
import { Card, Button, Alert } from '@/components/ui'
import { StatsCard, DataTable } from '@/components/common'
import { useApi } from '@/hooks'
import { ExampleService } from '@/services'
import { formatDate, formatNumber } from '@/utils'

// ── Demo static stats ────────────────────────────────────────────────────────
const STATS = [
  { label: 'Total Records', value: '12,480', delta: '+8.2%', positive: true },
  { label: 'Active Today',  value: '342',    delta: '+3.1%', positive: true },
  { label: 'Pending',       value: '57',     delta: '-12%',  positive: false },
  { label: 'Resolved',      value: '99.1%',  delta: '+0.4%', positive: true },
]

// ── Table column definitions ─────────────────────────────────────────────────
const COLUMNS = [
  { key: 'province_name',  label: 'Province' },
  { key: 'district_name',  label: 'District' },
  { key: 'record_type',    label: 'Type' },
  {
    key: 'positivity_pct',
    label: 'Positivity %',
    render: (v) =>
      v != null ? (
        <span className={v > 10 ? 'font-semibold text-red-600' : 'text-gray-700 dark:text-gray-300'}>
          {formatNumber(v, 1)}%
        </span>
      ) : '—',
  },
  {
    key: 'created_at',
    label: 'Date',
    render: (v) => formatDate(v),
  },
]

// ── Demo fallback rows (shown when API is not connected) ─────────────────────
const DEMO_ROWS = [
  { id: 1, province_name: 'Punjab',    district_name: 'Lahore',    record_type: 'Type A', positivity_pct: 8.4,  created_at: '2024-11-01' },
  { id: 2, province_name: 'Sindh',     district_name: 'Karachi',   record_type: 'Type B', positivity_pct: 14.2, created_at: '2024-11-03' },
  { id: 3, province_name: 'KPK',       district_name: 'Peshawar',  record_type: 'Type A', positivity_pct: 6.1,  created_at: '2024-11-05' },
  { id: 4, province_name: 'Balochistan', district_name: 'Quetta', record_type: 'Type C', positivity_pct: 11.9, created_at: '2024-11-06' },
]

export default function HomePage() {
  const { data, loading, error, execute } = useApi(ExampleService.list)
  const [usedDemo, setUsedDemo] = useState(false)

  useEffect(() => {
    execute().catch(() => setUsedDemo(true))
  }, [execute])

  const rows = usedDemo ? DEMO_ROWS : (data?.results ?? [])

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">

      {/* ── Hero ──────────────────────────────────────────────────────── */}
      <section className="mb-10">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
              Dashboard
            </h1>
            <p className="mt-1 text-base text-gray-500 dark:text-gray-400">
              Welcome to your React + Django boilerplate.
            </p>
          </div>
          <Button variant="primary" size="md" onClick={() => execute().catch(() => setUsedDemo(true))}>
            Refresh data
          </Button>
        </div>
      </section>

      {/* ── API connectivity banner ───────────────────────────────────── */}
      {usedDemo && (
        <Alert variant="info" className="mb-6">
          API not reachable — showing demo data. Start your Django backend at{' '}
          <code className="rounded bg-blue-100 px-1 py-0.5 text-xs dark:bg-blue-900">
            http://localhost:8000
          </code>{' '}
          and refresh.
        </Alert>
      )}
      {error && !usedDemo && (
        <Alert variant="error" className="mb-6">{error}</Alert>
      )}

      {/* ── Stats row ─────────────────────────────────────────────────── */}
      <section className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {STATS.map((s) => (
          <StatsCard key={s.label} {...s} />
        ))}
      </section>

      {/* ── Data table card ───────────────────────────────────────────── */}
      <Card>
        <Card.Header
          title="Recent Records"
          subtitle={`${usedDemo ? DEMO_ROWS.length : (data?.count ?? '…')} total`}
          action={
            <span className="rounded-full bg-primary-50 px-2.5 py-0.5 text-xs font-medium text-primary-700 dark:bg-primary-950 dark:text-primary-400">
              {usedDemo ? 'Demo' : 'Live'}
            </span>
          }
        />
        <Card.Body>
          <DataTable
            columns={COLUMNS}
            rows={rows}
            loading={loading}
            emptyMessage="No records returned from the API."
          />
        </Card.Body>
        {data?.next && (
          <Card.Footer>
            <Button variant="ghost" size="sm">Load more</Button>
          </Card.Footer>
        )}
      </Card>

      {/* ── Quick-start card ──────────────────────────────────────────── */}
      <section className="mt-8 grid gap-4 sm:grid-cols-3">
        {[
          {
            title: 'Add a service',
            body: 'Create a file in src/services/ that calls your new Django endpoint.',
            path: 'src/services/myService.js',
          },
          {
            title: 'Add a page',
            body: 'Drop a new .jsx in src/pages/ and register the route in App.jsx.',
            path: 'src/pages/MyPage.jsx',
          },
          {
            title: 'Add a component',
            body: 'Place reusable UI in src/components/ui/, shared widgets in common/.',
            path: 'src/components/ui/MyComponent.jsx',
          },
        ].map((tip) => (
          <Card key={tip.title} className="flex flex-col gap-2">
            <h3 className="font-semibold text-gray-900 dark:text-white">{tip.title}</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">{tip.body}</p>
            <code className="mt-auto rounded bg-gray-100 px-2 py-1 text-xs text-gray-700 dark:bg-gray-800 dark:text-gray-300">
              {tip.path}
            </code>
          </Card>
        ))}
      </section>
    </div>
  )
}
