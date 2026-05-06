import { ChevronDown, UserCog } from 'lucide-react'
import { useState } from 'react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/context/AuthContext'
import type { UserRole } from '@/types'

const ROLES: { role: UserRole; label: string; color: string }[] = [
  { role: 'Admin',   label: 'Admin',   color: 'text-accent-gold' },
  { role: 'Maker',   label: 'Maker',   color: 'text-info-500'    },
  { role: 'Checker', label: 'Checker', color: 'text-success-500' },
]

export function RoleSwitcher() {
  const { currentUser, switchRole } = useAuth()
  const [open, setOpen] = useState(false)

  if (!currentUser) return null

  const currentRoleDef = ROLES.find(r => r.role === currentUser.role)

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className={cn(
          'flex items-center gap-2 px-3 py-1.5 rounded-md border text-sm font-medium',
          'border-primary-200/30 bg-primary-800/40 hover:bg-primary-700/60',
          'text-white transition-colors',
        )}
      >
        <UserCog size={14} className="text-primary-300" />
        <span className="text-primary-100">{currentUser.name}</span>
        <span className={cn('text-xs font-semibold px-1.5 py-0.5 rounded bg-primary-700', currentRoleDef?.color)}>
          {currentUser.role}
        </span>
        <ChevronDown size={12} className="text-primary-300" />
      </button>

      {open && (
        <div className="absolute top-full right-0 mt-1 w-56 bg-white rounded-lg shadow-modal border border-border z-50 overflow-hidden">
          <div className="px-3 py-2 border-b border-surface-100">
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Demo — Switch Role</p>
          </div>
          {ROLES.map(({ role, label, color }) => (
            <button
              key={role}
              onClick={() => { switchRole(role); setOpen(false) }}
              className={cn(
                'w-full flex items-center gap-3 px-3 py-2.5 text-sm text-left hover:bg-surface-50 transition-colors',
                currentUser.role === role && 'bg-accent-light',
              )}
            >
              <span className={cn('text-xs font-bold w-14 shrink-0', color)}>{label}</span>
              <span className="text-muted-foreground text-xs">
                {role === 'Admin'   && 'Rajesh Kumar'}
                {role === 'Maker'   && 'Priya Sharma'}
                {role === 'Checker' && 'Anil Verma'}
              </span>
              {currentUser.role === role && (
                <span className="ml-auto text-accent-gold text-xs font-semibold">Active</span>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Backdrop */}
      {open && <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />}
    </div>
  )
}
