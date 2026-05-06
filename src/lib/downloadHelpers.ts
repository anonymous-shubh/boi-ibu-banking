import type { Transaction } from '@/types'

const CSV_HEADERS = [
  'Date', 'Value Date', 'Description', 'Reference', 'SWIFT Ref', 'Counterparty',
  'Counterparty Bank', 'Debit', 'Credit', 'Balance', 'Currency', 'Purpose Code', 'Status',
]

export function downloadCSV(transactions: Transaction[], filename: string) {
  const rows = transactions.map(t => [
    t.date, t.valueDate, t.description, t.id, t.swiftRef ?? '',
    t.counterparty ?? '', t.counterpartyBank ?? '',
    t.debit ?? '', t.credit ?? '', t.balance, t.currency,
    t.purposeCode ?? '', t.status,
  ])
  const csv = [CSV_HEADERS, ...rows].map(r => r.map(v => `"${v}"`).join(',')).join('\n')
  triggerDownload(csv, filename, 'text/csv')
}

export function downloadJSON(transactions: Transaction[], filename: string) {
  const json = JSON.stringify({ account: filename, generatedAt: new Date().toISOString(), transactions }, null, 2)
  triggerDownload(json, filename, 'application/json')
}

export function downloadXML(transactions: Transaction[], filename: string) {
  const rows = transactions.map(t => `
  <transaction>
    <date>${t.date}</date>
    <valueDate>${t.valueDate}</valueDate>
    <description><![CDATA[${t.description}]]></description>
    <reference>${t.id}</reference>
    <swiftRef>${t.swiftRef ?? ''}</swiftRef>
    <debit>${t.debit ?? ''}</debit>
    <credit>${t.credit ?? ''}</credit>
    <balance>${t.balance}</balance>
    <currency>${t.currency}</currency>
    <status>${t.status}</status>
  </transaction>`).join('')
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<statement generatedAt="${new Date().toISOString()}">${rows}\n</statement>`
  triggerDownload(xml, filename, 'application/xml')
}

function triggerDownload(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href     = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
