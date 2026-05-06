import { useState, useMemo }  from 'react'
import { useSearchParams }    from 'react-router-dom'
import { motion }              from 'framer-motion'
import {
  Download, FileText, CheckCircle2, Clock,
  File, Code, FileCode,
} from 'lucide-react'
import { toast }               from 'sonner'
import { useBanking }          from '@/context/BankingContext'
import { formatDate, getCurrencyFlag, cn } from '@/lib/utils'
import { downloadCSV, downloadJSON, downloadXML } from '@/lib/downloadHelpers'
import transactionsData        from '@/data/transactions.json'
import type { Transaction }    from '@/types'

const transactions = transactionsData as Transaction[]

type Format = 'csv' | 'json' | 'xml'

interface DownloadRecord {
  id: string
  accountId: string
  format: Format
  dateRange: string
  downloadedAt: string
  rows: number
}

const FORMAT_OPTIONS: { value: Format; label: string; description: string; icon: React.ElementType; ext: string }[] = [
  { value: 'csv',  label: 'CSV',  description: 'Excel-compatible, easy to import', icon: File,     ext: '.csv' },
  { value: 'json', label: 'JSON', description: 'Machine-readable structured data',  icon: Code,     ext: '.json' },
  { value: 'xml',  label: 'XML',  description: 'ISO 20022 compatible format',       icon: FileCode, ext: '.xml' },
]

