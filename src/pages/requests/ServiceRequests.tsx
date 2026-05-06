import { useState }               from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus, CheckCircle2, Clock, AlertCircle,
  XCircle, ChevronDown, ChevronUp, X,
} from 'lucide-react'
import { toast }                   from 'sonner'
import { formatDateTime, cn }      from '@/lib/utils'
import serviceRequestsData         from '@/data/serviceRequests.json'
import type { ServiceRequest }     from '@/types'

const INITIAL = serviceRequestsData as ServiceRequest[]

const TYPE_LABELS: Record<string, string> = {
  inward_remittance_disposal: 'Inward Remittance Disposal',
  stop_payment:               'Stop Payment',
  certified_statement:        'Certified Statement',
  swift_confirmation:         'SWIFT Confirmation',
}

const TYPE_DESCRIPTIONS: Record<string, string> = {
  inward_remittance_disposal: 'Provide disposal instructions for an inward foreign remittance received into your account.',
  stop_payment:               'Request cancellation of a scheduled or pending outward payment.',
  certified_statement:        'Request a bank-certified account statement for audits, regulatory filings, or legal purposes.',
  swift_confirmation:         'Request a SWIFT MT103 confirmation for an outward remittance.',
}

const PURPOSE_CODES = ['P0101', 'P0102', 'P0103', 'P0802', 'S0099']

function StatusBadge({ status }: { status: ServiceRequest['status'] }) {
  const configs = {
    open:        { cls: 'bg-warning-50 text-warning-700',  icon: Clock,        label: 'Open' },
    in_progress: { cls: 'bg-info-50 text-info-700',        icon: AlertCircle,  label: 'In Progress' },
    completed:   { cls: 'bg-success-50 text-success-700',  icon: CheckCircle2, label: 'Completed' },
    cancelled:   { cls: 'bg-error-50 text-error-700',      icon: XCircle,      label: 'Cancelled' },
  }
  const { cls, icon: Icon, label } = configs[status]
  return (
    <span className={cn('inline-flex items-center gap-1 text-xs font-medium rounded-full px-2.5 py-1', cls)}>
      <Icon size={11} />
      {label}
    </span>
  )
}

function RequestCard({ req }: { req: ServiceRequest }) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="card-base">
      <div
        className="flex items-start justify-between p-4 cursor-pointer"
        onClick={() => setExpanded(e => !e)}
      >
        <div className="flex items-start gap-3">
          <div className="mt-0.5">
            <p className="text-xs font-semibold text-foreground">{TYPE_LABELS[req.type]}</p>
            <p className="text-xs font-mono text-muted-foreground mt-0.5">{req.referenceNo ?? req.id}</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Submitted: {formatDateTime(req.submittedAt)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <StatusBadge status={req.status} />
          {expanded ? <ChevronUp size={14} className="text-muted-foreground" /> : <ChevronDown size={14} className="text-muted-foreground" />}
        </div>
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 pt-1 border-t border-border">
              <p className="text-xs text-muted-foreground leading-relaxed">{req.details}</p>
              {req.updatedAt && (
                <p className="text-xs text-muted-foreground mt-2">
                  Last updated: {formatDateTime(req.updatedAt)}
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function NewRequestDrawer({
  onClose,
  onAdd,
}: {
  onClose: () => void
  onAdd: (req: ServiceRequest) => void
}) {
  const [type,    setType]    = useState<ServiceRequest['type']>('inward_remittance_disposal')
  const [details, setDetails] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit() {
    if (!details.trim()) { toast.error('Please provide details for the request.'); return }
    setSubmitting(true)
    await new Promise(r => setTimeout(r, 1000))
    const newReq: ServiceRequest = {
      id:          `REQ-${Date.now()}`,
      type,
      submittedAt: new Date().toISOString(),
      status:      'open',
      details,
      referenceNo: `REQ-${type.slice(0, 3).toUpperCase()}-${new Date().getFullYear()}-${String(Date.now()).slice(-4)}`,
    }
    onAdd(newReq)
    toast.success(`Service request submitted — ${newReq.referenceNo}`)
    onClose()
  }

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
            <h3 className="text-sm font-bold text-foreground">New Service Request</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Submit a banking service or operation request</p>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Request type */}
          <div>
            <label className="block text-xs font-medium text-foreground mb-1.5">Request Type</label>
            <select
              value={type}
              onChange={e => setType(e.target.value as ServiceRequest['type'])}
              className="w-full px-3 py-2.5 text-sm border border-border rounded-md bg-surface-50 focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              {Object.entries(TYPE_LABELS).map(([v, l]) => (
                <option key={v} value={v}>{l}</option>
              ))}
            </select>
            <p className="text-xs text-muted-foreground mt-1">{TYPE_DESCRIPTIONS[type]}</p>
          </div>

          {/* Inward remittance fields */}
          {type === 'inward_remittance_disposal' && (
            <>
              <div>
                <label className="block text-xs font-medium text-foreground mb-1.5">SWIFT Reference</label>
                <input
                  placeholder="e.g. BKIDINGB20260506001"
                  className="w-full px-3 py-2 text-sm border border-border rounded-md bg-surface-50 font-mono focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-foreground mb-1.5">Disposal Purpose Code (FEMA)</label>
                <select className="w-full px-3 py-2 text-sm border border-border rounded-md bg-surface-50 focus:outline-none focus:ring-2 focus:ring-primary-500">
                  {PURPOSE_CODES.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-foreground mb-1.5">Disposal Instruction</label>
                <select className="w-full px-3 py-2 text-sm border border-border rounded-md bg-surface-50 focus:outline-none focus:ring-2 focus:ring-primary-500">
                  <option>Credit to INR Primary Account at spot rate</option>
                  <option>Credit to USD Account as received</option>
                  <option>Convert and credit to EUR Account</option>
                  <option>Hold pending further instruction</option>
                </select>
              </div>
            </>
          )}

          {/* Details textarea */}
          <div>
            <label className="block text-xs font-medium text-foreground mb-1.5">Details / Description *</label>
            <textarea
              value={details}
              onChange={e => setDetails(e.target.value)}
              rows={5}
              placeholder={`Provide details for the ${TYPE_LABELS[type]} request...`}
              className="w-full px-3 py-2 text-sm border border-border rounded-md bg-surface-50 resize-none focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div className="p-3 bg-info-50 border border-info-200 rounded-md text-xs text-info-700">
            Service requests are processed within 1-2 business days. You will receive updates via email and SMS.
          </div>
        </div>

        <div className="p-5 border-t border-border">
          <button
            onClick={handleSubmit}
            disabled={submitting || !details.trim()}
            className={cn(
              'w-full py-2.5 rounded-md text-sm font-semibold transition-all flex items-center justify-center gap-2',
              details.trim() && !submitting
                ? 'bg-primary-900 text-white hover:bg-primary-700'
                : 'bg-surface-300 text-muted-foreground cursor-not-allowed',
            )}
          >
            {submitting ? (
              <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Submitting…</>
            ) : (
              <><CheckCircle2 size={14} /> Submit Request</>
            )}
          </button>
        </div>
      </motion.div>
    </>
  )
}

