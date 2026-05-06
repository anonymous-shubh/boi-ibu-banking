import { useNavigate }           from 'react-router-dom'
import { motion }                 from 'framer-motion'
import {
  ArrowUpRight, ArrowDownRight, TrendingUp, Clock,
  CreditCard, RefreshCw, PiggyBank, FileText,
  AlertTriangle, ChevronRight, ArrowRight, Activity,
} from 'lucide-react'
import { useBanking }             from '@/context/BankingContext'
import { useAuth }                from '@/context/AuthContext'
import { useFXRates }             from '@/hooks/useFXRates'
import { formatINR, formatCurrency, getCurrencyFlag, formatDate, cn } from '@/lib/utils'
import transactionsData           from '@/data/transactions.json'
import type { Transaction }       from '@/types'

const transactions = transactionsData as Transaction[]

// ─── Sub-components ──────────────────────────────────────────────────────────

function HeroAccountCard({ onNavigate }: { onNavigate: () => void }) {
  const { accounts } = useBanking()
  const primary = accounts.find(a => a.primary) ?? accounts[0]

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      onClick={onNavigate}
      className="relative overflow-hidden rounded-xl cursor-pointer group"
      style={{ background: 'linear-gradient(135deg, #0A1F44 0%, #1A3A6B 60%, #2463AE 100%)' }}
    >
      {/* Subtle dot pattern overlay */}
      <div
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: 'radial-gradient(circle, #C9A84C 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }}
      />

      <div className="relative p-6">
        <div className="flex items-start justify-between mb-6">
          <div>
            <p className="text-xs font-medium text-blue-200/80 uppercase tracking-widest mb-1">
              {getCurrencyFlag('INR')} INR Primary Account
            </p>
            <p className="text-xs text-blue-300/60 font-mono">{primary.accountNo ?? primary.id}</p>
          </div>
          <div className="flex items-center gap-1.5 bg-white/10 rounded-full px-3 py-1">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            <span className="text-xs text-blue-100">Active</span>
          </div>
        </div>

        <div className="mb-6">
          <p className="text-sm text-blue-300/70 mb-1">Available Balance</p>
          <p className="text-4xl font-bold text-white font-mono tracking-tight">
            {formatINR(primary.available, true)}
          </p>
          <p className="text-sm text-blue-300/60 mt-1">
            Book balance: {formatINR(primary.balance, true)}
          </p>
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-white/10">
          <div className="flex items-center gap-4">
            <div>
              <p className="text-xs text-blue-300/60">IFSC</p>
              <p className="text-sm font-mono text-blue-100">{primary.ifsc ?? 'BKID0GFTCIT'}</p>
            </div>
            <div>
              <p className="text-xs text-blue-300/60">Account Type</p>
              <p className="text-sm text-blue-100">{primary.type}</p>
            </div>
          </div>
          <div className="flex items-center gap-1 text-accent-gold group-hover:gap-2 transition-all text-sm font-medium">
            View Details <ArrowRight size={14} />
          </div>
        </div>
      </div>
    </motion.div>
  )
}

function ForeignAccountCard({
  account,
  index,
  onClick,
}: {
  account: { id: string; currency: string; balance: number; available: number; name: string; type: string }
  index: number
  onClick: () => void
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.1 + index * 0.05 }}
      onClick={onClick}
      className="card-base p-4 cursor-pointer hover:border-primary-300 group transition-all"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-lg">{getCurrencyFlag(account.currency)}</span>
          <div>
            <p className="text-xs font-semibold text-foreground">{account.currency}</p>
            <p className="text-xs text-muted-foreground">{account.type}</p>
          </div>
        </div>
        <ChevronRight size={14} className="text-muted-foreground group-hover:text-primary-600 transition-colors" />
      </div>
      <p className="text-lg font-bold font-mono text-foreground">
        {formatCurrency(account.available, account.currency, true)}
      </p>
      <p className="text-xs text-muted-foreground mt-0.5">
        Book: {formatCurrency(account.balance, account.currency, true)}
      </p>
    </motion.div>
  )
}

