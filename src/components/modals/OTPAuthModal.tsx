import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence }     from 'framer-motion'
import { Shield, X, RefreshCw, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

const OTP_LENGTH = 6
const TIMER_SECS = 30

interface OTPAuthModalProps {
  isOpen:       boolean
  title?:       string
  description?: string
  onVerify:     (otp: string) => Promise<void> | void
  onClose:      () => void
}

export function OTPAuthModal({
  isOpen,
  title       = 'Authorize Transaction',
  description = 'Enter the 6-digit OTP sent to your registered mobile number.',
  onVerify,
  onClose,
}: OTPAuthModalProps) {
  const [otp,     setOtp]     = useState<string[]>(Array(OTP_LENGTH).fill(''))
  const [timer,   setTimer]   = useState(TIMER_SECS)
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')
  const inputs = useRef<(HTMLInputElement | null)[]>([])

  // Reset state when opened
  useEffect(() => {
    if (isOpen) {
      setOtp(Array(OTP_LENGTH).fill(''))
      setTimer(TIMER_SECS)
      setError('')
      setLoading(false)
      setTimeout(() => inputs.current[0]?.focus(), 100)
    }
  }, [isOpen])

  // Countdown timer
  useEffect(() => {
    if (!isOpen || timer <= 0) return
    const t = setInterval(() => setTimer(s => s - 1), 1000)
    return () => clearInterval(t)
  }, [isOpen, timer])

  function handleChange(index: number, value: string) {
    if (!/^\d*$/.test(value)) return
    const updated = [...otp]
    updated[index] = value.slice(-1)
    setOtp(updated)
    setError('')
    if (value && index < OTP_LENGTH - 1) {
      inputs.current[index + 1]?.focus()
    }
    if (value && updated.every(d => d !== '') && index === OTP_LENGTH - 1) {
      submitOTP(updated.join(''))
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
    const updated = Array(OTP_LENGTH).fill('')
    for (let i = 0; i < pasted.length; i++) updated[i] = pasted[i]
    setOtp(updated)
    inputs.current[Math.min(pasted.length, OTP_LENGTH - 1)]?.focus()
    if (pasted.length === OTP_LENGTH) submitOTP(pasted)
  }

  async function submitOTP(code?: string) {
    const finalOTP = code ?? otp.join('')
    if (finalOTP.length < OTP_LENGTH) {
      setError('Please enter the complete 6-digit code.')
      return
    }
    setLoading(true)
    setError('')
    try {
      await onVerify(finalOTP)
    } catch {
      setError('Verification failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape' && !loading) onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [loading, onClose])

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            key="otp-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => !loading && onClose()}
            className="fixed inset-0 bg-black/50 z-40"
          />

          {/* Modal */}
          <motion.div
            key="otp-modal"
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none"
          >
            <div className="bg-surface-0 rounded-xl shadow-modal border border-border w-full max-w-md mx-4 pointer-events-auto">
              {/* Header */}
              <div className="flex items-start justify-between p-5 border-b border-border">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary-50 flex items-center justify-center">
                    <Shield size={18} className="text-primary-700" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-foreground">{title}</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
                  </div>
                </div>
                {!loading && (
                  <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
                    <X size={18} />
                  </button>
                )}
              </div>

              <div className="p-5 space-y-4">
                {/* OTP inputs */}
                <div className="flex gap-2 justify-center" onPaste={handlePaste}>
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
                      disabled={loading}
                      className={cn(
                        'w-11 h-12 text-center text-lg font-bold rounded-md border-2 bg-surface-50 transition-all',
                        'focus:outline-none focus:ring-0',
                        digit ? 'border-primary-500 bg-primary-50 text-primary-900' : 'border-border text-foreground',
                        error ? 'border-error-400' : '',
                        loading && 'opacity-50 cursor-not-allowed',
                      )}
                    />
                  ))}
                </div>

                {/* Timer / Resend */}
                <div className="text-center">
                  {timer > 0 ? (
                    <p className="text-xs text-muted-foreground">
                      Code expires in{' '}
                      <span className="font-mono font-semibold text-foreground">
                        {String(timer).padStart(2, '0')}s
                      </span>
                    </p>
                  ) : (
                    <button
                      onClick={() => { setTimer(TIMER_SECS); setOtp(Array(OTP_LENGTH).fill('')) }}
                      className="flex items-center gap-1.5 text-xs text-primary-600 hover:text-primary-800 font-medium mx-auto transition-colors"
                    >
                      <RefreshCw size={12} /> Resend OTP
                    </button>
                  )}
                </div>

                {/* Error */}
                <AnimatePresence>
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="flex items-center gap-2 text-sm text-error-600"
                    >
                      <AlertCircle size={14} />
                      <span>{error}</span>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Submit */}
                <button
                  onClick={() => submitOTP()}
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
                      Verifying…
                    </span>
                  ) : 'Verify & Authorize'}
                </button>

                <p className="text-xs text-muted-foreground text-center">
                  Demo: enter any 6 digits
                </p>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
