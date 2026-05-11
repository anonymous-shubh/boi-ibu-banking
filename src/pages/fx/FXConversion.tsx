import { useState, useEffect, useRef } from 'react'
import { useNavigate }                 from 'react-router-dom'
import { motion, AnimatePresence }     from 'framer-motion'
import {
  TrendingUp, TrendingDown, Minus, AlertTriangle,
  RefreshCw, Timer, CheckCircle2, ArrowRight,
  LayoutDashboard,
} from 'lucide-react'
import { toast }                       from 'sonner'
import { useBanking }                  from '@/context/BankingContext'
import { useFXRates }                  from '@/hooks/useFXRates'
import { useCharges }                  from '@/hooks/useCharges'
import { ChargesBreakdown }            from '@/components/banking/ChargesBreakdown'
import { OTPAuthModal }                from '@/components/modals/OTPAuthModal'
import { formatINR, formatCurrency, cn } from '@/lib/utils'
import type { FXRate }                 from '@/types'

const LOCK_SECONDS = 30

type Stage = 'board' | 'preview' | 'success'

interface Deal {
  reference: string
  pair: string
  sendAmount: number
  receiveAmount: number
  rate: number
  foreignCurrency: string
  settlementDate: string
}

function RateBoard({ rates }: { rates: FXRate[] }) {
  return (
    <div className="rounded-lg border border-border overflow-hidden">
      <div className="bg-surface-100 px-4 py-2.5 border-b border-border flex items-center gap-2">
        <span className="text-xs font-semibold text-foreground uppercase tracking-wider">FX Rate Board</span>
        <span className="ml-auto text-xs text-warning-600 bg-warning-50 border border-warning-200 rounded px-2 py-0.5">
          Indicative Rates Only
        </span>
      </div>
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-surface-50 border-b border-border">
            {['Currency Pair', 'Bid', 'Ask', 'Spread', 'Spread %', '24h Change'].map(h => (
              <th key={h} className={cn(
                'px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider',
                h !== 'Currency Pair' ? 'text-right' : 'text-left',
              )}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {rates.map(rate => (
            <motion.tr
              key={rate.pair}
              animate={{ opacity: [1, 0.7, 1] }}
              transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 3 + Math.random() * 2 }}
              className="hover:bg-surface-50 transition-colors"
            >
              <td className="px-4 py-3">
                <span className="text-sm font-bold text-foreground">{rate.pair}</span>
              </td>
              <td className="px-4 py-3 text-right font-mono text-sm text-foreground">{rate.bid.toFixed(4)}</td>
              <td className="px-4 py-3 text-right font-mono text-sm font-semibold text-foreground">{rate.ask.toFixed(4)}</td>
              <td className="px-4 py-3 text-right text-xs font-mono text-muted-foreground">{rate.spread.toFixed(4)}</td>
              <td className="px-4 py-3 text-right text-xs font-mono text-muted-foreground">{rate.spreadPct.toFixed(2)}%</td>
              <td className="px-4 py-3 text-right">
                <span className={cn(
                  'flex items-center justify-end gap-1 text-xs font-mono font-medium',
                  rate.change24h > 0  ? 'text-success-600' :
                  rate.change24h < 0  ? 'text-error-600'   :
                                        'text-muted-foreground',
                )}>
                  {rate.change24h > 0  ? <TrendingUp  size={11} /> :
                   rate.change24h < 0  ? <TrendingDown size={11} /> :
                                         <Minus size={11} />}
                  {rate.change24h > 0 ? '+' : ''}{rate.change24h.toFixed(4)}
                </span>
              </td>
            </motion.tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function RateLockCountdown({ seconds, onExpire }: { seconds: number; onExpire: () => void }) {
  const [remaining, setRemaining] = useState(seconds)

  useEffect(() => {
    const t = setInterval(() => {
      setRemaining(s => {
        if (s <= 1) { clearInterval(t); onExpire(); return 0 }
        return s - 1
      })
    }, 1000)
    return () => clearInterval(t)
  }, [onExpire])

  const pct = (remaining / seconds) * 100

  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-1.5 text-xs text-warning-700">
        <Timer size={13} />
        Rate locked for{' '}
        <span className={cn('font-mono font-bold', remaining <= 10 ? 'text-error-600 animate-pulse' : 'text-warning-800')}>
          {String(remaining).padStart(2, '0')}s
        </span>
      </div>
      <div className="flex-1 h-1.5 bg-surface-100 rounded-full overflow-hidden">
        <motion.div
          className={cn('h-full rounded-full', remaining <= 10 ? 'bg-error-500' : 'bg-warning-500')}
          initial={{ width: '100%' }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.5 }}
        />
      </div>
    </div>
  )
}

export function FXConversion() {
  const navigate   = useNavigate()
  const rates      = useFXRates()
  const { accounts } = useBanking()

  const [stage,       setStage]       = useState<Stage>('board')
  const [pair,        setPair]        = useState('USD/INR')
  const [sendAmount,  setSendAmount]  = useState('')
  const [lockedRate,  setLockedRate]  = useState<FXRate | null>(null)
  const [otpOpen,     setOtpOpen]     = useState(false)
  const [deal,        setDeal]        = useState<Deal | null>(null)
  const otpRef = useRef(false)

  const inrAccount    = accounts.find(a => a.primary)
  const numAmount     = parseFloat(sendAmount.replace(/,/g, '')) || 0
  const selectedRate  = (lockedRate ?? rates.find(r => r.pair === pair))!

  // Charges for FX conversion
  const charges = useCharges({
    transferType: 'fx_conversion',
    amount: numAmount,
    fxRate: selectedRate?.ask,
    fxSpreadPct: selectedRate?.spreadPct,
  })

  const spreadAmount  = numAmount * (selectedRate?.spreadPct ?? 0) / 100
  const receiveAmount = selectedRate?.ask && numAmount > 0
    ? parseFloat(((numAmount - spreadAmount - charges.bankProcessingCharge - charges.gstOnCharges) / selectedRate.ask).toFixed(2))
    : 0

  function handlePreview() {
    if (!numAmount || numAmount <= 0) { toast.error('Please enter an amount to convert.'); return }
    if (!inrAccount || numAmount > inrAccount.available) { toast.error('Insufficient balance in INR Primary Account.'); return }
    setLockedRate(rates.find(r => r.pair === pair) ?? null)
    setStage('preview')
  }

  function handleExpire() {
    toast.warning('Rate lock expired. Please request a new quote.')
    setLockedRate(null)
    setStage('board')
  }

  async function handleConfirm() {
    setOtpOpen(true)
  }

  async function handleOTPVerify() {
    await new Promise(r => setTimeout(r, 1500))
    const [foreignCurrency] = pair.split('/')
    setDeal({
      reference:       `FX-ARTTHA-${new Date().getFullYear()}${String(Date.now()).slice(-6)}`,
      pair,
      sendAmount:      numAmount,
      receiveAmount,
      rate:            selectedRate.ask,
      foreignCurrency,
      settlementDate:  new Date(Date.now() + 2 * 86400000).toISOString().slice(0, 10),
    })
    setStage('success')
  }

  // ── Rate board ──────────────────────────────────────────────────────────────
  if (stage === 'board' || stage === 'preview') return (
    <div className="p-6 space-y-5 max-w-[1400px]">
      <div>
        <h1 className="page-title">FX Conversion</h1>
        <p className="page-subtitle text-muted-foreground mt-0.5">
          Convert between currencies using live indicative rates
        </p>
      </div>

      {/* Indicative disclaimer */}
      <div className="flex items-start gap-2 p-3 rounded-md bg-warning-50 border border-warning-200 text-xs text-warning-800">
        <AlertTriangle size={14} className="flex-shrink-0 mt-0.5" />
        <span>
          All rates shown are <strong>indicative</strong> and subject to change. Final rate confirmed at execution.
          As per IFSCA circular IFSCA/IBU/2024/012.
        </span>
      </div>

      <div className="grid grid-cols-3 gap-5">
        {/* Left: Rate board + conversion panel */}
        <div className="col-span-2 space-y-4">
          <RateBoard rates={rates} />

          {/* Conversion panel */}
          <div className="card-base p-5 space-y-4">
            <h2 className="text-sm font-semibold text-foreground">New Conversion</h2>

            {stage === 'preview' && lockedRate && (
              <div className="p-3 bg-warning-50 border border-warning-200 rounded-md">
                <RateLockCountdown seconds={LOCK_SECONDS} onExpire={handleExpire} />
                <p className="text-xs text-warning-700 mt-1.5">
                  Locked rate: 1 {pair.split('/')[0]} = <strong>₹{lockedRate.ask.toFixed(4)}</strong>
                </p>
              </div>
            )}

            {/* Currency pair */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-foreground mb-1.5">Currency Pair</label>
                <select
                  value={pair}
                  onChange={e => { setPair(e.target.value); setStage('board'); setLockedRate(null) }}
                  disabled={stage === 'preview'}
                  className="w-full px-3 py-2.5 text-sm border border-border rounded-md bg-surface-50 focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-60"
                >
                  {rates.map(r => (
                    <option key={r.pair} value={r.pair}>{r.pair}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-foreground mb-1.5">Source Account</label>
                <div className="px-3 py-2.5 text-sm border border-border rounded-md bg-surface-100 text-muted-foreground">
                  🇮🇳 {inrAccount?.name ?? 'INR Primary'} — {formatINR(inrAccount?.available ?? 0)}
                </div>
              </div>
            </div>

            {/* Amount */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-foreground mb-1.5">You Send</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">₹</span>
                  <input
                    type="text"
                    value={sendAmount}
                    onChange={e => {
                      if (stage === 'preview') return
                      setSendAmount(e.target.value.replace(/[^0-9.]/g, ''))
                    }}
                    disabled={stage === 'preview'}
                    placeholder="0.00"
                    className="w-full pl-7 pr-3 py-2.5 text-sm border border-border rounded-md bg-surface-50 font-mono focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-60"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-foreground mb-1.5">
                  You Receive (est.)
                </label>
                <div className="px-3 py-2.5 text-sm border border-border rounded-md bg-surface-50 font-mono font-semibold text-success-700">
                  {receiveAmount > 0
                    ? formatCurrency(receiveAmount, pair.split('/')[0])
                    : '—'}
                </div>
              </div>
            </div>

            {/* Current rate display */}
            {selectedRate && (
              <div className="grid grid-cols-3 gap-3 text-xs text-muted-foreground bg-surface-100 rounded-md p-3">
                <div>
                  <p>Bid</p>
                  <p className="font-mono font-semibold text-foreground">{selectedRate.bid.toFixed(4)}</p>
                </div>
                <div>
                  <p>Ask (Applied)</p>
                  <p className="font-mono font-semibold text-primary-700">{selectedRate.ask.toFixed(4)}</p>
                </div>
                <div>
                  <p>Spread</p>
                  <p className="font-mono font-semibold text-foreground">{selectedRate.spreadPct.toFixed(2)}%</p>
                </div>
              </div>
            )}

            {/* CTA */}
            {stage === 'board' ? (
              <motion.button
                onClick={handlePreview}
                disabled={!numAmount || numAmount <= 0}
                whileTap={numAmount > 0 ? { scale: 0.98 } : undefined}
                className={cn(
                  'w-full py-3 rounded-md text-sm font-semibold transition-all flex items-center justify-center gap-2',
                  numAmount > 0
                    ? 'bg-primary-900 text-white hover:bg-primary-700'
                    : 'bg-surface-300 text-muted-foreground cursor-not-allowed',
                )}
              >
                <RefreshCw size={16} />
                Preview Conversion
              </motion.button>
            ) : (
              <motion.button
                onClick={handleConfirm}
                whileTap={{ scale: 0.98 }}
                className="w-full py-3 rounded-md text-sm font-semibold bg-success-600 text-white hover:bg-success-700 transition-all flex items-center justify-center gap-2"
              >
                <CheckCircle2 size={16} />
                Confirm Conversion
                <ArrowRight size={14} />
              </motion.button>
            )}
          </div>
        </div>

        {/* Right: Charges preview */}
        <div className="space-y-4">
          <AnimatePresence>
            {numAmount > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
              >
                <ChargesBreakdown
                  data={charges}
                  fxSpreadAmount={spreadAmount}
                  foreignCurrency={pair.split('/')[0]}
                  foreignAmount={receiveAmount}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* OTP Modal */}
      <OTPAuthModal
        isOpen={otpOpen}
        title="Confirm FX Conversion"
        description={`Authorize conversion of ${formatINR(numAmount)} at rate 1 ${pair.split('/')[0]} = ₹${selectedRate?.ask.toFixed(2)}.`}
        onVerify={handleOTPVerify}
        onClose={() => setOtpOpen(false)}
      />
    </div>
  )

  // ── Success ─────────────────────────────────────────────────────────────────
  return (
    <div className="p-6 flex items-center justify-center min-h-[70vh]">
      <div className="w-full max-w-lg">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 260, damping: 20 }}
          className="flex justify-center mb-6"
        >
          <div className="w-20 h-20 rounded-full bg-success-50 border-4 border-success-100 flex items-center justify-center">
            <CheckCircle2 size={40} className="text-success-600" />
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-foreground">Conversion Confirmed</h1>
            <p className="text-sm text-muted-foreground mt-1">Your FX conversion has been booked successfully.</p>
          </div>

          {deal && (
            <div className="card-base p-6 mb-5 space-y-3">
              <div className="text-center pb-4 border-b border-border">
                <p className="text-xs text-muted-foreground mb-1">You Sent</p>
                <p className="text-3xl font-bold font-mono">{formatINR(deal.sendAmount)}</p>
                <p className="text-sm text-muted-foreground mt-1">
                  You Receive: <span className="font-mono font-semibold text-success-700">
                    {formatCurrency(deal.receiveAmount, deal.foreignCurrency)}
                  </span>
                </p>
              </div>
              {[
                { label: 'Deal Reference', value: deal.reference, mono: true },
                { label: 'Pair',           value: deal.pair },
                { label: 'Booked Rate',    value: `1 ${deal.foreignCurrency} = ₹${deal.rate.toFixed(4)}`, mono: true },
                { label: 'Settlement',     value: `T+2 — ${deal.settlementDate}` },
              ].map(({ label, value, mono }) => (
                <div key={label} className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">{label}</span>
                  <span className={cn('font-medium text-foreground', mono && 'font-mono')}>{value}</span>
                </div>
              ))}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => { setStage('board'); setSendAmount(''); setDeal(null); setLockedRate(null) }}
              className="py-2.5 rounded-md border border-border text-sm font-medium text-foreground hover:bg-surface-100 transition-colors"
            >
              Book Another
            </button>
            <button
              onClick={() => navigate('/dashboard')}
              className="py-2.5 rounded-md bg-primary-900 text-white text-sm font-semibold hover:bg-primary-700 transition-colors flex items-center justify-center gap-2"
            >
              <LayoutDashboard size={15} />
              Dashboard
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