export function Statements() {
  const { accounts }       = useBanking()
  const [searchParams]     = useSearchParams()
  const prefilledAccount   = searchParams.get('account') ?? accounts.find(a => a.primary)?.id ?? ''

  const [accountId,  setAccountId]  = useState(prefilledAccount)
  const [dateFrom,   setDateFrom]   = useState('')
  const [dateTo,     setDateTo]     = useState('')
  const [format,     setFormat]     = useState<Format>('csv')
  const [generating, setGenerating] = useState(false)
  const [progress,   setProgress]   = useState(0)
  const [downloads,  setDownloads]  = useState<DownloadRecord[]>([
    {
      id: 'DL-001',
      accountId: 'BOIGC001',
      format: 'csv',
      dateRange: '01 Apr 2026 – 30 Apr 2026',
      downloadedAt: '2026-05-01T09:14:00',
      rows: 18,
    },
    {
      id: 'DL-002',
      accountId: 'BOIGC002',
      format: 'json',
      dateRange: '01 Apr 2026 – 05 May 2026',
      downloadedAt: '2026-05-05T14:32:00',
      rows: 6,
    },
  ])

  const account = accounts.find(a => a.id === accountId)

  const filteredTxns = useMemo(() => {
    return transactions
      .filter(t => {
        const matchesAccount = t.accountId === accountId
        const txnDate = new Date(t.date)
        const matchesFrom = !dateFrom || txnDate >= new Date(dateFrom)
        const matchesTo   = !dateTo   || txnDate <= new Date(dateTo)
        return matchesAccount && matchesFrom && matchesTo
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  }, [accountId, dateFrom, dateTo])

  async function handleGenerate() {
    if (!accountId || filteredTxns.length === 0) {
      toast.error('No transactions found for the selected filters.')
      return
    }
    setGenerating(true)
    setProgress(0)

    // Simulate progress bar
    const steps = [20, 45, 70, 90, 100]
    for (const step of steps) {
      await new Promise(r => setTimeout(r, 300))
      setProgress(step)
    }

    const dateLabel = dateFrom && dateTo
      ? `${dateFrom}_${dateTo}`
      : `all_${new Date().toISOString().slice(0, 10)}`
    const filename = `boi_ibu_statement_${accountId}_${dateLabel}.${format}`

    if (format === 'csv')  downloadCSV(filteredTxns,  filename)
    if (format === 'json') downloadJSON(filteredTxns, filename)
    if (format === 'xml')  downloadXML(filteredTxns,  filename)

    const newRecord: DownloadRecord = {
      id: `DL-${Date.now()}`,
      accountId,
      format,
      dateRange: dateFrom && dateTo
        ? `${formatDate(dateFrom)} – ${formatDate(dateTo)}`
        : 'All dates',
      downloadedAt: new Date().toISOString(),
      rows: filteredTxns.length,
    }
    setDownloads(prev => [newRecord, ...prev])
    setGenerating(false)
    toast.success(`Statement downloaded — ${filteredTxns.length} transactions`)
  }

  return (
    <div className="p-6 space-y-5 max-w-[1400px]">
      <div>
        <h1 className="page-title">Statements & Downloads</h1>
        <p className="page-subtitle text-muted-foreground mt-0.5">
          Generate and download account statements in multiple formats
        </p>
      </div>

      <div className="grid grid-cols-3 gap-5">
        {/* Left: Statement generator */}
        <div className="col-span-2 space-y-4">
          <div className="card-base p-6 space-y-5">
            <h2 className="text-sm font-semibold text-foreground">Generate Statement</h2>

            {/* Account selector */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Account</label>
              <select
                value={accountId}
                onChange={e => setAccountId(e.target.value)}
                className="w-full px-3 py-2.5 text-sm border border-border rounded-md bg-surface-50 focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                {accounts.map(a => (
                  <option key={a.id} value={a.id}>
                    {getCurrencyFlag(a.currency)} {a.name} ({a.currency})
                    {a.primary ? ' — Primary' : ''}
                  </option>
                ))}
              </select>
              {account && (
                <p className="text-xs text-muted-foreground mt-1">
                  Account No: <span className="font-mono">{account.accountNo ?? account.id}</span>
                </p>
              )}
            </div>

            {/* Date range */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">From Date</label>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={e => setDateFrom(e.target.value)}
                  className="w-full px-3 py-2.5 text-sm border border-border rounded-md bg-surface-50 focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">To Date</label>
                <input
                  type="date"
                  value={dateTo}
                  onChange={e => setDateTo(e.target.value)}
                  className="w-full px-3 py-2.5 text-sm border border-border rounded-md bg-surface-50 focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>

            {/* Transaction count preview */}
            {filteredTxns.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 text-xs text-success-700 bg-success-50 border border-success-200 rounded-md px-3 py-2"
              >
                <CheckCircle2 size={14} />
                {filteredTxns.length} transactions found for the selected period
              </motion.div>
            )}
            {filteredTxns.length === 0 && accountId && (
              <p className="text-xs text-warning-600 bg-warning-50 border border-warning-200 rounded-md px-3 py-2">
                No transactions found for the selected filters.
              </p>
            )}

            {/* Format selection */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Download Format</label>
              <div className="grid grid-cols-3 gap-3">
                {FORMAT_OPTIONS.map(({ value, label, description, icon: Icon, ext }) => (
                  <button
                    key={value}
                    onClick={() => setFormat(value)}
                    className={cn(
                      'flex flex-col items-start gap-2 p-3 rounded-lg border-2 text-left transition-all',
                      format === value
                        ? 'border-primary-500 bg-primary-50'
                        : 'border-border hover:border-primary-300 bg-surface-0',
                    )}
                  >
                    <div className={cn(
                      'w-8 h-8 rounded-md flex items-center justify-center',
                      format === value ? 'bg-primary-100 text-primary-700' : 'bg-surface-100 text-muted-foreground',
                    )}>
                      <Icon size={16} />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-foreground">{label}</p>
                      <p className="text-xs text-muted-foreground">{description}</p>
                      <p className="text-xs font-mono text-muted-foreground mt-0.5">{ext}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Progress bar */}
            {generating && (
              <div>
                <div className="flex items-center justify-between mb-1.5 text-xs text-muted-foreground">
                  <span>Generating statement…</span>
                  <span>{progress}%</span>
                </div>
                <div className="h-2 bg-surface-100 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-primary-500 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
              </div>
            )}

            {/* CTA */}
            <motion.button
              onClick={handleGenerate}
              disabled={generating || filteredTxns.length === 0}
              whileTap={filteredTxns.length > 0 ? { scale: 0.98 } : undefined}
              className={cn(
                'w-full py-2.5 px-4 rounded-md text-sm font-semibold text-white transition-all flex items-center justify-center gap-2',
                filteredTxns.length > 0 && !generating
                  ? 'bg-primary-900 hover:bg-primary-700'
                  : 'bg-surface-300 cursor-not-allowed text-muted-foreground',
              )}
            >
              {generating ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Generating…
                </>
              ) : (
                <>
                  <Download size={16} />
                  Generate & Download Statement ({format.toUpperCase()})
                </>
              )}
            </motion.button>
          </div>
        </div>

        {/* Right: Info panel */}
        <div className="space-y-4">
          <div className="card-base p-4">
            <div className="flex items-center gap-2 mb-3">
              <FileText size={16} className="text-primary-600" />
              <h3 className="text-sm font-semibold text-foreground">Format Guide</h3>
            </div>
            <div className="space-y-3 text-xs text-muted-foreground">
              <div>
                <p className="font-semibold text-foreground mb-0.5">CSV</p>
                <p>Compatible with Microsoft Excel, Google Sheets. Ideal for quick analysis and internal reporting.</p>
              </div>
              <div>
                <p className="font-semibold text-foreground mb-0.5">JSON</p>
                <p>Machine-readable format for system integrations, accounting software APIs.</p>
              </div>
              <div>
                <p className="font-semibold text-foreground mb-0.5">XML</p>
                <p>ISO 20022-compatible format. Accepted by most banking and ERP systems for reconciliation.</p>
              </div>
            </div>
          </div>

          <div className="card-base p-4 border-l-4 border-l-warning-500">
            <p className="text-xs font-semibold text-warning-700 mb-1">Official Records</p>
            <p className="text-xs text-muted-foreground">
              For certified statements required for regulatory filings, please raise a Service Request under
              "Certified Statement" from the Service Requests section.
            </p>
          </div>
        </div>
      </div>

      {/* Previous downloads */}
      {downloads.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-foreground mb-3">Recent Downloads</h3>
          <div className="rounded-lg border border-border overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-surface-100 border-b border-border">
                  {['Reference', 'Account', 'Date Range', 'Format', 'Transactions', 'Downloaded At', ''].map(h => (
                    <th key={h} className="px-4 py-2.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {downloads.map(d => {
                  const acc = accounts.find(a => a.id === d.accountId)
                  return (
                    <tr key={d.id} className="hover:bg-surface-50 transition-colors">
                      <td className="px-4 py-3 text-xs font-mono text-muted-foreground">{d.id}</td>
                      <td className="px-4 py-3 text-xs text-foreground">
                        {getCurrencyFlag(acc?.currency ?? '')} {acc?.name ?? d.accountId}
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">{d.dateRange}</td>
                      <td className="px-4 py-3">
                        <span className="text-xs bg-surface-100 text-muted-foreground rounded px-2 py-0.5 uppercase font-mono">
                          {d.format}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-foreground">{d.rows} rows</td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Clock size={12} />
                          {formatDate(d.downloadedAt)}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <button className="text-xs text-primary-600 hover:text-primary-800 transition-colors flex items-center gap-1">
                          <Download size={12} /> Re-download
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
