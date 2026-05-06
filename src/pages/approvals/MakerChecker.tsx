import { useState }               from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  CheckCircle2, XCircle, Clock, AlertTriangle,
  ChevronRight, ChevronLeft, Shield,
  FileText, Users, PiggyBank,
} from 'lucide-react'
import { toast }                   from 'sonner'
import { useBanking }              from '@/context/BankingContext'
import { useAuth }                 from '@/context/AuthContext'
import { OTPAuthModal }            from '@/components/modals/OTPAuthModal'
import { formatINR, formatDateTime, cn } from '@/lib/utils'
import pendingData                 from '@/data/pendingApprovals.json'
import type { PendingApproval }    from '@/types'

const INITIAL_APPROVALS = pendingData as PendingApproval[]

const REJECTION_REASONS = [
  'Insufficient documentation',
  'SWIFT/IBAN validation failed',
  'Purpose code mismatch',
  'Exceeds daily transaction limit',
  'Beneficiary not verified',
  'Compliance review required',
  'Duplicate transaction suspected',
  'Other',
]

const TYPE_LABELS: Record<string, string> = {
  fund_transfer:   'Fund Transfer',
  beneficiary_add: 'Beneficiary Addition',
  fd_creation:     'Fixed Deposit Creation',
  fx_conversion:   'FX Conversion',
}

function TypeIcon({ type }: { type: PendingApproval['type'] }) {
  const props = { size: 16 }
  if (type === 'fund_transfer')   return <Shield    {...props} className="text-primary-600" />
  if (type === 'beneficiary_add') return <Users     {...props} className="text-info-600" />
  if (type === 'fd_creation')     return <PiggyBank {...props} className="text-accent-gold" />
  return <FileText {...props} className="text-muted-foreground" />
}

function ApprovalRow({
  approval,
  isSelected,
  onSelect,
}: {
  approval: PendingApproval
  isSelected: boolean
  onSelect: () => void
}) {
  return (
    <motion.tr
      layout
      onClick={onSelect}
      className={cn(
        'cursor-pointer transition-colors',
        isSelected ? 'bg-accent-light' : 'hover:bg-surface-50',
        approval.urgency === 'high' && !isSelected && 'border-l-2 border-l-error-400',
      )}
    >
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <TypeIcon type={approval.type} />
          <span className="text-xs font-medium text-foreground">{TYPE_LABELS[approval.type]}</span>
          {approval.urgency === 'high' && (
            <span className="text-xs bg-error-50 text-error-700 rounded-full px-2 py-0.5 font-medium">High</span>
          )}
        </div>
      </td>
      <td className="px-4 py-3">
        <p className="text-xs font-medium text-foreground">{approval.beneficiary ?? '—'}</p>
        {approval.beneficiaryBank && (
          <p className="text-xs text-muted-foreground">{approval.beneficiaryBank}</p>
        )}
      </td>
      <td className="px-4 py-3 text-right">
        {approval.amount ? (
          <span className="text-xs font-mono font-semibold text-foreground">{formatINR(approval.amount, true)}</span>
        ) : (
          <span className="text-xs text-muted-foreground">—</span>
        )}
      </td>
      <td className="px-4 py-3 text-xs text-muted-foreground">{approval.makerName}</td>
      <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
        {formatDateTime(approval.submittedAt)}
      </td>
      <td className="px-4 py-3">
        <span className={cn(
          'text-xs rounded-full px-2.5 py-1 font-medium',
          approval.status === 'pending'  && 'bg-warning-50 text-warning-700',
          approval.status === 'approved' && 'bg-success-50 text-success-700',
          approval.status === 'rejected' && 'bg-error-50 text-error-700',
        )}>
          {approval.status.charAt(0).toUpperCase() + approval.status.slice(1)}
        </span>
      </td>
      <td className="px-4 py-3">
        <ChevronRight size={14} className={cn('transition-transform', isSelected && 'rotate-90 text-primary-600')} />
      </td>
    </motion.tr>
  )
}

