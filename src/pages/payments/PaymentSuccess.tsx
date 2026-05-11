import { useLocation, useNavigate } from 'react-router-dom'
import { motion }                    from 'framer-motion'
import {
  CheckCircle2, Download, Plus, LayoutDashboard,
  Copy, ExternalLink,
} from 'lucide-react'
import { toast }                    from 'sonner'
import { formatINR, formatCurrency, formatDate } from '@/lib/utils'

interface SuccessState {
  amount:        number
  netAmount:     number
  beneficiary:   string
  currency:      string
  foreignAmount?: number
  reference:     string
  uetr:          string
  valueDate:     string
}

export function PaymentSuccess() {
  const navigate = useNavigate()
  const { state } = useLocation() as { state?: SuccessState }

  // Fallback demo data when navigated directly
  const data: SuccessState = state ?? {
    amount:       62500000,
    netAmount:    62422980,
    beneficiary:  'Acme Corporation USA',
    currency:     'USD',
    foreignAmount: 74915.60,
    reference:    `TXN-ARTTHA-${new Date().getFullYear()}${String(Date.now()).slice(-8)}`,
    uetr:         'b4c8d2e6-f1a3-7890-abcd-ef5678901234',
    valueDate:    new Date(Date.now() + 2 * 86400000).toISOString().slice(0, 10),
  }

  function copyToClipboard(text: string, label: string) {
    navigator.clipboard.writeText(text).then(() => toast.success(`${label} copied`))
  }

  return (
    <div className="p-6 flex items-center justify-center min-h-[70vh]">
      <div className="w-full max-w-lg">
        {/* Success animation */}
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 260, damping: 20, delay: 0.1 }}
          className="flex justify-center mb-6"
        >
          <div className="w-20 h-20 rounded-full bg-success-50 border-4 border-success-100 flex items-center justify-center">
            <CheckCircle2 size={40} className="text-success-600" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
        >
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-foreground">Transfer Authorized</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Your transfer has been authorized and submitted for processing.
            </p>
          </div>

          {/* Summary card */}
          <div className="card-base p-6 mb-5 space-y-4">
            <div className="text-center pb-4 border-b border-border">
              <p className="text-xs text-muted-foreground mb-1">Amount Debited</p>
              <p className="text-3xl font-bold font-mono text-foreground">{formatINR(data.amount)}</p>
              {data.foreignAmount && data.currency && (
                <p className="text-sm text-muted-foreground mt-1">
                  Beneficiary receives approx.{' '}
                  <span className="font-mono font-semibold text-success-700">
                    {formatCurrency(data.foreignAmount, data.currency)}
                  </span>
                </p>
              )}
              <p className="text-xs text-muted-foreground mt-1">
                Net amount after charges: <span className="font-mono font-medium">{formatINR(data.netAmount)}</span>
              </p>
            </div>

            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">To</span>
                <span className="text-xs font-semibold text-foreground">{data.beneficiary}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Value Date</span>
                <span className="text-xs font-medium text-foreground">{data.valueDate ? formatDate(data.valueDate) : '—'}</span>
              </div>

              {/* Reference */}
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Transaction Reference</span>
                <div className="flex items-center gap-1">
                  <span className="text-xs font-mono font-semibold text-foreground">{data.reference}</span>
                  <button
                    onClick={() => copyToClipboard(data.reference, 'Reference')}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <Copy size={12} />
                  </button>
                </div>
              </div>

              {/* UETR */}
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">UETR</span>
                <div className="flex items-center gap-1">
                  <span className="text-xs font-mono text-muted-foreground">{data.uetr.slice(0, 18)}…</span>
                  <button
                    onClick={() => copyToClipboard(data.uetr, 'UETR')}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <Copy size={12} />
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-border">
                <span className="text-xs text-muted-foreground">Status</span>
                <span className="text-xs font-medium bg-success-50 text-success-700 rounded-full px-3 py-1">
                  ✓ Authorized
                </span>
              </div>
            </div>
          </div>

          {/* SWIFT tracker link */}
          <div className="flex items-center gap-2 p-3 bg-info-50 border border-info-200 rounded-md text-xs text-info-700 mb-5">
            <ExternalLink size={13} />
            <span>Track this SWIFT payment using UETR on the SWIFT gpi Tracker (demo).</span>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-3">
            <button
              onClick={() => toast.success('Receipt downloaded (demo)')}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-md border border-border text-sm font-medium text-foreground hover:bg-surface-100 transition-colors"
            >
              <Download size={15} />
              Download Receipt
            </button>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => navigate('/payments/new')}
                className="flex items-center justify-center gap-2 py-2.5 rounded-md border border-border text-sm font-medium text-foreground hover:bg-surface-100 transition-colors"
              >
                <Plus size={15} />
                Make Another
              </button>
              <button
                onClick={() => navigate('/dashboard')}
                className="flex items-center justify-center gap-2 py-2.5 rounded-md bg-primary-900 text-white text-sm font-semibold hover:bg-primary-700 transition-colors"
              >
                <LayoutDashboard size={15} />
                Dashboard
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
