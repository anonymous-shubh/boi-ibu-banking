import { useState }               from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  PiggyBank, Plus, X, AlertTriangle,
  CheckCircle2, Clock, TrendingUp, ChevronDown, ChevronUp,
} from 'lucide-react'
import { toast }                   from 'sonner'
import { OTPAuthModal }            from '@/components/modals/OTPAuthModal'
import { formatINR, formatDate, cn } from '@/lib/utils'
import fixedDepositsData           from '@/data/fixedDeposits.json'
import type { FixedDeposit as FDType } from '@/types'

const INITIAL_FDS = fixedDepositsData as FDType[]

const RATE_SCHEDULE: Record<string, number> = {
  '3M':  6.50,
  '6M':  7.00,
  '9M':  7.15,
  '12M': 7.25,
  '18M': 7.40,
  '24M': 7.50,
  '36M': 7.60,
}

const TENURE_MONTHS: Record<string, number> = {
  '3M': 3, '6M': 6, '9M': 9, '12M': 12, '18M': 18, '24M': 24, '36M': 36,
}

function daysRemaining(maturityDate: string) {
  const diff = new Date(maturityDate).getTime() - Date.now()
  return Math.max(0, Math.ceil(diff / 86400000))
}

function calcMaturityAmount(principal: number, rate: number, tenureMonths: number) {
  return parseFloat((principal * (1 + (rate / 100) * (tenureMonths / 12))).toFixed(2))
}

function calcAccruedInterest(principal: number, rate: number, startDate: string) {
  const days = Math.ceil((Date.now() - new Date(startDate).getTime()) / 86400000)
  return parseFloat((principal * (rate / 100) * (days / 365)).toFixed(2))
}

// ── FD Card ──────────────────────────────────────────────────────────────────

