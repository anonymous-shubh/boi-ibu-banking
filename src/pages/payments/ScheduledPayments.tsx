import { useState }               from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus, Calendar, RefreshCw, Clock,
  XCircle, Edit, Trash2, X, CheckCircle2,
} from 'lucide-react'
import { toast }                   from 'sonner'
import { formatCurrency, formatDate, getCurrencyFlag, cn } from '@/lib/utils'
import scheduledData               from '@/data/scheduledPayments.json'
import type { ScheduledPayment }   from '@/types'

const INITIAL = scheduledData as ScheduledPayment[]

const FREQUENCY_LABELS: Record<string, string> = {
  once: 'One-time', weekly: 'Weekly', monthly: 'Monthly',
}

const FREQUENCY_ICONS: Record<string, React.ElementType> = {
  once: Clock, weekly: RefreshCw, monthly: Calendar,
}

function StatusBadge({ status }: { status: ScheduledPayment['status'] }) {
  return (
    <span className={cn(
      'text-xs rounded-full px-2.5 py-1 font-medium',
      status === 'active'    && 'bg-success-50 text-success-700',
      status === 'expired'   && 'bg-surface-100 text-muted-foreground',
      status === 'cancelled' && 'bg-error-50 text-error-700',
    )}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  )
}

export function ScheduledPayments() {
  const [payments, setPayments] = useState<ScheduledPayment[]>(INITIAL)
  const [showCreate, setShowCreate] = useState(false)

  function handleCancel(id: string) {
    setPayments(prev => prev.map(p => p.id === id ? { ...p, status: 'cancelled' } : p))
    toast.success('Scheduled payment cancelled.')
  }

  const active    = payments.filter(p => p.status === 'active').length
  const cancelled = payments.filter(p => p.status === 'cancelled').length

  return (
    <div className="p-6 space-y-5 max-w-[1400px]">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="page-title">Scheduled Payments</h1>
          <p className="page-subtitle text-muted-foreground mt-0.5">
            Manage recurring and future-dated payment rules
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 bg-primary-900 text-white rounded-md px-4 py-2 text-sm font-semibold hover:bg-primary-700 transition-colors"
        >
          <Plus size={16} />
          New Scheduled Payment
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Active Rules',    value: active,                    color: 'text-success-700' },
          { label: 'Total Rules',     value: payments.length,           color: 'text-foreground' },
          { label: 'Cancelled Rules', value: cancelled,                 color: 'text-error-700' },
        ].map(({ label, value, color }) => (
          <div key={label} className="card-base px-4 py-3">
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className={cn('text-xl font-bold mt-0.5', color)}>{value}</p>
          </div>
        ))}
      </div>

      {/* Rules table */}
      <div className="rounded-lg border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-surface-100 border-b border-border">
              {['Beneficiary', 'Amount', 'Frequency', 'Next Date', 'End Date', 'Purpose', 'Status', 'Actions'].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {payments.map(p => {
              const FreqIcon = FREQUENCY_ICONS[p.frequency]
              return (
                <tr key={p.id} className="hover:bg-surface-50 transition-colors">
                  <td className="px-4 py-3">
                    <p className="text-xs font-semibold text-foreground">{p.beneficiaryName}</p>
                    <p className="text-xs font-mono text-muted-foreground">{p.id}</p>
                  </td>
                  <td className="px-4 py-3 text-xs font-mono font-semibold text-foreground">
                    {getCurrencyFlag(p.currency)} {formatCurrency(p.amount, p.currency)}
                  </td>
                  <td className="px-4 py-3">
                    <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <FreqIcon size={12} />
                      {FREQUENCY_LABELS[p.frequency]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-foreground">{formatDate(p.nextDate)}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    {p.endDate ? formatDate(p.endDate) : '—'}
                  </td>
                  <td className="px-4 py-3 text-xs font-mono text-muted-foreground">{p.purposeCode}</td>
                  <td className="px-4 py-3"><StatusBadge status={p.status} /></td>
                  <td className="px-4 py-3">
                    {p.status === 'active' && (
                      <div className="flex items-center gap-2">
                        <button className="text-primary-600 hover:text-primary-800 transition-colors">
                          <Edit size={13} />
                        </button>
                        <button
                          onClick={() => handleCancel(p.id)}
                          className="text-error-600 hover:text-error-800 transition-colors"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Create drawer (simplified) */}
      <AnimatePresence>
        {showCreate && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowCreate(false)}
              className="fixed inset-0 bg-black/40 z-30"
            />
            <motion.div
              initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
              transition={{ type: 'tween', duration: 0.25 }}
              className="fixed right-0 top-0 h-full w-[420px] bg-surface-0 shadow-modal z-40 flex flex-col"
            >
              <div className="flex items-center justify-between p-5 border-b border-border">
                <h3 className="text-sm font-bold text-foreground">New Scheduled Payment</h3>
                <button onClick={() => setShowCreate(false)} className="text-muted-foreground hover:text-foreground">
                  <X size={18} />
                </button>
              </div>
              <div className="flex-1 p-5 space-y-4">
                {(['Beneficiary', 'Amount (INR)', 'Frequency', 'Start Date', 'End Date (optional)', 'Purpose Code'] as const).map(f => (
                  <div key={f}>
                    <label className="block text-xs font-medium text-foreground mb-1.5">{f}</label>
                    {f === 'Frequency' ? (
                      <select className="w-full px-3 py-2 text-sm border border-border rounded-md bg-surface-50 focus:outline-none focus:ring-2 focus:ring-primary-500">
                        <option>One-time</option>
                        <option>Weekly</option>
                        <option>Monthly</option>
                      </select>
                    ) : (
                      <input
                        type={f.includes('Date') ? 'date' : 'text'}
                        className="w-full px-3 py-2 text-sm border border-border rounded-md bg-surface-50 focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                    )}
                  </div>
                ))}
              </div>
              <div className="p-5 border-t border-border">
                <button
                  onClick={() => { toast.success('Scheduled payment created.'); setShowCreate(false) }}
                  className="w-full py-2.5 rounded-md bg-primary-900 text-white text-sm font-semibold hover:bg-primary-700 transition-colors flex items-center justify-center gap-2"
                >
                  <CheckCircle2 size={14} />
                  Create Scheduled Payment
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