function FXTicker() {
  const rates = useFXRates()
  const tickerPairs = ['USD/INR', 'EUR/INR', 'GBP/INR', 'AED/INR']
  const displayed = rates.filter(r => tickerPairs.includes(r.pair))

  return (
    <div className="flex items-center gap-1 overflow-x-auto scrollbar-none">
      <div className="flex items-center gap-1 flex-shrink-0 mr-2">
        <Activity size={12} className="text-accent-gold animate-pulse" />
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Live FX</span>
        <span className="text-xs text-warning-600 bg-warning-50 border border-warning-200 rounded px-1.5 py-0.5 ml-1">Indicative</span>
      </div>
      {displayed.map((rate) => (
        <motion.div
          key={rate.pair}
          animate={{ opacity: [1, 0.7, 1] }}
          transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
          className="flex-shrink-0 flex items-center gap-2 bg-surface-100 rounded-md px-3 py-1.5"
        >
          <span className="text-xs font-semibold text-foreground">{rate.pair}</span>
          <span className="text-xs font-mono font-medium text-foreground">{rate.ask.toFixed(2)}</span>
          <span className={cn(
            'text-xs flex items-center gap-0.5',
            rate.change24h >= 0 ? 'text-success-600' : 'text-error-600',
          )}>
            {rate.change24h >= 0
              ? <ArrowUpRight size={11} />
              : <ArrowDownRight size={11} />}
            {Math.abs(rate.change24h).toFixed(2)}
          </span>
        </motion.div>
      ))}
    </div>
  )
}