function FDCard({
  fd,
  isExpanded,
  onToggle,
  onWithdraw,
}: {
  fd: FDType
  isExpanded: boolean
  onToggle: () => void
  onWithdraw: () => void
}) {
  const daysLeft   = daysRemaining(fd.maturityDate)
  const progress   = 1 - daysLeft / (fd.tenureMonths * 30)
  const isMaturing = daysLeft < 30

  return (
    <div className={cn(
      'rounded-xl border transition-all',
      isExpanded ? 'border-primary-300 shadow-card' : 'border-border card-base',
    )}>
      {/* Card header */}
      <div
        className="flex items-start justify-between p-5 cursor-pointer"
        onClick={onToggle}
      >
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-accent-light flex items-center justify-center">
            <PiggyBank size={20} className="text-accent-gold" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <p className="text-sm font-bold text-foreground">{formatINR(fd.principal, true)}</p>
              <span className={cn(
                'text-xs rounded-full px-2.5 py-0.5 font-medium',
                fd.status === 'active'              && 'bg-success-50 text-success-700',
                fd.status === 'withdrawal_requested' && 'bg-warning-50 text-warning-700',
                fd.status === 'matured'             && 'bg-info-50 text-info-700',
              )}>
                {fd.status === 'active'               ? 'Active' :
                 fd.status === 'withdrawal_requested' ? 'Withdrawal Requested' : 'Matured'}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              {fd.tenure} @ <strong>{fd.rate}% p.a.</strong> · Matures {formatDate(fd.maturityDate)}
            </p>
            <p className="text-xs font-mono text-muted-foreground">{fd.id}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {isMaturing && (
            <span className="text-xs bg-warning-50 text-warning-700 border border-warning-200 rounded-full px-2 py-0.5 flex items-center gap-1">
              <Clock size={11} /> Matures in {daysLeft}d
            </span>
          )}
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Maturity Amount</p>
            <p className="text-sm font-bold font-mono text-success-700">{formatINR(fd.maturityAmount, true)}</p>
          </div>
          {isExpanded ? <ChevronUp size={16} className="text-muted-foreground" /> : <ChevronDown size={16} className="text-muted-foreground" />}
        </div>
      </div>

      {/* Progress bar */}
      <div className="px-5 pb-4">
        <div className="flex items-center justify-between text-xs text-muted-foreground mb-1.5">
          <span>{formatDate(fd.startDate)}</span>
          <span>{daysLeft > 0 ? `${daysLeft} days remaining` : 'Matured'}</span>
          <span>{formatDate(fd.maturityDate)}</span>
        </div>
        <div className="h-1.5 bg-surface-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-accent-gold rounded-full transition-all"
            style={{ width: `${Math.min(progress * 100, 100)}%` }}
          />
        </div>
      </div>

      {/* Expanded details */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5 pt-2 border-t border-border space-y-4">
              <div className="grid grid-cols-3 gap-4 text-xs">
                {[
                  { label: 'Principal',      value: formatINR(fd.principal) },
                  { label: 'Interest Rate',  value: `${fd.rate}% p.a.` },
                  { label: 'Tenure',         value: fd.tenure },
                  { label: 'Currency',       value: '🇮🇳 INR (Fixed)' },
                  { label: 'Accrued Interest', value: formatINR(calcAccruedInterest(fd.principal, fd.rate, fd.startDate), true) },
                  { label: 'Instructions',   value: fd.instructions === 'auto_renew' ? 'Auto-Renew' : 'Credit to Account' },
                ].map(({ label, value }) => (
                  <div key={label}>
                    <p className="text-muted-foreground">{label}</p>
                    <p className="font-semibold text-foreground mt-0.5">{value}</p>
                  </div>
                ))}
              </div>

              {fd.status === 'active' && (
                <button
                  onClick={onWithdraw}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-md border-2 border-warning-400 text-warning-700 text-xs font-semibold hover:bg-warning-50 transition-colors"
                >
                  <AlertTriangle size={14} />
                  Request Premature Withdrawal
                </button>
              )}

              {fd.status === 'withdrawal_requested' && (
                <div className="flex items-center gap-2 p-3 bg-warning-50 border border-warning-200 rounded-md text-xs text-warning-700">
                  <Clock size={13} />
                  Withdrawal request submitted. Estimated settlement: T+1 business day.
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ── Premature Withdrawal Modal ───────────────────────────────────────────────

function PrematureWithdrawalModal({
  fd,
  onClose,
  onConfirm,
}: {
  fd: FDType
  onClose:   () => void
  onConfirm: () => void
}) {
  const [acknowledged, setAcknowledged] = useState(false)
  const [otpOpen,      setOtpOpen]      = useState(false)

  const accruedInterest = calcAccruedInterest(fd.principal, fd.rate, fd.startDate)
  const penaltyDeduction = parseFloat((fd.principal * (fd.penaltyRate / 100) * (
    Math.ceil((Date.now() - new Date(fd.startDate).getTime()) / 86400000) / 365
  )).toFixed(2))
  const effectiveRate   = fd.rate - fd.penaltyRate
  const netPayable      = fd.principal + accruedInterest - penaltyDeduction

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/50 z-40"
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96 }}
        className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none"
      >
        <div className="bg-surface-0 rounded-xl shadow-modal border border-border w-full max-w-lg mx-4 pointer-events-auto">
          <div className="flex items-start justify-between p-5 border-b border-border">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-warning-50 flex items-center justify-center">
                <AlertTriangle size={18} className="text-warning-600" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-foreground">Premature Withdrawal Notice</h3>
                <p className="text-xs text-muted-foreground mt-0.5">Please review the penalty before confirming.</p>
              </div>
            </div>
            <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
              <X size={18} />
            </button>
          </div>

          <div className="p-5 space-y-4">
            {/* Penalty breakdown */}
            <div className="rounded-lg border border-border overflow-hidden">
              <div className="flex">
                <div className="w-1 bg-warning-500 flex-shrink-0" />
                <div className="flex-1 p-4 space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Original Rate</span>
                    <span className="font-semibold text-foreground">{fd.rate}% p.a.</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Penalty</span>
                    <span className="font-semibold text-error-600">-{fd.penaltyRate}% p.a.</span>
                  </div>
                  <div className="flex justify-between border-t border-border pt-2">
                    <span className="text-muted-foreground">Effective Rate</span>
                    <span className="font-bold text-foreground">{effectiveRate}% p.a.</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Principal</span>
                    <span className="font-mono text-foreground">{formatINR(fd.principal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Accrued Interest</span>
                    <span className="font-mono text-success-600">{formatINR(accruedInterest)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Penalty Deduction</span>
                    <span className="font-mono text-error-600">-{formatINR(penaltyDeduction)}</span>
                  </div>
                  <div className="flex justify-between border-t-2 border-primary-200 pt-2">
                    <span className="font-bold text-foreground">Estimated Net Payable</span>
                    <span className="font-bold font-mono text-success-700">{formatINR(netPayable)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Warning */}
            <div className="flex items-start gap-2 p-3 bg-error-50 border border-error-200 rounded-md text-xs text-error-700">
              <AlertTriangle size={13} className="flex-shrink-0 mt-0.5" />
              <span>This action is <strong>irreversible</strong> once submitted. The FD will be closed and funds credited to your INR Primary Account.</span>
            </div>

            {/* Acknowledgement */}
            <label className="flex items-start gap-2 cursor-pointer">
              <div
                onClick={() => setAcknowledged(prev => !prev)}
                className={cn(
                  'mt-0.5 w-4 h-4 rounded border-2 flex-shrink-0 flex items-center justify-center transition-all',
                  acknowledged ? 'bg-primary-900 border-primary-900' : 'border-border',
                )}
              >
                {acknowledged && <CheckCircle2 size={11} className="text-white" />}
              </div>
              <span className="text-xs text-foreground">
                I understand the penalty implications and acknowledge this request is irreversible.
              </span>
            </label>

            <button
              onClick={() => acknowledged && setOtpOpen(true)}
              disabled={!acknowledged}
              className={cn(
                'w-full py-2.5 rounded-md text-sm font-semibold transition-all',
                acknowledged
                  ? 'bg-warning-600 text-white hover:bg-warning-700'
                  : 'bg-surface-300 text-muted-foreground cursor-not-allowed',
              )}
            >
              Submit Withdrawal Request
            </button>
          </div>
        </div>
      </motion.div>

      <OTPAuthModal
        isOpen={otpOpen}
        title="Authorize Withdrawal"
        description="Enter OTP to authorize the premature withdrawal request."
        onVerify={async () => {
          await new Promise(r => setTimeout(r, 1200))
          onConfirm()
        }}
        onClose={() => setOtpOpen(false)}
      />
    </>
  )
}

// ── Create FD Drawer ─────────────────────────────────────────────────────────

function CreateFDDrawer({ onClose, onAdd }: { onClose: () => void; onAdd: (fd: FDType) => void }) {
  const [principal, setPrincipal] = useState('')
  const [tenure,    setTenure]    = useState('12M')
  const [instructions, setInstructions] = useState<'auto_renew' | 'credit_to_account'>('credit_to_account')
  const [agreed,    setAgreed]    = useState(false)
  const [otpOpen,   setOtpOpen]   = useState(false)

  const numPrincipal = parseFloat(principal.replace(/,/g, '')) || 0
  const rate         = RATE_SCHEDULE[tenure]
  const tenureMonths = TENURE_MONTHS[tenure]
  const maturityDate = new Date(Date.now() + tenureMonths * 30 * 86400000).toISOString().slice(0, 10)
  const maturityAmt  = numPrincipal > 0 ? calcMaturityAmount(numPrincipal, rate, tenureMonths) : 0

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/40 z-30"
      />
      <motion.div
        initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
        transition={{ type: 'tween', duration: 0.25 }}
        className="fixed right-0 top-0 h-full w-[480px] bg-surface-0 shadow-modal z-40 flex flex-col"
      >
        <div className="flex items-center justify-between p-5 border-b border-border flex-shrink-0">
          <div>
            <h3 className="text-sm font-bold text-foreground">Create Fixed Deposit</h3>
            <p className="text-xs text-muted-foreground mt-0.5">All FDs are INR-denominated only</p>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Currency locked to INR */}
          <div>
            <label className="block text-xs font-medium text-foreground mb-1.5">Currency</label>
            <div className="px-3 py-2.5 rounded-md bg-surface-100 border border-border text-sm text-muted-foreground flex items-center gap-2">
              🇮🇳 INR — Indian Rupee
              <span className="ml-auto text-xs bg-primary-50 text-primary-700 rounded px-2 py-0.5">Fixed</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">As per IFSCA guidelines, IBU Fixed Deposits are INR-only.</p>
          </div>

          {/* Source account */}
          <div>
            <label className="block text-xs font-medium text-foreground mb-1.5">Source Account</label>
            <div className="px-3 py-2.5 rounded-md bg-surface-100 border border-border text-sm text-muted-foreground">
              🇮🇳 INR Primary Account — BOIGC001
            </div>
          </div>

          {/* Principal */}
          <div>
            <label className="block text-xs font-medium text-foreground mb-1.5">Principal Amount (₹)</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">₹</span>
              <input
                type="text"
                value={principal}
                onChange={e => setPrincipal(e.target.value.replace(/[^0-9.]/g, ''))}
                placeholder="e.g. 20000000"
                className="w-full pl-7 pr-3 py-2.5 text-sm border border-border rounded-md bg-surface-50 font-mono focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            {numPrincipal > 0 && (
              <p className="text-xs text-muted-foreground mt-1">{formatINR(numPrincipal)}</p>
            )}
          </div>

          {/* Tenure */}
          <div>
            <label className="block text-xs font-medium text-foreground mb-1.5">Tenure</label>
            <div className="grid grid-cols-4 gap-2">
              {Object.keys(RATE_SCHEDULE).map(t => (
                <button
                  key={t}
                  onClick={() => setTenure(t)}
                  className={cn(
                    'py-2 rounded-md text-xs font-semibold border-2 transition-all',
                    tenure === t
                      ? 'border-primary-500 bg-primary-50 text-primary-700'
                      : 'border-border bg-surface-0 text-muted-foreground hover:border-primary-300',
                  )}
                >
                  {t}
                  <span className="block text-xs font-normal">{RATE_SCHEDULE[t]}%</span>
                </button>
              ))}
            </div>
          </div>

          {/* Interest rate display */}
          <div className="p-3 bg-success-50 border border-success-200 rounded-md flex items-center gap-3">
            <TrendingUp size={16} className="text-success-600 flex-shrink-0" />
            <div className="text-xs">
              <p className="font-semibold text-success-800">Interest Rate: {rate}% p.a. (Simple Interest)</p>
              <p className="text-success-700 mt-0.5">Maturity Date: {formatDate(maturityDate)}</p>
            </div>
          </div>

          {/* Maturity amount preview */}
          {maturityAmt > 0 && (
            <div className="p-3 bg-accent-light border border-accent-gold/30 rounded-md flex items-center justify-between">
              <span className="text-xs font-semibold text-foreground">Maturity Amount</span>
              <span className="text-sm font-bold font-mono text-accent-gold">{formatINR(maturityAmt, true)}</span>
            </div>
          )}

          {/* Instructions at maturity */}
          <div>
            <label className="block text-xs font-medium text-foreground mb-2">Instructions at Maturity</label>
            <div className="space-y-2">
              {([
                { value: 'credit_to_account', label: 'Credit principal + interest to account' },
                { value: 'auto_renew',         label: 'Auto-renew for the same tenure' },
              ] as const).map(({ value, label }) => (
                <label key={value} className="flex items-center gap-2 cursor-pointer">
                  <div
                    onClick={() => setInstructions(value)}
                    className={cn(
                      'w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all',
                      instructions === value ? 'border-primary-900 bg-primary-900' : 'border-border',
                    )}
                  >
                    {instructions === value && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                  </div>
                  <span className="text-sm text-foreground">{label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Terms */}
          <label className="flex items-start gap-2 cursor-pointer">
            <div
              onClick={() => setAgreed(prev => !prev)}
              className={cn(
                'mt-0.5 w-4 h-4 rounded border-2 flex-shrink-0 flex items-center justify-center transition-all',
                agreed ? 'bg-primary-900 border-primary-900' : 'border-border',
              )}
            >
              {agreed && <CheckCircle2 size={11} className="text-white" />}
            </div>
            <span className="text-xs text-foreground">
              I confirm the details above and accept the Fixed Deposit terms including the premature withdrawal penalty of {INITIAL_FDS[0]?.penaltyRate ?? 1}% p.a.
            </span>
          </label>
        </div>

        <div className="p-5 border-t border-border flex-shrink-0">
          <button
            onClick={() => numPrincipal > 0 && agreed && setOtpOpen(true)}
            disabled={!numPrincipal || !agreed}
            className={cn(
              'w-full py-2.5 rounded-md text-sm font-semibold transition-all',
              numPrincipal > 0 && agreed
                ? 'bg-primary-900 text-white hover:bg-primary-700'
                : 'bg-surface-300 text-muted-foreground cursor-not-allowed',
            )}
          >
            Create Fixed Deposit
          </button>
        </div>
      </motion.div>

      <OTPAuthModal
        isOpen={otpOpen}
        title="Authorize FD Creation"
        description={`Enter OTP to create FD of ${formatINR(numPrincipal, true)} for ${tenure} @ ${rate}% p.a.`}
        onVerify={async () => {
          await new Promise(r => setTimeout(r, 1200))
          const newFD: FDType = {
            id:           `FD-BOIGC-INR-${new Date().getFullYear()}-${Date.now().toString().slice(-4)}`,
            currency:     'INR',
            principal:    numPrincipal,
            rate,
            tenure:       `${tenureMonths} Months`,
            tenureMonths,
            startDate:    new Date().toISOString().slice(0, 10),
            maturityDate,
            maturityAmount: maturityAmt,
            status:       'active',
            penaltyRate:  1.00,
            instructions,
            sourceAccountId: 'BOIGC001',
          }
          onAdd(newFD)
          toast.success(`FD created — ${newFD.id}. Matures ${formatDate(maturityDate)}.`)
          onClose()
        }}
        onClose={() => setOtpOpen(false)}
      />
    </>
  )
}

// ── Main Page ────────────────────────────────────────────────────────────────

export function FixedDeposit() {
  const [fds,          setFds]          = useState<FDType[]>(INITIAL_FDS)
  const [expanded,     setExpanded]     = useState<string | null>(null)
  const [showCreate,   setShowCreate]   = useState(false)
  const [withdrawFD,   setWithdrawFD]   = useState<FDType | null>(null)

  const totalPrincipal = fds.filter(fd => fd.status === 'active').reduce((s, fd) => s + fd.principal, 0)
  const totalMaturity  = fds.filter(fd => fd.status === 'active').reduce((s, fd) => s + fd.maturityAmount, 0)

  function handleWithdrawConfirm(fdId: string) {
    setFds(prev => prev.map(fd =>
      fd.id === fdId ? { ...fd, status: 'withdrawal_requested' } : fd,
    ))
    setWithdrawFD(null)
    setExpanded(null)
    const ref = `FD-WD-${new Date().getFullYear()}-${String(Date.now()).slice(-4)}`
    toast.success(`Withdrawal request submitted. Ref: ${ref}. Settlement T+1.`)
  }

  return (
    <div className="p-6 space-y-5 max-w-[1400px]">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="page-title">Fixed Deposits</h1>
          <p className="page-subtitle text-muted-foreground mt-0.5">
            INR-denominated fixed deposits only, as per IFSCA IBU guidelines
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 bg-primary-900 text-white rounded-md px-4 py-2 text-sm font-semibold hover:bg-primary-700 transition-colors"
        >
          <Plus size={16} />
          Create New FD
        </button>
      </div>

      {/* INR-only notice */}
      <div className="flex items-start gap-2 p-3 rounded-md bg-info-50 border border-info-200 text-xs text-info-700">
        <AlertTriangle size={13} className="flex-shrink-0 mt-0.5" />
        <span>
          Fixed Deposits at BOI GIFT City IBU are <strong>INR-denominated only</strong>, as mandated by IFSCA regulations.
          Foreign currency term deposits are not permitted at the IBU level.
        </span>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Active FDs',        value: fds.filter(fd => fd.status === 'active').length.toString() },
          { label: 'Total Principal',   value: formatINR(totalPrincipal, true) },
          { label: 'Total at Maturity', value: formatINR(totalMaturity, true) },
          { label: 'Total Interest',    value: formatINR(totalMaturity - totalPrincipal, true) },
        ].map(({ label, value }) => (
          <div key={label} className="card-base px-4 py-3">
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="text-sm font-bold font-mono text-foreground mt-0.5">{value}</p>
          </div>
        ))}
      </div>

      {/* FD list */}
      <div className="space-y-3">
        {fds.map(fd => (
          <FDCard
            key={fd.id}
            fd={fd}
            isExpanded={expanded === fd.id}
            onToggle={() => setExpanded(expanded === fd.id ? null : fd.id)}
            onWithdraw={() => setWithdrawFD(fd)}
          />
        ))}
      </div>

      {/* Premature withdrawal modal */}
      <AnimatePresence>
        {withdrawFD && (
          <PrematureWithdrawalModal
            fd={withdrawFD}
            onClose={() => setWithdrawFD(null)}
            onConfirm={() => handleWithdrawConfirm(withdrawFD.id)}
          />
        )}
      </AnimatePresence>

      {/* Create FD drawer */}
      <AnimatePresence>
        {showCreate && (
          <CreateFDDrawer
            onClose={() => setShowCreate(false)}
            onAdd={fd => setFds(prev => [fd, ...prev])}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
