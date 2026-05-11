import { useNavigate }       from 'react-router-dom'
import { motion }             from 'framer-motion'
import { ArrowRight, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { useBanking }         from '@/context/BankingContext'
import { useFXRates }         from '@/hooks/useFXRates'
import { formatCurrency, getCurrencyFlag, cn } from '@/lib/utils'
import type { Account }       from '@/types'

function AccountCard({ account, index }: { account: Account; index: number }) {
  const navigate = useNavigate()
  const isPrimary = account.primary

  const usedPct = ((account.balance - account.available) / account.balance) * 100

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.07 }}
      onClick={() => navigate(`/accounts/${account.id}`)}
      className={cn(
        'rounded-xl border cursor-pointer group transition-all duration-200',
        isPrimary
          ? 'border-primary-200 bg-gradient-to-br from-primary-900 to-primary-700 text-white shadow-panel'
          : 'card-base hover:border-primary-300 hover:shadow-card',
      )}
    >
      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-5">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{getCurrencyFlag(account.currency)}</span>
            <div>
              <div className="flex items-center gap-2">
                <p className={cn('text-sm font-bold', isPrimary ? 'text-white' : 'text-foreground')}>
                  {account.currency}
                </p>
                {isPrimary && (
                  <span className="text-xs bg-accent-gold/20 text-accent-gold border border-accent-gold/30 rounded-full px-2 py-0.5 font-medium">
                    Primary
                  </span>
                )}
              </div>
              <p className={cn('text-xs', isPrimary ? 'text-blue-200/70' : 'text-muted-foreground')}>
                {account.type} Account
              </p>
            </div>
          </div>
          <ArrowRight
            size={16}
            className={cn(
              'transition-all group-hover:translate-x-1',
              isPrimary ? 'text-blue-200/50 group-hover:text-accent-gold' : 'text-muted-foreground group-hover:text-primary-600',
            )}
          />
        </div>

        {/* Account number */}
        <p className={cn('text-xs font-mono mb-4', isPrimary ? 'text-blue-200/60' : 'text-muted-foreground')}>
          {account.accountNo ?? account.id}
        </p>

        {/* Balances */}
        <div className="space-y-1 mb-5">
          <div className="flex items-baseline gap-1.5">
            <span className={cn('text-xs', isPrimary ? 'text-blue-200/70' : 'text-muted-foreground')}>Available</span>
          </div>
          <p className={cn(
            'text-3xl font-bold font-mono tracking-tight',
            isPrimary ? 'text-white' : 'text-foreground',
          )}>
            {formatCurrency(account.available, account.currency)}
          </p>
          <p className={cn('text-xs', isPrimary ? 'text-blue-200/60' : 'text-muted-foreground')}>
            Book balance: {formatCurrency(account.balance, account.currency)}
          </p>
        </div>

        {/* Utilisation bar */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className={cn('text-xs', isPrimary ? 'text-blue-200/60' : 'text-muted-foreground')}>
              Utilisation
            </span>
            <span className={cn('text-xs font-medium', isPrimary ? 'text-blue-200/80' : 'text-foreground')}>
              {usedPct.toFixed(1)}%
            </span>
          </div>
          <div className={cn('h-1.5 rounded-full', isPrimary ? 'bg-white/15' : 'bg-surface-100')}>
            <div
              className={cn(
                'h-full rounded-full transition-all',
                usedPct > 80 ? 'bg-error-500' : usedPct > 50 ? 'bg-warning-500' : isPrimary ? 'bg-accent-gold' : 'bg-success-500',
              )}
              style={{ width: `${Math.min(usedPct, 100)}%` }}
            />
          </div>
        </div>

        {/* Account identifiers */}
        <div className={cn(
          'flex items-center gap-4 mt-4 pt-4 border-t text-xs',
          isPrimary ? 'border-white/10 text-blue-200/60' : 'border-border text-muted-foreground',
        )}>
          {account.ifsc && <span>IFSC: <span className="font-mono">{account.ifsc}</span></span>}
          {account.swift && <span>SWIFT: <span className="font-mono">{account.swift}</span></span>}
          {account.iban && (
            <span className="truncate">
              IBAN: <span className="font-mono">{account.iban.slice(0, 12)}…</span>
            </span>
          )}
        </div>
      </div>
    </motion.div>
  )
}

function FXSummaryBar() {
  const rates = useFXRates()
  const majors = rates.filter(r => ['USD/INR', 'EUR/INR', 'GBP/INR'].includes(r.pair))

  return (
    <div className="card-base px-4 py-3 flex items-center gap-6">
      <span className="text-xs font-medium text-muted-foreground flex-shrink-0">Indicative FX Rates</span>
      {majors.map(r => (
        <div key={r.pair} className="flex items-center gap-2">
          <span className="text-xs font-semibold text-foreground">{r.pair}</span>
          <span className="text-xs font-mono text-foreground">{r.ask.toFixed(2)}</span>
          {r.change24h > 0 ? (
            <TrendingUp size={12} className="text-success-600" />
          ) : r.change24h < 0 ? (
            <TrendingDown size={12} className="text-error-600" />
          ) : (
            <Minus size={12} className="text-muted-foreground" />
          )}
        </div>
      ))}
      <span className="ml-auto text-xs text-warning-600 bg-warning-50 border border-warning-200 rounded px-2 py-0.5">
        Indicative • Rates updated every 5s
      </span>
    </div>
  )
}

export function AccountList() {
  const { accounts } = useBanking()

  // INR primary first, then foreign accounts
  const sorted = [...accounts].sort((a, b) => (b.primary ? 1 : 0) - (a.primary ? 1 : 0))

  return (
    <div className="p-6 space-y-5 max-w-[1400px]">
      <div>
        <h1 className="page-title">Accounts</h1>
        <p className="page-subtitle text-muted-foreground mt-0.5">
          All accounts across currencies — INR Primary Account highlighted
        </p>
      </div>

      <FXSummaryBar />

      {/* Summary strip */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Total Accounts', value: accounts.length.toString(), sub: 'Multi-currency portfolio' },
          { label: 'INR Available', value: formatCurrency(accounts.find(a => a.primary)?.available ?? 0, 'INR'), sub: 'Primary account' },
          { label: 'Currencies', value: [...new Set(accounts.map(a => a.currency))].join(' · '), sub: 'Active denominations' },
          { label: 'Account Status', value: 'All Active', sub: 'No dormant accounts' },
        ].map(({ label, value, sub }) => (
          <div key={label} className="card-base px-4 py-3">
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="text-sm font-bold text-foreground mt-0.5">{value}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>
          </div>
        ))}
      </div>

      {/* Account cards grid — 2 columns: primary on left (wider), rest fill */}
      <div className="grid grid-cols-2 gap-4">
        {sorted.map((acc, i) => (
          <AccountCard key={acc.id} account={acc} index={i} />
        ))}
      </div>
    </div>
  )
}
