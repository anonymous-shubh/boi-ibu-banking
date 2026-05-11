import { useState }               from 'react'
import { useNavigate }             from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Shield, Clock, FileText, LogOut,
  AlertTriangle, CheckCircle2, Eye, EyeOff,
  Lock, Smartphone, X,
} from 'lucide-react'
import { toast }                   from 'sonner'
import { useAuth }                 from '@/context/AuthContext'
import { cn }                      from '@/lib/utils'

interface ToggleSetting {
  id: string
  label: string
  description: string
  value: boolean
}

const AUDIT_LOG = [
  { action: 'Login',                  user: 'Rajesh Kumar',  time: '2026-05-06 09:14 IST', ip: '192.168.1.45' },
  { action: 'OTP Verified',           user: 'Rajesh Kumar',  time: '2026-05-06 09:14 IST', ip: '192.168.1.45' },
  { action: 'Transfer Authorized',    user: 'Rajesh Kumar',  time: '2026-05-05 16:30 IST', ip: '192.168.1.45' },
  { action: 'FD Created',             user: 'Priya Sharma',  time: '2026-05-04 11:22 IST', ip: '10.0.0.12' },
  { action: 'Beneficiary Submitted',  user: 'Priya Sharma',  time: '2026-05-04 10:05 IST', ip: '10.0.0.12' },
  { action: 'Payment Approved',       user: 'Anil Verma',    time: '2026-05-03 15:40 IST', ip: '172.16.0.8' },
]

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="card-base p-6 space-y-4">
      <h2 className="text-sm font-bold text-foreground border-b border-border pb-3">{title}</h2>
      {children}
    </div>
  )
}

function Toggle({ label, description, value, onChange }: {
  label: string; description: string; value: boolean; onChange: (v: boolean) => void
}) {
  return (
    <div className="flex items-center justify-between py-2">
      <div>
        <p className="text-sm font-medium text-foreground">{label}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
      </div>
      <button
        onClick={() => onChange(!value)}
        className={cn(
          'w-11 h-6 rounded-full relative transition-all flex-shrink-0',
          value ? 'bg-primary-600' : 'bg-surface-200',
        )}
      >
        <div className={cn(
          'absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all',
          value ? 'left-6' : 'left-1',
        )} />
      </button>
    </div>
  )
}

