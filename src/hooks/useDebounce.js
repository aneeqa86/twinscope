import { useState, useEffect } from 'react'

/**
 * useDebounce — delays updating a value until after a pause
 *
 * @example
 * const debouncedSearch = useDebounce(searchTerm, 400)
 */
export function useDebounce(value, delay = 300) {
  const [debounced, setDebounced] = useState(value)

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])

  return debounced
}
