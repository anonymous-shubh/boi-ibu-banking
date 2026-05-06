import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Eye, EyeOff, Shield, AlertCircle } from 'lucide-react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { useAuth } from '@/context/AuthContext'

export function Login() {
  const navigate          = useNavigate()
  const { login }         = useAuth()
  const [customerId, setCustomerId] = useState('')
  const [password, setPassword]     = useState('')
  const [showPass, setShowPass]     = useState(false)
  const [loading, setLoading]       = useState(false)
  const [error, setError]           = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!customerId.trim() || !password.trim()) {
      setError('Please enter your Customer ID and Password.')
      return
    }
    setLoading(true)
    // Simulate auth delay
    await new Promise(r => setTimeout(r, 1200))
    // For demo: any credentials work; map to Admin by default
    const userId = customerId.toUpperCase().includes('MAKER')
      ? 'BOIGC-MAKER-001'
      : customerId.toUpperCase().includes('CHECKER')
        ? 'BOIGC-CHECKER-001'
        : 'BOIGC-ADMIN-001'
    login(userId)
    setLoading(false)
    navigate('/auth/otp')
  }

  return (
    <div className="p-8">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-foreground">Secure Sign In</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Access your BOI GIFT City IBU account
        </p>
      </div>

      {/* Device trust notice */}
      <div className="flex items-start gap-2 p-3 rounded-md bg-info-50 border border-info-200 mb-6 text-xs text-info-700">
        <Shield size={14} className="mt-0.5 flex-shrink-0" />
        <span>This session will be secured with two-factor authentication. Ensure you are on a trusted device.</span>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">
            Customer ID
          </label>
          <input
            type="text"
            value={customerId}
            onChange={e => setCustomerId(e.target.value)}
            placeholder="e.g. BOIGC-ADMIN-001"
            className={cn(
              'w-full px-3 py-2.5 rounded-md border text-sm bg-surface-50 transition-colors',
              'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500',
              error ? 'border-error-500' : 'border-border',
            )}
            autoComplete="username"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">
            Password
          </label>
          <div className="relative">
            <input
              type={showPass ? 'text' : 'password'}
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Enter your password"
              className={cn(
                'w-full px-3 py-2.5 pr-10 rounded-md border text-sm bg-surface-50 transition-colors',
                'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500',
                error ? 'border-error-500' : 'border-border',
              )}
              autoComplete="current-password"
            />
            <button
              type="button"
              onClick={() => setShowPass(s => !s)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 text-sm text-error-600"
          >
            <AlertCircle size={14} />
            <span>{error}</span>
          </motion.div>
        )}

        <button
          type="submit"
          disabled={loading}
          className={cn(
            'w-full py-2.5 px-4 rounded-md text-sm font-semibold text-white transition-all',
            'bg-primary-900 hover:bg-primary-700 active:scale-[0.98]',
            'disabled:opacity-60 disabled:cursor-not-allowed',
            'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2',
          )}
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Authenticating...
            </span>
          ) : 'Secure Login'}
        </button>
      </form>

      <div className="mt-6 pt-6 border-t border-surface-100">
        <p className="text-xs text-muted-foreground text-center">
          Demo credentials: <span className="font-mono text-primary-600">BOIGC-ADMIN-001</span> / any password
        </p>
        <p className="text-xs text-muted-foreground text-center mt-1">
          Use <span className="font-mono">BOIGC-MAKER-001</span> or <span className="font-mono">BOIGC-CHECKER-001</span> for role-based demo
        </p>
      </div>
    </div>
  )
}
