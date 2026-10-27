import { clsx } from 'clsx'

/**
 * cn — merge Tailwind class names conditionally
 * @example cn('px-4 py-2', isActive && 'bg-primary-600', className)
 */
export function cn(...inputs) {
  return clsx(inputs)
}

/**
 * formatDate — locale-aware date string
 * @example formatDate('2024-01-15') → "Jan 15, 2024"
 */
export function formatDate(dateStr, options = {}) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    ...options,
  })
}

/**
 * formatNumber — locale number with optional decimals
 * @example formatNumber(12500.5, 2) → "12,500.50"
 */
export function formatNumber(value, decimals = 0) {
  if (value === null || value === undefined) return '—'
  return Number(value).toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })
}

/**
 * truncate — clamp a string to maxLen characters
 */
export function truncate(str, maxLen = 80) {
  if (!str) return ''
  return str.length > maxLen ? str.slice(0, maxLen) + '…' : str
}

/**
 * getErrorMessage — extract a readable string from an axios error
 */
export function getErrorMessage(error) {
  return (
    error?.response?.data?.detail ||
    error?.response?.data?.message ||
    error?.message ||
    'An unexpected error occurred.'
  )
}

/** 25.1972 → "25.1972° N" */
export function formatLat(lat) {
  if (lat === null || lat === undefined || isNaN(lat)) return '—'
  return `${Math.abs(lat).toFixed(4)}° ${lat >= 0 ? 'N' : 'S'}`
}

/** 55.2744 → "55.2744° E" */
export function formatLng(lng) {
  if (lng === null || lng === undefined || isNaN(lng)) return '—'
  return `${Math.abs(lng).toFixed(4)}° ${lng >= 0 ? 'E' : 'W'}`
}

/** Altitude in km → "1.82 km" (or metres below 1 km) */
export function formatAlt(km) {
  if (km === null || km === undefined || isNaN(km)) return '—'
  if (km < 1) return `${Math.round(km * 1000)} m`
  return `${km < 100 ? km.toFixed(2) : Math.round(km).toLocaleString()} km`
}

/** Decimal hour → "06:20" (24h) */
export function formatHour24(h) {
  if (h === null || h === undefined || isNaN(h)) return '—'
  let hours = Math.floor(h)
  let mins = Math.round((h - hours) * 60)
  if (mins === 60) { hours += 1; mins = 0 }
  return `${String(hours % 24).padStart(2, '0')}:${String(mins).padStart(2, '0')}`
}