function RecentTransactions() {
  const navigate = useNavigate()
  const recent = transactions
    .filter(t => t.accountId === 'BOIGC001')
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 6)

  const typeLabel: Record<string, string> = {
    inward: 'Inward', outward: 'Outward', domestic: 'Domestic',
    fd: 'Fixed Deposit', fx: 'FX', fee: 'Charges',
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-foreground">Recent Transactions</h3>
        <button
          onClick={() => navigate('/accounts/BOIGC001')}
          className="text-xs text-primary-600 hover:text-primary-800 flex items-center gap-1 transition-colors"
        >
          View all <ChevronRight size={12} />
        </button>
      </div>

      <div className="rounded-lg border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-surface-100 border-b border-border">
              <th className="px-4 py-2.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Date</th>
              <th className="px-4 py-2.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Description</th>
              <th className="px-4 py-2.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Type</th>
              <th className="px-4 py-2.5 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">Amount</th>
              <th className="px-4 py-2.5 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {recent.map((txn, i) => {
              const isCredit = !!txn.credit
              const amount   = txn.credit ?? txn.debit ?? 0
              return (
                <motion.tr
                  key={txn.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.04 }}
                  className="hover:bg-surface-50 transition-colors"
                >
                  <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                    {formatDate(txn.date)}
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-xs font-medium text-foreground truncate max-w-[200px]">{txn.description}</p>
                    {txn.counterparty && (
                      <p className="text-xs text-muted-foreground truncate max-w-[200px]">{txn.counterparty}</p>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs bg-surface-100 text-muted-foreground rounded px-2 py-0.5">
                      {typeLabel[txn.type] ?? txn.type}
                    </span>
                  </td>
                  <td className={cn(
                    'px-4 py-3 text-right text-xs font-mono font-semibold whitespace-nowrap',
                    isCredit ? 'text-success-600' : 'text-error-600',
                  )}>
                    {isCredit ? '+' : '-'}{formatINR(amount)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className={cn(
                      'text-xs rounded-full px-2 py-0.5 font-medium',
                      txn.status === 'completed' ? 'bg-success-50 text-success-700' :
                      txn.status === 'pending'   ? 'bg-warning-50 text-warning-700' :
                                                   'bg-error-50 text-error-700',
                    )}>
                      {txn.status === 'completed' ? 'Completed' : txn.status === 'pending' ? 'Pending' : 'Failed'}
                    </span>
                  </td>
                </motion.tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function QuickActions() {
  const navigate = useNavigate()
  const actions = [
    { icon: ArrowUpRight,  label: 'New Payment',    sub: 'RTGS / SWIFT',    route: '/payments/new',      color: 'text-primary-600 bg-primary-50' },
    { icon: TrendingUp,    label: 'FX Conversion',  sub: 'Live rates',      route: '/fx',                color: 'text-success-600 bg-success-50' },
    { icon: PiggyBank,     label: 'Fixed Deposit',  sub: 'INR only',        route: '/fixed-deposits',    color: 'text-accent-gold bg-accent-light' },
    { icon: FileText,      label: 'Statements',     sub: 'CSV / XML / JSON',route: '/statements',        color: 'text-info-600 bg-info-50' },
    { icon: CreditCard,    label: 'Beneficiaries',  sub: 'Manage whitelist',route: '/beneficiaries',     color: 'text-warning-600 bg-warning-50' },
    { icon: RefreshCw,     label: 'Scheduled',      sub: 'View rules',      route: '/payments/scheduled',color: 'text-muted-foreground bg-surface-100' },
  ]

  return (
    <div>
      <h3 className="text-sm font-semibold text-foreground mb-3">Quick Actions</h3>
      <div className="grid grid-cols-3 gap-2">
        {actions.map(({ icon: Icon, label, sub, route, color }, i) => (
          <motion.button
            key={label}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.15 + i * 0.04 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate(route)}
            className="flex flex-col items-start gap-2 p-3 rounded-lg border border-border bg-surface-0 hover:border-primary-300 hover:shadow-card transition-all text-left"
          >
            <div className={cn('w-8 h-8 rounded-md flex items-center justify-center', color)}>
              <Icon size={16} />
            </div>
            <div>
              <p className="text-xs font-semibold text-foreground">{label}</p>
              <p className="text-xs text-muted-foreground">{sub}</p>
            </div>
          </motion.button>
        ))}
      </div>
    </div>
  )
}

function PendingWidget() {
  const navigate = useNavigate()
  const { pendingApprovalsCount } = useBanking()
  const { currentUser }           = useAuth()
  if (!['Admin', 'Checker'].includes(currentUser?.role ?? '')) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="card-base p-4"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-warning-50 flex items-center justify-center">
            <Clock size={18} className="text-warning-600" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">Pending Approvals</p>
            <p className="text-xs text-muted-foreground">Awaiting your review</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-2xl font-bold text-warning-600 font-mono">{pendingApprovalsCount}</span>
          <button
            onClick={() => navigate('/approvals')}
            className="flex items-center gap-1 text-xs bg-primary-900 text-white rounded-md px-3 py-1.5 hover:bg-primary-700 transition-colors"
          >
            Review <ArrowRight size={12} />
          </button>
        </div>
      </div>
    </motion.div>
  )
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────

export function Dashboard() {
  const navigate  = useNavigate()
  const { accounts } = useBanking()
  const foreign = accounts.filter(a => !a.primary)

  return (
    <div className="p-6 space-y-5 max-w-[1400px]">

      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle text-muted-foreground mt-0.5">
            BOI GIFT City IBU — Corporate Internet Banking
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground bg-surface-100 rounded-md px-3 py-2">
          <span className="w-1.5 h-1.5 rounded-full bg-success-500 animate-pulse" />
          As of {new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })} IST
        </div>
      </div>

      {/* IFSCA compliance notice */}
      <div className="compliance-bar-info flex items-center gap-2">
        <AlertTriangle size={13} className="text-info-600 flex-shrink-0" />
        <span>
          You are accessing BOI GIFT City IBU Internet Banking, a regulated service under IFSCA.
          Transactions are subject to FEMA and IFSCA circular IFSCA/IBU/2024/012.
        </span>
      </div>

      {/* FX ticker */}
      <div className="card-base px-4 py-3">
        <FXTicker />
      </div>

      {/* Account cards */}
      <div className="grid grid-cols-4 gap-4">
        <div className="col-span-2">
          <HeroAccountCard onNavigate={() => navigate('/accounts/BOIGC001')} />
        </div>
        {foreign.map((acc, i) => (
          <ForeignAccountCard
            key={acc.id}
            account={acc as { id: string; currency: string; balance: number; available: number; name: string; type: string }}
            index={i}
            onClick={() => navigate(`/accounts/${acc.id}`)}
          />
        ))}
      </div>

      {/* Pending approvals (role-gated) */}
      <PendingWidget />

      {/* Main content grid */}
      <div className="grid grid-cols-3 gap-5">
        {/* Recent transactions — takes 2/3 width */}
        <div className="col-span-2">
          <RecentTransactions />
        </div>

        {/* Quick actions sidebar */}
        <div>
          <QuickActions />
        </div>
      </div>
    </div>
  )
}
