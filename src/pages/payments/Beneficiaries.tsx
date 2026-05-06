import { useState }             from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus, Search, CheckCircle2, Clock, XCircle,
  Globe, Building2, X, AlertCircle,
} from 'lucide-react'
import { toast }                   from 'sonner'
import { cn, getCurrencyFlag }     from '@/lib/utils'
import { validateSWIFT, validateIBAN } from '@/lib/formatters'
import beneficiariesData           from '@/data/beneficiaries.json'
import type { Beneficiary }        from '@/types'

const INITIAL = beneficiariesData as Beneficiary[]

const PURPOSE_OPTIONS = [
  'Trade Payment', 'Service Payment', 'Advance Payment', 'Royalty',
  'Loan Repayment', 'Investment', 'Subscription', 'Other',
]

const CURRENCY_OPTIONS = ['USD', 'EUR', 'GBP', 'AED', 'JPY', 'INR']
const COUNTRY_OPTIONS  = ['United States', 'United Kingdom', 'Germany', 'Netherlands', 'Singapore', 'UAE', 'Japan', 'India', 'Other']

function StatusChip({ status }: { status: Beneficiary['status'] }) {
  return (
    <span className={cn(
      'inline-flex items-center gap-1 text-xs font-medium rounded-full px-2.5 py-1',
      status === 'approved' && 'bg-success-50 text-success-700',
      status === 'pending'  && 'bg-warning-50 text-warning-700',
      status === 'rejected' && 'bg-error-50 text-error-700',
    )}>
      {status === 'approved' && <CheckCircle2 size={11} />}
      {status === 'pending'  && <Clock size={11} />}
      {status === 'rejected' && <XCircle size={11} />}
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  )
}

function BeneficiaryCard({
  ben,
  onSelect,
}: {
  ben: Beneficiary
  onSelect?: (b: Beneficiary) => void
}) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'card-base p-4 transition-all',
        ben.status === 'approved' && onSelect && 'cursor-pointer hover:border-primary-300',
      )}
      onClick={() => ben.status === 'approved' && onSelect?.(ben)}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className={cn(
            'w-10 h-10 rounded-lg flex items-center justify-center',
            ben.type === 'international' ? 'bg-primary-50' : 'bg-surface-100',
          )}>
            {ben.type === 'international'
              ? <Globe size={18} className="text-primary-600" />
              : <Building2 size={18} className="text-muted-foreground" />}
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">{ben.name}</p>
            <p className="text-xs text-muted-foreground">{ben.bankName}</p>
          </div>
        </div>
        <StatusChip status={ben.status} />
      </div>

      <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
        <div>
          <span className="text-muted-foreground">Currency</span>
          <p className="font-medium text-foreground">{getCurrencyFlag(ben.currency)} {ben.currency}</p>
        </div>
        <div>
          <span className="text-muted-foreground">Country</span>
          <p className="font-medium text-foreground">{ben.country}</p>
        </div>
        <div>
          <span className="text-muted-foreground">Account / IBAN</span>
          <p className="font-mono text-foreground text-xs truncate">
            {ben.iban || ben.accountNo}
          </p>
        </div>
        {ben.swift && (
          <div>
            <span className="text-muted-foreground">SWIFT / BIC</span>
            <p className="font-mono text-foreground">{ben.swift}</p>
          </div>
        )}
        {ben.ifsc && (
          <div>
            <span className="text-muted-foreground">IFSC</span>
            <p className="font-mono text-foreground">{ben.ifsc}</p>
          </div>
        )}
      </div>

      {ben.rejectionReason && (
        <div className="mt-3 flex items-start gap-2 p-2 bg-error-50 border border-error-200 rounded-md text-xs text-error-700">
          <AlertCircle size={12} className="flex-shrink-0 mt-0.5" />
          {ben.rejectionReason}
        </div>
      )}

      {ben.status === 'pending' && (
        <p className="mt-2 text-xs text-warning-600 bg-warning-50 border border-warning-200 rounded px-2 py-1">
          Awaiting Checker approval before this beneficiary can be used for transfers.
        </p>
      )}
    </motion.div>
  )
}

