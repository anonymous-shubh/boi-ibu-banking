import { useState }               from 'react'
import { motion }                  from 'framer-motion'
import {
  Bell, Mail, Smartphone, Shield,
  TrendingUp, ArrowDownLeft, ArrowUpRight,
  CheckCircle2, Clock, Info,
} from 'lucide-react'
import { toast }                   from 'sonner'
import { cn }                      from '@/lib/utils'

/* ─── Types ─── */

type Channel = 'sms' | 'email' | 'push'

interface AlertType {
  id:          string
  label:       string
  description: string
  icon:        React.ElementType
  category:    'transaction' | 'security' | 'market' | 'approval'
  defaultThreshold?: string
}

interface NotificationRule {
  id:        string
  alert:     string
  condition: string
  channels:  Channel[]
  active:    boolean
}

/* ─── Static data ─── */

const ALERT_TYPES: AlertType[] = [
  {
    id:          'debit_alert',
    label:       'Debit Alerts',
    description: 'Notify on every debit from any account',
    icon:        ArrowUpRight,
    category:    'transaction',
  },
  {
    id:          'credit_alert',
    label:       'Credit Alerts',
    description: 'Notify on every inward credit or remittance',
    icon:        ArrowDownLeft,
    category:    'transaction',
  },
  {
    id:          'high_value',
    label:       'High Value Transaction',
    description: 'Alert for transactions above threshold amount',
    icon:        TrendingUp,
    category:    'transaction',
    defaultThreshold: '₹ 1,00,00,000',
  },
  {
    id:          'login_alert',
    label:       'Login Notifications',
    description: 'Notify on every new login to IBU internet banking',
    icon:        Shield,
    category:    'security',
  },
  {
    id:          'approval_pending',
    label:       'Approval Pending',
    description: 'Notify checker when a new payment is queued for approval',
    icon:        Clock,
    category:    'approval',
  },
  {
    id:          'approval_action',
    label:       'Approval Action',
    description: 'Notify maker when checker approves or rejects a payment',
    icon:        CheckCircle2,
    category:    'approval',
  },
  {
    id:          'fx_rate',
    label:       'FX Rate Alerts',
    description: 'Alert when a monitored currency pair crosses your target rate',
    icon:        TrendingUp,
    category:    'market',
    defaultThreshold: '1 USD = 84.00',
  },
  {
    id:          'fd_maturity',
    label:       'FD Maturity Reminders',
    description: 'Remind 7 days before a fixed deposit matures',
    icon:        Bell,
    category:    'transaction',
  },
]

const NOTIFICATION_LOG = [
  { id: 'N1', label: 'Debit Alert',          message: 'Rs. 62,50,000 debited — TXN-BOIGC-20240506-00891', time: '2026-05-06 09:31 IST', channel: 'sms'   },
  { id: 'N2', label: 'Login Notification',   message: 'New login from MacBook Pro (Chrome 124) — 192.168.1.45', time: '2026-05-06 09:14 IST', channel: 'email' },
  { id: 'N3', label: 'Approval Pending',     message: 'Payment Rs. 45,00,000 to Acme Corp awaiting your approval', time: '2026-05-05 16:32 IST', channel: 'sms'   },
  { id: 'N4', label: 'Credit Alert',         message: 'USD 1,25,000 credited — Inward SWIFT TT202505050023', time: '2026-05-05 12:08 IST', channel: 'email' },
  { id: 'N5', label: 'High Value Alert',     message: 'Transaction above Rs. 1 Cr: Rs. 5,00,00,000 — FD-BOIGC-INR-001', time: '2026-05-04 11:22 IST', channel: 'sms'   },
]

const INITIAL_RULES: NotificationRule[] = [
  { id: 'R1', alert: 'High Value',   condition: 'Amount ≥ Rs. 1,00,00,000',    channels: ['sms', 'email'], active: true  },
  { id: 'R2', alert: 'FX Rate',      condition: '1 USD ≥ 84.00',               channels: ['email'],        active: true  },
  { id: 'R3', alert: 'FX Rate',      condition: '1 EUR ≥ 90.00',               channels: ['sms'],          active: false },
]

const CHANNEL_META: Record<Channel, { label: string; icon: React.ElementType; color: string }> = {
  sms:   { label: 'SMS',   icon: Smartphone, color: 'text-success-600' },
  email: { label: 'Email', icon: Mail,       color: 'text-primary-600' },
  push:  { label: 'Push',  icon: Bell,       color: 'text-warning-600' },
}

const CATEGORY_LABELS: Record<AlertType['category'], string> = {
  transaction: 'Transaction Alerts',
  security:    'Security Alerts',
  market:      'Market & Rate Alerts',
  approval:    'Maker-Checker Alerts',
}

/* ─── Sub-components ─── */

