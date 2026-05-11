import { useState }             from 'react'
import { useNavigate }           from 'react-router-dom'
import { motion }                from 'framer-motion'
import {
  ChevronLeft, CheckCircle2, Shield, AlertTriangle,
  Pencil, ArrowRight,
} from 'lucide-react'
import { toast }                 from 'sonner'
import { useBanking }            from '@/context/BankingContext'
import { useAuth }               from '@/context/AuthContext'
import { ChargesBreakdown }      from '@/components/banking/ChargesBreakdown'
import { OTPAuthModal }          from '@/components/modals/OTPAuthModal'
import { formatINR, formatCurrency, getCurrencyFlag, formatDate, cn } from '@/lib/utils'
import beneficiariesData         from '@/data/beneficiaries.json'
import type { Beneficiary }      from '@/types'

const beneficiaries = beneficiariesData as Beneficiary[]

const COMPLIANCE_CHECKS = [
  'FEMA compliance — Purpose code validated',
  'Beneficiary whitelisted and approved',
  'Daily transaction limit — within permitted range',
  'AML screening — cleared',
  'Source of funds declaration — on file',
]

const FX_RATE = 83.45

export function PaymentReview() {
  const navigate       = useNavigate()
  const { paymentDraft, clearPaymentDraft, getAccount, decrementPending } = useBanking()
  const { currentUser } = useAuth()

  const [otpOpen,    setOtpOpen]    = useState(false)
  const [processing, setProcessing] = useState(false)

  const isMaker   = currentUser?.role === 'Maker'
  const isAdmin   = currentUser?.role === 'Admin'
  const isChecker = currentUser?.role === 'Checker'

  if (!paymentDraft) {
    return (
      <div className="p-6">
        <button onClick={() => navigate('/payments/new')} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors">
          <ChevronLeft size={16} /> Back
        </button>
        <p className="text-muted-foreground">No payment draft found. Please start a new transfer.</p>
        <button onClick={() => navigate('/payments/new')} className="mt-4 text-sm text-primary-600 hover:text-primary-800 transition-colors">
          ← New Payment
        </button>
      </div>
    )
  }

  // Capture a stable non-null reference so async closures can access it safely
  const draft          = paymentDraft
  const sourceAccount  = getAccount(draft.sourceAccountId)
  const beneficiary    = beneficiaries.find(b => b.id === draft.beneficiaryId)
  const destAccount    = draft.transferType === 'own' ? getAccount(draft.beneficiaryId) : undefined
  const charges        = draft.charges
  const isInternational = draft.transferType === 'international'

  const foreignAmount = isInternational && beneficiary?.currency && beneficiary.currency !== 'INR'
    ? parseFloat(((charges?.netAmount ?? draft.amount) / FX_RATE).toFixed(2))
    : undefined

  async function handleAuthorize() {
    setOtpOpen(true)
  }

  async function handleOTPVerify() {
    await new Promise(r => setTimeout(r, 1800))
    setProcessing(false)
    clearPaymentDraft()
    if (!isMaker) decrementPending()
    navigate('/payments/success', {
      state: {
        amount: draft.amount,
        netAmount: charges?.netAmount ?? draft.amount,
        beneficiary: beneficiary?.name ?? destAccount?.name,
        currency: beneficiary?.currency ?? destAccount?.currency ?? 'INR',
        foreignAmount,
        reference: `TXN-ARTTHA-${new Date().getFullYear()}${String(Date.now()).slice(-8)}`,
        uetr: 'b4c8d2e6-f1a3-7890-abcd-ef5678901234',
        valueDate: charges?.valueDate,
      },
    })
  }

  function handleSubmitForApproval() {
    toast.success(
      `Payment submitted for Checker approval. Ref: TXN-ARTTHA-${new Date().getFullYear()}${String(Date.now()).slice(-5)}`,
    )
    clearPaymentDraft()
    navigate('/dashboard')
  }

  return (
    <div className="p-6 space-y-5 max-w-[1400px]">
      <button
        onClick={() => navigate('/payments/new')}
        className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ChevronLeft size={16} /> Edit Payment
      </button>

      <div>
        <h1 className="page-title">Review & Authorize Transfer</h1>
        <p className="page-subtitle text-muted-foreground mt-0.5">
          Please verify all details before authorizing. This action cannot be undone.
        </p>
      </div>

      <div className="grid grid-cols-3 gap-5">
        {/* Main review panel */}
        <div className="col-span-2 space-y-4">

          {/* Transfer summary */}
          <div className="card-base p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-foreground">Transfer Summary</h2>
              <button
                onClick={() => navigate('/payments/new')}
                className="flex items-center gap-1 text-xs text-primary-600 hover:text-primary-800 transition-colors"
              >
                <Pencil size={12} /> Edit
              </button>
            </div>

            <div className="space-y-3">
              {/* From / To */}
              <div className="grid grid-cols-2 gap-4 pb-4 border-b border-border">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">From</p>
                  <p className="text-sm font-semibold text-foreground">{sourceAccount?.name ?? draft.sourceAccountId}</p>
                  <p className="text-xs font-mono text-muted-foreground">{sourceAccount?.accountNo ?? draft.sourceAccountId}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {getCurrencyFlag('INR')} INR — Available: {formatINR(sourceAccount?.available ?? 0)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">To</p>
                  <p className="text-sm font-semibold text-foreground">
                    {draft.transferType === 'own'
                      ? (destAccount?.name ?? draft.beneficiaryId)
                      : (beneficiary?.name ?? draft.beneficiaryId)}
                  </p>
                  <p className="text-xs font-mono text-muted-foreground">
                    {draft.transferType === 'own'
                      ? (destAccount?.accountNo ?? '')
                      : (beneficiary?.swift ?? beneficiary?.accountNo ?? '')}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {draft.transferType === 'own'
                      ? (destAccount ? `${getCurrencyFlag(destAccount.currency)} ${destAccount.currency} — Own Account Transfer` : '')
                      : (beneficiary ? `${getCurrencyFlag(beneficiary.currency)} ${beneficiary.currency} — ${beneficiary.bankName}` : '')}
                  </p>
                </div>
              </div>

              {/* Amount + details */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">You Send</p>
                  <p className="text-2xl font-bold font-mono text-foreground">{formatINR(draft.amount)}</p>
                </div>
                {isInternational && foreignAmount && beneficiary?.currency && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Beneficiary Receives (est.)</p>
                    <p className="text-2xl font-bold font-mono text-success-700">
                      ~{formatCurrency(foreignAmount, beneficiary.currency)}
                    </p>
                    <p className="text-xs text-muted-foreground">At 1 {beneficiary.currency} = ₹{FX_RATE}</p>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-3 gap-4 pt-3 border-t border-border text-xs">
                <div>
                  <span className="text-muted-foreground">Transfer Type</span>
                  <p className="font-medium text-foreground capitalize">{draft.transferType.replace('_', ' ')}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Purpose Code</span>
                  <p className="font-mono font-medium text-foreground">{draft.purposeCode}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Payment Date</span>
                  <p className="font-medium text-foreground">
                    {draft.scheduled ? formatDate(draft.paymentDate) : 'Immediate'}
                  </p>
                </div>
                {draft.narrative && (
                  <div className="col-span-3">
                    <span className="text-muted-foreground">Narrative</span>
                    <p className="font-medium text-foreground">{draft.narrative}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Charges breakdown */}
          {charges && (
            <ChargesBreakdown
              data={charges}
              foreignCurrency={isInternational && beneficiary?.currency !== 'INR' ? beneficiary?.currency : undefined}
              foreignAmount={foreignAmount}
            />
          )}

          {/* Compliance checks */}
          <div className="card-base p-4">
            <div className="flex items-center gap-2 mb-3">
              <Shield size={15} className="text-success-600" />
              <h3 className="text-sm font-semibold text-foreground">Compliance Checks</h3>
            </div>
            <div className="space-y-2">
              {COMPLIANCE_CHECKS.map(check => (
                <div key={check} className="flex items-center gap-2">
                  <CheckCircle2 size={13} className="text-success-600 flex-shrink-0" />
                  <span className="text-xs text-foreground">{check}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Maker-role note */}
          {isMaker && (
            <div className="p-3 bg-info-50 border border-info-200 rounded-md text-xs text-info-700 flex items-start gap-2">
              <AlertTriangle size={13} className="flex-shrink-0 mt-0.5" />
              As a <strong>Maker</strong>, this payment will be submitted for Checker approval before execution.
            </div>
          )}

          {/* CTAs */}
          <div className="flex gap-3">
            {(isAdmin || isChecker) ? (
              <motion.button
                onClick={handleAuthorize}
                disabled={processing}
                whileTap={{ scale: 0.98 }}
                className="flex-1 py-3 px-4 rounded-md text-sm font-semibold text-white bg-primary-900 hover:bg-primary-700 transition-all flex items-center justify-center gap-2"
              >
                <Shield size={16} />
                Authorize Transfer
                <ArrowRight size={16} />
              </motion.button>
            ) : (
              <motion.button
                onClick={handleSubmitForApproval}
                whileTap={{ scale: 0.98 }}
                className="flex-1 py-3 px-4 rounded-md text-sm font-semibold text-white bg-primary-900 hover:bg-primary-700 transition-all flex items-center justify-center gap-2"
              >
                <Shield size={16} />
                Submit for Checker Approval
              </motion.button>
            )}
            <button
              onClick={() => navigate('/payments/new')}
              className="px-4 py-3 rounded-md text-sm font-medium text-muted-foreground border border-border hover:bg-surface-100 transition-colors"
            >
              Edit
            </button>
          </div>
        </div>

        {/* Right info panel */}
        <div className="space-y-4">
          <div className="card-base p-4 border-l-4 border-l-warning-500">
            <p className="text-xs font-semibold text-warning-700 mb-1">Dual Authorization Required</p>
            <p className="text-xs text-muted-foreground">
              All transfers above ₹5 Cr are subject to Maker-Checker dual authorization as per IFSCA circular.
            </p>
          </div>

          <div className="card-base p-4">
            <p className="text-xs font-semibold text-foreground uppercase tracking-wide mb-2">Initiating User</p>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center">
                <span className="text-xs font-bold text-primary-700">
                  {(currentUser?.name ?? 'U').split(' ').map(n => n[0]).join('')}
                </span>
              </div>
              <div>
                <p className="text-xs font-semibold text-foreground">{currentUser?.name}</p>
                <p className={cn(
                  'text-xs font-medium',
                  isMaker ? 'text-warning-600' : isChecker ? 'text-success-600' : 'text-primary-600',
                )}>
                  {currentUser?.role}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* OTP Modal */}
      <OTPAuthModal
        isOpen={otpOpen}
        title="Authorize Transfer"
        description={`Verify your identity to authorize transfer of ${formatINR(draft.amount)} to ${beneficiary?.name ?? destAccount?.name ?? 'destination account'}.`}
        onVerify={handleOTPVerify}
        onClose={() => setOtpOpen(false)}
      />
    </div>
  )
}