export function ServiceRequests() {
  const [requests,   setRequests]   = useState<ServiceRequest[]>(INITIAL)
  const [showCreate, setShowCreate] = useState(false)
  const [filter,     setFilter]     = useState<'all' | ServiceRequest['status']>('all')

  const filtered = filter === 'all' ? requests : requests.filter(r => r.status === filter)

  const counts = {
    all:         requests.length,
    open:        requests.filter(r => r.status === 'open').length,
    in_progress: requests.filter(r => r.status === 'in_progress').length,
    completed:   requests.filter(r => r.status === 'completed').length,
    cancelled:   requests.filter(r => r.status === 'cancelled').length,
  }

  return (
    <div className="p-6 space-y-5 max-w-[1400px]">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="page-title">Service Requests</h1>
          <p className="page-subtitle text-muted-foreground mt-0.5">
            Banking operations requests — inward remittance disposal, stop payments, certified statements
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 bg-primary-900 text-white rounded-md px-4 py-2 text-sm font-semibold hover:bg-primary-700 transition-colors"
        >
          <Plus size={16} />
          New Request
        </button>
      </div>

      {/* Filter tabs */}
      <div className="flex rounded-lg border border-border overflow-hidden w-fit">
        {(['all', 'open', 'in_progress', 'completed'] as const).map(s => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={cn(
              'px-4 py-2 text-xs font-medium transition-colors flex items-center gap-1.5',
              filter === s
                ? 'bg-primary-900 text-white'
                : 'bg-surface-0 text-muted-foreground hover:bg-surface-100',
            )}
          >
            {s === 'all' ? 'All' : s === 'in_progress' ? 'In Progress' : s.charAt(0).toUpperCase() + s.slice(1)}
            <span className={cn('rounded-full px-1.5', filter === s ? 'bg-white/20' : 'bg-surface-100')}>
              {counts[s]}
            </span>
          </button>
        ))}
      </div>

      {/* Request cards */}
      {filtered.length === 0 ? (
        <div className="card-base text-center py-12 text-sm text-muted-foreground">
          No requests match the current filter.
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(req => (
            <RequestCard key={req.id} req={req} />
          ))}
        </div>
      )}

      {/* New request drawer */}
      <AnimatePresence>
        {showCreate && (
          <NewRequestDrawer
            onClose={() => setShowCreate(false)}
            onAdd={req => setRequests(prev => [req, ...prev])}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
