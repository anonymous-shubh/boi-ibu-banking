import { useState, useEffect }  from 'react'
import { useNavigate }            from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { AlertTriangle, Clock, Info, ChevronRight } from 'lucide-react'
import { toast }                  from 'sonner'
import { useBanking }             from '@/context/BankingContext'
import { useAuth }                from '@/context/AuthContext'
import { useCharges }             from '@/hooks/useCharges'
import { ChargesBreakdown }       from '@/components/banking/ChargesBreakdown'
import { formatCurrency, formatINR, getCurrencyFlag, cn } from '@/lib/utils'
import beneficiariesData          from '@/data/beneficiaries.json'
import type { Beneficiary }       from '@/types'

const beneficiaries = beneficiariesData as Beneficiary[]

const PURPOSE_CODES = [
  { code: 'P0101', label: 'P0101 — Export of Goods' },
  { code: 'P0102', label: 'P0102 — Import of Goods' },
  { code: 'P0103', label: 'P0103 — Trade Payment' },
  { code: 'P0802', label: 'P0802 — Royalty / IP Payment' },
  { code: 'S0099', label: 'S0099 — Miscellaneous / Other' },
]

// Show cut-off warning after 13:00 (simulated)
function useCutOffWarning() {
  const [show, setShow] = useState(false)
  useEffect(() => {
    const h = new Date().getHours()
    setShow(h >= 13)
  }, [])
  return show
}

