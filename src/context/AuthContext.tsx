import { createContext, useContext, useReducer, type ReactNode } from 'react'
import type { User, UserRole } from '@/types'
import usersData from '@/data/users.json'

interface AuthState {
  isAuthenticated: boolean
  consentAccepted: boolean
  currentUser: User | null
  otpVerified: boolean
}

type AuthAction =
  | { type: 'LOGIN'; userId: string }
  | { type: 'OTP_VERIFIED' }
  | { type: 'CONSENT_ACCEPTED' }
  | { type: 'LOGOUT' }
  | { type: 'SWITCH_ROLE'; role: UserRole }

const initialState: AuthState = {
  isAuthenticated: false,
  consentAccepted: false,
  currentUser: null,
  otpVerified: false,
}

function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'LOGIN':
      return {
        ...state,
        currentUser: (usersData as User[]).find(u => u.id === action.userId) ?? null,
      }
    case 'OTP_VERIFIED':
      return { ...state, otpVerified: true }
    case 'CONSENT_ACCEPTED':
      return { ...state, isAuthenticated: true, consentAccepted: true }
    case 'LOGOUT':
      return { ...initialState }
    case 'SWITCH_ROLE': {
      const user = (usersData as User[]).find(u => u.role === action.role) ?? state.currentUser
      return { ...state, currentUser: user }
    }
    default:
      return state
  }
}

interface AuthContextValue extends AuthState {
  login: (userId: string) => void
  verifyOTP: () => void
  acceptConsent: () => void
  logout: () => void
  switchRole: (role: UserRole) => void
  hasPermission: (permission: string) => boolean
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(authReducer, initialState)

  const login         = (userId: string)   => dispatch({ type: 'LOGIN', userId })
  const verifyOTP     = ()                  => dispatch({ type: 'OTP_VERIFIED' })
  const acceptConsent = ()                  => dispatch({ type: 'CONSENT_ACCEPTED' })
  const logout        = ()                  => dispatch({ type: 'LOGOUT' })
  const switchRole    = (role: UserRole)    => dispatch({ type: 'SWITCH_ROLE', role })

  const hasPermission = (permission: string) =>
    state.currentUser?.permissions.includes(permission) ?? false

  return (
    <AuthContext.Provider value={{ ...state, login, verifyOTP, acceptConsent, logout, switchRole, hasPermission }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
