import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Shield, AlertTriangle, CheckCircle2, ExternalLink, ChevronLeft } from 'lucide-react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { useAuth } from '@/context/AuthContext'

const ELIGIBILITY_CRITERIA = [
  'Non-Resident Indians (NRIs) and Persons of Indian Origin (PIOs)',
  'Foreign nationals holding valid work or business visa',
  'Companies incorporated outside India with business operations',
  'Foreign Portfolio Investors (FPIs) registered with SEBI',
  'Multinational corporations with presence in GIFT City IFSC',
]

const CONSENT_ITEMS = [
  { id: 'terms', label: 'I have read and agree to the Terms & Conditions of Arttha Internet Banking' },
  { id: 'data',  label: 'I consent to the collection and processing of my data as per the Privacy Policy and IFSCA guidelines' },
  { id: 'comms', label: 'I agree to receive transaction alerts, OTPs, and important account communications via SMS and email' },
]

export function Consent() {
  const navigate              = useNavigate()
  const { acceptConsent }     = useAuth()
  const [checked, setChecked] = useState<Record<string, boolean>>({})
  const [loading, setLoading] = useState(false)
  const [declined, setDeclined] = useState(false)

  const allChecked = CONSENT_ITEMS.every(i => checked[i.id])

  async function handleAccept() {
    if (!allChecked) return
    setLoading(true)
    await new Promise(r => setTimeout(r, 1000))
    acceptConsent()
    navigate('/dashboard')
  }

  function toggleCheck(id: string) {
    setChecked(prev => ({ ...prev, [id]: !prev[id] }))
  }

  return (
    <div className="p-8 max-h-[85vh] overflow-y-auto">
      <button
        onClick={() => navigate('/auth/otp')}
        className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
      >
        <ChevronLeft size={16} /> Back
      </button>

      <div className="mb-5">
        <h2 className="text-xl font-bold text-foreground">IBU Registration Consent</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Please review and accept the terms to activate your internet banking access
        </p>
      </div>

      {/* IBU Eligibility */}
      <div className="rounded-md border border-warning-200 bg-warning-50 p-4 mb-5">
        <div className="flex items-center gap-2 mb-3">
          <AlertTriangle size={16} className="text-warning-600 flex-shrink-0" />
          <p className="text-sm font-semibold text-warning-800">IBU Eligibility Notice</p>
        </div>
        <p className="text-xs text-warning-700 mb-2">
          Access to Arttha Internet Banking is restricted to eligible entities as defined under IFSCA regulations:
        </p>
        <ul className="space-y-1.5">
          {ELIGIBILITY_CRITERIA.map((c, i) => (
            <li key={i} className="flex items-start gap-2 text-xs text-warning-700">
              <span className="w-1 h-1 rounded-full bg-warning-500 mt-1.5 flex-shrink-0" />
              {c}
            </li>
          ))}
        </ul>
      </div>

      {/* Terms summary */}
      <div className="rounded-md border border-border bg-surface-50 p-4 mb-5 max-h-40 overflow-y-auto">
        <p className="text-xs font-semibold text-foreground mb-2 uppercase tracking-wide">Summary of Key Terms</p>
        <div className="space-y-2 text-xs text-muted-foreground">
          <p>1. <strong className="text-foreground">Service Scope:</strong> This platform provides information, interactive, and transactional banking services as defined under IFSCA Internet Banking circular IFSCA/IBU/2024/012.</p>
          <p>2. <strong className="text-foreground">Authentication:</strong> All transactions require dual-layer authentication (password + OTP). Sharing credentials is strictly prohibited.</p>
          <p>3. <strong className="text-foreground">Transaction Limits:</strong> Daily and per-transaction limits apply as per your account mandate. Limits may be reviewed upon request.</p>
          <p>4. <strong className="text-foreground">Data Protection:</strong> All personal and financial data is processed in compliance with applicable data protection laws and IFSCA guidelines.</p>
          <p>5. <strong className="text-foreground">Maker-Checker:</strong> Corporate accounts are subject to maker-checker controls as configured in your account mandate.</p>
          <p>6. <strong className="text-foreground">De-registration:</strong> You may de-register from internet banking at any time via Settings. Outstanding transactions will not be affected.</p>
        </div>
      </div>

      {/* Consent checkboxes */}
      <div className="space-y-3 mb-6">
        {CONSENT_ITEMS.map(item => (
          <label key={item.id} className="flex items-start gap-3 cursor-pointer group">
            <div
              onClick={() => toggleCheck(item.id)}
              className={cn(
                'mt-0.5 w-4 h-4 rounded border-2 flex-shrink-0 flex items-center justify-center transition-all',
                checked[item.id]
                  ? 'bg-primary-900 border-primary-900'
                  : 'border-border group-hover:border-primary-400',
              )}
            >
              {checked[item.id] && <CheckCircle2 size={12} className="text-white" />}
            </div>
            <span className="text-sm text-foreground">{item.label}</span>
          </label>
        ))}
      </div>

      {/* Actions */}
      <div className="space-y-3">
        <motion.button
          onClick={handleAccept}
          disabled={!allChecked || loading}
          whileTap={allChecked ? { scale: 0.98 } : undefined}
          className={cn(
            'w-full py-2.5 px-4 rounded-md text-sm font-semibold text-white transition-all',
            allChecked
              ? 'bg-primary-900 hover:bg-primary-700'
              : 'bg-surface-300 cursor-not-allowed text-muted-foreground',
          )}
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Activating Internet Banking...
            </span>
          ) : (
            <span className="flex items-center justify-center gap-2">
              <Shield size={16} />
              Accept & Activate Internet Banking
            </span>
          )}
        </motion.button>

        <button
          onClick={() => setDeclined(true)}
          className="w-full py-2 text-sm text-muted-foreground hover:text-error-600 transition-colors"
        >
          Decline
        </button>
      </div>

      {declined && (
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 p-3 rounded-md bg-error-50 border border-error-200 text-xs text-error-700"
        >
          If you decline, you will not be able to access internet banking services. Please contact your branch for assistance.
        </motion.div>
      )}

      <div className="mt-6 pt-4 border-t border-surface-100 flex items-center justify-between text-xs text-muted-foreground">
        <span>As per IFSCA Circular IFSCA/IBU/2024/012</span>
        <button className="flex items-center gap-1 hover:text-primary-600 transition-colors">
          <ExternalLink size={10} />
          View Full Policy
        </button>
      </div>
    </div>
  )
}
