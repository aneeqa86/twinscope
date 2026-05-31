import api from './api'

const AuthService = {
  /**
   * POST /auth/token/
   * Returns { access, refresh }
   */
  login: async (username, password) => {
    const { data } = await api.post('/auth/token/', { username, password })
    localStorage.setItem('access_token', data.access)
    localStorage.setItem('refresh_token', data.refresh)
    return data
  },

  logout: () => {
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
  },

  /**
   * POST /auth/register/
   */
  register: async (payload) => {
    const { data } = await api.post('/auth/register/', payload)
    return data
  },

  /**
   * GET /auth/me/
   */
  getProfile: async () => {
    const { data } = await api.get('/auth/me/')
    return data
  },

  isAuthenticated: () => !!localStorage.getItem('access_token'),
}

export default AuthService
