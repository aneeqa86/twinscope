import api from './api'

/**
 * ExampleService
 * Mirrors the Django ExampleRecord REST endpoints.
 * Replace with your own domain resource.
 */
const ExampleService = {
  /**
   * GET /example-records/?province=...&page=1
   * @param {object} params - query params (province, district, page, etc.)
   */
  list: async (params = {}) => {
    const { data } = await api.get('/example-records/', { params })
    return data // { count, next, previous, results: [...] }
  },

  /**
   * GET /example-records/:id/
   */
  get: async (id) => {
    const { data } = await api.get(`/example-records/${id}/`)
    return data
  },

  /**
   * POST /example-records/
   */
  create: async (payload) => {
    const { data } = await api.post('/example-records/', payload)
    return data
  },

  /**
   * PATCH /example-records/:id/
   */
  update: async (id, payload) => {
    const { data } = await api.patch(`/example-records/${id}/`, payload)
    return data
  },

  /**
   * DELETE /example-records/:id/
   */
  remove: async (id) => {
    await api.delete(`/example-records/${id}/`)
  },
}

export default ExampleService
