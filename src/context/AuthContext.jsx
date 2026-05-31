import { createContext, useContext, useEffect, useState } from 'react'
import AuthService from '@/services/authService'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null)
  const [loading, setLoading] = useState(true)

  // Rehydrate user from token on mount
  useEffect(() => {
    const init = async () => {
      if (AuthService.isAuthenticated()) {
        try {
          const profile = await AuthService.getProfile()
          setUser(profile)
        } catch {
          AuthService.logout()
        }
      }
      setLoading(false)
    }
    init()
  }, [])

  const login = async (username, password) => {
    await AuthService.login(username, password)
    const profile = await AuthService.getProfile()
    setUser(profile)
  }

  const logout = () => {
    AuthService.logout()
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  )
}

/** Hook — usage: const { user, login, logout } = useAuth() */
export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}
