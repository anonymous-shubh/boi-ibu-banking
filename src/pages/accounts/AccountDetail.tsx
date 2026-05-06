import { useState, useMemo }    from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ChevronLeft, ChevronRight, Download, Search,
  Filter, ArrowUpRight, ArrowDownRight, ChevronDown, ChevronUp,
} from 'lucide-react'
import { useBanking }             from '@/context/BankingContext'
import {
  formatCurrency, formatDate, getCurrencyFlag, cn, truncateRef,
} from '@/lib/utils'
import transactionsData           from '@/data/transactions.json'
import type { Transaction }       from '@/types'

const transactions = transactionsData as Transaction[]

const TXN_TYPES = ['all', 'inward', 'outward', 'domestic', 'fd', 'fx', 'fee'] as const
const PAGE_SIZE = 10

const TYPE_LABELS: Record<string, string> = {
  all: 'All Types', inward: 'Inward', outward: 'Outward',
  domestic: 'Domestic', fd: 'Fixed Deposit', fx: 'FX', fee: 'Charges',
}

function StatusBadge({ status }: { status: string }) {
  return (
    <span className={cn(
      'text-xs rounded-full px-2 py-0.5 font-medium',
      status === 'completed' ? 'bg-success-50 text-success-700' :
      status === 'pending'   ? 'bg-warning-50 text-warning-700' :
                               'bg-error-50 text-error-700',
    )}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  )
}

function ExpandedRow({ txn }: { txn: Transaction }) {
  return (
    <motion.tr initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <td colSpan={9} className="px-4 py-3 bg-surface-50 border-b border-border">
        <div className="grid grid-cols-3 gap-6 text-xs">
          <div className="space-y-1.5">
            <p className="font-semibold text-muted-foreground uppercase tracking-wide mb-2">Transaction Details</p>
            <div className="flex gap-2"><span className="text-muted-foreground w-24">Value Date</span><span className="font-medium text-foreground">{formatDate(txn.valueDate)}</span></div>
            <div className="flex gap-2"><span className="text-muted-foreground w-24">Purpose Code</span><span className="font-mono text-foreground">{txn.purposeCode ?? '—'}</span></div>
            {txn.chargesDeducted && (
              <div className="flex gap-2"><span className="text-muted-foreground w-24">Charges</span><span className="font-mono text-error-600">-{formatCurrency(txn.chargesDeducted, txn.currency)}</span></div>
            )}
          </div>
          <div className="space-y-1.5">
            <p className="font-semibold text-muted-foreground uppercase tracking-wide mb-2">Counterparty</p>
            <div className="flex gap-2"><span className="text-muted-foreground w-24">Name</span><span className="font-medium text-foreground">{txn.counterparty ?? '—'}</span></div>
            <div className="flex gap-2"><span className="text-muted-foreground w-24">Bank</span><span className="text-foreground">{txn.counterpartyBank ?? '—'}</span></div>
          </div>
          <div className="space-y-1.5">
            <p className="font-semibold text-muted-foreground uppercase tracking-wide mb-2">References</p>
            {txn.swiftRef && (
              <div className="flex gap-2"><span className="text-muted-foreground w-24">SWIFT Ref</span><span className="font-mono text-foreground break-all">{txn.swiftRef}</span></div>
            )}
            {txn.uetr && (
              <div className="flex gap-2"><span className="text-muted-foreground w-24">UETR</span><span className="font-mono text-foreground break-all">{txn.uetr}</span></div>
            )}
            <div className="flex gap-2"><span className="text-muted-foreground w-24">ID</span><span className="font-mono text-foreground">{txn.id}</span></div>
          </div>
        </div>
      </td>
    </motion.tr>
  )
}

