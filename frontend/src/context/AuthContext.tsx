import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { api, getToken, setToken } from '../lib/api'
import type { AuthResponse, User } from '../lib/types'

interface AuthState {
  user: User | null
  loading: boolean
  isAdmin: boolean
  login: (username: string, password: string) => Promise<User>
  register: (data: { fullName: string; username: string; email?: string; phone: string; password: string }) => Promise<User>
  /** dùng sau khi đăng nhập Google: lưu token rồi tải thông tin người dùng */
  loginWithToken: (token: string) => Promise<User>
  logout: () => void
  setUser: (u: User) => void
}

const AuthContext = createContext<AuthState | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState<boolean>(() => !!getToken())
  const qc = useQueryClient()

  useEffect(() => {
    if (!getToken()) return
    api
      .get<User>('/account/me')
      .then(setUser)
      .catch(() => {
        setToken(null)
        setUser(null)
      })
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    const onExpired = () => setUser(null)
    window.addEventListener('auth:expired', onExpired)
    return () => window.removeEventListener('auth:expired', onExpired)
  }, [])

  const handleAuth = useCallback(
    (res: AuthResponse) => {
      setToken(res.token)
      setUser(res.user)
      qc.invalidateQueries()
      return res.user
    },
    [qc],
  )

  const login = useCallback(
    async (username: string, password: string) =>
      handleAuth(await api.post<AuthResponse>('/auth/login', { username, password })),
    [handleAuth],
  )

  const register = useCallback(
    async (data: { fullName: string; username: string; email?: string; phone: string; password: string }) =>
      handleAuth(await api.post<AuthResponse>('/auth/register', data)),
    [handleAuth],
  )

  const loginWithToken = useCallback(
    async (token: string) => {
      setToken(token)
      try {
        return handleAuth({ token, user: await api.get<User>('/account/me') })
      } catch (err) {
        setToken(null)
        throw err
      }
    },
    [handleAuth],
  )

  const logout = useCallback(() => {
    setToken(null)
    setUser(null)
    qc.clear()
  }, [qc])

  const value = useMemo(
    () => ({ user, loading, isAdmin: user?.role === 'ADMIN', login, register, loginWithToken, logout, setUser }),
    [user, loading, login, register, loginWithToken, logout],
  )
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthState {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
