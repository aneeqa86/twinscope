import { useState, useCallback } from 'react'

/**
 * useApi — generic async hook
 *
 * @example
 * const { data, loading, error, execute } = useApi(ExampleService.list)
 * useEffect(() => { execute({ province: 'Punjab' }) }, [execute])
 */
export function useApi(serviceMethod) {
  const [data, setData]       = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState(null)

  const execute = useCallback(async (...args) => {
    setLoading(true)
    setError(null)
    try {
      const result = await serviceMethod(...args)
      setData(result)
      return result
    } catch (err) {
      const message =
        err.response?.data?.detail ||
        err.response?.data?.message ||
        err.message ||
        'Something went wrong'
      setError(message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [serviceMethod])

  return { data, loading, error, execute }
}