function ApprovalDetail({
  approval,
  onApprove,
  onReject,
  onClose,
}: {
  approval: PendingApproval
  onApprove: (remarks: string) => void
  onReject:  (reason: string, remarks: string) => void
  onClose:   () => void
}) {
  const [mode,    setMode]    = useState<'view' | 'approve' | 'reject'>('view')
  const [remarks, setRemarks] = useState('')
  const [reason,  setReason]  = useState(REJECTION_REASONS[0])
  const [otpOpen, setOtpOpen] = useState(false)

  return (
    <div className="card-base p-5 h-full">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold text-foreground">Approval Detail</h3>
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
          <ChevronLeft size={16} />
        </button>
      </div>

      <div className="space-y-4">
        {/* Type + urgency */}
        <div className="flex items-center gap-2">
          <TypeIcon type={approval.type} />
          <span className="text-sm font-semibold text-foreground">{TYPE_LABELS[approval.type]}</span>
          {approval.urgency === 'high' && (
            <span className="text-xs bg-error-50 text-error-700 border border-error-200 rounded-full px-2 py-0.5">High Priority</span>
          )}
        </div>

        {/* Details grid */}
        <div className="space-y-2 text-xs border border-border rounded-lg p-3 bg-surface-50">
          {[
            { label: 'Reference',    value: approval.id },
            { label: 'Maker',        value: `${approval.makerName} (${approval.makerId})` },
            { label: 'Submitted',    value: formatDateTime(approval.submittedAt) },
            approval.amount     && { label: 'Amount',       value: formatINR(approval.amount) },
            approval.beneficiary && { label: 'Beneficiary', value: approval.beneficiary },
            approval.beneficiaryBank && { label: 'Bank',    value: approval.beneficiaryBank },
            approval.purpose    && { label: 'Purpose',      value: approval.purpose },
          ].filter(Boolean).map(row => row && (
            <div key={row.label} className="flex gap-2">
              <span className="text-muted-foreground w-24 flex-shrink-0">{row.label}</span>
              <span className="font-medium text-foreground break-words">{row.value}</span>
            </div>
          ))}
        </div>

        {/* Status */}
        {approval.status !== 'pending' && (
          <div className={cn(
            'p-3 rounded-md text-xs',
            approval.status === 'approved' ? 'bg-success-50 border border-success-200 text-success-800' : 'bg-error-50 border border-error-200 text-error-800',
          )}>
            <div className="flex items-center gap-1 mb-1">
              {approval.status === 'approved' ? <CheckCircle2 size={13} /> : <XCircle size={13} />}
              <strong>{approval.status === 'approved' ? 'Approved' : 'Rejected'}</strong>
              {approval.resolvedAt && ` • ${formatDateTime(approval.resolvedAt)}`}
            </div>
            {approval.checkerRemarks && <p>{approval.checkerRemarks}</p>}
          </div>
        )}

        {/* Actions for pending items */}
        {approval.status === 'pending' && (
          <>
            {mode === 'view' && (
              <div className="flex gap-2 pt-2">
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setMode('approve')}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-md bg-success-600 text-white text-xs font-semibold hover:bg-success-700 transition-colors"
                >
                  <CheckCircle2 size={14} /> Approve
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setMode('reject')}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-md bg-error-600 text-white text-xs font-semibold hover:bg-error-700 transition-colors"
                >
                  <XCircle size={14} /> Reject
                </motion.button>
              </div>
            )}

            {mode === 'approve' && (
              <div className="space-y-3 pt-2">
                <div>
                  <label className="block text-xs font-medium text-foreground mb-1">Checker Remarks (optional)</label>
                  <textarea
                    value={remarks}
                    onChange={e => setRemarks(e.target.value)}
                    rows={2}
                    placeholder="Add any remarks..."
                    className="w-full px-3 py-2 text-xs border border-border rounded-md bg-surface-50 resize-none focus:outline-none focus:ring-2 focus:ring-success-500"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setOtpOpen(true)}
                    className="flex-1 py-2.5 rounded-md bg-success-600 text-white text-xs font-semibold hover:bg-success-700 transition-colors flex items-center justify-center gap-1.5"
                  >
                    <Shield size={13} /> Confirm Approval
                  </button>
                  <button onClick={() => setMode('view')} className="px-3 py-2.5 rounded-md border border-border text-xs text-muted-foreground hover:bg-surface-100 transition-colors">
                    Back
                  </button>
                </div>
              </div>
            )}

            {mode === 'reject' && (
              <div className="space-y-3 pt-2">
                <div>
                  <label className="block text-xs font-medium text-foreground mb-1">Rejection Reason *</label>
                  <select
                    value={reason}
                    onChange={e => setReason(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-border rounded-md bg-surface-50 focus:outline-none focus:ring-2 focus:ring-error-500"
                  >
                    {REJECTION_REASONS.map(r => <option key={r}>{r}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-foreground mb-1">Additional Remarks</label>
                  <textarea
                    value={remarks}
                    onChange={e => setRemarks(e.target.value)}
                    rows={2}
                    placeholder="Provide details for the Maker..."
                    className="w-full px-3 py-2 text-xs border border-border rounded-md bg-surface-50 resize-none focus:outline-none focus:ring-2 focus:ring-error-500"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => onReject(reason, remarks)}
                    className="flex-1 py-2.5 rounded-md bg-error-600 text-white text-xs font-semibold hover:bg-error-700 transition-colors flex items-center justify-center gap-1.5"
                  >
                    <XCircle size={13} /> Confirm Rejection
                  </button>
                  <button onClick={() => setMode('view')} className="px-3 py-2.5 rounded-md border border-border text-xs text-muted-foreground hover:bg-surface-100 transition-colors">
                    Back
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* OTP for approval */}
      <OTPAuthModal
        isOpen={otpOpen}
        title="Confirm Approval"
        description="Enter OTP to authorize your Checker approval."
        onVerify={async () => {
          await new Promise(r => setTimeout(r, 1200))
          onApprove(remarks)
        }}
        onClose={() => setOtpOpen(false)}
      />
    </div>
  )
}

export function MakerChecker() {
  const { decrementPending } = useBanking()
  const { currentUser }      = useAuth()

  const [approvals,   setApprovals]  = useState<PendingApproval[]>(INITIAL_APPROVALS)
  const [selected,    setSelected]   = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all')

  const selectedApproval = approvals.find(a => a.id === selected)

  const filtered = approvals.filter(a =>
    statusFilter === 'all' || a.status === statusFilter,
  )

  const counts = {
    all:      approvals.length,
    pending:  approvals.filter(a => a.status === 'pending').length,
    approved: approvals.filter(a => a.status === 'approved').length,
    rejected: approvals.filter(a => a.status === 'rejected').length,
  }

  function handleApprove(id: string, remarks: string) {
    setApprovals(prev => prev.map(a =>
      a.id === id
        ? { ...a, status: 'approved', checkerName: currentUser?.name, checkerRemarks: remarks, resolvedAt: new Date().toISOString() }
        : a,
    ))
    decrementPending()
    setSelected(null)
    toast.success('Payment approved. Maker has been notified.')
  }

  function handleReject(id: string, reason: string, remarks: string) {
    setApprovals(prev => prev.map(a =>
      a.id === id
        ? { ...a, status: 'rejected', checkerName: currentUser?.name, checkerRemarks: `${reason}${remarks ? ': ' + remarks : ''}`, resolvedAt: new Date().toISOString() }
        : a,
    ))
    decrementPending()
    setSelected(null)
    toast.success('Payment rejected. Maker has been notified with the reason.')
  }

  const canAct = currentUser?.role === 'Checker' || currentUser?.role === 'Admin'

  return (
    <div className="p-6 space-y-5 max-w-[1400px]">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="page-title">Maker-Checker Approvals</h1>
          <p className="page-subtitle text-muted-foreground mt-0.5">
            Review and authorize pending transactions submitted by Makers
          </p>
        </div>
        {counts.pending > 0 && (
          <div className="flex items-center gap-2 bg-warning-50 border border-warning-200 rounded-lg px-4 py-2">
            <Clock size={16} className="text-warning-600" />
            <span className="text-sm font-semibold text-warning-800">{counts.pending} pending</span>
          </div>
        )}
      </div>

      {!canAct && (
        <div className="flex items-start gap-2 p-3 bg-info-50 border border-info-200 rounded-md text-xs text-info-700">
          <AlertTriangle size={14} className="flex-shrink-0 mt-0.5" />
          <span>You are viewing as <strong>{currentUser?.role}</strong>. Only Checkers and Admins can approve or reject. Switch role from the TopBar to demonstrate the approval flow.</span>
        </div>
      )}

      {/* Status tabs */}
      <div className="flex rounded-lg border border-border overflow-hidden w-fit">
        {(['all', 'pending', 'approved', 'rejected'] as const).map(s => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={cn(
              'px-4 py-2 text-xs font-medium transition-colors flex items-center gap-1.5',
              statusFilter === s
                ? 'bg-primary-900 text-white'
                : 'bg-surface-0 text-muted-foreground hover:bg-surface-100',
            )}
          >
            {s === 'pending'  && <Clock size={12} />}
            {s === 'approved' && <CheckCircle2 size={12} />}
            {s === 'rejected' && <XCircle size={12} />}
            {s.charAt(0).toUpperCase() + s.slice(1)}
            <span className={cn('rounded-full px-1.5', statusFilter === s ? 'bg-white/20' : 'bg-surface-100')}>
              {counts[s]}
            </span>
          </button>
        ))}
      </div>

      <div className={cn('grid gap-5', selected ? 'grid-cols-5' : 'grid-cols-1')}>
        {/* Approvals table */}
        <div className={selected ? 'col-span-3' : 'col-span-1'}>
          <div className="rounded-lg border border-border overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-surface-100 border-b border-border">
                  {['Type', 'Beneficiary', 'Amount', 'Submitted By', 'Submitted At', 'Status', ''].map(h => (
                    <th key={h} className={cn(
                      'px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider',
                      h === 'Amount' ? 'text-right' : 'text-left',
                    )}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center text-sm text-muted-foreground">
                      No approvals match the current filter.
                    </td>
                  </tr>
                ) : (
                  filtered.map(a => (
                    <ApprovalRow
                      key={a.id}
                      approval={a}
                      isSelected={selected === a.id}
                      onSelect={() => setSelected(selected === a.id ? null : a.id)}
                    />
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Detail panel */}
        <AnimatePresence>
          {selected && selectedApproval && (
            <motion.div
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 12 }}
              className="col-span-2"
            >
              <ApprovalDetail
                approval={selectedApproval}
                onApprove={remarks => handleApprove(selectedApproval.id, remarks)}
                onReject={(reason, remarks) => handleReject(selectedApproval.id, reason, remarks)}
                onClose={() => setSelected(null)}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
