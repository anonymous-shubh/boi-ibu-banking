import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Format a number as Indian Rupees: ₹1,85,00,000.00 */
export function formatINR(amount: number, compact = false): string {
  if (compact) {
    if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(2)} Cr`
    if (amount >= 100000)   return `₹${(amount / 100000).toFixed(2)} L`
    if (amount >= 1000)     return `₹${(amount / 1000).toFixed(2)} K`
  }
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
  }).format(amount)
}

/** Format any currency amount */
export function formatCurrency(amount: number, currency: string, compact = false): string {
  if (currency === 'INR') return formatINR(amount, compact)
  if (compact) {
    if (amount >= 1000000) return `${getCurrencySymbol(currency)}${(amount / 1000000).toFixed(2)}M`
    if (amount >= 1000)    return `${getCurrencySymbol(currency)}${(amount / 1000).toFixed(2)}K`
  }
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(amount)
}

export function getCurrencySymbol(currency: string): string {
  const symbols: Record<string, string> = {
    INR: '₹', USD: '$', EUR: '€', GBP: '£', AED: 'د.إ', JPY: '¥',
  }
  return symbols[currency] ?? currency
}

export function getCurrencyFlag(currency: string): string {
  const flags: Record<string, string> = {
    INR: '🇮🇳', USD: '🇺🇸', EUR: '🇪🇺', GBP: '🇬🇧', AED: '🇦🇪', JPY: '🇯🇵',
  }
  return flags[currency] ?? '🌐'
}

/** Format date: 06 May 2026 */
export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
  })
}

/** Format date + time: 06 May 2026, 14:32 IST */
export function formatDateTime(dateStr: string): string {
  return new Date(dateStr).toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: false,
  }) + ' IST'
}

/** Truncate reference strings for display */
export function truncateRef(ref: string, len = 16): string {
  return ref.length > len ? ref.slice(0, len) + '…' : ref
}

/** Generate a mock transaction reference */
export function genTxnRef(): string {
  return `TXN-BOIGC-${new Date().getFullYear()}${String(Date.now()).slice(-8)}`
}