function ChannelToggle({
  channel,
  enabled,
  onChange,
}: {
  channel: Channel
  enabled: boolean
  onChange: (v: boolean) => void
}) {
  const { label, icon: Icon, color } = CHANNEL_META[channel]
  return (
    <button
      onClick={() => onChange(!enabled)}
      title={`${enabled ? 'Disable' : 'Enable'} ${label}`}
      className={cn(
        'flex flex-col items-center gap-1 px-3 py-2 rounded-lg border-2 transition-all text-xs font-medium',
        enabled
          ? `border-primary-300 bg-primary-50 ${color}`
          : 'border-border bg-surface-0 text-muted-foreground hover:border-surface-200',
      )}
    >
      <Icon size={14} />
      {label}
    </button>
  )
}

function AlertRow({
  alert,
  prefs,
  onToggleChannel,
}: {
  alert: AlertType
  prefs: Record<Channel, boolean>
  onToggleChannel: (channel: Channel, value: boolean) => void
}) {
  const Icon = alert.icon
  return (
    <div className="flex items-center justify-between py-3 border-b border-border last:border-0 gap-4">
      <div className="flex items-start gap-3 min-w-0">
        <div className="w-8 h-8 rounded-md bg-surface-100 flex items-center justify-center flex-shrink-0">
          <Icon size={15} className="text-muted-foreground" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium text-foreground">{alert.label}</p>
          <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{alert.description}</p>
          {alert.defaultThreshold && (
            <p className="text-xs text-primary-600 mt-0.5">
              Default threshold: <span className="font-mono font-medium">{alert.defaultThreshold}</span>
            </p>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        {(['sms', 'email', 'push'] as Channel[]).map(ch => (
          <ChannelToggle
            key={ch}
            channel={ch}
            enabled={prefs[ch]}
            onChange={v => onToggleChannel(ch, v)}
          />
        ))}
      </div>
    </div>
  )
}

/* ─── Initial preferences state ─── */

function buildDefaultPrefs(): Record<string, Record<Channel, boolean>> {
  const defaults: Record<string, Record<Channel, boolean>> = {}
  for (const a of ALERT_TYPES) {
    defaults[a.id] = {
      sms:   ['debit_alert', 'credit_alert', 'high_value', 'login_alert', 'approval_pending', 'approval_action'].includes(a.id),
      email: ['login_alert', 'high_value', 'approval_action', 'fd_maturity', 'fx_rate'].includes(a.id),
      push:  false,
    }
  }
  return defaults
}

/* ─── Main component ─── */

export function Notifications() {
  const [prefs,   setPrefs]   = useState(buildDefaultPrefs)
  const [rules,   setRules]   = useState<NotificationRule[]>(INITIAL_RULES)
  const [saved,   setSaved]   = useState(false)
  const [quietHr, setQuietHr] = useState({ enabled: false, from: '22:00', to: '07:00' })

  function updatePref(alertId: string, channel: Channel, value: boolean) {
    setPrefs(prev => ({
      ...prev,
      [alertId]: { ...prev[alertId], [channel]: value },
    }))
    setSaved(false)
  }

  function handleSave() {
    setSaved(true)
    toast.success('Notification preferences saved.')
  }

  function toggleRule(id: string) {
    setRules(prev => prev.map(r => r.id === id ? { ...r, active: !r.active } : r))
    toast.success('Alert rule updated.')
  }

  /* Group alert types by category */
  const grouped = ALERT_TYPES.reduce<Record<string, AlertType[]>>((acc, a) => {
    if (!acc[a.category]) acc[a.category] = []
    acc[a.category].push(a)
    return acc
  }, {})

  return (
    <div className="p-6 space-y-5 max-w-[900px]">
      {/* Header */}
      <div>
        <h1 className="page-title">Notifications & Alerts</h1>
        <p className="page-subtitle text-muted-foreground mt-0.5">
          Configure SMS, email, and push notification preferences per alert type
        </p>
      </div>

      {/* IFSCA notice */}
      <div className="flex items-start gap-2 p-3 bg-info-50 border border-info-200 rounded-md text-xs text-info-700">
        <Info size={13} className="flex-shrink-0 mt-0.5" />
        <span>
          As per IFSCA guidelines, login alerts and high-value transaction alerts (≥ Rs. 1 Cr) are
          mandatory and cannot be fully disabled. SMS remains enabled for these by default.
        </span>
      </div>

      {/* Alert preferences matrix — grouped by category */}
      {(Object.entries(CATEGORY_LABELS) as [AlertType['category'], string][]).map(([cat, catLabel]) => {
        const items = grouped[cat]
        if (!items?.length) return null
        return (
          <motion.div
            key={cat}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="card-base p-5 space-y-1"
          >
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-bold text-foreground border-b border-border pb-3 w-full">
                {catLabel}
              </h2>
            </div>
            {/* Channel header */}
            <div className="flex items-center justify-between pb-1">
              <span className="text-xs text-muted-foreground">Alert type</span>
              <div className="flex gap-2 text-xs text-muted-foreground pr-0.5">
                <span className="w-[68px] text-center">SMS</span>
                <span className="w-[68px] text-center">Email</span>
                <span className="w-[68px] text-center">Push</span>
              </div>
            </div>
            {items.map(alert => (
              <AlertRow
                key={alert.id}
                alert={alert}
                prefs={prefs[alert.id]}
                onToggleChannel={(ch, val) => updatePref(alert.id, ch, val)}
              />
            ))}
          </motion.div>
        )
      })}

      {/* Quiet hours */}
      <div className="card-base p-5 space-y-4">
        <h2 className="text-sm font-bold text-foreground border-b border-border pb-3">Quiet Hours</h2>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-foreground">Suppress non-critical alerts</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Only mandatory security and high-value alerts will be sent during quiet hours
            </p>
          </div>
          <button
            onClick={() => { setQuietHr(prev => ({ ...prev, enabled: !prev.enabled })); toast.success('Quiet hours updated.') }}
            className={cn(
              'w-11 h-6 rounded-full relative transition-all flex-shrink-0',
              quietHr.enabled ? 'bg-primary-600' : 'bg-surface-200',
            )}
          >
            <div className={cn(
              'absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all',
              quietHr.enabled ? 'left-6' : 'left-1',
            )} />
          </button>
        </div>
        {quietHr.enabled && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="flex items-center gap-3 text-sm"
          >
            <span className="text-xs text-muted-foreground">From</span>
            <input
              type="time"
              value={quietHr.from}
              onChange={e => setQuietHr(prev => ({ ...prev, from: e.target.value }))}
              className="px-3 py-1.5 text-sm border border-border rounded-md bg-surface-50 focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
            <span className="text-xs text-muted-foreground">to</span>
            <input
              type="time"
              value={quietHr.to}
              onChange={e => setQuietHr(prev => ({ ...prev, to: e.target.value }))}
              className="px-3 py-1.5 text-sm border border-border rounded-md bg-surface-50 focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
            <span className="text-xs text-muted-foreground">(IST)</span>
          </motion.div>
        )}
      </div>

      {/* Custom alert rules */}
      <div className="card-base p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <h2 className="text-sm font-bold text-foreground">Custom Alert Rules</h2>
          <button
            onClick={() => toast.info('Custom rule editor — available in next release (demo)')}
            className="text-xs text-primary-600 hover:text-primary-800 transition-colors font-medium"
          >
            + Add Rule
          </button>
        </div>
        {rules.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-4">No custom rules configured.</p>
        ) : (
          <div className="space-y-0">
            {rules.map(rule => (
              <div
                key={rule.id}
                className="flex items-center justify-between py-2.5 border-b border-border last:border-0"
              >
                <div>
                  <p className="text-xs font-semibold text-foreground">{rule.alert}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{rule.condition}</p>
                  <div className="flex gap-1 mt-1">
                    {rule.channels.map(ch => {
                      const { label, icon: Icon, color } = CHANNEL_META[ch]
                      return (
                        <span key={ch} className={cn('inline-flex items-center gap-1 text-xs', color)}>
                          <Icon size={10} /> {label}
                        </span>
                      )
                    }).reduce<React.ReactNode[]>((acc, el, i) => (i === 0 ? [el] : [...acc, <span key={i} className="text-muted-foreground text-xs mx-0.5">·</span>, el]), [])}
                  </div>
                </div>
                <button
                  onClick={() => toggleRule(rule.id)}
                  className={cn(
                    'w-11 h-6 rounded-full relative transition-all flex-shrink-0',
                    rule.active ? 'bg-primary-600' : 'bg-surface-200',
                  )}
                >
                  <div className={cn(
                    'absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all',
                    rule.active ? 'left-6' : 'left-1',
                  )} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent notification log */}
      <div className="card-base p-5 space-y-4">
        <h2 className="text-sm font-bold text-foreground border-b border-border pb-3">
          Recent Notifications Sent
        </h2>
        <div className="space-y-0">
          {NOTIFICATION_LOG.map(n => {
            const { icon: Icon, color } = CHANNEL_META[n.channel as Channel]
            return (
              <div key={n.id} className="flex items-start justify-between py-2.5 border-b border-border last:border-0 gap-3 text-xs">
                <div className="flex items-start gap-2 min-w-0">
                  <Icon size={12} className={cn('mt-0.5 flex-shrink-0', color)} />
                  <div className="min-w-0">
                    <span className="font-semibold text-foreground">{n.label}: </span>
                    <span className="text-muted-foreground">{n.message}</span>
                  </div>
                </div>
                <span className="text-muted-foreground flex-shrink-0 whitespace-nowrap">{n.time}</span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Save bar */}
      <div className="flex items-center justify-between p-4 bg-surface-0 border border-border rounded-xl">
        <p className="text-xs text-muted-foreground">
          {saved ? (
            <span className="text-success-600 flex items-center gap-1.5">
              <CheckCircle2 size={13} /> Preferences saved successfully
            </span>
          ) : (
            'Unsaved changes — click Save to apply your preferences'
          )}
        </p>
        <button
          onClick={handleSave}
          className="px-5 py-2 bg-primary-900 text-white text-sm font-semibold rounded-md hover:bg-primary-700 transition-colors"
        >
          Save Preferences
        </button>
      </div>
    </div>
  )
}