function DeregisterModal({ onClose }: { onClose: () => void }) {
  const [step,        setStep]        = useState<1 | 2>(1)
  const [reason,      setReason]      = useState('')
  const [confirmed,   setConfirmed]   = useState(false)
  const navigate = useNavigate()
  const { logout } = useAuth()

  const reasons = [
    'No longer require internet banking access',
    'Switching to branch-based banking',
    'Security concerns',
    'Closing account',
    'Other',
  ]

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/50 z-40"
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none"
      >
        <div className="bg-surface-0 rounded-xl shadow-modal border border-error-200 w-full max-w-md mx-4 pointer-events-auto">
          <div className="flex items-start justify-between p-5 border-b border-border">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-error-50 flex items-center justify-center">
                <AlertTriangle size={18} className="text-error-600" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-foreground">De-register from IBU Internet Banking</h3>
                <p className="text-xs text-muted-foreground mt-0.5">This action cannot be undone.</p>
              </div>
            </div>
            <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
              <X size={18} />
            </button>
          </div>

          <div className="p-5 space-y-4">
            {step === 1 && (
              <>
                <div className="p-3 bg-error-50 border border-error-200 rounded-md text-xs text-error-700 space-y-1">
                  <p className="font-semibold">Before proceeding, please note:</p>
                  <ul className="list-disc pl-4 space-y-0.5">
                    <li>All pending transactions will not be affected</li>
                    <li>Scheduled payments will be cancelled</li>
                    <li>You will lose access to all IBU internet banking services</li>
                    <li>Re-registration requires branch visit and fresh consent</li>
                  </ul>
                </div>

                <div>
                  <label className="block text-xs font-medium text-foreground mb-1.5">Reason for De-registration</label>
                  <select
                    value={reason}
                    onChange={e => setReason(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-border rounded-md bg-surface-50 focus:outline-none focus:ring-2 focus:ring-error-500"
                  >
                    <option value="">— Select reason —</option>
                    {reasons.map(r => <option key={r}>{r}</option>)}
                  </select>
                </div>

                <button
                  disabled={!reason}
                  onClick={() => setStep(2)}
                  className={cn(
                    'w-full py-2.5 rounded-md text-sm font-semibold transition-all',
                    reason ? 'bg-error-600 text-white hover:bg-error-700' : 'bg-surface-200 text-muted-foreground cursor-not-allowed',
                  )}
                >
                  Continue
                </button>
              </>
            )}

            {step === 2 && (
              <>
                <p className="text-sm text-foreground">
                  Are you absolutely sure you want to de-register{' '}
                  <strong>Rajesh Kumar (BOIGC-ADMIN-001)</strong> from Arttha Internet Banking?
                </p>

                <label className="flex items-start gap-2 cursor-pointer">
                  <div
                    onClick={() => setConfirmed(p => !p)}
                    className={cn(
                      'mt-0.5 w-4 h-4 rounded border-2 flex-shrink-0 flex items-center justify-center transition-all',
                      confirmed ? 'bg-error-600 border-error-600' : 'border-border',
                    )}
                  >
                    {confirmed && <CheckCircle2 size={11} className="text-white" />}
                  </div>
                  <span className="text-xs text-foreground">
                    I confirm that I want to permanently de-register from IBU Internet Banking. I understand this is irreversible.
                  </span>
                </label>

                <button
                  disabled={!confirmed}
                  onClick={() => {
                    toast.success('De-registration request submitted. Your access will be revoked within 24 hours.')
                    onClose()
                    setTimeout(() => { logout(); navigate('/login') }, 2000)
                  }}
                  className={cn(
                    'w-full py-2.5 rounded-md text-sm font-semibold transition-all',
                    confirmed ? 'bg-error-600 text-white hover:bg-error-700' : 'bg-surface-200 text-muted-foreground cursor-not-allowed',
                  )}
                >
                  De-register Now
                </button>
              </>
            )}
          </div>
        </div>
      </motion.div>
    </>
  )
}

export function Settings() {
  const { currentUser, logout } = useAuth()
  const navigate   = useNavigate()

  const [showDeregister, setShowDeregister] = useState(false)
  const [showPass,       setShowPass]       = useState(false)
  const [settings, setSettings] = useState({
    smsAlerts:         true,
    emailAlerts:       true,
    loginNotify:       true,
    highValueAlert:    true,
    sessionTimeout:    true,
    twoFAAlways:       true,
    autoLogout:        true,
  })

  function toggle(key: keyof typeof settings) {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }))
    toast.success('Setting updated.')
  }

  return (
    <div className="p-6 space-y-5 max-w-[900px]">
      <div>
        <h1 className="page-title">Security & Settings</h1>
        <p className="page-subtitle text-muted-foreground mt-0.5">
          Manage authentication preferences, session settings, and audit trail
        </p>
      </div>

      {/* Profile summary */}
      <div className="card-base p-5 flex items-center gap-4">
        <div className="w-14 h-14 rounded-full bg-primary-100 flex items-center justify-center text-xl font-bold text-primary-700">
          {(currentUser?.name ?? 'U').split(' ').map(n => n[0]).join('').slice(0, 2)}
        </div>
        <div className="flex-1">
          <p className="text-base font-bold text-foreground">{currentUser?.name ?? 'Unknown User'}</p>
          <p className="text-sm text-muted-foreground">{currentUser?.id}</p>
          <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
            <span>Role: <strong className="text-foreground">{currentUser?.role}</strong></span>
            <span>Email: rajesh.kumar@boigiftcity.in</span>
            <span>Mobile: +91 98765 43210</span>
          </div>
        </div>
      </div>

      {/* Authentication */}
      <Section title="Authentication & Security">
        <Toggle
          label="Two-Factor Authentication"
          description="Require OTP for all logins and sensitive transactions (required by IFSCA)"
          value={settings.twoFAAlways}
          onChange={() => toggle('twoFAAlways')}
        />
        <Toggle
          label="Auto-logout on Inactivity"
          description="Automatically log out after 5 minutes of inactivity"
          value={settings.autoLogout}
          onChange={() => toggle('autoLogout')}
        />
        <Toggle
          label="Login Notification"
          description="Receive SMS and email alert on every new login"
          value={settings.loginNotify}
          onChange={() => toggle('loginNotify')}
        />

        <div className="pt-2 border-t border-border">
          <p className="text-sm font-medium text-foreground mb-2">Change Password</p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-muted-foreground mb-1">Current Password</label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  placeholder="••••••••"
                  className="w-full px-3 py-2 pr-9 text-sm border border-border rounded-md bg-surface-50 focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                <button onClick={() => setShowPass(p => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1">New Password</label>
              <input
                type="password"
                placeholder="••••••••"
                className="w-full px-3 py-2 text-sm border border-border rounded-md bg-surface-50 focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>
          <button
            onClick={() => toast.success('Password change request sent. OTP required (demo).')}
            className="mt-3 flex items-center gap-2 px-4 py-2 bg-primary-900 text-white text-xs font-semibold rounded-md hover:bg-primary-700 transition-colors"
          >
            <Lock size={13} /> Change Password
          </button>
        </div>
      </Section>

      {/* Session settings */}
      <Section title="Session & Alerts">
        <Toggle
          label="Session Timeout Warning"
          description="Show a warning modal 2 minutes before automatic session expiry"
          value={settings.sessionTimeout}
          onChange={() => toggle('sessionTimeout')}
        />
        <Toggle
          label="High Value Transaction Alert"
          description="Alert for any transaction above ₹1 Cr via SMS and email"
          value={settings.highValueAlert}
          onChange={() => toggle('highValueAlert')}
        />
        <Toggle
          label="SMS Alerts"
          description="Receive SMS for all debits, credits, and logins"
          value={settings.smsAlerts}
          onChange={() => toggle('smsAlerts')}
        />
        <Toggle
          label="Email Alerts"
          description="Receive email digest for all account activity"
          value={settings.emailAlerts}
          onChange={() => toggle('emailAlerts')}
        />
      </Section>

      {/* Registered devices */}
      <Section title="Trusted Devices">
        {[
          { device: 'MacBook Pro (Chrome 124)', registered: '2026-05-01', current: true },
          { device: 'iPhone 15 Pro (Safari)',    registered: '2026-04-28', current: false },
        ].map(({ device, registered, current }) => (
          <div key={device} className="flex items-center justify-between py-2 border-b border-border last:border-0">
            <div className="flex items-center gap-3">
              <Smartphone size={15} className="text-muted-foreground" />
              <div>
                <p className="text-sm font-medium text-foreground">{device}</p>
                <p className="text-xs text-muted-foreground">Registered: {registered}</p>
              </div>
              {current && (
                <span className="text-xs bg-success-50 text-success-700 rounded-full px-2 py-0.5">Current</span>
              )}
            </div>
            {!current && (
              <button
                onClick={() => toast.success('Device removed from trusted list.')}
                className="text-xs text-error-600 hover:text-error-800 transition-colors"
              >
                Remove
              </button>
            )}
          </div>
        ))}
      </Section>

      {/* Audit trail */}
      <Section title="Recent Audit Trail">
        <div className="space-y-0">
          {AUDIT_LOG.map((entry, i) => (
            <div key={i} className="flex items-center justify-between py-2 border-b border-border last:border-0 text-xs">
              <div className="flex items-center gap-2">
                <Shield size={12} className="text-muted-foreground" />
                <span className="font-medium text-foreground">{entry.action}</span>
                <span className="text-muted-foreground">by {entry.user}</span>
              </div>
              <div className="flex items-center gap-3 text-muted-foreground">
                <span>{entry.time}</span>
                <span className="font-mono">{entry.ip}</span>
              </div>
            </div>
          ))}
        </div>
        <button
          onClick={() => toast.info('Full audit report export — available via Service Requests (demo)')}
          className="flex items-center gap-2 text-xs text-primary-600 hover:text-primary-800 transition-colors"
        >
          <FileText size={13} />
          Download Full Audit Report
        </button>
      </Section>

      {/* Danger zone */}
      <div className="rounded-xl border-2 border-error-200 p-5 space-y-4">
        <div>
          <h2 className="text-sm font-bold text-error-700">Danger Zone</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Irreversible actions. Proceed with caution.</p>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-foreground">De-register from IBU Internet Banking</p>
            <p className="text-xs text-muted-foreground">
              Permanently revoke your IBU internet banking access. As per IFSCA circular, you may re-register via branch.
            </p>
          </div>
          <button
            onClick={() => setShowDeregister(true)}
            className="flex items-center gap-2 px-4 py-2 border-2 border-error-400 text-error-700 text-sm font-semibold rounded-md hover:bg-error-50 transition-colors flex-shrink-0 ml-4"
          >
            <LogOut size={14} /> De-register
          </button>
        </div>
      </div>

      {/* De-register modal */}
      <AnimatePresence>
        {showDeregister && <DeregisterModal onClose={() => setShowDeregister(false)} />}
      </AnimatePresence>
    </div>
  )
}
