import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { MessageSquare, RefreshCw, AlertCircle, ChevronLeft } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { useAuth } from '@/context/AuthContext'

const OTP_LENGTH = 6
const TIMER_SECONDS = 30

export function OTPAuth() {
  const navigate            = useNavigate()
  const { verifyOTP, currentUser } = useAuth()
  const [otp, setOtp]       = useState<string[]>(Array(OTP_LENGTH).fill(''))
  const [timer, setTimer]   = useState(TIMER_SECONDS)
  const [loading, setLoading] = useState(false)
  const [error, setError]   = useState('')
  const inputs              = useRef<(HTMLInputElement | null)[]>([])

  useEffect(() => {
    inputs.current[0]?.focus()
  }, [])

  useEffect(() => {
    if (timer <= 0) return
    const t = setInterval(() => setTimer(s => s - 1), 1000)
    return () => clearInterval(t)
  }, [timer])

  function handleChange(index: number, value: string) {
    if (!/^\d*$/.test(value)) return
    const updated = [...otp]
    updated[index] = value.slice(-1)
    setOtp(updated)
    if (value && index < OTP_LENGTH - 1) {
      inputs.current[index + 1]?.focus()
    }
    // Auto-submit when complete
    if (value && updated.every(d => d !== '') && index === OTP_LENGTH - 1) {
      handleVerify(updated.join(''))
    }
  }

  function handleKeyDown(index: number, e: React.KeyboardEvent) {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputs.current[index - 1]?.focus()
    }
  }

  function handlePaste(e: React.ClipboardEvent) {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, OTP_LENGTH)
    const updated = [...otp]
    for (let i = 0; i < pasted.length; i++) updated[i] = pasted[i]
    setOtp(updated)
    inputs.current[Math.min(pasted.length, OTP_LENGTH - 1)]?.focus()
    if (pasted.length === OTP_LENGTH) handleVerify(pasted)
  }

  async function handleVerify(code?: string) {
    const finalOTP = code ?? otp.join('')
    if (finalOTP.length < OTP_LENGTH) { setError('Please enter the complete 6-digit code.'); return }
    setError('')
    setLoading(true)
    await new Promise(r => setTimeout(r, 1400))
    verifyOTP()
    setLoading(false)
    navigate('/consent')
  }

  return (
    <div className="p-8">
      <button
        onClick={() => navigate('/login')}
        className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
      >
        <ChevronLeft size={16} /> Back
      </button>

      <div className="mb-6">
        <h2 className="text-xl font-bold text-foreground">Verify Your Identity</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Two-factor authentication is required for secure access
        </p>
      </div>

      {/* SMS notice */}
      <div className="flex items-start gap-2 p-3 rounded-md bg-success-50 border border-success-200 mb-6 text-xs text-success-700">
        <MessageSquare size={14} className="mt-0.5 flex-shrink-0" />
        <span>
          A 6-digit verification code has been sent to the registered mobile number ending in{' '}
          <span className="font-semibold">••••{currentUser?.mobile?.slice(-4) ?? '3210'}</span>
        </span>
      </div>

      {/* OTP inputs */}
      <div className="flex gap-2 justify-center mb-2" onPaste={handlePaste}>
        {otp.map((digit, i) => (
          <input
            key={i}
            ref={el => { inputs.current[i] = el }}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={digit}
            onChange={e => handleChange(i, e.target.value)}
            onKeyDown={e => handleKeyDown(i, e)}
            className={cn(
              'w-11 h-12 text-center text-lg font-bold rounded-md border-2 bg-surface-50 transition-all',
              'focus:outline-none focus:ring-0',
              digit ? 'border-primary-500 bg-primary-50 text-primary-900' : 'border-border text-foreground',
              error && !digit && 'border-error-400',
            )}
          />
        ))}
      </div>

      {/* Timer */}
      <div className="text-center mb-4">
        {timer > 0 ? (
          <p className="text-xs text-muted-foreground">
            Code expires in <span className="font-mono font-semibold text-foreground">{String(timer).padStart(2,'0')}s</span>
          </p>
        ) : (
          <button
            onClick={() => { setTimer(TIMER_SECONDS); setOtp(Array(OTP_LENGTH).fill('')) }}
            className="flex items-center gap-1.5 text-xs text-primary-600 hover:text-primary-800 font-medium mx-auto transition-colors"
          >
            <RefreshCw size={12} /> Resend OTP
          </button>
        )}
      </div>

      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex items-center gap-2 text-sm text-error-600 mb-4"
          >
            <AlertCircle size={14} />
            <span>{error}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        onClick={() => handleVerify()}
        disabled={loading || otp.some(d => d === '')}
        className={cn(
          'w-full py-2.5 px-4 rounded-md text-sm font-semibold text-white transition-all',
          'bg-primary-900 hover:bg-primary-700 active:scale-[0.98]',
          'disabled:opacity-60 disabled:cursor-not-allowed',
        )}
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Verifying...
          </span>
        ) : 'Verify & Continue'}
      </button>

      <p className="text-xs text-muted-foreground text-center mt-4">
        Demo: enter any 6 digits
      </p>
    </div>
  )
}