function AddBeneficiaryDrawer({
  onClose,
  onAdd,
}: {
  onClose: () => void
  onAdd: (ben: Beneficiary) => void
}) {
  const [form, setForm] = useState({
    name: '', accountNo: '', bankName: '', currency: 'USD',
    country: 'United States', type: 'international' as 'domestic' | 'international',
    swift: '', iban: '', ifsc: '', relationship: 'Trade Partner',
  })
  const [swiftValid,  setSwiftValid]  = useState<boolean | null>(null)
  const [ibanValid,   setIbanValid]   = useState<boolean | null>(null)
  const [submitting,  setSubmitting]  = useState(false)

  function setField<K extends keyof typeof form>(key: K, value: typeof form[K]) {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  function handleSWIFTBlur() {
    if (!form.swift) { setSwiftValid(null); return }
    setSwiftValid(validateSWIFT(form.swift))
  }

  function handleIBANBlur() {
    if (!form.iban) { setIbanValid(null); return }
    setIbanValid(validateIBAN(form.iban))
  }

  async function handleSubmit() {
    if (!form.name || !form.accountNo || !form.bankName) {
      toast.error('Please fill in all required fields.')
      return
    }
    if (form.type === 'international' && !form.swift) {
      toast.error('SWIFT/BIC code is required for international beneficiaries.')
      return
    }
    setSubmitting(true)
    await new Promise(r => setTimeout(r, 1200))

    const newBen: Beneficiary = {
      id:       `BEN-${Date.now()}`,
      name:     form.name,
      accountNo: form.accountNo,
      bankName: form.bankName,
      currency: form.currency as Beneficiary['currency'],
      country:  form.country,
      type:     form.type,
      status:   'pending',
      swift:    form.swift || undefined,
      iban:     form.iban  || undefined,
      ifsc:     form.ifsc  || undefined,
      relationship: form.relationship,
      addedAt:  new Date().toISOString().slice(0, 10),
    }
    onAdd(newBen)
    toast.success('Beneficiary submitted. Awaiting Checker approval.')
    onClose()
  }

  return (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/40 z-30"
      />
      {/* Drawer */}
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'tween', duration: 0.25 }}
        className="fixed right-0 top-0 h-full w-[480px] bg-surface-0 shadow-modal z-40 flex flex-col"
      >
        {/* Drawer header */}
        <div className="flex items-center justify-between p-5 border-b border-border flex-shrink-0">
          <div>
            <h3 className="text-sm font-bold text-foreground">Add New Beneficiary</h3>
            <p className="text-xs text-muted-foreground mt-0.5">New beneficiaries require Checker approval before use.</p>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Drawer body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Transfer type toggle */}
          <div>
            <label className="block text-xs font-medium text-foreground mb-1.5">Beneficiary Type</label>
            <div className="flex rounded-md border border-border overflow-hidden">
              {(['international', 'domestic'] as const).map(t => (
                <button
                  key={t}
                  onClick={() => setField('type', t)}
                  className={cn(
                    'flex-1 py-2 text-xs font-medium transition-colors',
                    form.type === t
                      ? 'bg-primary-900 text-white'
                      : 'bg-surface-0 text-muted-foreground hover:bg-surface-100',
                  )}
                >
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Beneficiary Name */}
          <div>
            <label className="block text-xs font-medium text-foreground mb-1">Beneficiary Name *</label>
            <input
              value={form.name}
              onChange={e => setField('name', e.target.value)}
              placeholder="e.g. Acme Corporation Ltd"
              className="w-full px-3 py-2 text-sm border border-border rounded-md bg-surface-50 focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          {/* Account Number */}
          <div>
            <label className="block text-xs font-medium text-foreground mb-1">Account Number / IBAN *</label>
            <input
              value={form.accountNo}
              onChange={e => setField('accountNo', e.target.value)}
              placeholder="Account number or full IBAN"
              className="w-full px-3 py-2 text-sm border border-border rounded-md bg-surface-50 focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          {/* Bank Name */}
          <div>
            <label className="block text-xs font-medium text-foreground mb-1">Bank Name *</label>
            <input
              value={form.bankName}
              onChange={e => setField('bankName', e.target.value)}
              placeholder="e.g. JP Morgan Chase Bank"
              className="w-full px-3 py-2 text-sm border border-border rounded-md bg-surface-50 focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          {/* SWIFT (international only) */}
          {form.type === 'international' && (
            <div>
              <label className="block text-xs font-medium text-foreground mb-1">SWIFT / BIC Code *</label>
              <div className="relative">
                <input
                  value={form.swift}
                  onChange={e => { setField('swift', e.target.value.toUpperCase()); setSwiftValid(null) }}
                  onBlur={handleSWIFTBlur}
                  placeholder="e.g. CHASUS33XXX"
                  maxLength={11}
                  className={cn(
                    'w-full px-3 py-2 pr-10 text-sm border rounded-md bg-surface-50 focus:outline-none focus:ring-2',
                    swiftValid === true  && 'border-success-500 focus:ring-success-500',
                    swiftValid === false && 'border-error-500 focus:ring-error-500',
                    swiftValid === null  && 'border-border focus:ring-primary-500',
                  )}
                />
                {swiftValid === true  && <CheckCircle2 size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-success-500" />}
                {swiftValid === false && <XCircle     size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-error-500" />}
              </div>
              {swiftValid === false && (
                <p className="text-xs text-error-600 mt-1">Invalid SWIFT/BIC format. Must be 8 or 11 characters.</p>
              )}
              {swiftValid === true && (
                <p className="text-xs text-success-600 mt-1">Valid SWIFT/BIC code format.</p>
              )}
            </div>
          )}

          {/* IBAN (optional, international) */}
          {form.type === 'international' && (
            <div>
              <label className="block text-xs font-medium text-foreground mb-1">IBAN (optional)</label>
              <div className="relative">
                <input
                  value={form.iban}
                  onChange={e => { setField('iban', e.target.value.toUpperCase()); setIbanValid(null) }}
                  onBlur={handleIBANBlur}
                  placeholder="e.g. NL91ABNA0417164300"
                  className={cn(
                    'w-full px-3 py-2 pr-10 text-sm border rounded-md bg-surface-50 focus:outline-none focus:ring-2',
                    ibanValid === true  && 'border-success-500 focus:ring-success-500',
                    ibanValid === false && 'border-error-500 focus:ring-error-500',
                    ibanValid === null  && 'border-border focus:ring-primary-500',
                  )}
                />
                {ibanValid === true  && <CheckCircle2 size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-success-500" />}
                {ibanValid === false && <XCircle     size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-error-500" />}
              </div>
              {ibanValid === false && <p className="text-xs text-error-600 mt-1">Invalid IBAN checksum.</p>}
            </div>
          )}

          {/* IFSC (domestic only) */}
          {form.type === 'domestic' && (
            <div>
              <label className="block text-xs font-medium text-foreground mb-1">IFSC Code *</label>
              <input
                value={form.ifsc}
                onChange={e => setField('ifsc', e.target.value.toUpperCase())}
                placeholder="e.g. SBIN0001234"
                maxLength={11}
                className="w-full px-3 py-2 text-sm border border-border rounded-md bg-surface-50 focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          )}

          {/* Currency + Country */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-foreground mb-1">Currency</label>
              <select
                value={form.currency}
                onChange={e => setField('currency', e.target.value)}
                className="w-full px-3 py-2 text-sm border border-border rounded-md bg-surface-50 focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                {CURRENCY_OPTIONS.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-foreground mb-1">Country</label>
              <select
                value={form.country}
                onChange={e => setField('country', e.target.value)}
                className="w-full px-3 py-2 text-sm border border-border rounded-md bg-surface-50 focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                {COUNTRY_OPTIONS.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
          </div>

          {/* Relationship */}
          <div>
            <label className="block text-xs font-medium text-foreground mb-1">Relationship</label>
            <select
              value={form.relationship}
              onChange={e => setField('relationship', e.target.value)}
              className="w-full px-3 py-2 text-sm border border-border rounded-md bg-surface-50 focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              {PURPOSE_OPTIONS.map(p => <option key={p}>{p}</option>)}
              <option>Trade Partner</option>
              <option>Vendor</option>
              <option>Supplier</option>
              <option>Client</option>
              <option>Subsidiary</option>
              <option>Other</option>
            </select>
          </div>

          {/* Maker-Checker note */}
          <div className="p-3 bg-info-50 border border-info-200 rounded-md text-xs text-info-700">
            This beneficiary will be submitted for Checker approval before it can be used in transfers.
            You will receive a notification once it is approved.
          </div>
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-border flex-shrink-0">
          <motion.button
            onClick={handleSubmit}
            disabled={submitting}
            whileTap={{ scale: 0.98 }}
            className="w-full py-2.5 px-4 rounded-md text-sm font-semibold text-white bg-primary-900 hover:bg-primary-700 disabled:opacity-60 transition-all flex items-center justify-center gap-2"
          >
            {submitting ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Submitting…
              </>
            ) : (
              'Submit for Approval'
            )}
          </motion.button>
        </div>
      </motion.div>
    </>
  )
}

export function Beneficiaries() {
  const [bens,     setBens]     = useState<Beneficiary[]>(INITIAL)
  const [search,   setSearch]   = useState('')
  const [filter,   setFilter]   = useState<'all' | 'approved' | 'pending' | 'rejected'>('all')
  const [showAdd,  setShowAdd]  = useState(false)

  const filtered = bens.filter(b => {
    const matchesSearch = !search
      || b.name.toLowerCase().includes(search.toLowerCase())
      || b.bankName.toLowerCase().includes(search.toLowerCase())
      || (b.swift?.toLowerCase().includes(search.toLowerCase()))
    const matchesFilter = filter === 'all' || b.status === filter
    return matchesSearch && matchesFilter
  })

  const counts = {
    all:      bens.length,
    approved: bens.filter(b => b.status === 'approved').length,
    pending:  bens.filter(b => b.status === 'pending').length,
    rejected: bens.filter(b => b.status === 'rejected').length,
  }

  return (
    <div className="p-6 space-y-5 max-w-[1400px]">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="page-title">Beneficiary Management</h1>
          <p className="page-subtitle text-muted-foreground mt-0.5">
            Whitelisted beneficiaries for fund transfers. New entries require Checker approval.
          </p>
        </div>
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 bg-primary-900 text-white rounded-md px-4 py-2 text-sm font-semibold hover:bg-primary-700 transition-colors"
        >
          <Plus size={16} />
          Add New Beneficiary
        </motion.button>
      </div>

      {/* Status filter tabs + search */}
      <div className="flex items-center gap-4">
        <div className="flex rounded-lg border border-border overflow-hidden">
          {(['all', 'approved', 'pending', 'rejected'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                'px-4 py-2 text-xs font-medium transition-colors flex items-center gap-1.5',
                filter === f
                  ? 'bg-primary-900 text-white'
                  : 'bg-surface-0 text-muted-foreground hover:bg-surface-100',
              )}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
              <span className={cn(
                'rounded-full px-1.5 text-xs',
                filter === f ? 'bg-white/20' : 'bg-surface-100',
              )}>
                {counts[f]}
              </span>
            </button>
          ))}
        </div>

        <div className="relative flex-1 max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name, bank, or SWIFT..."
            className="w-full pl-9 pr-3 py-2 text-sm border border-border rounded-md bg-surface-50 focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
      </div>

      {/* Beneficiary grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-12 text-sm text-muted-foreground card-base">
          No beneficiaries match the current filters.
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {filtered.map(ben => (
            <BeneficiaryCard key={ben.id} ben={ben} />
          ))}
        </div>
      )}

      {/* Add drawer */}
      <AnimatePresence>
        {showAdd && (
          <AddBeneficiaryDrawer
            onClose={() => setShowAdd(false)}
            onAdd={ben => setBens(prev => [ben, ...prev])}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
