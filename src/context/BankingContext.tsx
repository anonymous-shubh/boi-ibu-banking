import { createContext, useContext, useReducer, type ReactNode } from 'react'
import type { PaymentDraft, Account, FXRate } from '@/types'
import accountsData from '@/data/accounts.json'
import fxRatesData  from '@/data/fxRates.json'

interface BankingState {
  accounts: Account[]
  fxRates: FXRate[]
  pendingApprovalsCount: number
  paymentDraft: PaymentDraft | null
  activeAccountId: string | null
  fxQuote: { rate: FXRate; lockedAt: number } | null
}

type BankingAction =
  | { type: 'SET_ACTIVE_ACCOUNT'; accountId: string }
  | { type: 'SET_PAYMENT_DRAFT'; draft: PaymentDraft }
  | { type: 'CLEAR_PAYMENT_DRAFT' }
  | { type: 'SET_FX_RATES'; rates: FXRate[] }
  | { type: 'LOCK_FX_QUOTE'; rate: FXRate }
  | { type: 'CLEAR_FX_QUOTE' }
  | { type: 'SET_PENDING_COUNT'; count: number }
  | { type: 'DECREMENT_PENDING_COUNT' }

const initialState: BankingState = {
  accounts: accountsData as Account[],
  fxRates:  fxRatesData  as FXRate[],
  pendingApprovalsCount: 5,
  paymentDraft: null,
  activeAccountId: 'BOIGC001',
  fxQuote: null,
}

function bankingReducer(state: BankingState, action: BankingAction): BankingState {
  switch (action.type) {
    case 'SET_ACTIVE_ACCOUNT':
      return { ...state, activeAccountId: action.accountId }
    case 'SET_PAYMENT_DRAFT':
      return { ...state, paymentDraft: action.draft }
    case 'CLEAR_PAYMENT_DRAFT':
      return { ...state, paymentDraft: null }
    case 'SET_FX_RATES':
      return { ...state, fxRates: action.rates }
    case 'LOCK_FX_QUOTE':
      return { ...state, fxQuote: { rate: action.rate, lockedAt: Date.now() } }
    case 'CLEAR_FX_QUOTE':
      return { ...state, fxQuote: null }
    case 'SET_PENDING_COUNT':
      return { ...state, pendingApprovalsCount: action.count }
    case 'DECREMENT_PENDING_COUNT':
      return { ...state, pendingApprovalsCount: Math.max(0, state.pendingApprovalsCount - 1) }
    default:
      return state
  }
}

interface BankingContextValue extends BankingState {
  setActiveAccount: (id: string) => void
  setPaymentDraft:  (draft: PaymentDraft) => void
  clearPaymentDraft: () => void
  setFXRates:       (rates: FXRate[]) => void
  lockFXQuote:      (rate: FXRate) => void
  clearFXQuote:     () => void
  decrementPending: () => void
  getAccount:       (id: string) => Account | undefined
}

const BankingContext = createContext<BankingContextValue | null>(null)

export function BankingProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(bankingReducer, initialState)

  const setActiveAccount  = (id: string)      => dispatch({ type: 'SET_ACTIVE_ACCOUNT', accountId: id })
  const setPaymentDraft   = (d: PaymentDraft)  => dispatch({ type: 'SET_PAYMENT_DRAFT', draft: d })
  const clearPaymentDraft = ()                 => dispatch({ type: 'CLEAR_PAYMENT_DRAFT' })
  const setFXRates        = (r: FXRate[])      => dispatch({ type: 'SET_FX_RATES', rates: r })
  const lockFXQuote       = (r: FXRate)        => dispatch({ type: 'LOCK_FX_QUOTE', rate: r })
  const clearFXQuote      = ()                 => dispatch({ type: 'CLEAR_FX_QUOTE' })
  const decrementPending  = ()                 => dispatch({ type: 'DECREMENT_PENDING_COUNT' })
  const getAccount        = (id: string)       => state.accounts.find(a => a.id === id)

  return (
    <BankingContext.Provider value={{
      ...state,
      setActiveAccount, setPaymentDraft, clearPaymentDraft,
      setFXRates, lockFXQuote, clearFXQuote, decrementPending, getAccount,
    }}>
      {children}
    </BankingContext.Provider>
  )
}

export function useBanking() {
  const ctx = useContext(BankingContext)
  if (!ctx) throw new Error('useBanking must be used within BankingProvider')
  return ctx
}