export function PaymentNew() {
  const navigate           = useNavigate()
  const { accounts, setPaymentDraft } = useBanking()
  const { currentUser }    = useAuth()
  const showCutOff         = useCutOffWarning()

  const inrAccount = accounts.find(a => a.primary) ?? accounts[0]
  const approvedBens = beneficiaries.filter(b => b.status === 'approved')

  const [transferType,  setTransferType]  = useState<'own' | 'third_party' | 'international'>('international')
  const [sourceAccId,   setSourceAccId]   = useState(inrAccount.id)
  const [beneficiaryId, setBeneficiaryId] = useState('')
  const [amount,        setAmount]        = useState('')
  const [purposeCode,   setPurposeCode]   = useState('P0101')
  const [narrative,     setNarrative]     = useState('')
  const [payDate,       setPayDate]       = useState('immediate')
  const [schedDate,     setSchedDate]     = useState('')
  const [showCharges,   setShowCharges]   = useState(false)
  const [errors,        setErrors]        = useState<Record<string, string>>({})

  const numAmount = parseFloat(amount.replace(/,/g, '')) || 0
  const selectedBen = approvedBens.find(b => b.id === beneficiaryId)
  const sourceAccount = accounts.find(a => a.id === sourceAccId)

  // FX rate for USD/INR (approx 83.45 for display)
  const fxRate = 83.45

  const chargesData = useCharges({
    transferType: transferType === 'international' ? 'international_transfer' : 'domestic_transfer',
    amount: numAmount,
    fxRate,
  })

  const foreignAmount = transferType === 'international' && selectedBen?.currency && selectedBen.currency !== 'INR' && numAmount > 0
    ? parseFloat((chargesData.netAmount / fxRate).toFixed(2))
    : undefined

  // Show charges preview when amount entered and beneficiary selected
  useEffect(() => {
    setShowCharges(!!(numAmount > 0 && beneficiaryId))
  }, [numAmount, beneficiaryId])

  function validate() {
    const errs: Record<string, string> = {}
    if (!amount || numAmount <= 0) errs.amount = 'Please enter a valid amount.'
    if (numAmount > (sourceAccount?.available ?? 0)) errs.amount = 'Amount exceeds available balance.'
    if (!beneficiaryId) errs.beneficiary = transferType === 'own' ? 'Please select a destination account.' : 'Please select a beneficiary.'
    if (!purposeCode)   errs.purpose = 'Purpose code is required.'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  function handleReview() {
    if (!validate()) return
    setPaymentDraft({
      transferType,
      sourceAccountId: sourceAccId,
      beneficiaryId,
      amount: numAmount,
      currency: 'INR',
      purposeCode,
      narrative,
      paymentDate: payDate === 'immediate' ? new Date().toISOString().slice(0, 10) : schedDate,
      scheduled: payDate !== 'immediate',
      charges: chargesData,
    })
    navigate('/payments/review')
  }

  const isChecker = currentUser?.role === 'Checker'

  return (
    <div className="p-6 space-y-5 max-w-[1400px]">
      <div>
        <h1 className="page-title">New Payment</h1>
        <p className="page-subtitle text-muted-foreground mt-0.5">
          Initiate domestic or international fund transfers
        </p>
      </div>

      {/* Cut-off warning */}
      <AnimatePresence>
        {showCutOff && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-start gap-2 p-3 rounded-md bg-warning-50 border border-warning-300 text-xs text-warning-800"
          >
            <Clock size={14} className="flex-shrink-0 mt-0.5" />
            <span>
              <strong>Same-day RTGS cut-off: 17:30 IST</strong> — Payments initiated after cut-off will be processed on the next business day.
              SWIFT cut-off is 15:30 IST.
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-3 gap-5">
        {/* Left: Form */}
        <div className="col-span-2 space-y-5">
          <div className="card-base p-6 space-y-5">

            {/* Transfer type */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Transfer Type</label>
              <div className="flex rounded-lg border border-border overflow-hidden">
                {([
                  { value: 'own',           label: 'Own Account' },
                  { value: 'third_party',   label: 'Domestic (Third Party)' },
                  { value: 'international', label: 'International Remittance' },
                ] as const).map(({ value, label }) => (
                  <button
                    key={value}
                    onClick={() => { setTransferType(value); setBeneficiaryId('') }}
                    className={cn(
                      'flex-1 py-2.5 text-xs font-medium transition-colors',
                      transferType === value
                        ? 'bg-primary-900 text-white'
                        : 'bg-surface-0 text-muted-foreground hover:bg-surface-100',
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Source account */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Source Account</label>
              <select
                value={sourceAccId}
                onChange={e => setSourceAccId(e.target.value)}
                className="w-full px-3 py-2.5 text-sm border border-border rounded-md bg-surface-50 focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                {accounts
                  .filter(a => transferType === 'international' ? a.primary : true)
                  .map(a => (
                    <option key={a.id} value={a.id}>
                      {getCurrencyFlag(a.currency)} {a.name} — Available: {formatCurrency(a.available, a.currency)}
                    </option>
                  ))}
              </select>
              {sourceAccount && (
                <p className="text-xs text-muted-foreground mt-1">
                  Available: <span className="font-mono font-medium text-foreground">{formatCurrency(sourceAccount.available, sourceAccount.currency)}</span>
                </p>
              )}
            </div>

            {/* Beneficiary / Destination Account */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                {transferType === 'own' ? 'Destination Account' : 'Beneficiary'}{' '}
                <span className="text-error-500">*</span>
              </label>
              {transferType === 'own' ? (
                <select
                  value={beneficiaryId}
                  onChange={e => setBeneficiaryId(e.target.value)}
                  className={cn(
                    'w-full px-3 py-2.5 text-sm border rounded-md bg-surface-50 focus:outline-none focus:ring-2 focus:ring-primary-500',
                    errors.beneficiary ? 'border-error-400' : 'border-border',
                  )}
                >
                  <option value="">— Select destination account —</option>
                  {accounts
                    .filter(a => a.id !== sourceAccId)
                    .map(a => (
                      <option key={a.id} value={a.id}>
                        {getCurrencyFlag(a.currency)} {a.name}
                      </option>
                    ))}
                </select>
              ) : (
                <select
                  value={beneficiaryId}
                  onChange={e => setBeneficiaryId(e.target.value)}
                  className={cn(
                    'w-full px-3 py-2.5 text-sm border rounded-md bg-surface-50 focus:outline-none focus:ring-2 focus:ring-primary-500',
                    errors.beneficiary ? 'border-error-400' : 'border-border',
                  )}
                >
                  <option value="">— Select approved beneficiary —</option>
                  {approvedBens
                    .filter(b => {
                      if (transferType === 'international') return b.type === 'international'
                      if (transferType === 'third_party')   return b.type === 'domestic'
                      return false
                    })
                    .map(b => (
                      <option key={b.id} value={b.id}>
                        {b.name} — {b.currency} — {b.bankName}
                      </option>
                    ))}
                </select>
              )}
              {errors.beneficiary && <p className="text-xs text-error-600 mt-1">{errors.beneficiary}</p>}
              {selectedBen && (
                <div className="mt-2 p-2 bg-surface-100 rounded text-xs text-muted-foreground grid grid-cols-2 gap-1">
                  <span>SWIFT: <span className="font-mono text-foreground">{selectedBen.swift ?? '—'}</span></span>
                  <span>IBAN: <span className="font-mono text-foreground">{selectedBen.iban ? selectedBen.iban.slice(0,14) + '…' : selectedBen.accountNo.slice(0,14)}</span></span>
                  <span>Currency: {getCurrencyFlag(selectedBen.currency)} <strong>{selectedBen.currency}</strong></span>
                  <span>Country: {selectedBen.country}</span>
                </div>
              )}
            </div>

            {/* Amount */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Amount (INR) <span className="text-error-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">₹</span>
                <input
                  type="text"
                  value={amount}
                  onChange={e => {
                    const v = e.target.value.replace(/[^0-9.]/g, '')
                    setAmount(v)
                    setErrors(prev => ({ ...prev, amount: '' }))
                  }}
                  placeholder="0.00"
                  className={cn(
                    'w-full pl-7 pr-3 py-2.5 text-sm border rounded-md bg-surface-50 font-mono focus:outline-none focus:ring-2 focus:ring-primary-500',
                    errors.amount ? 'border-error-400' : 'border-border',
                  )}
                />
              </div>
              {errors.amount && <p className="text-xs text-error-600 mt-1">{errors.amount}</p>}
              {numAmount > 0 && sourceAccount && numAmount <= sourceAccount.available && (
                <p className="text-xs text-success-600 mt-1 flex items-center gap-1">
                  ✓ Within available balance ({formatINR(sourceAccount.available)} available)
                </p>
              )}
            </div>

            {/* FX preview (international) */}
            {transferType === 'international' && selectedBen && numAmount > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="p-3 bg-info-50 border border-info-200 rounded-md text-xs"
              >
                <div className="flex items-center gap-1.5 text-info-700 mb-1">
                  <Info size={13} />
                  <span className="font-medium">Indicative FX Preview</span>
                </div>
                <p className="text-info-700">
                  Rate: 1 {selectedBen.currency} = ₹{fxRate} •{' '}
                  Beneficiary may receive approx.{' '}
                  <strong>{formatCurrency(numAmount / fxRate, selectedBen.currency)}</strong>{' '}
                  (after charges, indicative)
                </p>
              </motion.div>
            )}

            {/* Purpose code */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Purpose Code (FEMA / IFSCA)</label>
              <select
                value={purposeCode}
                onChange={e => setPurposeCode(e.target.value)}
                className="w-full px-3 py-2.5 text-sm border border-border rounded-md bg-surface-50 focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                {PURPOSE_CODES.map(p => (
                  <option key={p.code} value={p.code}>{p.label}</option>
                ))}
              </select>
            </div>

            {/* Narrative */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Narrative / Reference</label>
              <input
                value={narrative}
                onChange={e => setNarrative(e.target.value)}
                placeholder="Payment reference or invoice number..."
                className="w-full px-3 py-2.5 text-sm border border-border rounded-md bg-surface-50 focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            {/* Payment date */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Payment Date</label>
              <div className="flex gap-3">
                {([
                  { value: 'immediate', label: 'Immediate (Today)' },
                  { value: 'scheduled', label: 'Scheduled' },
                ] as const).map(({ value, label }) => (
                  <label key={value} className="flex items-center gap-2 cursor-pointer">
                    <div
                      onClick={() => setPayDate(value)}
                      className={cn(
                        'w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all',
                        payDate === value ? 'border-primary-900 bg-primary-900' : 'border-border',
                      )}
                    >
                      {payDate === value && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                    </div>
                    <span className="text-sm text-foreground">{label}</span>
                  </label>
                ))}
              </div>
              {payDate === 'scheduled' && (
                <input
                  type="date"
                  value={schedDate}
                  onChange={e => setSchedDate(e.target.value)}
                  min={new Date().toISOString().slice(0, 10)}
                  className="mt-2 px-3 py-2 text-sm border border-border rounded-md bg-surface-50 focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              )}
            </div>
          </div>

          {/* CTA */}
          <motion.button
            onClick={handleReview}
            whileTap={{ scale: 0.98 }}
            className="w-full py-3 px-4 rounded-md text-sm font-semibold text-white bg-primary-900 hover:bg-primary-700 transition-all flex items-center justify-center gap-2"
          >
            Review Transfer <ChevronRight size={16} />
          </motion.button>

          {isChecker && (
            <p className="text-xs text-muted-foreground text-center">
              As a Checker, you can only approve/reject payments — not initiate them.
            </p>
          )}
        </div>

        {/* Right: Charges preview */}
        <div className="space-y-4">
          <AnimatePresence>
            {showCharges && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
              >
                <ChargesBreakdown
                  data={chargesData}
                  foreignCurrency={
                    transferType === 'international' && selectedBen?.currency !== 'INR'
                      ? selectedBen?.currency
                      : undefined
                  }
                  foreignAmount={foreignAmount}
                />
              </motion.div>
            )}
          </AnimatePresence>

          <div className="card-base p-4 space-y-3">
            <p className="text-xs font-semibold text-foreground uppercase tracking-wide">Transfer Guidelines</p>
            <div className="space-y-2 text-xs text-muted-foreground">
              <div className="flex items-start gap-2">
                <AlertTriangle size={12} className="text-warning-500 flex-shrink-0 mt-0.5" />
                <span>All international transfers are subject to FEMA compliance checks.</span>
              </div>
              <div className="flex items-start gap-2">
                <AlertTriangle size={12} className="text-warning-500 flex-shrink-0 mt-0.5" />
                <span>Purpose code must match the underlying transaction. Incorrect codes may cause delays.</span>
              </div>
              <div className="flex items-start gap-2">
                <Info size={12} className="text-info-500 flex-shrink-0 mt-0.5" />
                <span>RTGS cut-off: 17:30 IST | SWIFT cut-off: 15:30 IST</span>
              </div>
              <div className="flex items-start gap-2">
                <Info size={12} className="text-info-500 flex-shrink-0 mt-0.5" />
                <span>Payments above ₹5 Cr require Maker-Checker dual authorization.</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
