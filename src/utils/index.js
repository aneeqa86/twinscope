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
