import { Link } from 'react-router-dom'
import { BrandMark } from '@/components/shell/Brand'

export default function NotFoundPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-void px-4 text-center text-ink">
      <BrandMark size={44} />
      <p className="mt-6 font-mono text-[13px] tracking-[0.12em] text-ink-3">404 · OFF THE MAP</p>
      <h1 className="mt-3 text-[28px] font-semibold tracking-[-0.01em]">Page not found</h1>
      <p className="mt-2 text-[14px] text-ink-2">The page you're looking for doesn't exist or has been moved.</p>
      <Link
        to="/"
        className="ts-transition mt-7 inline-flex h-11 items-center rounded-[11px] bg-accent px-5 text-[14px] font-semibold text-accent-on hover:brightness-110"
      >
        Back to the map
      </Link>
    </main>
  )
}
