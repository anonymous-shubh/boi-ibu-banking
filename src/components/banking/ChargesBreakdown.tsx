import { Info }                from 'lucide-react'
import { formatINR, formatCurrency, cn } from '@/lib/utils'
import type { ChargesBreakdownData }     from '@/types'

interface ChargesBreakdownProps {
  data: ChargesBreakdownData
  /** For FX: the spread amount to show as first line item */
  fxSpreadAmount?: number
  /** For FX: show "You Receive" in foreign currency */
  foreignCurrency?: string
  foreignAmount?: number
  className?: string
}

function Row({
  label,
  value,
  mono = true,
  variant = 'default',
  tooltip,
}: {
  label: string
  value: string
  mono?: boolean
  variant?: 'default' | 'deduction' | 'total' | 'net' | 'subtle'
  tooltip?: string
}) {
  return (
    <div className={cn(
      'flex items-center justify-between py-1.5',
      variant === 'total' && 'border-t border-border mt-1 pt-2.5',
      variant === 'net'   && 'border-t-2 border-primary-200 mt-1 pt-2.5',
    )}>
      <div className="flex items-center gap-1.5">
        <span className={cn(
          'text-xs',
          variant === 'default'   && 'text-foreground',
          variant === 'deduction' && 'text-error-700',
          variant === 'total'     && 'font-semibold text-foreground',
          variant === 'net'       && 'font-bold text-foreground',
          variant === 'subtle'    && 'text-muted-foreground',
        )}>
          {label}
        </span>
        {tooltip && (
          <div className="group relative cursor-help">
            <Info size={11} className="text-muted-foreground" />
            <div className="absolute left-0 top-5 z-50 hidden group-hover:block w-56 bg-foreground text-background text-xs rounded-md p-2 shadow-modal">
              {tooltip}
            </div>
          </div>
        )}
      </div>
      <span className={cn(
        'text-xs',
        mono && 'font-mono',
        variant === 'default'   && 'text-foreground',
        variant === 'deduction' && 'text-error-700 font-medium',
        variant === 'total'     && 'font-semibold text-error-700',
        variant === 'net'       && 'font-bold text-success-700',
        variant === 'subtle'    && 'text-muted-foreground',
      )}>
        {value}
      </span>
    </div>
  )
}

export function ChargesBreakdown({
  data,
  fxSpreadAmount,
  foreignCurrency,
  foreignAmount,
  className,
}: ChargesBreakdownProps) {
  const fmt = (n: number) => formatINR(n)

  return (
    <div className={cn(
      'rounded-lg border border-border bg-surface-50 overflow-hidden',
      className,
    )}>
      {/* Gold left border accent — regulatory disclosure signal */}
      <div className="flex">
        <div className="w-1 bg-accent-gold flex-shrink-0 rounded-l-lg" />
        <div className="flex-1 p-4">

          {/* Header */}
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-bold text-foreground uppercase tracking-wider">
              Charges Breakdown
            </p>
            <div className="flex items-center gap-1 text-xs text-warning-600 bg-warning-50 border border-warning-200 rounded px-2 py-0.5">
              <Info size={11} />
              Estimated
            </div>
          </div>

          <div className="space-y-0.5">
            {/* Transfer / Send amount */}
            <Row
              label={foreignCurrency ? 'You Send (INR)' : 'Transfer Amount'}
              value={fmt(data.transferAmount)}
              variant="default"
            />

            {/* FX spread (only for FX conversion) */}
            {fxSpreadAmount !== undefined && fxSpreadAmount > 0 && (
              <Row
                label={`FX Spread (${((fxSpreadAmount / data.transferAmount) * 100).toFixed(2)}%)`}
                value={`-${fmt(fxSpreadAmount)}`}
                variant="deduction"
              />
            )}

            {/* Bank processing charges */}
            {data.bankProcessingCharge > 0 && (
              <Row
                label="Bank Processing Charges"
                value={`-${fmt(data.bankProcessingCharge)}`}
                variant="deduction"
              />
            )}

            {/* GST */}
            {data.gstOnCharges > 0 && (
              <Row
                label="GST on Bank Charges (18%)"
                value={`-${fmt(data.gstOnCharges)}`}
                variant="deduction"
              />
            )}

            {/* SWIFT charges */}
            {data.swiftCharge > 0 && (
              <Row
                label="SWIFT Charges"
                value={`-${fmt(data.swiftCharge)}`}
                variant="deduction"
              />
            )}

            {/* Correspondent bank charges */}
            {data.correspondentCharge > 0 && (
              <Row
                label="Correspondent Bank Charges"
                value={`-${fmt(data.correspondentCharge)}`}
                variant="deduction"
                tooltip="Charged by the correspondent/intermediary bank for routing the payment. May vary."
              />
            )}

            {/* Foreign bank charges */}
            {data.foreignBankCharge > 0 && (
              <Row
                label="Foreign Bank Charges (est.)"
                value={`-${fmt(data.foreignBankCharge)}`}
                variant="deduction"
                tooltip="Estimated charges levied by the beneficiary's bank. Final amount may differ."
              />
            )}

            {/* Total charges */}
            <Row
              label="Total Charges"
              value={`-${fmt(data.totalCharges)}`}
              variant="total"
            />

            {/* Net amount / You receive */}
            {foreignCurrency && foreignAmount ? (
              <>
                <Row
                  label="You Receive (estimated)"
                  value={formatCurrency(foreignAmount, foreignCurrency)}
                  variant="net"
                />
                {data.fxRate && (
                  <Row
                    label="Applied Rate"
                    value={`1 ${foreignCurrency} = ₹${data.fxRate.toFixed(2)}`}
                    variant="subtle"
                  />
                )}
              </>
            ) : (
              <Row
                label="Estimated Net Amount Credited"
                value={fmt(data.netAmount)}
                variant="net"
              />
            )}

            {/* Value date */}
            <Row
              label="Value Date"
              value={data.valueDate}
              variant="subtle"
            />
          </div>

          {/* Disclaimer */}
          <p className="text-xs text-muted-foreground mt-3 pt-3 border-t border-border">
            * Charges are estimates. Final amounts confirmed at execution. Subject to IFSCA guidelines.
          </p>
        </div>
      </div>
    </div>
  )
}
