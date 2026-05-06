import chargesConfig from '@/data/chargesConfig.json'
import type { ChargesBreakdownData } from '@/types'
import { getValueDate } from '@/lib/formatters'

type TransferType = 'domestic_transfer' | 'international_transfer' | 'fx_conversion'

interface UseChargesInput {
  transferType: TransferType
  amount: number
  fxRate?: number
  fxSpreadPct?: number
  foreignCurrency?: string
}

export function useCharges({
  transferType,
  amount,
  fxRate,
  fxSpreadPct = 0,
}: UseChargesInput): ChargesBreakdownData {
  const cfg = chargesConfig[transferType as keyof typeof chargesConfig]

  const bankCharge       = cfg.bankProcessingCharge
  const gstOnCharges     = parseFloat((bankCharge * cfg.gstRate).toFixed(2))
  const swiftCharge      = cfg.swiftCharge ?? 0
  const correspondentCh  = cfg.correspondentCharge ?? 0
  const foreignBankCh    = cfg.foreignBankCharge ?? 0

  // For FX, spread is baked into the rate — show it separately
  const spreadAmount = transferType === 'fx_conversion' && fxSpreadPct
    ? parseFloat((amount * (fxSpreadPct / 100)).toFixed(2))
    : 0

  const totalCharges = bankCharge + gstOnCharges + swiftCharge + correspondentCh + foreignBankCh + spreadAmount
  const netAmount    = parseFloat((amount - totalCharges).toFixed(2))

  const isDomestic = transferType === 'domestic_transfer'

  return {
    transferAmount:       amount,
    bankProcessingCharge: bankCharge,
    gstOnCharges,
    swiftCharge,
    correspondentCharge:  correspondentCh,
    foreignBankCharge:    foreignBankCh,
    totalCharges:         parseFloat(totalCharges.toFixed(2)),
    netAmount,
    fxRate,
    valueDate: getValueDate(isDomestic ? 'domestic' : 'international'),
  }
}
