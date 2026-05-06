/** Validate SWIFT/BIC code format (8 or 11 chars) */
export function validateSWIFT(swift: string): boolean {
  return /^[A-Z]{4}[A-Z]{2}[A-Z0-9]{2}([A-Z0-9]{3})?$/.test(swift.toUpperCase())
}

/** Validate IBAN using mod-97 checksum */
export function validateIBAN(iban: string): boolean {
  const cleaned = iban.replace(/\s/g, '').toUpperCase()
  if (cleaned.length < 15 || cleaned.length > 34) return false
  const rearranged = cleaned.slice(4) + cleaned.slice(0, 4)
  const numeric = rearranged.split('').map(c =>
    isNaN(Number(c)) ? (c.charCodeAt(0) - 55).toString() : c
  ).join('')
  let remainder = 0
  for (const digit of numeric) {
    remainder = (remainder * 10 + parseInt(digit)) % 97
  }
  return remainder === 1
}

/** Format IFSC code display */
export function formatIFSC(ifsc: string): string {
  return ifsc.toUpperCase()
}

/** Mask account number: show last 4 digits */
export function maskAccount(account: string): string {
  return '•••• •••• ' + account.slice(-4)
}

/** Compute value date (T+N business days, simplified) */
export function getValueDate(transferType: 'domestic' | 'international', immediate = true): string {
  const d = new Date()
  const add = immediate ? (transferType === 'domestic' ? 0 : 2) : 1
  d.setDate(d.getDate() + add)
  return d.toISOString().split('T')[0]
}

/** Format percentage */
export function formatPct(value: number, decimals = 2): string {
  return `${value.toFixed(decimals)}%`
}