export function AccountDetail() {
  const { id }         = useParams<{ id: string }>()
  const navigate       = useNavigate()
  const { getAccount } = useBanking()

  const account = getAccount(id ?? '')

  const [search,     setSearch]     = useState('')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [dateFrom,   setDateFrom]   = useState('')
  const [dateTo,     setDateTo]     = useState('')
  const [page,       setPage]       = useState(1)
  const [expanded,   setExpanded]   = useState<string | null>(null)

  const accountTxns = useMemo(() =>
    transactions
      .filter(t => t.accountId === id)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    [id],
  )

  const filtered = useMemo(() => {
    return accountTxns.filter(t => {
      const matchesSearch = !search
        || t.description.toLowerCase().includes(search.toLowerCase())
        || (t.counterparty?.toLowerCase().includes(search.toLowerCase()))
        || t.id.toLowerCase().includes(search.toLowerCase())
      const matchesType = typeFilter === 'all' || t.type === typeFilter
      const txnDate     = new Date(t.date)
      const matchesFrom = !dateFrom || txnDate >= new Date(dateFrom)
      const matchesTo   = !dateTo   || txnDate <= new Date(dateTo)
      return matchesSearch && matchesType && matchesFrom && matchesTo
    })
  }, [accountTxns, search, typeFilter, dateFrom, dateTo])

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const paged      = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const credits = accountTxns.reduce((s, t) => s + (t.credit ?? 0), 0)
  const debits  = accountTxns.reduce((s, t) => s + (t.debit ?? 0), 0)

  if (!account) {
    return (
      <div className="p-6">
        <button onClick={() => navigate('/accounts')} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors">
          <ChevronLeft size={16} /> Back to Accounts
        </button>
        <p className="text-muted-foreground">Account not found.</p>
      </div>
    )
  }

  const ccy = account.currency

  return (
    <div className="p-6 space-y-5 max-w-[1400px]">
      <button
        onClick={() => navigate('/accounts')}
        className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ChevronLeft size={16} /> Back to Accounts
      </button>

      {/* Account header */}
      <div
        className="rounded-xl p-6 text-white"
        style={{ background: 'linear-gradient(135deg, #0A1F44 0%, #1A3A6B 70%, #2463AE 100%)' }}
      >
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xl">{getCurrencyFlag(ccy)}</span>
              <h1 className="text-lg font-bold">{account.name}</h1>
              {account.primary && (
                <span className="text-xs bg-accent-gold/20 text-accent-gold border border-accent-gold/30 rounded-full px-2 py-0.5">
                  Primary
                </span>
              )}
            </div>
            <p className="text-sm text-blue-200/60 font-mono">{account.accountNo ?? account.id}</p>
          </div>
          <button
            onClick={() => navigate('/statements')}
            className="flex items-center gap-2 bg-white/10 hover:bg-white/20 rounded-md px-3 py-2 text-sm transition-colors"
          >
            <Download size={14} />
            Download Statement
          </button>
        </div>

        <div className="grid grid-cols-4 gap-6 mt-6">
          {[
            { label: 'Available Balance', value: formatCurrency(account.available, ccy) },
            { label: 'Book Balance',      value: formatCurrency(account.balance, ccy) },
            { label: 'Total Credits',     value: formatCurrency(credits, ccy, true) },
            { label: 'Total Debits',      value: formatCurrency(debits, ccy, true) },
          ].map(({ label, value }) => (
            <div key={label}>
              <p className="text-xs text-blue-200/60">{label}</p>
              <p className="text-xl font-bold font-mono mt-1">{value}</p>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-6 mt-4 pt-4 border-t border-white/10 text-xs text-blue-200/60">
          {account.ifsc  && <span>IFSC: <span className="font-mono text-blue-100">{account.ifsc}</span></span>}
          {account.swift && <span>SWIFT: <span className="font-mono text-blue-100">{account.swift}</span></span>}
          {account.iban  && <span>IBAN: <span className="font-mono text-blue-100">{account.iban}</span></span>}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="card-base p-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-success-50 flex items-center justify-center">
            <ArrowDownRight size={16} className="text-success-600" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Total Credits</p>
            <p className="text-sm font-bold text-success-600 font-mono">{formatCurrency(credits, ccy, true)}</p>
          </div>
        </div>
        <div className="card-base p-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-error-50 flex items-center justify-center">
            <ArrowUpRight size={16} className="text-error-600" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Total Debits</p>
            <p className="text-sm font-bold text-error-600 font-mono">{formatCurrency(debits, ccy, true)}</p>
          </div>
        </div>
        <div className="card-base p-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-surface-100 flex items-center justify-center">
            <Filter size={16} className="text-muted-foreground" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Transactions shown</p>
            <p className="text-sm font-bold text-foreground">{filtered.length} of {accountTxns.length}</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card-base p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1) }}
              placeholder="Search by description, counterparty, or reference..."
              className="w-full pl-9 pr-3 py-2 text-sm border border-border rounded-md bg-surface-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
          <select
            value={typeFilter}
            onChange={e => { setTypeFilter(e.target.value); setPage(1) }}
            className="px-3 py-2 text-sm border border-border rounded-md bg-surface-50 focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            {TXN_TYPES.map(t => <option key={t} value={t}>{TYPE_LABELS[t]}</option>)}
          </select>
          <input
            type="date"
            value={dateFrom}
            onChange={e => { setDateFrom(e.target.value); setPage(1) }}
            className="px-3 py-2 text-sm border border-border rounded-md bg-surface-50 focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
          <span className="text-muted-foreground text-sm">to</span>
          <input
            type="date"
            value={dateTo}
            onChange={e => { setDateTo(e.target.value); setPage(1) }}
            className="px-3 py-2 text-sm border border-border rounded-md bg-surface-50 focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
          {(search || typeFilter !== 'all' || dateFrom || dateTo) && (
            <button
              onClick={() => { setSearch(''); setTypeFilter('all'); setDateFrom(''); setDateTo(''); setPage(1) }}
              className="text-sm text-error-600 hover:text-error-800 transition-colors"
            >
              Clear filters
            </button>
          )}
          <button
            onClick={() => navigate('/statements')}
            className="ml-auto flex items-center gap-1.5 text-sm bg-primary-900 text-white rounded-md px-3 py-2 hover:bg-primary-700 transition-colors"
          >
            <Download size={14} />
            Statement
          </button>
        </div>
      </div>

      {/* Transaction table */}
      <div className="rounded-lg border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-surface-100 border-b border-border">
              {['Date', 'Description', 'Ref', 'Type', 'Debit', 'Credit', 'Balance', 'Status', ''].map(h => (
                <th key={h} className={cn(
                  'px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider',
                  ['Debit', 'Credit', 'Balance', 'Status'].includes(h) ? 'text-right' : 'text-left',
                )}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {paged.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-4 py-12 text-center text-sm text-muted-foreground">
                  No transactions match the current filters.
                </td>
              </tr>
            ) : (
              paged.flatMap(txn => {
                const rows = [
                  <tr
                    key={txn.id}
                    className="hover:bg-surface-50 transition-colors cursor-pointer"
                    onClick={() => setExpanded(expanded === txn.id ? null : txn.id)}
                  >
                    <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">{formatDate(txn.date)}</td>
                    <td className="px-4 py-3">
                      <p className="text-xs font-medium text-foreground">{txn.description}</p>
                      {txn.counterparty && <p className="text-xs text-muted-foreground">{txn.counterparty}</p>}
                    </td>
                    <td className="px-4 py-3 text-xs font-mono text-muted-foreground">
                      {txn.swiftRef ? truncateRef(txn.swiftRef, 14) : truncateRef(txn.id, 14)}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs bg-surface-100 text-muted-foreground rounded px-2 py-0.5">
                        {TYPE_LABELS[txn.type] ?? txn.type}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right text-xs font-mono font-medium text-error-600">
                      {txn.debit ? formatCurrency(txn.debit, ccy) : '—'}
                    </td>
                    <td className="px-4 py-3 text-right text-xs font-mono font-medium text-success-600">
                      {txn.credit ? formatCurrency(txn.credit, ccy) : '—'}
                    </td>
                    <td className="px-4 py-3 text-right text-xs font-mono font-semibold text-foreground">
                      {txn.balance ? formatCurrency(txn.balance, ccy, true) : '—'}
                    </td>
                    <td className="px-4 py-3 text-right"><StatusBadge status={txn.status} /></td>
                    <td className="px-4 py-3 text-right">
                      {expanded === txn.id ? <ChevronUp size={14} className="text-muted-foreground" /> : <ChevronDown size={14} className="text-muted-foreground" />}
                    </td>
                  </tr>,
                ]
                if (expanded === txn.id) {
                  rows.push(
                    <AnimatePresence key={`exp-${txn.id}`}>
                      <ExpandedRow txn={txn} />
                    </AnimatePresence>
                  )
                }
                return rows
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length} transactions
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft size={16} /> Prev
            </button>
            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={cn(
                    'w-7 h-7 rounded text-xs font-medium transition-colors',
                    p === page ? 'bg-primary-900 text-white' : 'text-muted-foreground hover:bg-surface-100',
                  )}
                >
                  {p}
                </button>
              ))}
            </div>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Next <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
