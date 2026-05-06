// ── User & Auth ──────────────────────────────────────────────────────────────

export type UserRole = 'Admin' | 'Maker' | 'Checker'

export interface User {
  id: string
  name: string
  role: UserRole
  permissions: string[]
  email?: string
  mobile?: string
}

// ── Accounts ─────────────────────────────────────────────────────────────────

export type Currency = 'INR' | 'USD' | 'EUR' | 'GBP' | 'AED' | 'JPY'

export interface Account {
  id: string
  name: string
  type: 'Current' | 'Settlement' | 'Savings'
  currency: Currency
  balance: number
  available: number
  primary?: boolean
  accountNo?: string
  ifsc?: string
  swift?: string
  iban?: string
}

// ── Transactions ──────────────────────────────────────────────────────────────

export type TxnType = 'inward' | 'outward' | 'fx' | 'fd' | 'domestic' | 'fee'
export type TxnStatus = 'completed' | 'pending' | 'failed' | 'processing'

export interface Transaction {
  id: string
  accountId: string
  date: string
  valueDate: string
  description: string
  type: TxnType
  debit?: number
  credit?: number
  balance: number
  currency: Currency
  swiftRef?: string
  uetr?: string
  counterparty?: string
  counterpartyBank?: string
  status: TxnStatus
  purposeCode?: string
  chargesDeducted?: number
}

// ── Beneficiaries ─────────────────────────────────────────────────────────────

export type BeneficiaryStatus = 'approved' | 'pending' | 'rejected'
export type BeneficiaryType   = 'domestic' | 'international'

export interface Beneficiary {
  id: string
  name: string
  accountNo: string
  bankName: string
  currency: Currency
  country: string
  type: BeneficiaryType
  status: BeneficiaryStatus
  swift?: string
  iban?: string
  ifsc?: string
  relationship?: string
  addedAt?: string
  rejectionReason?: string
}

// ── FX Rates ──────────────────────────────────────────────────────────────────

export interface FXRate {
  pair: string
  base: Currency
  quote: Currency
  bid: number
  ask: number
  spread: number
  spreadPct: number
  change24h: number
  lastUpdated: string
  indicative: boolean
}

// ── Fixed Deposits ────────────────────────────────────────────────────────────

export type FDStatus = 'active' | 'matured' | 'withdrawal_requested' | 'closed'

export interface FixedDeposit {
  id: string
  currency: 'INR'
  principal: number
  rate: number
  tenure: string
  tenureMonths: number
  startDate: string
  maturityDate: string
  maturityAmount: number
  status: FDStatus
  penaltyRate: number
  instructions: 'auto_renew' | 'credit_to_account'
  sourceAccountId: string
}

// ── Approvals (Maker-Checker) ─────────────────────────────────────────────────

export type ApprovalType   = 'fund_transfer' | 'beneficiary_add' | 'fd_creation' | 'fx_conversion'
export type ApprovalStatus = 'pending' | 'approved' | 'rejected'

export interface PendingApproval {
  id: string
  type: ApprovalType
  makerName: string
  makerId: string
  amount?: number
  currency?: Currency
  beneficiary?: string
  beneficiaryBank?: string
  purpose?: string
  submittedAt: string
  status: ApprovalStatus
  urgency: 'normal' | 'high'
  checkerName?: string
  checkerRemarks?: string
  resolvedAt?: string
}

// ── Scheduled Payments ────────────────────────────────────────────────────────

export type ScheduleFrequency = 'once' | 'weekly' | 'monthly'
export type ScheduleStatus    = 'active' | 'expired' | 'cancelled'

export interface ScheduledPayment {
  id: string
  beneficiaryName: string
  amount: number
  currency: Currency
  frequency: ScheduleFrequency
  nextDate: string
  endDate?: string
  status: ScheduleStatus
  sourceAccountId: string
  purposeCode: string
}

// ── Service Requests ──────────────────────────────────────────────────────────

export type RequestType   = 'inward_remittance_disposal' | 'stop_payment' | 'certified_statement' | 'swift_confirmation'
export type RequestStatus = 'open' | 'in_progress' | 'completed' | 'cancelled'

export interface ServiceRequest {
  id: string
  type: RequestType
  submittedAt: string
  status: RequestStatus
  details: string
  referenceNo?: string
  updatedAt?: string
}

// ── Charges ───────────────────────────────────────────────────────────────────

export interface ChargesConfig {
  bankProcessingCharge: number
  gstRate: number
  swiftCharge: number
  correspondentCharge: number
  foreignBankCharge: number
  spreadIncluded?: boolean
}

export interface ChargesBreakdownData {
  transferAmount: number
  bankProcessingCharge: number
  gstOnCharges: number
  swiftCharge: number
  correspondentCharge: number
  foreignBankCharge: number
  totalCharges: number
  netAmount: number
  fxRate?: number
  foreignAmount?: number
  foreignCurrency?: Currency
  valueDate: string
}

// ── Payment Draft (in-flight state) ──────────────────────────────────────────

export interface PaymentDraft {
  transferType: 'own' | 'third_party' | 'international'
  sourceAccountId: string
  beneficiaryId: string
  amount: number
  currency: Currency
  purposeCode: string
  narrative: string
  paymentDate: string
  scheduled: boolean
  charges?: ChargesBreakdownData
}
